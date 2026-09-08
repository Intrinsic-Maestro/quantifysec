"""
db.py — Supabase write layer for QuantifySec.

One function per table (or logical write unit). Called from main.py's
/api/run-pipeline. Uses the `supabase` client (pip install supabase).
Env vars required: SUPABASE_URL, SUPABASE_KEY.

TABLE MAP
─────────────────────────────────────────────────────────────────────────
  assets               ← upsert_assets()
  vulnerabilities      ← upsert_vulnerabilities()
  simulation_runs      ← insert_simulation_run()
  risk_assessments     ← insert_risk_assessments()
  remediation_actions  ← insert_remediation_actions()
  optimization_runs    ← insert_optimization_run()
  ciso_snapshots       ← insert_ciso_snapshot()      [NEW]
  cfo_snapshots        ← insert_cfo_snapshot()       [NEW]
  quarterly_risk_trend ← insert_quarterly_risk_trend()[NEW]

UPSERT POLICY
─────────────────────────────────────────────────────────────────────────
  assets / vulnerabilities  : upsert (re-running the pipeline against
                              the same synthetic data must not duplicate rows)
  All others                : insert — each pipeline run is a fresh record.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")  # backend/.env

from supabase import create_client, Client

_client: Client | None = None


# ── Supabase client ───────────────────────────────────────────────────────

def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_KEY"]
        _client = create_client(url, key)
    return _client


# ── Internal helpers ──────────────────────────────────────────────────────

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

def upsert_assets(valid_assets: list) -> None:
    """
    Persist asset records.

    valid_assets : list[AssetRecord] from ingest_assets()

    NOTE — agent_installed:
        AssetRecord doesn't carry this field yet. The column defaults to
        FALSE in the schema until the synthetic data generator and
        AssetRecord model are updated to include it.
    """
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
            # agent_installed intentionally omitted — schema default (FALSE) applies
        }
        for a in valid_assets
    ]
    if rows:
        get_client().table("assets").upsert(rows, on_conflict="uid").execute()


def upsert_vulnerabilities(
    valid_vulns: list,
    company_name: str,
    raw_combined: list | None = None,
) -> None:
    """
    Persist vulnerability records.

    valid_vulns  : list[VulnerabilityRecord] from ingest_vulnerabilities()
    raw_combined : optional list[CombinedFindingRecord] — when supplied,
                   kev_listed / known_ransomware_use are read from the source
                   record and stored for the Exploitability Threat Index
                   (CISO Metric #7). Pass None to fall back to FALSE defaults.

    New fields written vs. original db.py:
        severity             — derived from cvss_score via _cvss_to_severity()
        kev_listed           — from CombinedFindingRecord.kev_listed
        known_ransomware_use — True when raw.known_ransomware_use == "Known"
        days_open_as_of_last_run — set to 0 on first ingest; update via a
                                   scheduled job or re-ingest pass once aging
                                   data is available
    """
    # Index raw records by finding_uid for O(1) lookup
    raw_map: dict[str, Any] = {}
    if raw_combined:
        for r in raw_combined:
            raw_map[r.finding_uid] = r

    rows = []
    for v in valid_vulns:
        raw = raw_map.get(v.id)

        kev_listed = bool(raw.kev_listed) if raw else False
        known_ransomware = (
            raw.known_ransomware_use.value == "Known" if raw else False
        )

        rows.append(
            {
                "id": v.id,
                "asset_id": v.asset_id,
                "company_name": company_name,
                "cve_id": v.cve_id,
                "cvss_score": v.cvss_score,
                "severity": _cvss_to_severity(v.cvss_score),
                "exploit_status": v.exploit_status.value,
                "affected_component": v.affected_component,
                "kev_listed": kev_listed,
                "known_ransomware_use": known_ransomware,
                # remediation_status defaults to 'open' in the schema
                # first_seen_date    defaults to CURRENT_DATE in the schema
                "days_open_as_of_last_run": 0,
            }
        )

    if rows:
        get_client().table("vulnerabilities").upsert(rows, on_conflict="id").execute()


# ═══════════════════════════════════════════════════════════════════════════
# MONTE CARLO LAYER
# ═══════════════════════════════════════════════════════════════════════════

def insert_simulation_run(mc_api_response: dict, company_name: str) -> str:
    """
    Persist the portfolio-level Monte Carlo output.

    mc_api_response : dict from serialize_simulation_results(...).model_dump()
                      Shape confirmed: portfolio_metrics {mean_ale, std_dev,
                      p50, p90, p95, p99} + metadata {status,
                      total_iterations, audit_trail_seed}.

    Returns the new simulation_runs.id (UUID) for downstream FK references.
    """
    portfolio = mc_api_response["portfolio_metrics"]
    meta = mc_api_response.get("metadata", mc_api_response)

    row = {
        "company_name": company_name,
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


def insert_risk_assessments(
    asset_level_results: list, simulation_run_id: str, company_name: str
) -> None:
    """
    Persist per-asset ALE (CFO Metric #9 — Asset-Level Treemap source).

    asset_level_results : list of {asset_id, mean_ale} dicts from
                          generate_portfolio_analytics_summary()["top_risk_drivers"]
    """
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
    """
    Persist the full set of dynamic vulnerability controls generated by
    build_dynamic_vuln_controls().

    dynamic_controls  : list[SecurityControl]
    simulation_run_id : str (UUID)

    Returns {vulnerability_id: remediation_actions.id} so that
    insert_optimization_run() can translate solver control IDs to row IDs.

    New vs. original db.py:
        cost_efficiency_ratio — estimated_risk_reduction / cost_lakh,
        stored for CFO Metric #10 (Remediation Cost-Efficiency Table).
    """
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
    """
    Persist the knapsack optimisation result.

    opt_result           : OptimizationResult from solve_knapsack()
    simulation_run_id    : str (UUID)
    vuln_id_to_action_id : {vulnerability_id: remediation_actions.id}
                           returned by insert_remediation_actions()
    portfolio_ale_lakh   : total portfolio ALE in lakhs (used for residual_risk)
    dynamic_controls     : optional full list[SecurityControl] — used to
                           derive full_coverage_capex_lakh (Metric #8)

    New vs. original db.py:
        total_selected_cost_lakh — sum of selected control costs
        full_coverage_capex_lakh — total cost across ALL controls (100% coverage)
        rosi                     — total_risk_reduction / total_selected_cost_lakh
    """
    opt_dict = opt_result.model_dump()

    selected_controls = opt_dict.get("selected_controls", [])
    selected_action_ids = [
        vuln_id_to_action_id[c["id"]]
        for c in selected_controls
        if c["id"] in vuln_id_to_action_id
    ]

    total_risk_reduction = opt_dict.get("total_risk_reduction", 0) or 0
    total_selected_cost = sum(c["cost"] for c in selected_controls)

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
# CISO SNAPSHOT
# ═══════════════════════════════════════════════════════════════════════════

def insert_ciso_snapshot(
    valid_assets: list,
    valid_vulns: list,
    opt_result: Any,
    simulation_run_id: str,
    company_name: str,
) -> tuple[str, float]:
    """
    Compute and persist all 11 CISO dashboard metrics for this pipeline run.

    valid_assets      : list[AssetRecord]
    valid_vulns       : list[VulnerabilityRecord]
    opt_result        : OptimizationResult — knapsack output
    simulation_run_id : str (UUID)

    Returns (ciso_snapshots.id, posture_score) so that
    insert_quarterly_risk_trend() can mirror the posture score without
    a round-trip query.

    Metric derivations
    ──────────────────
    #1  posture_score          100 − severity_penalty − exploit_penalty + coverage_bonus
                               Clamped to [0, 100].
                               Penalty weights: Critical 3 pt, High 1.5 pt, Medium 0.5 pt,
                               Low 0.1 pt, active exploit +2 pt, known exploit +1 pt.
                               Coverage bonus: control_coverage_ratio × 15 pt.

    #2  total_active_vulns     len(valid_vulns)
    #3  count_critical/high/medium/low  derived from cvss_score via _cvss_to_severity()
    #6  control_coverage_ratio selected_controls / total_vulns
    #7  exploitability counts  grouped by exploit_status.value
    #8  avg_days_open_*        from days_open_as_of_last_run (set to 0 on first ingest)
    #9  attack surface         asset internet_facing flag joined to each vuln
    #10 endpoint agent pct     agent_installed flag on AssetRecord (defaults FALSE)
    #11 pipeline funnel        selected controls → in_progress, rest → open
    """
    opt_dict = opt_result.model_dump()
    selected_ids: set[str] = {c["id"] for c in opt_dict.get("selected_controls", [])}

    # ── Asset lookup maps ────────────────────────────────────────────────
    asset_internet_map: dict[str, bool] = {
        a.uid: a.internet_facing for a in valid_assets
    }

    # ── Vulnerability aggregation ────────────────────────────────────────
    total_vulns = len(valid_vulns)
    count_critical = count_high = count_medium = count_low = 0
    count_exploitable_theoretical = count_exploitable_active = 0
    count_external = count_internal = 0
    pipeline_open = pipeline_in_progress = 0
    total_days_open_critical = 0
    total_days_open_all = 0

    for v in valid_vulns:
        severity = _cvss_to_severity(v.cvss_score)
        days_open = getattr(v, "days_open_as_of_last_run", 0) or 0

        # Severity distribution (Metric #3)
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

        # Exploitability (Metric #7)
        es = v.exploit_status.value
        if es == "active":
            count_exploitable_active += 1
        elif es == "known":
            count_exploitable_theoretical += 1

        # Pipeline funnel (Metric #11)
        vuln_id = getattr(v, "id", None)
        if vuln_id and vuln_id in selected_ids:
            pipeline_in_progress += 1
        else:
            pipeline_open += 1

        # Attack surface (Metric #9)
        if asset_internet_map.get(v.asset_id, False):
            count_external += 1
        else:
            count_internal += 1

    # ── Metric #6: Control coverage ratio ───────────────────────────────
    control_coverage_ratio = (
        round(len(selected_ids) / total_vulns, 4) if total_vulns > 0 else 0.0
    )

    # ── Metric #8: Aging ─────────────────────────────────────────────────
    avg_days_open_critical = (
        round(total_days_open_critical / count_critical, 2)
        if count_critical > 0
        else 0.0
    )
    avg_days_open_all = (
        round(total_days_open_all / total_vulns, 2) if total_vulns > 0 else 0.0
    )

    # ── Metric #10: Endpoint agent coverage ─────────────────────────────
    total_assets = len(valid_assets)
    assets_with_agent = sum(
        1 for a in valid_assets if getattr(a, "agent_installed", False)
    )
    endpoint_agent_coverage_pct = (
        round(assets_with_agent / total_assets * 100, 2) if total_assets > 0 else 0.0
    )

    # ── Metric #1: Posture score ─────────────────────────────────────────
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
        "pipeline_testing": 0,   # promoted by patch-management integration
        "pipeline_verified": 0,  # promoted by patch-management integration
    }
    res = get_client().table("ciso_snapshots").insert(row).execute()
    return res.data[0]["id"], posture_score


# ═══════════════════════════════════════════════════════════════════════════
# CFO SNAPSHOT
# ═══════════════════════════════════════════════════════════════════════════

def insert_cfo_snapshot(
    analytics: dict,
    opt_result: Any,
    simulation_run_id: str,
    company_name: str,
) -> str:
    """
    Compute and persist all 11 CFO financial dashboard metrics for this run.

    analytics         : dict from generate_portfolio_analytics_summary()
    opt_result        : OptimizationResult from solve_knapsack()
    simulation_run_id : str (UUID)

    Metric derivations
    ──────────────────
    #1  mean_ale_lakh                    analytics.portfolio_metrics.mean_ale / 1e5
    #2  var_95_lakh                      analytics.portfolio_metrics.p95 / 1e5
    #3  budget_utilization_pct           opt_result.budget_utilization_pct  (native field)
    #4  total_risk_reduction_lakh        opt_result.total_risk_reduction (already in lakhs)
    #5  rosi                             total_risk_reduction / total_cost (selected)
    #6  deferred_backlog_*               opt_result.future_budget.total_deferred_{cost,reduction}
    #7  next_cycle_budget_forecast_lakh  opt_result.future_budget.approx_next_cycle_budget
    #8  full_coverage_capex_lakh         opt_result.future_budget.approx_full_coverage_budget
                                         (includes 15% contingency buffer from the solver)
    """
    opt_dict = opt_result.model_dump()
    pm = analytics["portfolio_metrics"]

    mean_ale_lakh = round(pm["mean_ale"] / 100_000.0, 4)
    var_95_lakh = round((pm.get("p95") or 0.0) / 100_000.0, 4)

    budget_lakh = opt_dict.get("budget", 0) or 0.0
    total_selected_cost = opt_dict.get("total_cost", 0) or 0.0
    total_risk_reduction = opt_dict.get("total_risk_reduction", 0) or 0.0

    # OptimizationResult carries budget_utilization_pct natively
    budget_utilization_pct = opt_dict.get("budget_utilization_pct", 0.0)

    # ROSI
    rosi = (
        round(total_risk_reduction / total_selected_cost, 6)
        if total_selected_cost > 0
        else None
    )

    # Deferred backlog — sourced from FutureBudgetEstimate (populated by solver)
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
    """
    Append one data point to the QoQ risk trend table (CFO Metric #11).

    Call once per pipeline run, immediately after insert_ciso_snapshot()
    so posture_score is already computed.

    simulation_run_id : str (UUID)
    period_label      : human-readable quarter label, e.g. "Q2 FY26"
    period_start      : ISO 8601 date string for the quarter start, e.g. "2026-07-01"
    analytics         : dict from generate_portfolio_analytics_summary()
    opt_result        : OptimizationResult from solve_knapsack()
    posture_score     : float — second return value from insert_ciso_snapshot()
    """
    opt_dict = opt_result.model_dump()
    pm = analytics["portfolio_metrics"]

    mean_ale_lakh = round(pm["mean_ale"] / 100_000.0, 4)
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
# AUTH / MULTI-TENANCY LAYER — append these to db.py
# ═══════════════════════════════════════════════════════════════════════════

def get_or_create_company(company_name: str) -> str:
    """
    Look up a company by name; create it if it doesn't exist yet.
    Returns the company's UUID (companies.company_id).

    NOTE: this matches on company_name exactly (case-sensitive). If two
    people sign up with slightly different casing/spacing for the same
    real company ("Acme Corp" vs "acme corp "), they'll get separate
    company rows. Fine for a hackathon demo; a real product would
    normalize the name (lowercase + strip) before matching, or let users
    pick from existing companies instead of free-typing one.
    """
    client = get_client()
    existing = (
        client.table("companies")
        .select("company_id")
        .eq("company_name", company_name)
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]["company_id"]

    created = client.table("companies").insert({"company_name": company_name}).execute()
    return created.data[0]["company_id"]


def upsert_profile(email: str, name: str, role: str, company_id: str) -> None:
    """
    Create or update the user's profile row, linked to their company.

    Matches on email (assumed unique per user). If profiles.email doesn't
    have a unique constraint in your schema yet, this on_conflict will
    fail — add one via:
        ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    before relying on this upsert.
    """
    get_client().table("profiles").upsert(
        {
            "email": email,
            "name": name,
            "role": role,
            "company_id": company_id,
        },
        on_conflict="email",
    ).execute()
def get_profile_by_email(email: str) -> dict | None:
    """
    Fetches an existing profile from Supabase by email.
    Used during login to prevent overwriting existing names/companies with nulls.
    """
    try:
        res = get_client().table("profiles").select("*").eq("email", email).limit(1).execute()
        if res.data:
            return res.data[0]
        return None
    except Exception as e:
        print(f"Error fetching profile: {e}")
        return None


def get_company_name(company_id: str | None) -> str:
    """
    Looks up a company name by its UUID.
    Required by /api/run-pipeline to tag all metrics with the correct tenant.
    """
    if not company_id:
        return "Unknown Company"
        
    try:
        res = get_client().table("companies").select("company_name").eq("company_id", company_id).limit(1).execute()
        if res.data:
            return res.data[0]["company_name"]
        return "Unknown Company"
    except Exception as e:
        print(f"Error fetching company name: {e}")
        return "Unknown Company"