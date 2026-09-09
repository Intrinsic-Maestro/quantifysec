"""
db.py — Supabase Data & Write Layer for QuantifySec.
Features Auto-Healing Schema Insertion.
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, List, Dict

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

from supabase import create_client, Client

_client: Client | None = None

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
    if name in ("client", "supabase"):
        return get_client()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

def _cvss_to_severity(score: float) -> str:
    if score >= 9.0: return "Critical"
    elif score >= 7.0: return "High"
    elif score >= 4.0: return "Medium"
    return "Low"

def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))

# ═══════════════════════════════════════════════════════════════════════════
# SELF-HEALING DATABASE INSERTER
# ═══════════════════════════════════════════════════════════════════════════

def _robust_upsert(table_name: str, rows: list, pk_col: str = "id") -> list:
    """
    If Supabase rejects an insert due to a missing column in your table schema,
    this function detects the exact missing column, strips it, and retries automatically.
    """
    if not rows: 
        return []
    
    client = get_client()
    all_results = []
    
    # Chunk into 200 rows at a time to prevent payload limits
    for i in range(0, len(rows), 200):
        chunk = [r.copy() for r in rows[i:i+200]]
        
        for attempt in range(10):  # Allow up to 10 auto-corrections per chunk
            try:
                # Omit explicit on_conflict if not explicitly required by Supabase config
                res = client.table(table_name).upsert(chunk).execute()
                all_results.extend(res.data or [])
                break
            except Exception as e:
                err_str = str(e)
                
                # Check if it crashed because of a missing column
                match = re.search(r'column "([^"]+)"', err_str) or re.search(r"Could not find the '([^']+)' column", err_str)
                if match:
                    bad_col = match.group(1)
                    print(f"[{table_name}] Auto-fixing schema: Stripping unknown column '{bad_col}'")
                    for r in chunk:
                        r.pop(bad_col, None)
                    continue
                
                # Check for constraint conflicts, try pure insert fallback
                if "conflict" in err_str.lower() or "constraint" in err_str.lower():
                    try:
                        res = client.table(table_name).insert(chunk).execute()
                        all_results.extend(res.data or [])
                        break
                    except Exception as inner_e:
                        print(f"[{table_name}] Insert fallback failed: {inner_e}")
                        break
                        
                print(f"[{table_name}] Unrecoverable DB Error: {err_str}")
                break

    return all_results

# ═══════════════════════════════════════════════════════════════════════════
# INGESTION & QUERY LAYER
# ═══════════════════════════════════════════════════════════════════════════

def has_telemetry(company_name: str | None = None) -> bool:
    try:
        query = get_client().table("vulnerabilities").select("id").limit(1)
        if company_name and company_name != "Unknown Company":
            query = query.eq("company_name", company_name)
        return len(query.execute().data) > 0
    except Exception:
        return False

def get_vulnerabilities(company_name: str | None = None, limit: int = 1000) -> List[Dict[str, Any]]:
    try:
        query = get_client().table("vulnerabilities").select("*").limit(limit)
        if company_name and company_name != "Unknown Company":
            query = query.eq("company_name", company_name)
        return query.execute().data or []
    except Exception as e:
        print(f"Error fetching vulnerabilities: {e}")
        return []

def get_assets(company_name: str | None = None, limit: int = 1000) -> List[Dict[str, Any]]:
    try:
        query = get_client().table("assets").select("*").limit(limit)
        if company_name and company_name != "Unknown Company":
            query = query.eq("company_name", company_name)
        return query.execute().data or []
    except Exception as e:
        print(f"Error fetching assets: {e}")
        return []

def upsert_assets(valid_assets: list, company_name: str | None = None) -> None:
    rows = []
    for i, a in enumerate(valid_assets):
        loss_params = getattr(a, "loss_parameters", None)
        uid = getattr(a, "uid", None) or getattr(a, "id", None) or f"AST-{i+1:04d}"
        rows.append({
            "uid": uid,
            "company_name": company_name or "Unknown Company",
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
    _robust_upsert("assets", rows, "uid")

def upsert_vulnerabilities(valid_vulns: list, company_name: str) -> None:
    rows = []
    for i, v in enumerate(valid_vulns):
        vid = getattr(v, "id", f"VULN-{i+1:04d}")
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
            "kev_listed": bool(getattr(v, "kev_listed", False)),
            "known_ransomware_use": bool(getattr(v, "known_ransomware_use", False)),
            "days_open_as_of_last_run": getattr(v, "days_open_as_of_last_run", 0) or 0,
        })
    _robust_upsert("vulnerabilities", rows, "id")

# ═══════════════════════════════════════════════════════════════════════════
# RESULTS PERSISTENCE (MONTE CARLO / KNAPSACK / SNAPSHOTS)
# ═══════════════════════════════════════════════════════════════════════════

def insert_simulation_run(mc_api_response: dict, company_name: str) -> str:
    portfolio = mc_api_response.get("portfolio_metrics", {})
    meta = mc_api_response.get("metadata", mc_api_response)
    row = {
        "company_name": company_name,
        "status": meta.get("status", "completed"),
        "total_iterations": meta.get("total_iterations", 10000),
        "audit_trail_seed": meta.get("audit_trail_seed", 42),
        "mean_ale": portfolio.get("mean_ale", 0.0),
        "std_dev": portfolio.get("std_dev", 0.0),
        "p50": portfolio.get("p50") or portfolio.get("percentile_50") or 0.0,
        "p90": portfolio.get("p90") or portfolio.get("percentile_90") or 0.0,
        "p95": portfolio.get("p95") or portfolio.get("percentile_95") or 0.0,
        "p99": portfolio.get("p99") or portfolio.get("percentile_99") or 0.0,
    }
    res = _robust_upsert("simulation_runs", [row], "id")
    return res[0]["id"] if res and "id" in res[0] else "sim-run-fallback"

def insert_risk_assessments(asset_level_results: list, simulation_run_id: str, company_name: str) -> None:
    rows = [
        {
            "asset_id": r["asset_id"],
            "company_name": company_name,
            "simulation_run_id": simulation_run_id,
            "mean_ale_inr": r.get("mean_ale", 0.0),
        }
        for r in asset_level_results
    ]
    _robust_upsert("risk_assessments", rows, "id")

def insert_remediation_actions(dynamic_controls: list, simulation_run_id: str, company_name: str) -> dict[str, str]:
    rows = [
        {
            "vulnerability_id": c.id,
            "company_name": company_name,
            "simulation_run_id": simulation_run_id,
            "cost_lakh": c.cost,
            "estimated_risk_reduction": c.risk_reduction,
            "effort_days": None,
            "cost_efficiency_ratio": (round(c.risk_reduction / c.cost, 6) if c.cost > 0 else None),
        }
        for c in dynamic_controls
    ]
    res = _robust_upsert("remediation_actions", rows, "id")
    return {row["vulnerability_id"]: row["id"] for row in res if "vulnerability_id" in row and "id" in row}

def insert_optimization_run(opt_result: Any, simulation_run_id: str, vuln_id_to_action_id: dict[str, str], portfolio_ale_lakh: float, company_name: str, dynamic_controls: list | None = None) -> str:
    opt_dict = opt_result.model_dump() if hasattr(opt_result, "model_dump") else opt_result
    selected_controls = opt_dict.get("selected_controls", [])
    selected_action_ids = [vuln_id_to_action_id[c["id"]] for c in selected_controls if c.get("id") in vuln_id_to_action_id]
    total_risk_reduction = opt_dict.get("total_risk_reduction", 0) or 0
    total_selected_cost = sum(c.get("cost", 0) for c in selected_controls)
    full_coverage_capex = round(sum(c.cost for c in dynamic_controls), 4) if dynamic_controls else None
    rosi = round(total_risk_reduction / total_selected_cost, 6) if total_selected_cost > 0 else None

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
    res = _robust_upsert("optimization_runs", [row], "id")
    return res[0]["id"] if res and "id" in res[0] else "opt-run-fallback"

def insert_ciso_snapshot(valid_assets: list, valid_vulns: list, opt_result: Any, simulation_run_id: str, company_name: str) -> tuple[str, float]:
    opt_dict = opt_result.model_dump() if hasattr(opt_result, "model_dump") else opt_result
    selected_ids: set[str] = {c["id"] for c in opt_dict.get("selected_controls", [])}

    total_vulns = len(valid_vulns)
    count_critical = count_high = count_medium = count_low = 0
    for v in valid_vulns:
        severity = _cvss_to_severity(getattr(v, "cvss_score", 5.0) or 5.0)
        if severity == "Critical": count_critical += 1
        elif severity == "High": count_high += 1
        elif severity == "Medium": count_medium += 1
        else: count_low += 1

    control_coverage_ratio = round(len(selected_ids) / total_vulns, 4) if total_vulns > 0 else 0.0
    posture_score = _clamp(round(100.0 - (count_critical * 3.0 + count_high * 1.5 + count_medium * 0.5 + count_low * 0.1) + (control_coverage_ratio * 15.0), 2), 0.0, 100.0)

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
        "total_assets": len(valid_assets),
    }
    res = _robust_upsert("ciso_snapshots", [row], "id")
    return (res[0]["id"] if res and "id" in res[0] else "ciso-snap-fallback"), posture_score

def insert_cfo_snapshot(analytics: dict, opt_result: Any, simulation_run_id: str, company_name: str) -> str:
    opt_dict = opt_result.model_dump() if hasattr(opt_result, "model_dump") else opt_result
    pm = analytics.get("portfolio_metrics", {})
    row = {
        "company_name": company_name,
        "simulation_run_id": simulation_run_id,
        "mean_ale_lakh": round(pm.get("mean_ale", 0.0) / 100_000.0, 4),
        "var_95_lakh": round((pm.get("p95") or pm.get("percentile_95") or 0.0) / 100_000.0, 4),
        "allocated_budget_lakh": round(opt_dict.get("budget", 0) or 0.0, 4),
        "total_remediation_cost_lakh": round(opt_dict.get("total_cost", 0) or 0.0, 4),
        "budget_utilization_pct": round(opt_dict.get("budget_utilization_pct", 0.0), 2),
        "total_risk_reduction_lakh": round(opt_dict.get("total_risk_reduction", 0) or 0.0, 4),
    }
    res = _robust_upsert("cfo_snapshots", [row], "id")
    return res[0]["id"] if res and "id" in res[0] else "cfo-snap-fallback"

def insert_quarterly_risk_trend(simulation_run_id: str, period_label: str, period_start: str, analytics: dict, opt_result: Any, posture_score: float, company_name: str) -> str:
    opt_dict = opt_result.model_dump() if hasattr(opt_result, "model_dump") else opt_result
    pm = analytics.get("portfolio_metrics", {})
    row = {
        "company_name": company_name,
        "simulation_run_id": simulation_run_id,
        "period_label": period_label,
        "period_start": period_start,
        "mean_ale_lakh": round(pm.get("mean_ale", 0.0) / 100_000.0, 4),
        "var_95_lakh": round((pm.get("p95") or pm.get("percentile_95") or 0.0) / 100_000.0, 4),
        "total_risk_reduction_lakh": round(opt_dict.get("total_risk_reduction", 0) or 0.0, 4),
        "posture_score": round(posture_score, 2),
    }
    res = _robust_upsert("quarterly_risk_trend", [row], "id")
    return res[0]["id"] if res and "id" in res[0] else "trend-fallback"

# ═══════════════════════════════════════════════════════════════════════════
# AUTH / PROFILES LAYER
# ═══════════════════════════════════════════════════════════════════════════

def get_or_create_company(company_name: str) -> str:
    clean_name = company_name.strip() if company_name else "Unknown Company"
    try:
        existing = get_client().table("companies").select("company_id").eq("company_name", clean_name).limit(1).execute()
        if existing.data: return existing.data[0]["company_id"]
        created = get_client().table("companies").insert({"company_name": clean_name}).execute()
        return created.data[0]["company_id"]
    except Exception:
        return "comp-fallback"

def upsert_profile(email: str, name: str, role: str, company_id: str) -> None:
    try:
        get_client().table("profiles").upsert({"email": email.strip().lower(), "name": name.strip(), "role": role.strip().lower(), "company_id": company_id}, on_conflict="email").execute()
    except Exception: pass

def get_profile_by_email(email: str) -> dict | None:
    try:
        res = get_client().table("profiles").select("*").eq("email", email.strip().lower()).limit(1).execute()
        return res.data[0] if res.data else None
    except Exception: return None

def get_company_name(company_id: str | None) -> str:
    if not company_id: return "Unknown Company"
    try:
        res = get_client().table("companies").select("company_name").eq("company_id", company_id).limit(1).execute()
        if res.data and res.data[0].get("company_name"): return res.data[0]["company_name"]
        return "Unknown Company"
    except Exception: return "Unknown Company"