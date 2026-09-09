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

# ============================================================
# Root Directory Setup
# ============================================================
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

from data_ingestion.ingestion import ingest_assets, ingest_vulnerabilities, ingest_combined_findings
from math_engine.monte_carlo.simulator import run_portfolio_simulation
from math_engine.monte_carlo.analytics import generate_portfolio_analytics_summary
from math_engine.monte_carlo.schema_exporter import serialize_simulation_results
from knapsack_solver.solver import solve_knapsack
from knapsack_solver.data import get_sample_controls, DEFAULT_BUDGET_LAKH
from knapsack_solver.models import OptimizationRequest, OptimizationResult, SecurityControl

# ============================================================
# Environment & Auth Config
# ============================================================
DISABLE_AUTH = os.getenv("DISABLE_AUTH", "false").lower() == "true"
JWT_SECRET = os.getenv("JWT_SECRET_KEY", os.getenv("SUPABASE_JWT_SECRET", "fallback-secret-for-dev"))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
resend.api_key = os.getenv("RESEND_API_KEY")

security = HTTPBearer(auto_error=False)

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Validates the JWT token issued to the user."""
    if DISABLE_AUTH:
        return {"sub": "test-user", "email": "test@local", "role": "ciso", "company_name": "Test Company"}

    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing authentication token.")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_aud": False})
        return {
            "sub": payload.get("sub"),
            "email": payload.get("email", payload.get("sub")),
            "role": payload.get("role", "ciso"),
            "company_id": payload.get("app_metadata", {}).get("company_id"),
            "company_name": payload.get("company_name", "Unknown Company"),
        }
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token or expired session.")

# In-Memory OTP Store
OTP_STORE: Dict[str, Dict[str, Any]] = {}

class OTPRequest(BaseModel):
    email: str
    role: str
    name: Optional[str] = None
    company: Optional[str] = None

class OTPVerify(BaseModel):
    email: str
    otp: str

# ============================================================
# FastAPI App Initialization
# ============================================================
app = FastAPI(
    title="QuantifySec Enterprise API", 
    version="1.0.0",
    description="End-to-End Cyber Risk Quantification & Optimization Pipeline"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Dynamic Pipeline Objects & Stubs
# ============================================================
class DynamicLossParams:
    def __init__(self, mean_inr_millions: float = 50.0):
        self.mean_inr_millions = mean_inr_millions

class DynamicAssetStub:
    def __init__(self, uid: str, mean_inr_millions: float = 50.0):
        self.uid = uid
        self.loss_parameters = DynamicLossParams(mean_inr_millions)

class DynamicVulnStub:
    def __init__(self, vuln_id: str, asset_id: str, cvss_score: float):
        self.id = vuln_id
        self.asset_id = asset_id
        self.cvss_score = cvss_score

def build_mc_payload(valid_assets: list, valid_vulns: list) -> List[Dict[str, Any]]:
    asset_map = {}
    for a in valid_assets:
        asset_map[a.uid] = a.loss_parameters.mean_inr_millions * 1_000_000 
    
    payload = []
    for v in valid_vulns:
        if v.asset_id in asset_map:
            payload.append({
                "asset_id": v.asset_id,
                "asset_value": asset_map[v.asset_id],
                "cvss_score": v.cvss_score
            })
    return payload

def build_dynamic_vuln_controls(valid_vulns: list, portfolio_ale_rupees: float) -> List[SecurityControl]:
    dynamic_controls = []
    total_cvss = sum(v.cvss_score for v in valid_vulns)
    
    for i, v in enumerate(valid_vulns):
        vuln_share = v.cvss_score / total_cvss if total_cvss > 0 else 0
        reduction_lakhs = (portfolio_ale_rupees * vuln_share) / 100_000.0
        estimated_cost_lakh = round(max(0.5, v.cvss_score * 0.5), 2)
        vuln_id = getattr(v, 'id', f"vuln-{i}")
        
        dynamic_controls.append(
            SecurityControl(
                id=vuln_id,
                name=f"Patch Vuln {vuln_id[:8]} (CVSS {v.cvss_score})",
                cost=estimated_cost_lakh,
                risk_reduction=round(reduction_lakhs, 2),
                category="Remediation"
            )
        )
    return dynamic_controls

def build_vulnerability_drilldown(valid_vulns: list, portfolio_ale_rupees: float) -> List[dict]:
    total_cvss = sum(v.cvss_score for v in valid_vulns)
    drilldown = []
    
    for i, v in enumerate(valid_vulns):
        vuln_share = v.cvss_score / total_cvss if total_cvss > 0 else 0
        exposure_rupees = portfolio_ale_rupees * vuln_share
        vuln_id = getattr(v, 'id', f"VULN-{i}")
        
        drilldown.append({
            "vulnerability_id": vuln_id,
            "asset_id": v.asset_id,
            "cvss_score": v.cvss_score,
            "financial_exposure_lakhs": round(exposure_rupees / 100_000.0, 2)
        })
        
    drilldown.sort(key=lambda x: x["financial_exposure_lakhs"], reverse=True)
    return drilldown

def execute_risk_engine(valid_assets: list, valid_vulns: list, valid_findings: list, company_name: str) -> dict:
    """Runs Monte Carlo and Knapsack optimization strictly on live data."""
    if not valid_vulns:
        return {"has_data": False}

    if not valid_assets:
        unique_asset_ids = {getattr(v, 'asset_id', 'AST-DEFAULT') for v in valid_vulns}
        valid_assets = [DynamicAssetStub(aid) for aid in unique_asset_ids]

    mc_payload = build_mc_payload(valid_assets, valid_vulns)
    raw_sim_results = run_portfolio_simulation(mc_payload)
    analytics = generate_portfolio_analytics_summary(raw_sim_results)
    mc_api_response = serialize_simulation_results(analytics, total_iterations=10000, random_seed=42)
    mc_dict = mc_api_response.model_dump()

    portfolio_ale_rupees = analytics["portfolio_metrics"]["mean_ale"]
    dynamic_vuln_controls = build_dynamic_vuln_controls(valid_vulns, portfolio_ale_rupees)
    
    opt_request = OptimizationRequest(controls=dynamic_vuln_controls, budget=custom_budget)
    opt_result = solve_knapsack(opt_request)
    portfolio_ale_lakh = portfolio_ale_rupees / 100_000.0

    today = date.today()
    month = today.month
    if month >= 4:
        quarter = (month - 4) // 3 + 1
        fy_year = today.year + 1
        q_start_month = 4 + (quarter - 1) * 3
        q_start_year = today.year
    else:
        quarter = 4
        fy_year = today.year
        q_start_month = 1
        q_start_year = today.year

    period_label = f"Q{quarter} FY{str(fy_year)[2:]}"
    period_start = date(q_start_year, q_start_month, 1).isoformat()

    # Safely persist database snapshots
    posture_score = 75
    simulation_run_id = None
    try:
        simulation_run_id = db.insert_simulation_run(mc_dict, company_name)
        db.insert_risk_assessments(analytics["top_risk_drivers"], simulation_run_id, company_name)
        vuln_id_to_action_id = db.insert_remediation_actions(dynamic_vuln_controls, simulation_run_id, company_name)
        db.insert_optimization_run(
            opt_result,
            simulation_run_id,
            vuln_id_to_action_id,
            portfolio_ale_lakh,
            company_name,
            dynamic_controls=dynamic_vuln_controls,
        )
        _ciso_id, posture_score = db.insert_ciso_snapshot(
            valid_assets,
            valid_vulns,
            opt_result,
            simulation_run_id,
            company_name,
        )
        db.insert_cfo_snapshot(
            analytics,
            opt_result,
            simulation_run_id,
            company_name,
        )
        db.insert_quarterly_risk_trend(
            simulation_run_id,
            period_label,
            period_start,
            analytics,
            opt_result,
            posture_score,
            company_name,
        )
    except Exception as db_err:
        print(f"Database snapshot write notice: {db_err}")

    capital_at_risk_pre = round(portfolio_ale_rupees / 100_000.0, 2)
    risk_neutralized = round(opt_result.total_risk_reduction, 2)
    budget_deployed = round(opt_result.total_cost, 2)
    roi_multiple = round(risk_neutralized / budget_deployed, 2) if budget_deployed > 0 else 0
    exposure_pct = round((risk_neutralized / capital_at_risk_pre) * 100, 1) if capital_at_risk_pre > 0 else 0

    vuln_drilldown = build_vulnerability_drilldown(valid_vulns, portfolio_ale_rupees)

    return {
        "status": "success",
        "has_data": True,
        "simulation_run_id": simulation_run_id,
        "period_label": period_label,
        "cfo_metrics": {
            "capital_at_risk": capital_at_risk_pre,
            "risk_neutralized": f"{risk_neutralized:,.2f}",
            "budget_deployed": budget_deployed,
            "roi": f"{roi_multiple}",
            "exposure_reduction": f"{exposure_pct}%",
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
        "budget": DEFAULT_BUDGET_LAKH,
        "technical_drilldown": vuln_drilldown,
    }

# ============================================================
# API Endpoints: Health & Controls
# ============================================================
@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}

@app.get("/api/controls", response_model=List[SecurityControl])
def list_default_controls() -> List[SecurityControl]:
    return get_sample_controls()

@app.get("/api/optimize/default", response_model=OptimizationResult)
def optimize_default() -> OptimizationResult:
    req = OptimizationRequest(
        controls=get_sample_controls(),
        budget=DEFAULT_BUDGET_LAKH,
    )
    return solve_knapsack(req)

@app.post("/api/optimize", response_model=OptimizationResult)
def optimize(request: OptimizationRequest) -> OptimizationResult:
    if not request.controls:
        raise HTTPException(400, "No controls provided.")

    result = solve_knapsack(request)
    if result.status == "Infeasible":
        raise HTTPException(422, "No feasible combination satisfies the given budget and constraints.")
    if result.status not in ("Optimal", "Not Solved"):
        raise HTTPException(500, f"Solver returned status: {result.status}")

    return result

# ============================================================
# API Endpoints: Real Email MFA (Resend) & JWT Auth
# ============================================================
@app.post("/api/auth/request-otp")
def request_otp(payload: OTPRequest):
    email = payload.email.strip().lower()
    role = payload.role.strip().lower()
 
    code = f"{random.randint(100000, 999999)}"
    OTP_STORE[email] = {
        "otp": code,
        "expires_at": time.time() + 300,
        "role": role,
        "name": payload.name.strip() if payload.name else None,
        "company": payload.company.strip() if payload.company else None,
    }
 
    try:
        resend.Emails.send({
            "from": "QuantifySec <onboarding@resend.dev>",
            "to": email,
            "subject": f"QuantifySec Verification Code: {code}",
            "html": f"""
                <div style="font-family: sans-serif; background: #09090b; color: #ffffff; padding: 30px; border-radius: 12px;">
                    <h2 style="color: #a78bfa; margin-bottom: 10px;">QuantifySec Authentication</h2>
                    <p style="color: #a1a1aa; font-size: 14px;">Your single-use authorization code is:</p>
                    <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 16px; background: #18181b; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; display: inline-block; color: #a78bfa; margin: 15px 0;">
                        {code}
                    </div>
                    <p style="color: #71717a; font-size: 12px;">This code will expire in 5 minutes.</p>
                </div>
            """
        })
        return {"status": "success", "message": "Verification code dispatched to your email."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dispatch email: {str(e)}")

@app.post("/api/auth/verify-otp")
def verify_otp(payload: OTPVerify):
    email = payload.email.strip().lower()
    otp = payload.otp.strip()

    record = OTP_STORE.get(email)
    if not record:
        raise HTTPException(status_code=400, detail="No verification code requested for this email.")

    if time.time() > record["expires_at"]:
        del OTP_STORE[email]
        raise HTTPException(status_code=400, detail="Verification code expired. Please request a new code.")

    if record["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    # Smart profile and company lookup
    try:
        existing_profile = db.get_profile_by_email(email)
        
        if existing_profile:
            name = existing_profile.get("name") or record.get("name") or email.split("@")[0]
            company_id = existing_profile.get("company_id")
            role = existing_profile.get("role") or record["role"]
            
            if not company_id:
                company_name = record.get("company") or "Unknown Company"
                company_id = db.get_or_create_company(company_name)
                db.upsert_profile(email=email, name=name, role=role, company_id=company_id)
        else:
            company_name = record.get("company") or "Unknown Company"
            name = record.get("name") or email.split("@")[0]
            role = record["role"]
            company_id = db.get_or_create_company(company_name)
            db.upsert_profile(email=email, name=name, role=role, company_id=company_id)
            
        company_name = db.get_company_name(company_id) or "Unknown Company"

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to access or save profile in Supabase: {str(e)}")

    token_payload = {
        "sub": email,
        "email": email,
        "name": name,
        "role": role,
        "company_name": company_name,
        "aud": "authenticated",
        "app_metadata": {"company_id": company_id},
        "exp": time.time() + (60 * 60 * 24),
    }
    access_token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    del OTP_STORE[email]

    return {
        "status": "authenticated",
        "access_token": access_token,
        "role": role,
        "email": email,
        "company_id": company_id,
        "company_name": company_name,
    }

# ============================================================
# API Endpoint: Multi-File Ingestion (Supports JSON & NDJSON)
# ============================================================
@app.post("/api/ingest-ocsf")
async def ingest_ocsf_telemetry(
    files: Optional[List[UploadFile]] = File(None),
    file: Optional[UploadFile] = File(None),
    user: dict = Depends(verify_token)
):
    upload_list = []
    if files:
        upload_list.extend(files)
    if file and file not in upload_list:
        upload_list.append(file)

    if not upload_list:
        raise HTTPException(status_code=400, detail="No files received by backend.")

    if len(upload_list) > 6:
        raise HTTPException(status_code=400, detail="Maximum of 6 files allowed at once.")

    all_valid_vulns = []
    all_valid_assets = []
    company_name = user.get("company_name") or "Unknown Company"
    budget_lakh = DEFAULT_BUDGET_LAKH

    for uploaded_file in upload_list:
        if not uploaded_file.filename.endswith(".json"):
            continue
        try:
            raw_bytes = await uploaded_file.read()
            text_content = raw_bytes.decode("utf-8").strip()

            # 1. Parse JSON or NDJSON safely
            try:
                parsed_data = json.loads(text_content)
                if isinstance(parsed_data, dict):
                    # Check if it's the budget profile (1112.json)
                    if "company_profile" in parsed_data:
                        budget_lakh = float(parsed_data["company_profile"].get("allocated_security_budget_lakhs", DEFAULT_BUDGET_LAKH))
                        continue
                    # Check if it's the quarterly trend history (1113.json)
                    if "quarterly_history" in parsed_data:
                        continue
                    items = parsed_data.get("findings") or parsed_data.get("vulnerabilities") or [parsed_data]
                else:
                    items = parsed_data
            except json.JSONDecodeError:
                # Fallback parser for NDJSON (line-by-line JSON like 1114.json)
                items = []
                for line in text_content.splitlines():
                    line = line.strip()
                    if line:
                        try:
                            items.append(json.loads(line))
                        except json.JSONDecodeError:
                            continue

            # 2. Extract Assets (e.g. 1111_2.json)
            for item in items:
                if "asset_id" in item and "financial_exposure" in item:
                    sle = item["financial_exposure"].get("single_loss_expectancy_lakhs", 50.0)
                    all_valid_assets.append(DynamicAssetStub(
                        uid=item["asset_id"],
                        mean_inr_millions=float(sle) / 10.0
                    ))

                # 3. Extract Vulnerability Findings (e.g. 1114.json or standard OCSF)
                if "finding_info" in item and "vulnerabilities" in item:
                    vuln_list = item.get("vulnerabilities", [])
                    device_uid = item.get("device", {}).get("uid", "AST-UNKNOWN")
                    finding_uid = item.get("finding_info", {}).get("uid", f"FINDING-{len(all_valid_vulns)}")

                    for v in vuln_list:
                        cvss_score = float(v.get("cvss", {}).get("base_score", 5.0))
                        all_valid_vulns.append(DynamicVulnStub(
                            vuln_id=finding_uid,
                            asset_id=device_uid,
                            cvss_score=cvss_score
                        ))

        except Exception as e:
            print(f"Error parsing {uploaded_file.filename}: {e}")

    if not all_valid_vulns:
        raise HTTPException(
            status_code=400,
            detail="No valid vulnerability findings detected. Ensure the OCSF findings file (1114.json) is included."
        )

    # 4. Upsert records to Supabase
    try:
        if all_valid_assets:
            db.upsert_assets(all_valid_assets, company_name)
        db.upsert_vulnerabilities(all_valid_vulns, company_name)
    except Exception as e:
        print(f"Database upsert warning: {e}")

    # 5. Run Monte Carlo simulation & Knapsack solver using parsed budget
    return execute_risk_engine(all_valid_assets, all_valid_vulns, [], company_name, custom_budget=budget_lakh)

# ============================================================
# API Endpoint: Live Pipeline Check (Database-Driven, No Synthetic Data)
# ============================================================
@app.get("/api/run-pipeline")
@app.post("/api/run-pipeline")
def run_pipeline(user: dict = Depends(verify_token)):
    """
    Checks Supabase for real user telemetry.
    Never loads synthetic files or auto-inserts demo records.
    """
    company_name = user.get("company_name") or "Unknown Company"

    # 1. Fetch live records from Supabase
    raw_vulns = db.get_vulnerabilities(company_name)

    # 2. If the database is empty, return has_data: False immediately
    if not raw_vulns:
        return {"has_data": False}

    # 3. If real telemetry exists, read assets and execute the risk engine
    raw_assets = db.get_assets(company_name)

    valid_vulns = [
        DynamicVulnStub(
            vuln_id=row.get("id", f"VULN-{i}"),
            asset_id=row.get("asset_id", "AST-0001"),
            cvss_score=float(row.get("cvss_score") or 5.0)
        )
        for i, row in enumerate(raw_vulns)
    ]

    valid_assets = [
        DynamicAssetStub(uid=row.get("uid") or row.get("id") or row.get("asset_id") or "AST-0001")
        for row in raw_assets
    ]

    return execute_risk_engine(valid_assets, valid_vulns, [], company_name)