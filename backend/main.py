import sys
from pathlib import Path
import os
import time
import random
import json
import traceback
from typing import List, Dict, Any

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, Security, UploadFile, File, Header
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

from data_ingestion.ingestion import load_json_file, ingest_assets, ingest_vulnerabilities
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
        return {"sub": "test-user", "email": "test@local", "role": "ciso"}

    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing authentication token.")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_aud": False})
        return {
            "sub": payload.get("sub"),
            "email": payload.get("email", payload.get("sub")),
            "role": payload.get("role", "ciso")
        }
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token or expired session.")

# In-Memory OTP Store: { "email": {"otp": "123456", "expires_at": 1718000000, "role": "ciso"} }
OTP_STORE: Dict[str, Dict[str, Any]] = {}

class OTPRequest(BaseModel):
    email: str
    role: str

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
# Pipeline Helper Functions
# ============================================================
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
        "expires_at": time.time() + 300,  # 5 minute expiry
        "role": role
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
        
    token_payload = {
        "sub": email,
        "email": email,
        "role": record["role"],
        "exp": time.time() + (60 * 60 * 24)
    }
    access_token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    del OTP_STORE[email]
    
    return {
        "status": "authenticated",
        "access_token": access_token,
        "role": record["role"],
        "email": email
    }

# ============================================================
# API Endpoint: OCSF Telemetry Ingestion
# ============================================================
@app.post("/api/ingest-ocsf")
async def ingest_ocsf_telemetry(file: UploadFile = File(...), user: dict = Depends(verify_token)):
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Invalid file format. Upload only .json OCSF datasets.")
    
    try:
        content = await file.read()
        json_data = json.loads(content.decode("utf-8"))
        
        # Ingestion validation
        vuln_res = ingest_vulnerabilities(json_data)
        if not vuln_res["valid"]:
            raise HTTPException(status_code=400, detail="Uploaded file contained no valid OCSF vulnerability records.")
            
        db.upsert_vulnerabilities(vuln_res["valid"])
        
        return {
            "status": "success",
            "filename": file.filename,
            "records_processed": len(vuln_res["valid"]),
            "user": user["sub"]
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file syntax.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

# ============================================================
# API Endpoint: Full Pipeline Execution
# ============================================================
@app.post("/api/run-pipeline")
def run_full_enterprise_pipeline(user: dict = Depends(verify_token)):
    try:
        raw_assets = load_json_file("../output/synthetic_assets.json")
        raw_vulns = load_json_file("../output/synthetic_combined.json")
        
        asset_res = ingest_assets(raw_assets)
        vuln_res = ingest_vulnerabilities(raw_vulns)
        
        if not asset_res["valid"] or not vuln_res["valid"]:
            raise HTTPException(status_code=400, detail="Data ingestion failed. No valid records found.")

        db.upsert_assets(asset_res["valid"])
        db.upsert_vulnerabilities(vuln_res["valid"])

        mc_payload = build_mc_payload(asset_res["valid"], vuln_res["valid"])
        raw_sim_results = run_portfolio_simulation(mc_payload)
        analytics = generate_portfolio_analytics_summary(raw_sim_results)
        mc_api_response = serialize_simulation_results(analytics, total_iterations=10000, random_seed=42)

        mc_dict = mc_api_response.model_dump()
        simulation_run_id = db.insert_simulation_run(mc_dict)
        db.insert_risk_assessments(analytics["top_risk_drivers"], simulation_run_id)

        portfolio_ale_rupees = analytics["portfolio_metrics"]["mean_ale"]
        dynamic_vuln_controls = build_dynamic_vuln_controls(vuln_res["valid"], portfolio_ale_rupees)
        vuln_id_to_action_id = db.insert_remediation_actions(dynamic_vuln_controls, simulation_run_id)

        opt_request = OptimizationRequest(controls=dynamic_vuln_controls, budget=DEFAULT_BUDGET_LAKH)
        opt_result = solve_knapsack(opt_request)

        portfolio_ale_lakh = portfolio_ale_rupees / 100_000.0
        db.insert_optimization_run(opt_result, simulation_run_id, vuln_id_to_action_id, portfolio_ale_lakh)

        vuln_drilldown = build_vulnerability_drilldown(vuln_res["valid"], portfolio_ale_rupees)

        pm = analytics["portfolio_metrics"]
        mc_dict.setdefault("portfolio_metrics", {})
        mc_dict["portfolio_metrics"].update({
            "mean_ale": pm.get("mean_ale"),
            "p5_ale":   pm.get("p5_ale") or pm.get("percentile_5"),
            "p25_ale":  pm.get("p25_ale") or pm.get("percentile_25"),
            "p50_ale":  pm.get("p50_ale") or pm.get("percentile_50"),
            "p75_ale":  pm.get("p75_ale") or pm.get("percentile_75"),
            "p95_ale":  pm.get("p95_ale") or pm.get("percentile_95"),
            "p99_ale":  pm.get("p99_ale") or pm.get("percentile_99"),
        })

        return {
            "status": "success",
            "simulation_run_id": simulation_run_id,
            "ingestion_metrics": {
                "assets_processed": len(asset_res["valid"]),
                "vulns_processed": len(vuln_res["valid"])
            },
            "monte_carlo_risk_profile": mc_dict,
            "cfo_budget_optimization": opt_result.model_dump(),
            "technical_drilldown": vuln_drilldown
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print("=== PIPELINE ERROR TRACEBACK ===")
        print(traceback.format_exc())
        print("=================================")
        raise HTTPException(status_code=500, detail=str(e))