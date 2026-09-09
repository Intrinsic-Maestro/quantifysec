from __future__ import annotations

import json
import logging
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from data_ingestion.loaders import load_json_source, iter_jsonl
from data_ingestion.schemas import AssetBusinessContext, FinancialParameters
from data_ingestion.graph_builder import parse_ocsf_to_graph
from math_engine.monte_carlo.simulator import run_portfolio_simulation
from math_engine.pso.optimizer import PSOSecurityOptimizer

logger = logging.getLogger("quantifysec")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

DATA_DIR = Path(os.getenv("QUANTIFYSEC_DATA_DIR", str(ROOT_DIR / "output")))
MC_ITERATIONS = int(os.getenv("MC_ITERATIONS", "10000"))
MC_BATCH_SIZE = int(os.getenv("MC_BATCH_SIZE", "2048"))
PSO_PARTICLES = int(os.getenv("PSO_PARTICLES", "30"))
PSO_ITERATIONS = int(os.getenv("PSO_ITERATIONS", "30"))
RANDOM_SEED = os.getenv("QUANTIFYSEC_SEED")
RANDOM_SEED = int(RANDOM_SEED) if RANDOM_SEED else None

FILES = {
    "assets": "asset_business_context.json",
    "finance": "financial_parameters.json",
    "history": "historical_risk_trends.json",
    "ocsf": "ocsf_vulnerability_findings.json",
}

