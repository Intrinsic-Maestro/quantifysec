"""
db.py — Supabase Data & Write Layer for QuantifySec.

Manages multi-tenant authentication, telemetry persistence, Monte Carlo
results, Knapsack optimization runs, and executive dashboard snapshots.
Env vars required: SUPABASE_URL, SUPABASE_KEY.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, List, Dict, Optional

from dotenv import load_dotenv

# Load backend/.env safely
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

from supabase import create_client, Client

_client: Client | None = None


# ── Supabase Client Singleton ─────────────────────────────────────────────

def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in environment.")
        _client = create_client(url, key)
    return _client


def __getattr__(name: str) -> Any:
    """Allows accessing db.supabase or db.client directly."""
    if name in ("client", "supabase"):
        return get_client()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


# ── Internal Helpers ──────────────────────────────────────────────────────

def _cvss_to_severity(score: float) -> str:
    """CVSS v3 severity bands per NIST NVD specification."""
    if score >= 9.0:
        return "Critical"
    elif score >= 7.0:
        return "High"
    elif score >= 4.0:
        return "Medium"
    else:
        return "Low"


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


# ═══════════════════════════════════════════════════════════════════════════
# INGESTION LAYER
# ═══════════════════════════════════════════════════════════════════════════

def upsert_assets(valid_assets: list, company_name: str | None = None) -> None:
    """
    Persist asset records safely.
    Handles Pydantic models, dicts, or dynamic stubs.
    """
    rows = []
    for i, a in enumerate(valid_assets):
        loss_params = getattr(a, "loss_parameters", None)
        c_name = getattr(a, "company_name", company_name) or company_name or "Unknown Company"
        uid = getattr(a, "uid", None) or getattr(a, "id", None) or f"AST-{i+1:04d}"

        rows.append({
            "uid": uid,
            "company_name": c_name,
            "nse_symbol": getattr(a, "nse_symbol", None),
            "sector": getattr(a, "sector", "Technology"),
            "industry": getattr(a, "industry", "Software"),
            "type": getattr(a, "type", "Server"),
            "criticality": getattr(a, "criticality", "Medium"),
            "internet_facing": bool(getattr(a, "internet_facing", False)),
            "annual_revenue_dependency_inr": getattr(a, "annual_revenue_dependency_inr", 0),
            "market_cap_inr": getattr(a, "market_cap_inr", 0),
            "loss_distribution": getattr(loss_params, "distribution", "lognormal"),
            "loss_mu": getattr(loss_params, "mu", 0.0),
            "loss_sigma": getattr(loss_params, "sigma", 1.0),
            "loss_mean_inr_millions": getattr(loss_params, "mean_inr_millions", 50.0),
            "loss_cv": getattr(loss_params, "cv", 0.5),
            "loss_benchmark_source": getattr(loss_params, "benchmark_source", "Custom"),
        })

    if rows:
        get_client().table("assets").upsert(rows, on_conflict="uid").execute()


def upsert_vulnerabilities(
    valid_vulns: list,
    company_name: str,
    raw_combined: list | None = None,
) -> None:
    """
    Persist vulnerability records.
    """
    raw_map: dict[str, Any] = {}
    if raw_combined:
        for r in raw_combined:
            f_uid = getattr(r, "finding_uid", getattr(r, "id", None))
            if f_uid:
                raw_map[f_uid] = r

    rows = []
    for i, v in enumerate(valid_vulns):
        vid = getattr(v, "id", f"VULN-{i+1:04d}")
        raw = raw_map.get(vid)

        kev_listed = bool(getattr(raw, "kev_listed", False)) if raw else False
        
        ransomware_val = getattr(getattr(raw, "known_ransomware_use", None), "value", None)
        known_ransomware = (ransomware_val == "Known") if raw else False

        cvss = float(getattr(v, "cvss_score", 5.0) or 5.0)
        exploit_stat = getattr(getattr(v, "exploit_status", None), "value", "none") or "none"

        rows.append({
            "id": vid,
            "asset_id": getattr(v, "asset_id", "AST-0001"),
            "company_name": company_name,
            "cve_id": getattr(v, "cve_id", "CVE-UNKNOWN"),
            "cvss_score": cvss,
            "severity": _cvss_to_severity(cvss),
            "exploit_status": exploit_stat,
            "affected_component": getattr(v, "affected_component", "system"),
            "kev_listed": kev_listed,
            "known_ransomware_use": known_ransomware,
            "days_open_as_of_last_run": getattr(v, "days_open_as_of_last_run", 0) or 0,
        })

    if rows:
        get_client().table("vulnerabilities").upsert(rows, on_conflict="id").execute()


# ═══════════════════════════════════════════════════════════════════════════
# DATA QUERY LAYER (MULTI-TENANT TELEMETRY RETRIEVAL)
# ═══════════════════════════════════════════════════════════════════════════

def has_telemetry(company_name: str | None = None) -> bool:
    """Checks whether real vulnerabilities exist for this company."""
    try:
        client = get_client()
        query = client.table("vulnerabilities").select("id").limit(1)
        if company_name and company_name != "Unknown Company":
            query = query.eq("company_name", company_name)
        res = query.execute()
        return len(res.data) > 0
    except Exception as e:
        print(f"Error checking telemetry existence: {e}")
        return False


def get_vulnerabilities(company_name: str | None = None, limit: int = 400) -> List[Dict[str, Any]]:
    """Fetches stored vulnerabilities for the active company."""
    try:
        client = get_client()
        query = client.table("vulnerabilities").select("*").limit(limit)
        if company_name and company_name != "Unknown Company":
            query = query.eq("company_name", company_name)
        res = query.execute()
        return res.data or []
    except Exception as e:
        print(f"Error fetching vulnerabilities: {e}")
        return []


def get_assets(company_name: str | None = None, limit: int = 200) -> List[Dict[str, Any]]:
    """Fetches stored assets for the active company."""
    try:
        client = get_client()
        query = client.table("assets").select("*").limit(limit)
        if company_name and company_name != "Unknown Company":
            query = query.eq("company_name", company_name)
        res = query.execute()
        return res.data or []
    except Exception as e:
        print(f"Error fetching assets: {e}")
        return []


# ═══════════════════════════════════════════════════════════════════════════
# MONTE CARLO LAYER
# ═══════════════════════════════════════════════════════════════════════════

def insert_simulation_run(mc_api_response: dict, company_name: str) -> str:
    """Persist portfolio-level Monte Carlo simulation run."""
    portfolio = mc_api_response.get("portfolio_metrics", {})
    meta = mc_api_response.get("metadata", mc_api_response)

    row = {
        "company_name": company_name,
        "status": meta.get("status", "completed"),
        "total_iterations": meta.get("total_iterations", 10000),
        "audit_trail_seed": meta.get("audit_trail_seed", 42),
        "mean_ale": portfolio.get("mean_ale", 0.0),
        "std_dev": portfolio.get("std_dev", 0.0),
        "p50": portfolio.get("p50", 0.0),
        "p90": portfolio.get("p90", 0.0),
        "p95": portfolio.get("p95", 0.0),
        "p99": portfolio.get("p99", 0.0),
    }
    res = get_client().table("simulation_runs").insert(row).execute()
    return res.data[0]["id"]


def insert_risk_assessments(
    asset_level_results: list, simulation_run_id: str, company_name: str
) -> None:
    """Persist asset-level risk assessments."""
    rows = [
        {
            "asset_id": r["asset_id"],
            "company_name": company_name,
            "simulation_run_id": simulation_run_id,
            "mean_ale_inr": r["mean_ale"],
        }
        for r in asset_level_results
    ]
    if rows:
        get_client().table("risk_assessments").insert(rows).execute()


# ═══════════════════════════════════════════════════════════════════════════
# KNAPSACK / OPTIMISATION LAYER
# ═══════════════════════════════════════════════════════════════════════════

def insert_remediation_actions(
    dynamic_controls: list, simulation_run_id: str, company_name: str
) -> dict[str, str]:
    """Persist candidate remediation actions."""
    rows = [
        {
            "vulnerability_id": c.id,
            "company_name": company_name,
            "simulation_run_id": simulation_run_id,
            "cost_lakh": c.cost,
            "estimated_risk_reduction": c.risk_reduction,
            "effort_days": None,
            "cost_efficiency_ratio": (
                round(c.risk_reduction / c.cost, 6) if c.cost > 0 else None
            ),
        }
        for c in dynamic_controls
    ]
    if not rows:
        return {}
    res = get_client().table("remediation_actions").insert(rows).execute()
    return {row["vulnerability_id"]: row["id"] for row in res.data}


def insert_optimization_run(
    opt_result: Any,
    simulation_run_id: str,
    vuln_id_to_action_id: dict[str, str],
    portfolio_ale_lakh: float,
    company_name: str,
    dynamic_controls: list | None = None,
) -> str:
    """Persist solver portfolio decisions."""
    opt_dict = opt_result.model_dump() if hasattr(opt_result, "model_dump") else opt_result

    selected_controls = opt_dict.get("selected_controls", [])
    selected_action_ids = [
        vuln_id_to_action_id[c["id"]]
        for c in selected_controls
        if c.get("id") in vuln_id_to_action_id
    ]

    total_risk_reduction = opt_dict.get("total_risk_reduction", 0) or 0
    total_selected_cost = sum(c.get("cost", 0) for c in selected_controls)

    full_coverage_capex = (
        round(sum(c.cost for c in dynamic_controls), 4)
        if dynamic_controls
        else None
    )

    rosi = (
        round(total_risk_reduction / total_selected_cost, 6)
        if total_selected_cost > 0
        else None
    )

    row = {
        "company_name": company_name,
        "simulation_run_id": simulation_run_id,
        "budget_lakh": opt_dict.get("budget"),
        "status": opt_dict.get("status"),
        "selected_actions_json": selected_action_ids,
        "total_risk_reduction": total_risk_reduction,
        "residual_risk": portfolio_ale_lakh - total_risk_reduction,
        "total_selected_cost_lakh": round(total_selected_cost, 4),
        "full_coverage_capex_lakh": full_coverage_capex,
        "rosi": rosi,
    }
    res = get_client().table("optimization_runs").insert(row).execute()
    return res.data[0]["id"]


# ═══════════════════════════════════════════════════════════════════════════
# CISO SNAPSHOT LAYER
# ═══════════════════════════════════════════════════════════════════════════

def insert_ciso_snapshot(
    valid_assets: list,
    valid_vulns: list,
    opt_result: Any,
    simulation_run_id: str,
    company_name: str,
) -> tuple[str, float]:
    """Compute and persist CISO posture metrics."""
    opt_dict = opt_result.model_dump() if hasattr(opt_result, "model_dump") else opt_result
    selected_ids: set[str] = {c["id"] for c in opt_dict.get("selected_controls", [])}

    asset_internet_map: dict[str, bool] = {
        getattr(a, "uid", getattr(a, "id", None)): bool(getattr(a, "internet_facing", False))
        for a in valid_assets
    }

    total_vulns = len(valid_vulns)
    count_critical = count_high = count_medium = count_low = 0
    count_exploitable_theoretical = count_exploitable_active = 0
    count_external = count_internal = 0
    pipeline_open = pipeline_in_progress = 0
    total_days_open_critical = 0
    total_days_open_all = 0

    for v in valid_vulns:
        cvss = getattr(v, "cvss_score", 5.0) or 5.0
        severity = _cvss_to_severity(cvss)
        days_open = getattr(v, "days_open_as_of_last_run", 0) or 0

        if severity == "Critical":
            count_critical += 1
            total_days_open_critical += days_open
        elif severity == "High":
            count_high += 1
        elif severity == "Medium":
            count_medium += 1
        else:
            count_low += 1

        total_days_open_all += days_open

        exploit_stat = getattr(getattr(v, "exploit_status", None), "value", "none") or "none"
        if exploit_stat == "active":
            count_exploitable_active += 1
        elif exploit_stat == "known":
            count_exploitable_theoretical += 1

        vuln_id = getattr(v, "id", None)
        if vuln_id and vuln_id in selected_ids:
            pipeline_in_progress += 1
        else:
            pipeline_open += 1

        if asset_internet_map.get(getattr(v, "asset_id", None), False):
            count_external += 1
        else:
            count_internal += 1

    control_coverage_ratio = (
        round(len(selected_ids) / total_vulns, 4) if total_vulns > 0 else 0.0
    )
    avg_days_open_critical = (
        round(total_days_open_critical / count_critical, 2)
        if count_critical > 0
        else 0.0
    )
    avg_days_open_all = (
        round(total_days_open_all / total_vulns, 2) if total_vulns > 0 else 0.0
    )

    total_assets = len(valid_assets)
    assets_with_agent = sum(
        1 for a in valid_assets if getattr(a, "agent_installed", False)
    )
    endpoint_agent_coverage_pct = (
        round(assets_with_agent / total_assets * 100, 2) if total_assets > 0 else 0.0
    )

    severity_penalty = (
        count_critical * 3.0
        + count_high * 1.5
        + count_medium * 0.5
        + count_low * 0.1
    )
    exploit_penalty = (
        count_exploitable_active * 2.0 + count_exploitable_theoretical * 1.0
    )
    coverage_bonus = control_coverage_ratio * 15.0
    posture_score = _clamp(
        round(100.0 - severity_penalty - exploit_penalty + coverage_bonus, 2),
        0.0,
        100.0,
    )

    row = {
        "company_name": company_name,
        "simulation_run_id": simulation_run_id,
        "posture_score": posture_score,
        "total_active_vulns": total_vulns,
        "count_critical": count_critical,
        "count_high": count_high,
        "count_medium": count_medium,
        "count_low": count_low,
        "control_coverage_ratio": control_coverage_ratio,
        "count_exploitable_theoretical": count_exploitable_theoretical,
        "count_exploitable_active": count_exploitable_active,
        "avg_days_open_critical": avg_days_open_critical,
        "avg_days_open_all": avg_days_open_all,
        "count_external_facing_vulns": count_external,
        "count_internal_only_vulns": count_internal,
        "total_assets": total_assets,
        "assets_with_agent": assets_with_agent,
        "endpoint_agent_coverage_pct": endpoint_agent_coverage_pct,
        "pipeline_open": pipeline_open,
        "pipeline_in_progress": pipeline_in_progress,
        "pipeline_testing": 0,
        "pipeline_verified": 0,
    }
    res = get_client().table("ciso_snapshots").insert(row).execute()
    return res.data[0]["id"], posture_score


# ═══════════════════════════════════════════════════════════════════════════
# CFO SNAPSHOT LAYER
# ═══════════════════════════════════════════════════════════════════════════

def insert_cfo_snapshot(
    analytics: dict,
    opt_result: Any,
    simulation_run_id: str,
    company_name: str,
) -> str:
    """Compute and persist CFO financial metrics."""
    opt_dict = opt_result.model_dump() if hasattr(opt_result, "model_dump") else opt_result
    pm = analytics.get("portfolio_metrics", {})

    mean_ale_lakh = round(pm.get("mean_ale", 0.0) / 100_000.0, 4)
    var_95_lakh = round((pm.get("p95") or 0.0) / 100_000.0, 4)

    budget_lakh = opt_dict.get("budget", 0) or 0.0
    total_selected_cost = opt_dict.get("total_cost", 0) or 0.0
    total_risk_reduction = opt_dict.get("total_risk_reduction", 0) or 0.0
    budget_utilization_pct = opt_dict.get("budget_utilization_pct", 0.0)

    rosi = (
        round(total_risk_reduction / total_selected_cost, 6)
        if total_selected_cost > 0
        else None
    )

    future = opt_dict.get("future_budget") or {}
    deferred_cost = future.get("total_deferred_cost", 0.0) or 0.0
    deferred_residual_risk = future.get("total_deferred_reduction", 0.0) or 0.0
    next_cycle_forecast = future.get("approx_next_cycle_budget", 0.0)
    full_coverage_capex = future.get("approx_full_coverage_budget", 0.0)

    row = {
        "company_name": company_name,
        "simulation_run_id": simulation_run_id,
        "mean_ale_lakh": mean_ale_lakh,
        "var_95_lakh": var_95_lakh,
        "allocated_budget_lakh": round(budget_lakh, 4),
        "total_remediation_cost_lakh": round(total_selected_cost, 4),
        "budget_utilization_pct": round(budget_utilization_pct, 2),
        "total_risk_reduction_lakh": round(total_risk_reduction, 4),
        "rosi": rosi,
        "deferred_backlog_cost_lakh": round(deferred_cost, 4),
        "deferred_backlog_residual_risk_lakh": round(deferred_residual_risk, 4),
        "next_cycle_budget_forecast_lakh": (
            round(next_cycle_forecast, 4) if next_cycle_forecast else None
        ),
        "full_coverage_capex_lakh": (
            round(full_coverage_capex, 4) if full_coverage_capex else None
        ),
    }
    res = get_client().table("cfo_snapshots").insert(row).execute()
    return res.data[0]["id"]


# ═══════════════════════════════════════════════════════════════════════════
# QUARTERLY RISK TREND
# ═══════════════════════════════════════════════════════════════════════════

def insert_quarterly_risk_trend(
    simulation_run_id: str,
    period_label: str,
    period_start: str,
    analytics: dict,
    opt_result: Any,
    posture_score: float,
    company_name: str,
) -> str:
    """Append a quarterly trend entry."""
    opt_dict = opt_result.model_dump() if hasattr(opt_result, "model_dump") else opt_result
    pm = analytics.get("portfolio_metrics", {})

    mean_ale_lakh = round(pm.get("mean_ale", 0.0) / 100_000.0, 4)
    var_95_lakh = round((pm.get("p95") or 0.0) / 100_000.0, 4)
    total_risk_reduction = opt_dict.get("total_risk_reduction", 0) or 0.0
    residual_risk_lakh = round(mean_ale_lakh - total_risk_reduction, 4)

    row = {
        "company_name": company_name,
        "simulation_run_id": simulation_run_id,
        "period_label": period_label,
        "period_start": period_start,
        "mean_ale_lakh": mean_ale_lakh,
        "var_95_lakh": var_95_lakh,
        "total_risk_reduction_lakh": round(total_risk_reduction, 4),
        "residual_risk_lakh": residual_risk_lakh,
        "posture_score": round(posture_score, 2),
    }
    res = get_client().table("quarterly_risk_trend").insert(row).execute()
    return res.data[0]["id"]


# ═══════════════════════════════════════════════════════════════════════════
# AUTH / MULTI-TENANCY LAYER
# ═══════════════════════════════════════════════════════════════════════════

def get_or_create_company(company_name: str) -> str:
    """Look up a company by name; create it if absent."""
    clean_name = company_name.strip() if company_name else "Unknown Company"
    client = get_client()
    existing = (
        client.table("companies")
        .select("company_id")
        .eq("company_name", clean_name)
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]["company_id"]

    created = client.table("companies").insert({"company_name": clean_name}).execute()
    return created.data[0]["company_id"]


def upsert_profile(email: str, name: str, role: str, company_id: str) -> None:
    """Create or update user profile linked to company."""
    get_client().table("profiles").upsert(
        {
            "email": email.strip().lower(),
            "name": name.strip(),
            "role": role.strip().lower(),
            "company_id": company_id,
        },
        on_conflict="email",
    ).execute()


def get_profile_by_email(email: str) -> dict | None:
    """Fetches an existing profile from Supabase by email."""
    try:
        res = (
            get_client()
            .table("profiles")
            .select("*")
            .eq("email", email.strip().lower())
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None
    except Exception as e:
        print(f"Error fetching profile: {e}")
        return None


def get_company_name(company_id: str | None) -> str:
    """Looks up company name by UUID."""
    if not company_id:
        return "Unknown Company"
        
    try:
        res = (
            get_client()
            .table("companies")
            .select("company_name")
            .eq("company_id", company_id)
            .limit(1)
            .execute()
        )
        if res.data and res.data[0].get("company_name"):
            return res.data[0]["company_name"]
        return "Unknown Company"
    except Exception as e:
        print(f"Error fetching company name: {e}")
        return "Unknown Company"