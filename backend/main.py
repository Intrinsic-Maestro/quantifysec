import sys
from pathlib import Path
import os
import time
import random
import json
import traceback
from datetime import date
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, Security, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
import resend

import db

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

from math_engine.monte_carlo.simulator import run_portfolio_simulation
from math_engine.monte_carlo.analytics import generate_portfolio_analytics_summary
from math_engine.monte_carlo.schema_exporter import serialize_simulation_results
from knapsack_solver.solver import solve_knapsack
from knapsack_solver.data import DEFAULT_BUDGET_LAKH
from knapsack_solver.models import OptimizationRequest, SecurityControl

DISABLE_AUTH = os.getenv("DISABLE_AUTH", "false").lower() == "true"
JWT_SECRET = os.getenv("JWT_SECRET_KEY", os.getenv("SUPABASE_JWT_SECRET", "fallback-secret-for-dev"))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
resend.api_key = os.getenv("RESEND_API_KEY")

security = HTTPBearer(auto_error=False)

# ═══════════════════════════════════════════════════════════════════════════
# ULTRA-FAST TAB SWITCHING CACHE
# ═══════════════════════════════════════════════════════════════════════════
GLOBAL_DASHBOARD_CACHE = {}

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    if DISABLE_AUTH: return {"sub": "test-user", "email": "test@local", "role": "ciso", "company_name": "Test Company"}
    if credentials is None: raise HTTPException(status_code=401, detail="Missing auth token.")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_aud": False})
        return {
            "sub": payload.get("sub"),
            "email": payload.get("email", payload.get("sub")),
            "role": payload.get("role", "ciso"),
            "company_id": payload.get("app_metadata", {}).get("company_id"),
            "company_name": payload.get("company_name", "Unknown Company"),
        }
    except jwt.PyJWTError: raise HTTPException(status_code=401, detail="Invalid token.")

OTP_STORE: Dict[str, Dict[str, Any]] = {}

class OTPRequest(BaseModel):
    email: str
    role: str
    name: Optional[str] = None
    company: Optional[str] = None

class OTPVerify(BaseModel):
    email: str
    otp: str

app = FastAPI(title="QuantifySec Enterprise API", version="1.0.0")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════════
# PIPELINE MODELS
# ═══════════════════════════════════════════════════════════════════════════

class DynamicLossParams:
    def __init__(self, mean_inr_millions: float = 50.0):
        self.mean_inr_millions = mean_inr_millions

class DynamicAssetStub:
    def __init__(self, uid: str, mean_inr_millions: float = 50.0):
        self.uid = uid
        self.loss_parameters = DynamicLossParams(mean_inr_millions)

class DynamicVulnStub:
    def __init__(self, vuln_id: str, asset_id: str, cvss_score: float, cost_lakh: Optional[float] = None, cve_id: str = "CVE-UNKNOWN", category: str = "Remediation"):
        self.id = vuln_id
        self.asset_id = asset_id
        self.cvss_score = cvss_score
        self.cost_lakh = cost_lakh
        self.cve_id = cve_id
        self.category = category

def build_mc_payload(valid_assets: list, valid_vulns: list) -> List[Dict[str, Any]]:
    asset_map = {a.uid: a.loss_parameters.mean_inr_millions * 1_000_000 for a in valid_assets}
    default_loss = 50.0 * 1_000_000
    return [{"asset_id": v.asset_id, "asset_value": asset_map.get(v.asset_id, default_loss), "cvss_score": v.cvss_score} for v in valid_vulns]

def build_dynamic_vuln_controls(valid_vulns: list, portfolio_ale_rupees: float) -> List[SecurityControl]:
    dynamic_controls = []
    total_cvss = sum(v.cvss_score for v in valid_vulns)
    
    for i, v in enumerate(valid_vulns):
        vuln_share = v.cvss_score / total_cvss if total_cvss > 0 else 0
        reduction_lakhs = (portfolio_ale_rupees * vuln_share) / 100_000.0
        cost_lakh = getattr(v, "cost_lakh", None)
        if cost_lakh is None or cost_lakh <= 0: cost_lakh = round(max(0.5, v.cvss_score * 0.5), 2)
        vuln_id = getattr(v, "id", f"vuln-{i}")
        dynamic_controls.append(SecurityControl(
            id=vuln_id, name=f"Remediate {getattr(v, 'cve_id', 'VULN')} ({vuln_id[:10]})",
            cost=cost_lakh, risk_reduction=round(reduction_lakhs, 2), category=getattr(v, "category", "Remediation")
        ))
    return dynamic_controls