app = FastAPI(
    title="QuantifySec Enterprise API",
    version="3.0.0",
    description="Four-file CTEM ingestion -> Monte Carlo risk quantification -> budget-constrained PSO remediation.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _locate(name: str) -> Path:
    candidates = [DATA_DIR / name, ROOT_DIR / name, ROOT_DIR / "data_ingestion" / name]
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError(f"Cannot find {name}. Checked: {[str(x) for x in candidates]}")


def _first_vuln(f: dict) -> dict:
    return (f.get("vulnerabilities") or [{}])[0]


def _asset_id(f: dict) -> str | None:
    return f.get("device", {}).get("uid") or f.get("affected_asset", {}).get("uid")


def _cve_id(f: dict) -> str | None:
    v = _first_vuln(f)
    cve = v.get("cve", {})
    return cve.get("id") or cve.get("uid")


def _cvss(f: dict) -> float:
    v = _first_vuln(f)
    return float(v.get("cvss", {}).get("base_score") or 0.0)


def _severity(f: dict) -> str:
    return str(f.get("severity") or "Unknown").title()


def _exploited(f: dict) -> bool:
    v = _first_vuln(f)
    return bool(v.get("is_known_exploited") or f.get("kev_listed") or f.get("is_known_exploited"))


def _status(f: dict) -> str:
    return str(f.get("finding_info", {}).get("status") or "Open")


def _created(f: dict) -> datetime | None:
    raw = f.get("finding_info", {}).get("created_time") or f.get("first_seen_time")
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _compact_finding(f: dict, asset_map: dict[str, AssetBusinessContext]) -> dict | None:
    asset_id = _asset_id(f)
    cve_id = _cve_id(f)
    if not asset_id or not cve_id or asset_id not in asset_map:
        return None

    remediation = f.get("remediation") or {}
    device = f.get("device") or {}
    agent = device.get("agent") or {}
    controls = f.get("applied_controls") or []

    return {
        "cve_id": cve_id,
        "asset_id": asset_id,
        "severity": _severity(f),
        "cvss_score": _cvss(f),
        "known_exploited": _exploited(f),
        "status": _status(f),
        "created_time": _created(f),
        "external": bool(device.get("is_ip_external", False)),
        "agent_status": str(agent.get("status") or "Unknown"),
        "controls": controls,
        "patch_available": bool(remediation.get("patch_available", False)),
        "remediation_cost_lakhs": float(remediation.get("estimated_remediation_cost_lakhs") or 0.0),
        "risk_reduction_percentage": float(remediation.get("risk_reduction_percentage") or 0.0),
        "asset_criticality": asset_map[asset_id].criticality_score,
        "business_unit": asset_map[asset_id].business_unit,
    }


def _ingest(assets_path: Path, finance_path: Path, history_path: Path, ocsf_path: Path):
    """Load the four package files. OCSF is streamed, so the 40+ MB JSONL file
    is never loaded wholesale into memory."""
    raw_assets = load_json_source(str(assets_path))
    raw_finance = load_json_source(str(finance_path))
    history = load_json_source(str(history_path))

    assets = [AssetBusinessContext(**x) for x in raw_assets]
    asset_map = {a.asset_id: a for a in assets}

    compact: list[dict] = []
    valid = malformed = 0

    def records():
        nonlocal valid, malformed
        for raw in iter_jsonl(str(ocsf_path)):
            rec = _compact_finding(raw, asset_map)
            if rec is None:
                malformed += 1
                continue
            valid += 1
            compact.append(rec)
            yield raw

    # Graph parsing consumes the stream once. Compact records are retained for
    # dashboard aggregation only, not the original 40 MB raw dictionaries.
    graph = parse_ocsf_to_graph(records(), assets, {})

    finance = FinancialParameters(**raw_finance)
    return assets, asset_map, finance, history, graph, compact, valid, malformed


def _severity_distribution(records: list[dict]) -> dict:
    counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for r in records:
        if r["severity"] in counts:
            counts[r["severity"]] += 1
    total = sum(counts.values())
    return {"counts": counts, "percentages": {k: round(v / total * 100, 2) if total else 0 for k, v in counts.items()}, "total": total}


def _heatmap(records: list[dict]) -> list[dict]:
    rows: dict[str, dict] = {}
    for r in records:
        row = rows.setdefault(r["asset_id"], {
            "asset_id": r["asset_id"], "business_unit": r["business_unit"],
            "criticality_score": r["asset_criticality"], "Critical": 0, "High": 0, "Medium": 0, "Low": 0,
        })
        if r["severity"] in ("Critical", "High", "Medium", "Low"):
            row[r["severity"]] += 1
    return sorted(rows.values(), key=lambda x: (x["criticality_score"], x["Critical"], x["High"]), reverse=True)[:100]


def _technical_metrics(records: list[dict], node_risk: list[dict]) -> dict:
    dist = _severity_distribution(records)
    total = len(records)
    exploited = sum(r["known_exploited"] for r in records)
    covered = sum(bool(r["controls"]) for r in records)
    external = sum(r["external"] for r in records)
    healthy = sum(r["agent_status"].lower() == "healthy" for r in records)
    unhealthy = sum(r["agent_status"].lower() == "unhealthy" for r in records)

    ages = []
    now = datetime.now(timezone.utc)
    for r in records:
        if r["severity"] == "Critical" and r["status"].lower() != "verified" and r["created_time"]:
            ages.append(max(0.0, (now - r["created_time"]).total_seconds() / 86400))

    stages = {"Open": 0, "In-Progress": 0, "Testing": 0, "Verified": 0}
    for r in records:
        s = r["status"] if r["status"] in stages else "Open"
        stages[s] += 1

    drivers = []
    risk_map = {x["graph_key"]: x for x in node_risk}
    for r in records:
        key = f'{r["asset_id"]}_{r["cve_id"]}'
        risk = risk_map.get(key, {})
        drivers.append({
            "cve_id": r["cve_id"], "asset_id": r["asset_id"], "cvss_score": r["cvss_score"],
            "severity": r["severity"], "asset_criticality": r["asset_criticality"],
            "known_exploited": r["known_exploited"],
            "expected_annual_loss_lakhs": risk.get("expected_annual_loss_lakhs", 0),
        })
    drivers.sort(key=lambda x: x["expected_annual_loss_lakhs"], reverse=True)

    # Transparent dashboard score, not a claim of a formal industry standard.
    severity_penalty = sum(
        {"Critical": 1.0, "High": 0.55, "Medium": 0.25, "Low": 0.08}.get(r["severity"], 0)
        for r in records
    )
    severity_health = max(0, 100 - severity_penalty / total * 100) if total else 0
    avg_criticality = sum(r["asset_criticality"] for r in records) / total if total else 1
    criticality_health = max(0, 100 - ((avg_criticality - 1) / 4) * 100)
    control_health = covered / total * 100 if total else 0
    exploit_health = 100 - exploited / total * 100 if total else 100
    posture = round(severity_health * .40 + criticality_health * .25 + control_health * .20 + exploit_health * .15, 1)

    controls = {}
    for r in records:
        for c in r["controls"]:
            controls[c] = controls.get(c, 0) + 1

    return {
        "overall_security_posture_score": posture,
        "total_active_vulnerabilities": total,
        "cvss_severity_distribution": dist,
        "asset_criticality_heatmap": _heatmap(records),
        "top_technical_risk_drivers": drivers[:25],
        "security_control_coverage_ratio": {
            "covered_vectors": covered, "total_risk_vectors": total,
            "coverage_ratio_percent": round(covered / total * 100, 2) if total else 0,
            "control_frequency": sorted(({"control": k, "findings_covered": v} for k, v in controls.items()), key=lambda x: x["findings_covered"], reverse=True),
        },
        "exploitability_threat_index": {
            "theoretical_vulnerabilities": total - exploited,
            "actively_exploited_cves": exploited,
            "exploited_ratio_percent": round(exploited / total * 100, 2) if total else 0,
        },
        "unpatched_vulnerability_aging": {
            "average_open_days": round(sum(ages) / len(ages), 2) if ages else 0,
            "critical_open_count": len(ages),
        },
        "attack_surface_exposure_index": {
            "external_facing_vulnerable_endpoints": external,
            "internal_only_vulnerable_endpoints": total - external,
            "external_exposure_percent": round(external / total * 100, 2) if total else 0,
        },
        "endpoint_agent_coverage": {
            "covered_endpoints": healthy + unhealthy,
            "healthy_agents": healthy,
            "unhealthy_agents": unhealthy,
            "deployment_coverage_percent": round((healthy + unhealthy) / total * 100, 2) if total else 0,
            "healthy_deployment_percent": round(healthy / (healthy + unhealthy) * 100, 2) if healthy + unhealthy else 0,
        },
        "remediation_pipeline_status": {"stages": stages, "total": total},
    }


def _build_controls(records: list[dict], node_risk: list[dict]) -> list[dict]:
    risk = {x["graph_key"]: x["expected_annual_loss_lakhs"] for x in node_risk}
    controls = []
    for index, r in enumerate(records):
        if r["status"].lower() == "verified" or not r["patch_available"] or r["remediation_cost_lakhs"] <= 0:
            continue
        key = f'{r["asset_id"]}_{r["cve_id"]}'
        monetary_risk = float(risk.get(key, 0.0))
        controls.append({
            "id": f'{r["cve_id"]}::{r["asset_id"]}::{index}',
            "name": f'Remediate {r["cve_id"]} on {r["asset_id"]}',
            "cost": r["remediation_cost_lakhs"],
            "risk_reduction": monetary_risk * max(0.0, min(1.0, r["risk_reduction_percentage"])),
            "category": "Remediation",
            "is_toxic": r["cvss_score"] >= 9.0 and r["asset_criticality"] >= 4,
            "cve_id": r["cve_id"],
            "asset_id": r["asset_id"],
        })
    return controls


def _treemap(records: list[dict], assets: dict[str, AssetBusinessContext]) -> list[dict]:
    grouped: dict[str, dict] = {}
    for r in records:
        a = assets[r["asset_id"]]
        row = grouped.setdefault(r["asset_id"], {
            "asset_id": r["asset_id"], "business_unit": a.business_unit,
            "financial_exposure_lakhs": a.single_loss_expectancy_inr_lakhs,
            "vulnerability_count": 0, "criticality_score": a.criticality_score,
        })
        row["vulnerability_count"] += 1
    return sorted(grouped.values(), key=lambda x: x["financial_exposure_lakhs"], reverse=True)[:100]


def _run_pipeline(iterations: int) -> dict:
    started = time.perf_counter()
    assets_path, finance_path, history_path, ocsf_path = (_locate(FILES[x]) for x in ("assets", "finance", "history", "ocsf"))
    assets, asset_map, finance, history, graph, records, valid, malformed = _ingest(assets_path, finance_path, history_path, ocsf_path)

    if not graph:
        raise HTTPException(400, "No valid vulnerability nodes were created from the OCSF dataset.")

    mc = run_portfolio_simulation(
        graph, assets, iterations=iterations, batch_size=MC_BATCH_SIZE, seed=RANDOM_SEED
    )
    ale = float(mc["mean_ale_lakhs"])

    controls = _build_controls(records, mc["node_risk"])
    pso = PSOSecurityOptimizer(
        controls=controls,
        budget_lakhs=finance.allocated_security_budget_lakhs,
        num_particles=PSO_PARTICLES,
        max_iterations=PSO_ITERATIONS,
        seed=RANDOM_SEED,
    ).optimize()

    selected = pso["selected_controls"]
    selected_cost = float(pso["total_cost"])
    gross_reduction = float(pso["total_risk_reduction"])
    effective_reduction = float(pso["effective_risk_reduction"])
    residual = max(0.0, ale - effective_reduction)
    rosi = effective_reduction / selected_cost if selected_cost else 0.0

    deferred = pso["deferred_controls"]
    deferred_cost = sum(float(x["cost"]) for x in deferred)
    deferred_reduction = sum(float(x["risk_reduction"]) for x in deferred)

    trend = list(history.get("quarterly_history", []))
    trend.append({"quarter": "Current Simulation", "mean_ale_lakhs": ale, "var_95_lakhs": mc["p95_var_lakhs"], "total_vulnerabilities": len(records)})

    ciso = _technical_metrics(records, mc["node_risk"])
    cfo = {
        "mean_annual_loss_expectancy_lakhs": ale,
        "p95_value_at_risk_lakhs": mc["p95_var_lakhs"],
        "budget_utilization": {
            "allocated_budget_lakhs": finance.allocated_security_budget_lakhs,
            "proposed_remediation_cost_lakhs": selected_cost,
            "utilization_percent": round(selected_cost / finance.allocated_security_budget_lakhs * 100, 2) if finance.allocated_security_budget_lakhs else 0,
            "remaining_budget_lakhs": round(finance.allocated_security_budget_lakhs - selected_cost, 2),
        },
        "total_financial_risk_reduction_lakhs": round(effective_reduction, 2),
        "return_on_security_investment": {"risk_reduction_lakhs": round(effective_reduction, 2), "investment_lakhs": round(selected_cost, 2), "rosi_ratio": round(rosi, 3)},
        "deferred_backlog_financial_impact": {
            "deferred_backlog_budget_lakhs": finance.deferred_backlog_budget_lakhs,
            "deferred_remediation_cost_lakhs": round(deferred_cost, 2),
            "deferred_risk_reduction_lakhs": round(deferred_reduction, 2),
            "residual_risk_lakhs": round(residual, 2),
        },
        "next_cycle_budget_forecast": {"forecast_lakhs": round(min(deferred_cost, finance.deferred_backlog_budget_lakhs), 2)},
        "full_coverage_capital_requirement_lakhs": finance.target_full_coverage_capital_lakhs,
        "asset_level_financial_loss_treemap": _treemap(records, asset_map),
        "remediation_cost_efficiency_table": sorted([
            {"id": x["id"], "name": x["name"], "cve_id": x["cve_id"], "asset_id": x["asset_id"], "cost_lakhs": x["cost"], "risk_reduction_lakhs": round(x["risk_reduction"], 4), "risk_reduction_per_lakh": round(x["risk_reduction"] / x["cost"], 4)}
            for x in controls if x["cost"] > 0
        ], key=lambda x: x["risk_reduction_per_lakh"], reverse=True)[:50],
        "quarter_over_quarter_risk_trend": trend,
    }

    # Never send tens of thousands of deferred controls to the browser.
    pso_public = dict(pso)
    pso_public["selected_controls"] = selected[:100]
    pso_public["deferred_controls"] = sorted(deferred, key=lambda x: x["risk_reduction"] / max(x["cost"], 1e-9), reverse=True)[:100]

    elapsed = round(time.perf_counter() - started, 3)
    return {
        "status": "success",
        "run_id": str(uuid.uuid4()),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "performance": {"pipeline_seconds": elapsed, "monte_carlo_iterations": iterations, "mc_batch_size": MC_BATCH_SIZE},
        "ingestion_metrics": {"raw_valid_findings": valid, "malformed_or_unmapped_findings": malformed, "graph_nodes_processed": len(graph), "assets_loaded": len(assets)},
        "company_context": {
            "annual_revenue_lakhs": finance.annual_revenue_inr_lakhs,
            "allocated_security_budget_lakhs": finance.allocated_security_budget_lakhs,
            "deferred_backlog_budget_lakhs": finance.deferred_backlog_budget_lakhs,
            "target_full_coverage_capital_lakhs": finance.target_full_coverage_capital_lakhs,
        },
        "ciso_metrics": ciso,
        "cfo_metrics": cfo,
        "monte_carlo": {k: v for k, v in mc.items() if k != "node_risk"},
        "risk_quantification": {"vulnerability_count": len(mc["node_risk"]), "top_risks": mc["node_risk"][:100], "all_risks_available": True},
        "pso_optimization": pso_public,
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "QuantifySec Enterprise API"}


@app.post("/api/run-pipeline")
def run_pipeline(iterations: int = Query(MC_ITERATIONS, ge=100, le=10000)):
    return _run_pipeline(iterations)


@app.get("/api/dashboard/ciso")
def ciso_dashboard(iterations: int = Query(MC_ITERATIONS, ge=100, le=10000)):
    result = _run_pipeline(iterations)
    return {"status": result["status"], "generated_at": result["generated_at"], "company_context": result["company_context"], "ingestion_metrics": result["ingestion_metrics"], "ciso_metrics": result["ciso_metrics"], "risk_quantification": result["risk_quantification"]}


@app.get("/api/dashboard/cfo")
def cfo_dashboard(iterations: int = Query(MC_ITERATIONS, ge=100, le=10000)):
    result = _run_pipeline(iterations)
    return {"status": result["status"], "generated_at": result["generated_at"], "company_context": result["company_context"], "ingestion_metrics": result["ingestion_metrics"], "cfo_metrics": result["cfo_metrics"], "monte_carlo": result["monte_carlo"], "pso_optimization": result["pso_optimization"]}


@app.post("/api/run-pipeline/upload")
async def run_uploaded_pipeline(
    asset_business_context: UploadFile = File(...),
    financial_parameters: UploadFile = File(...),
    historical_risk_trends: UploadFile = File(...),
    ocsf_vulnerability_findings: UploadFile = File(...),
    iterations: int = Query(MC_ITERATIONS, ge=100, le=10000),
):
    """Upload variant for clients that do not keep the four files on the API host."""
    temp_dir = ROOT_DIR / ".quantifysec_uploads"
    temp_dir.mkdir(exist_ok=True)
    run_id = uuid.uuid4().hex
    paths = {}
    try:
        for key, upload in (("assets", asset_business_context), ("finance", financial_parameters), ("history", historical_risk_trends), ("ocsf", ocsf_vulnerability_findings)):
            suffix = ".json"
            path = temp_dir / f"{run_id}_{key}{suffix}"
            with path.open("wb") as out:
                while chunk := await upload.read(1024 * 1024):
                    out.write(chunk)
            paths[key] = path

        # Same pipeline, but with the uploaded paths.
        assets, asset_map, finance, history, graph, records, valid, malformed = _ingest(paths["assets"], paths["finance"], paths["history"], paths["ocsf"])
        if not graph:
            raise HTTPException(400, "No valid vulnerability nodes were created from uploaded OCSF data.")

        # Reuse the core calculation by temporarily invoking the same stages.
        mc = run_portfolio_simulation(graph, assets, iterations=iterations, batch_size=MC_BATCH_SIZE, seed=RANDOM_SEED)
        controls = _build_controls(records, mc["node_risk"])
        pso = PSOSecurityOptimizer(controls, finance.allocated_security_budget_lakhs, PSO_PARTICLES, PSO_ITERATIONS, RANDOM_SEED).optimize()
        # Return a compact but complete frontend payload by mirroring the main result structure.
        ale = mc["mean_ale_lakhs"]
        selected_cost = pso["total_cost"]
        reduction = pso["effective_risk_reduction"]
        trend = list(history.get("quarterly_history", [])) + [{"quarter": "Current Simulation", "mean_ale_lakhs": ale, "var_95_lakhs": mc["p95_var_lakhs"], "total_vulnerabilities": len(records)}]
        ciso = _technical_metrics(records, mc["node_risk"])
        cfo = {
            "mean_annual_loss_expectancy_lakhs": ale,
            "p95_value_at_risk_lakhs": mc["p95_var_lakhs"],
            "budget_utilization": {"allocated_budget_lakhs": finance.allocated_security_budget_lakhs, "proposed_remediation_cost_lakhs": selected_cost, "utilization_percent": round(selected_cost / finance.allocated_security_budget_lakhs * 100, 2) if finance.allocated_security_budget_lakhs else 0},
            "total_financial_risk_reduction_lakhs": round(reduction, 2),
            "return_on_security_investment": {"rosi_ratio": round(reduction / selected_cost, 3) if selected_cost else 0},
            "deferred_backlog_financial_impact": {"deferred_backlog_budget_lakhs": finance.deferred_backlog_budget_lakhs},
            "next_cycle_budget_forecast": {"forecast_lakhs": finance.deferred_backlog_budget_lakhs},
            "full_coverage_capital_requirement_lakhs": finance.target_full_coverage_capital_lakhs,
            "asset_level_financial_loss_treemap": _treemap(records, asset_map),
            "remediation_cost_efficiency_table": [],
            "quarter_over_quarter_risk_trend": trend,
        }
        return {"status": "success", "ingestion_metrics": {"raw_valid_findings": valid, "malformed_or_unmapped_findings": malformed, "graph_nodes_processed": len(graph)}, "ciso_metrics": ciso, "cfo_metrics": cfo, "monte_carlo": {k: v for k, v in mc.items() if k != "node_risk"}, "risk_quantification": {"top_risks": mc["node_risk"][:100]}, "pso_optimization": {**pso, "selected_controls": pso["selected_controls"][:100], "deferred_controls": pso["deferred_controls"][:100]}}
    finally:
        for path in paths.values():
            try:
                path.unlink(missing_ok=True)
            except Exception:
                pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=False)
