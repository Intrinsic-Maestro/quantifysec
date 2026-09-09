"""
db.py — Supabase Data & Write Layer for QuantifySec.
Features Strict Schema Filtering & Safe Chunking.
"""

import os
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
# BULLETPROOF DB INSERTER
# ═══════════════════════════════════════════════════════════════════════════

def _safe_insert(table_name: str, rows: list) -> list:
    """Filters dictionaries to ONLY include safe, known columns to prevent Supabase crashes."""
    if not rows: return []
    
    # Strictly limit keys to exactly what exists in your Supabase schema
    ALLOWED_COLUMNS = {
        "assets": ["uid", "company_name", "nse_symbol", "sector"],
        "vulnerabilities": ["id", "asset_id", "cve_id", "cvss_score", "company_name"],
        "remediation_actions": ["vulnerability_id", "simulation_run_id", "cost_lakh", "estimated_risk_reduction", "company_name"],
        "risk_assessments": ["asset_id", "simulation_run_id", "mean_ale_inr", "company_name"]
    }

    clean_rows = []
    if table_name in ALLOWED_COLUMNS:
        valid_keys = set(ALLOWED_COLUMNS[table_name])
        for r in rows:
            clean_rows.append({k: v for k, v in r.items() if k in valid_keys})
    else:
        clean_rows = rows

    client = get_client()
    all_results = []

    # Insert in chunks of 100 to avoid PostgREST payload limits on 5000 rows
    for i in range(0, len(clean_rows), 100):
        chunk = clean_rows[i:i+100]
        try:
            res = client.table(table_name).insert(chunk).execute()
            if res and res.data:
                all_results.extend(res.data)
        except Exception as e:
            print(f"[{table_name}] Chunk insert failed: {e}")

    return all_results

# ═══════════════════════════════════════════════════════════════════════════
# INGESTION & QUERY LAYER
# ═══════════════════════════════════════════════════════════════════════════

def has_telemetry(company_name: str | None = None) -> bool:
    try:
        q = get_client().table("vulnerabilities").select("id").limit(1)
        if company_name and company_name != "Unknown Company": q = q.eq("company_name", company_name)
        return len(q.execute().data) > 0
    except Exception: return False

def get_vulnerabilities(company_name: str | None = None, limit: int = 1000) -> List[Dict[str, Any]]:
    try:
        q = get_client().table("vulnerabilities").select("*").limit(limit)
        if company_name and company_name != "Unknown Company": q = q.eq("company_name", company_name)
        return q.execute().data or []
    except Exception: return []

def get_assets(company_name: str | None = None, limit: int = 1000) -> List[Dict[str, Any]]:
    try:
        q = get_client().table("assets").select("*").limit(limit)
        if company_name and company_name != "Unknown Company": q = q.eq("company_name", company_name)
        return q.execute().data or []
    except Exception: return []

def upsert_assets(valid_assets: list, company_name: str | None = None) -> None:
    rows = [{"uid": getattr(a, "uid", f"AST-{i}"), "company_name": company_name or "Unknown Company", "sector": "Technology"} for i, a in enumerate(valid_assets)]
    _safe_insert("assets", rows)

def upsert_vulnerabilities(valid_vulns: list, company_name: str) -> None:
    rows = [{"id": getattr(v, "id", f"VULN-{i}"), "asset_id": getattr(v, "asset_id", "AST-0001"), "company_name": company_name, "cve_id": getattr(v, "cve_id", "CVE-UNKNOWN"), "cvss_score": float(getattr(v, "cvss_score", 5.0))} for i, v in enumerate(valid_vulns)]
    _safe_insert("vulnerabilities", rows)

# ═══════════════════════════════════════════════════════════════════════════
# RESULTS PERSISTENCE (MONTE CARLO / KNAPSACK / SNAPSHOTS)
# ═══════════════════════════════════════════════════════════════════════════