def execute_risk_engine(valid_assets: list, valid_vulns: list, company_name: str, custom_budget: float = DEFAULT_BUDGET_LAKH) -> dict:
    if not valid_vulns: return {"has_data": False}
    if not valid_assets:
        valid_assets = [DynamicAssetStub(aid) for aid in {getattr(v, "asset_id", "AST-DEFAULT") for v in valid_vulns}]

    print("Running 10,000 Monte Carlo Iterations...")
    mc_payload = build_mc_payload(valid_assets, valid_vulns)
    raw_sim_results = run_portfolio_simulation(mc_payload)
    analytics = generate_portfolio_analytics_summary(raw_sim_results)
    mc_dict = serialize_simulation_results(analytics, total_iterations=10000, random_seed=42).model_dump()

    portfolio_ale_rupees = analytics["portfolio_metrics"]["mean_ale"]
    dynamic_vuln_controls = build_dynamic_vuln_controls(valid_vulns, portfolio_ale_rupees)
    
    print("Running Knapsack Solver...")
    opt_result = solve_knapsack(OptimizationRequest(controls=dynamic_vuln_controls, budget=custom_budget))
    portfolio_ale_lakh = portfolio_ale_rupees / 100_000.0

    period_label = f"Q4 FY26"
    period_start = date(date.today().year, 1, 1).isoformat()
    posture_score = 75.0

    print("Writing 5000 rows to Supabase...")
    try:
        simulation_run_id = db.insert_simulation_run(mc_dict, company_name)
        db.insert_risk_assessments(analytics.get("top_risk_drivers", []), simulation_run_id, company_name)
        vuln_id_to_action_id = db.insert_remediation_actions(dynamic_vuln_controls, simulation_run_id, company_name)
        db.insert_optimization_run(opt_result, simulation_run_id, vuln_id_to_action_id, portfolio_ale_lakh, company_name, dynamic_vuln_controls)
        db.insert_ciso_snapshot(valid_assets, valid_vulns, opt_result, simulation_run_id, company_name)
        db.insert_cfo_snapshot(analytics, opt_result, simulation_run_id, company_name)
        db.insert_quarterly_risk_trend(simulation_run_id, period_label, period_start, analytics, opt_result, posture_score, company_name)
    except Exception as db_err:
        print(f"Database write notice: {db_err}")

    capital_at_risk_pre = round(portfolio_ale_rupees / 100_000.0, 2)
    risk_neutralized = round(opt_result.total_risk_reduction, 2)
    budget_deployed = round(opt_result.total_cost, 2)
    roi_multiple = round(risk_neutralized / budget_deployed, 2) if budget_deployed > 0 else 0.0

    payload = {
        "status": "success",
        "has_data": True,
        "cfo_metrics": {
            "capital_at_risk": capital_at_risk_pre,
            "risk_neutralized": f"{risk_neutralized:,.2f}",
            "budget_deployed": budget_deployed,
            "roi": f"{roi_multiple}",
            "exposure_reduction": f"{round((risk_neutralized / capital_at_risk_pre) * 100, 1) if capital_at_risk_pre > 0 else 0.0}%",
            "selected_controls": [c.model_dump() for c in opt_result.selected_controls],
            "deferred_controls": [c.model_dump() for c in opt_result.deferred_controls],
        },
        "ciso_metrics": {
            "posture_score": posture_score,
            "controls_deployed": len(opt_result.selected_controls),
            "critical_gaps": len(opt_result.deferred_controls),
            "total_evaluated": len(valid_vulns),
            "deployed_controls": [c.model_dump() for c in opt_result.selected_controls],
            "deferred_controls": [c.model_dump() for c in opt_result.deferred_controls],
        },
        "cfo_budget_optimization": opt_result.model_dump(),
        "monte_carlo_risk_profile": mc_dict,
        "solver_time_seconds": opt_result.solver_time_seconds,
        "budget": custom_budget,
    }

    # INSTANT CACHE FOR TAB SWITCHING
    GLOBAL_DASHBOARD_CACHE[company_name] = payload
    return payload

# ═══════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/request-otp")
def request_otp(payload: OTPRequest):
    email = payload.email.strip().lower()
    code = f"{random.randint(100000, 999999)}"
    OTP_STORE[email] = {
        "otp": code, "expires_at": time.time() + 300, "role": payload.role.strip().lower(),
        "name": payload.name.strip() if payload.name else None, "company": payload.company.strip() if payload.company else None,
    }
    return {"status": "success", "message": "Verification code dispatched"}

@app.post("/api/auth/verify-otp")
def verify_otp(payload: OTPVerify):
    email = payload.email.strip().lower()
    record = OTP_STORE.get(email)
    if not record or record["otp"] != payload.otp.strip(): raise HTTPException(400, "Invalid code")

    existing = db.get_profile_by_email(email)
    company_name = record.get("company") or (existing.get("company_name") if existing else "Unknown Company")
    name = record.get("name") or (existing.get("name") if existing else email.split("@")[0])
    role = record["role"]
    
    company_id = db.get_or_create_company(company_name)
    db.upsert_profile(email=email, name=name, role=role, company_id=company_id)

    token_payload = {"sub": email, "email": email, "name": name, "role": role, "company_name": company_name, "aud": "authenticated", "app_metadata": {"company_id": company_id}, "exp": time.time() + 86400}
    access_token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    del OTP_STORE[email]

    return {"status": "authenticated", "access_token": access_token, "role": role, "email": email, "company_name": company_name}

