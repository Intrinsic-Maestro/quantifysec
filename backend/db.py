"""
db.py — Supabase write layer for QuantifySec.

One function per table. Called from main.py's /api/run-pipeline at the
points marked in the integration diff. Uses the `supabase` client
(pip install supabase). Env vars: SUPABASE_URL, SUPABASE_KEY.

NOTE: pick your own conflict/upsert policy for assets & vulnerabilities —
they're written with upsert() here since re-running the pipeline against
the same synthetic data shouldn't duplicate them. simulation_runs /
risk_assessments / remediation_actions / optimization_runs are always
fresh inserts, since each pipeline run is a new run.
"""

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")  # .env in same folder as db.py (backend/)

from supabase import create_client, Client

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_KEY"]
        _client = create_client(url, key)
    return _client


# ── assets & vulnerabilities (ingestion layer) ─────────────────────────

def upsert_assets(valid_assets: list) -> None:
    """valid_assets: list[AssetRecord] from ingest_assets()."""
    rows = [
        {
            "uid": a.uid,
            "company_name": a.company_name,
            "nse_symbol": a.nse_symbol,
            "sector": a.sector,
            "industry": a.industry,
            "type": a.type,
            "criticality": a.criticality,
            "internet_facing": a.internet_facing,
            "annual_revenue_dependency_inr": a.annual_revenue_dependency_inr,
            "market_cap_inr": a.market_cap_inr,
            "loss_distribution": a.loss_parameters.distribution,
            "loss_mu": a.loss_parameters.mu,
            "loss_sigma": a.loss_parameters.sigma,
            "loss_mean_inr_millions": a.loss_parameters.mean_inr_millions,
            "loss_cv": a.loss_parameters.cv,
            "loss_benchmark_source": a.loss_parameters.benchmark_source,
        }
        for a in valid_assets
    ]
    if rows:
        get_client().table("assets").upsert(rows, on_conflict="uid").execute()


def upsert_vulnerabilities(valid_vulns: list) -> None:
    """valid_vulns: list[VulnerabilityRecord] from ingest_vulnerabilities()."""
    rows = [
        {
            "id": v.id,
            "asset_id": v.asset_id,
            "cve_id": v.cve_id,
            "cvss_score": v.cvss_score,
            "exploit_status": v.exploit_status.value,
            "affected_component": v.affected_component,
            # severity / vector_string / cwe / kev_listed / known_ransomware_use
            # aren't on VulnerabilityRecord as it stands (see models.py) —
            # pull them from the raw CombinedFindingRecord if you want these
            # populated, or drop these columns from the insert until wired up.
        }
        for v in valid_vulns
    ]
    if rows:
        get_client().table("vulnerabilities").upsert(rows, on_conflict="id").execute()


# ── simulation_runs (Monte Carlo output) ────────────────────────────────

def insert_simulation_run(mc_api_response: dict) -> str:
    """
    mc_api_response: the dict from serialize_simulation_results(...).model_dump()
    Expects the confirmed shape: portfolio {mean_ale, std_dev, p50, p90, p95, p99}
    + metadata {status, total_iterations, audit_trail_seed}.
    Returns the new simulation_runs.id (uuid) for use in downstream inserts."""
    portfolio = mc_api_response["portfolio_metrics"]  # adjust key if serializer nests differently
    meta = mc_api_response.get("metadata", mc_api_response)  # fallback if flat

    row = {
        "status": meta["status"],
        "total_iterations": meta["total_iterations"],
        "audit_trail_seed": meta["audit_trail_seed"],
        "mean_ale": portfolio["mean_ale"],
        "std_dev": portfolio["std_dev"],
        "p50": portfolio["p50"],
        "p90": portfolio["p90"],
        "p95": portfolio["p95"],
        "p99": portfolio["p99"],
    }
    res = get_client().table("simulation_runs").insert(row).execute()
    return res.data[0]["id"]


# ── risk_assessments (per-asset ALE, one row per asset per run) ────────

def insert_risk_assessments(asset_level_results: list, simulation_run_id: str) -> None:
    """
    asset_level_results: list of {asset_id, mean_ale} dicts from the
    Monte Carlo engine's asset-level output.
    """
    rows = [
        {
            "asset_id": r["asset_id"],
            "simulation_run_id": simulation_run_id,
            "mean_ale_inr": r["mean_ale"],
        }
        for r in asset_level_results
    ]
    if rows:
        get_client().table("risk_assessments").insert(rows).execute()


# ── remediation_actions (dynamic, per-vulnerability, per-run) ──────────

def insert_remediation_actions(
    dynamic_controls: list, simulation_run_id: str
) -> dict[str, str]:
    """
    dynamic_controls: list[SecurityControl] from build_dynamic_vuln_controls().
    Returns {vulnerability_id: remediation_actions.id} so optimization_runs
    can map solved control ids back to remediation_action rows.

    NOTE: SecurityControl doesn't carry effort_days -- inserted as null
    until that's wired into build_dynamic_vuln_controls().
    """
    rows = [
        {
            "vulnerability_id": c.id,  # = vuln_id, set in build_dynamic_vuln_controls
            "simulation_run_id": simulation_run_id,
            "cost_lakh": c.cost,
            "estimated_risk_reduction": c.risk_reduction,
            "effort_days": None,
        }
        for c in dynamic_controls
    ]
    if not rows:
        return {}
    res = get_client().table("remediation_actions").insert(rows).execute()
    return {row["vulnerability_id"]: row["id"] for row in res.data}


# ── optimization_runs (knapsack result) ─────────────────────────────────

def insert_optimization_run(
    opt_result: Any,
    simulation_run_id: str,
    vuln_id_to_action_id: dict[str, str],
    portfolio_ale_lakh: float,
) -> str:
    """
    opt_result: OptimizationResult from solve_knapsack().
    vuln_id_to_action_id: mapping returned by insert_remediation_actions(),
    used to translate the solver's selected control ids into
    remediation_actions.id values for selected_actions_json.
    portfolio_ale_lakh: total portfolio ALE in lakhs, used to derive
    residual_risk since OptimizationResult has no native field for it.
    """
    opt_dict = opt_result.model_dump()
    selected_action_ids = [
        vuln_id_to_action_id[c["id"]]
        for c in opt_dict.get("selected_controls", [])
        if c["id"] in vuln_id_to_action_id
    ]

    row = {
        "simulation_run_id": simulation_run_id,
        "budget_lakh": opt_dict.get("budget"),
        "status": opt_dict.get("status"),
        "selected_actions_json": selected_action_ids,
        "total_risk_reduction": opt_dict.get("total_risk_reduction"),
        "residual_risk": portfolio_ale_lakh - opt_dict.get("total_risk_reduction", 0),
    }
    res = get_client().table("optimization_runs").insert(row).execute()
    return res.data[0]["id"]