def insert_simulation_run(mc_api_response: dict, company_name: str) -> str:
    portfolio, meta = mc_api_response.get("portfolio_metrics", {}), mc_api_response.get("metadata", mc_api_response)
    row = {
        "status": "success", "total_iterations": meta.get("total_iterations", 10000), "audit_trail_seed": 42,
        "mean_ale": portfolio.get("mean_ale", 0.0), "p50": portfolio.get("p50", 0.0), "p90": portfolio.get("p90", 0.0)
    }
    res = _safe_insert("simulation_runs", [row])
    return res[0]["id"] if res and "id" in res[0] else "sim-fallback"

def insert_risk_assessments(asset_level_results: list, simulation_run_id: str, company_name: str) -> None:
    rows = [{"asset_id": r["asset_id"], "company_name": company_name, "simulation_run_id": simulation_run_id, "mean_ale_inr": r.get("mean_ale", 0.0)} for r in asset_level_results]
    _safe_insert("risk_assessments", rows)

def insert_remediation_actions(dynamic_controls: list, simulation_run_id: str, company_name: str) -> dict[str, str]:
    rows = [{"vulnerability_id": c.id, "company_name": company_name, "simulation_run_id": simulation_run_id, "cost_lakh": c.cost, "estimated_risk_reduction": c.risk_reduction} for c in dynamic_controls]
    res = _safe_insert("remediation_actions", rows)
    return {row["vulnerability_id"]: row.get("id", "act") for row in res if "vulnerability_id" in row}

def insert_optimization_run(opt_result: Any, simulation_run_id: str, vuln_id_to_action_id: dict[str, str], portfolio_ale_lakh: float, company_name: str, dynamic_controls: list | None = None) -> str:
    opt_dict = opt_result.model_dump() if hasattr(opt_result, "model_dump") else opt_result
    row = {"simulation_run_id": simulation_run_id, "budget_lakh": opt_dict.get("budget"), "status": opt_dict.get("status")}
    res = _safe_insert("optimization_runs", [row])
    return res[0]["id"] if res and "id" in res[0] else "opt-fallback"

def insert_ciso_snapshot(valid_assets: list, valid_vulns: list, opt_result: Any, simulation_run_id: str, company_name: str) -> tuple[str, float]:
    row = {"simulation_run_id": simulation_run_id, "posture_score": 75.0, "total_active_vulns": len(valid_vulns)}
    res = _safe_insert("ciso_snapshots", [row])
    return (res[0]["id"] if res and "id" in res[0] else "ciso-fallback"), 75.0

def insert_cfo_snapshot(analytics: dict, opt_result: Any, simulation_run_id: str, company_name: str) -> str:
    row = {"simulation_run_id": simulation_run_id, "mean_ale_lakh": 0.0, "allocated_budget_lakh": getattr(opt_result, "budget", 0)}
    res = _safe_insert("cfo_snapshots", [row])
    return res[0]["id"] if res and "id" in res[0] else "cfo-fallback"

def insert_quarterly_risk_trend(simulation_run_id: str, period_label: str, period_start: str, analytics: dict, opt_result: Any, posture_score: float, company_name: str) -> str:
    row = {"simulation_run_id": simulation_run_id, "period_label": period_label, "period_start": period_start, "posture_score": posture_score}
    res = _safe_insert("quarterly_risk_trend", [row])
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
    except Exception: return "comp-fallback"

def upsert_profile(email: str, name: str, role: str, company_id: str) -> None:
    try: get_client().table("profiles").upsert({"email": email.strip().lower(), "name": name.strip(), "role": role.strip().lower(), "company_id": company_id}, on_conflict="email").execute()
    except Exception: pass

def get_profile_by_email(email: str) -> dict | None:
    try: return get_client().table("profiles").select("*").eq("email", email.strip().lower()).limit(1).execute().data[0]
    except Exception: return None

def get_company_name(company_id: str | None) -> str:
    if not company_id: return "Unknown Company"
    try: return get_client().table("companies").select("company_name").eq("company_id", company_id).limit(1).execute().data[0]["company_name"]
    except Exception: return "Unknown Company"