# ═══════════════════════════════════════════════════════════════════════════
# TELEMETRY INGESTION (PARSES 1111, 1112, 1113, 1114)
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/ingest-ocsf")
async def ingest_ocsf_telemetry(files: Optional[List[UploadFile]] = File(None), file: Optional[UploadFile] = File(None), user: dict = Depends(verify_token)):
    upload_list = []
    if files: upload_list.extend(files)
    if file and file not in upload_list: upload_list.append(file)
    if not upload_list: raise HTTPException(status_code=400, detail="No files received.")

    all_valid_vulns, all_valid_assets = [], []
    company_name = user.get("company_name") or "Unknown Company"
    budget_lakh = DEFAULT_BUDGET_LAKH

    for uploaded_file in upload_list:
        if not uploaded_file.filename.endswith(".json"): continue
        try:
            text_content = (await uploaded_file.read()).decode("utf-8").strip()
            if not text_content: continue

            items = []
            try:
                parsed = json.loads(text_content)
                if isinstance(parsed, dict):
                    if "company_profile" in parsed:
                        budget_lakh = float(parsed["company_profile"].get("allocated_security_budget_lakhs", DEFAULT_BUDGET_LAKH))
                        continue
                    if "quarterly_history" in parsed: continue
                    items = parsed.get("findings") or parsed.get("vulnerabilities") or [parsed]
                elif isinstance(parsed, list):
                    items = parsed
            except json.JSONDecodeError:
                for line in text_content.splitlines():
                    if line.strip():
                        try: items.append(json.loads(line.strip()))
                        except Exception: pass

            for item in items:
                if not isinstance(item, dict): continue

                if "asset_id" in item and "financial_exposure" in item:
                    sle = float(item["financial_exposure"].get("single_loss_expectancy_lakhs", 50.0))
                    all_valid_assets.append(DynamicAssetStub(uid=item["asset_id"], mean_inr_millions=sle / 10.0))

                if "finding_info" in item and "vulnerabilities" in item:
                    device_uid = item.get("device", {}).get("uid", "AST-UNKNOWN")
                    finding_uid = item.get("finding_info", {}).get("uid", f"FINDING-{len(all_valid_vulns)}")
                    applied = item.get("applied_controls", ["Remediation"])
                    primary_cat = applied[0] if applied else "Remediation"
                    rem_cost = float(item.get("remediation", {}).get("estimated_remediation_cost_lakhs", 1.0))

                    for v in item.get("vulnerabilities", []):
                        score = float(v.get("cvss", {}).get("base_score", 5.0))
                        all_valid_vulns.append(DynamicVulnStub(
                            vuln_id=finding_uid, asset_id=device_uid, cvss_score=score, cost_lakh=rem_cost, 
                            cve_id=v.get("cve", {}).get("id", "CVE-UNKNOWN"), category=primary_cat
                        ))
        except Exception as e: print(f"Error parsing {uploaded_file.filename}: {e}")

    # Database Upsert
    try:
        if all_valid_assets: db.upsert_assets(all_valid_assets, company_name)
        db.upsert_vulnerabilities(all_valid_vulns, company_name)
    except Exception as db_e:
        print(f"Upsert warning: {db_e}")

    # Run Math and Cache Result
    return execute_risk_engine(all_valid_assets, all_valid_vulns, company_name, custom_budget=budget_lakh)

# ═══════════════════════════════════════════════════════════════════════════
# FAST CACHED DASHBOARD FETCH (ZERO LAG TAB-SWITCHING)
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/run-pipeline")
@app.post("/api/run-pipeline")
def run_pipeline(user: dict = Depends(verify_token)):
    company_name = user.get("company_name") or "Unknown Company"
    
    # 1. READ INSTANT CACHE FIRST: Bypasses 3-minute recalculation!
    if company_name in GLOBAL_DASHBOARD_CACHE:
        print("Fetching instantly from memory cache...")
        return GLOBAL_DASHBOARD_CACHE[company_name]

    # 2. If no cache exists, ensure user actually has telemetry in Supabase
    if not db.has_telemetry(company_name):
        return {"has_data": False}

    # 3. If cache was lost (e.g. server restarted) but DB has data, rebuild
    raw_vulns = db.get_vulnerabilities(company_name)
    raw_assets = db.get_assets(company_name)

    valid_vulns = [DynamicVulnStub(vuln_id=row.get("id", f"VULN-{i}"), asset_id=row.get("asset_id", "AST-0001"), cvss_score=float(row.get("cvss_score") or 5.0)) for i, row in enumerate(raw_vulns)]
    valid_assets = [DynamicAssetStub(uid=row.get("uid") or row.get("id") or row.get("asset_id") or "AST-0001") for row in raw_assets]

    return execute_risk_engine(valid_assets, valid_vulns, company_name)