import sys
from pathlib import Path
import os
import time
import random
import json
import traceback
from datetime import date
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
# Root Directory Setup & Path Resolutions
# ============================================================
ROOT_DIR = Path(__file__).resolve().parent.parent  # Points to quantifysec/
sys.path.append(str(ROOT_DIR))
sys.path.append(str(Path(__file__).resolve().parent))  # Points to backend/

# Import modular components
from data_ingestion.pipeline import run_ingestion_pipeline
from data_ingestion.ingestion import ingest_assets, ingest_vulnerabilities, ingest_combined_findings

from math_engine.monte_carlo.simulator import run_portfolio_simulation
from math_engine.monte_carlo.analytics import generate_portfolio_analytics_summary
from math_engine.monte_carlo.schema_exporter import serialize_simulation_results

from math_engine.pso.optimizer import PSOSecurityOptimizer
from knapsack_solver.data import get_sample_controls, DEFAULT_BUDGET_LAKH
from knapsack_solver.models import SecurityControl, OptimizationResult, OptimizationRequest

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
        return {"sub": "test-user", "email": "test@local", "role": "ciso", "company_id": "mock-company-id"}

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
        }
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token or expired session.")

# In-Memory OTP Store
OTP_STORE: Dict[str, Dict[str, Any]] = {}

class OTPRequest(BaseModel):
    email: str
    role: str
    name: str | None = None
    company: str | None = None

class OTPVerify(BaseModel):
    email: str
    otp: str

# ============================================================
# FastAPI App Initialization
# ============================================================
app = FastAPI(
    title="QuantifySec Enterprise API", 
    version="2.0.0",
    description="CTEM-Aligned Graph Risk Quantification & PSO Optimization Pipeline"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Pipeline Helper Bridge Functions
# ============================================================
def build_dynamic_vuln_controls(security_graph: dict, portfolio_ale_rupees: float) -> List[SecurityControl]:
    """Generates dynamic remediation controls from the security graph nodes."""
    dynamic_controls = []
    nodes = list(security_graph.values())
    total_score = sum(n.base_score for n in nodes) if nodes else 1.0
    
    for i, node in enumerate(nodes):
        vuln_share = node.base_score / total_score if total_score > 0 else 0
        reduction_lakhs = (portfolio_ale_rupees * vuln_share) / 100_000.0
        estimated_cost_lakh = round(max(0.5, node.base_score * 0.5), 2)
        
        dynamic_controls.append(
            SecurityControl(
                id=node.cve_id,
                name=f"Remediate {node.cve_id} on {node.asset_id}",
                cost=estimated_cost_lakh,
                risk_reduction=round(reduction_lakhs, 2),
                category="Remediation"
            )
        )
    return dynamic_controls

def build_vulnerability_drilldown(security_graph: dict, portfolio_ale_rupees: float) -> List[dict]:
    """Builds technical exposure drill-down metrics for the CISO view."""
    drilldown = []
    nodes = list(security_graph.values())
    total_score = sum(n.base_score for n in nodes) if nodes else 1.0
    
    for node in nodes:
        vuln_share = node.base_score / total_score if total_score > 0 else 0
        exposure_rupees = portfolio_ale_rupees * vuln_share
        
        drilldown.append({
            "vulnerability_id": node.cve_id,
            "asset_id": node.asset_id,
            "cvss_score": node.base_score,
            "is_toxic": node.is_toxic_combination,
            "financial_exposure_lakhs": round(exposure_rupees / 100_000.0, 2)
        })
        
    drilldown.sort(key=lambda x: x["financial_exposure_lakhs"], reverse=True)
    return drilldown

# ============================================================
# API Endpoints: Health & Default Optimization
# ============================================================
@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "engine": "CTEM Graph + PSO active"}

@app.get("/api/controls", response_model=List[SecurityControl])
def list_default_controls() -> List[SecurityControl]:
    return get_sample_controls()

@app.post("/api/optimize", response_model=OptimizationResult)
def optimize(request: OptimizationRequest) -> OptimizationResult:
    """Fallback manual endpoint using the Particle Swarm Optimizer."""
    if not request.controls:
        raise HTTPException(400, "No controls provided.")

    controls_dict_list = [c.dict() if hasattr(c, 'dict') else c for c in request.controls]
    optimizer = PSOSecurityOptimizer(controls=controls_dict_list, budget_lakhs=request.budget)
    res = optimizer.optimize()
    return OptimizationResult(**res)

# ============================================================
# API Endpoints: Auth (Resend OTP)
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
                    <p style="color: #a1a1aa; font-size: 14px;">Your verification code is:</p>
                    <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 16px; background: #18181b; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; display: inline-block; color: #a78bfa; margin: 15px 0;">
                        {code}
                    </div>
                    <p style="color: #71717a; font-size: 12px;">Expires in 5 minutes.</p>
                </div>
            """
        })
        return {"status": "success", "message": "Verification code dispatched."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dispatch email: {str(e)}")

@app.post("/api/auth/verify-otp")
def verify_otp(payload: OTPVerify):
    email = payload.email.strip().lower()
    otp = payload.otp.strip()

    record = OTP_STORE.get(email)
    if not record or time.time() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
    if record["otp"] != otp:
        raise HTTPException(status_code=400, detail="Incorrect verification code.")

    try:
        existing_profile = db.get_profile_by_email(email)
        if existing_profile:
            name = existing_profile.get("name")
            company_id = existing_profile.get("company_id")
            role = existing_profile.get("role") or record["role"]
            if not company_id:
                company_id = db.get_or_create_company(record.get("company") or "Unknown Company")
                db.upsert_profile(email=email, name=name, role=role, company_id=company_id)
        else:
            company_name = record.get("company") or "Unknown Company"
            name = record.get("name") or email.split("@")[0]
            role = record["role"]
            company_id = db.get_or_create_company(company_name)
            db.upsert_profile(email=email, name=name, role=role, company_id=company_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database synchronization error: {str(e)}")

    token_payload = {
        "sub": email,
        "email": email,
        "name": name,
        "role": role,
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
    }

# ============================================================
# API Endpoint: Full CTEM Pipeline Execution
# ============================================================
@app.post("/api/run-pipeline")
def run_full_enterprise_pipeline(user: dict = Depends(verify_token)):
    try:
        company_name = db.get_company_name(user.get("company_id"))

        # ── Step 1: Ingestion Pipeline (Consuming your 4 JSON files) ──
        output_dir = ROOT_DIR / "output"
        ingested_state = run_ingestion_pipeline(
            ocsf_path=str(output_dir / "synthetic_findings.json"),
            context_path=str(output_dir / "asset_business_context.json"),
            finance_path=str(output_dir / "financial_parameters.json"),
            interactions_path=str(output_dir / "toxic_combinations.json")
        )

        security_graph = ingested_state["security_graph"]
        asset_financials = ingested_state["asset_financials"]
        global_constraints = ingested_state["global_constraints"]

        if not security_graph:
            raise HTTPException(status_code=400, detail="Graph ingestion failed. No valid node records found.")

        # ── Step 2: Stochastic Monte Carlo Simulation (10,000 runs) ──
        mc_metrics = run_portfolio_simulation(
            security_graph=security_graph,
            asset_financials=asset_financials,
            iterations=10000
        )

        portfolio_ale_rupees = mc_metrics["mean_ale_lakhs"] * 100_000.0

        # ── Step 3: Particle Swarm Optimization (PSO) Solver ──
        dynamic_controls = build_dynamic_vuln_controls(security_graph, portfolio_ale_rupees)
        
        # Inject toxic combination flags into control records for PSO fitness boost
        controls_for_pso = []
        for ctrl in dynamic_controls:
            c_dict = ctrl.dict()
            node_key = next((k for k, v in security_graph.items() if v.cve_id == ctrl.id), None)
            c_dict["is_toxic"] = security_graph[node_key].is_toxic_combination if node_key else False
            controls_for_pso.append(c_dict)

        optimizer = PSOSecurityOptimizer(
            controls=controls_for_pso,
            budget_lakhs=global_constraints.allocated_security_budget_lakhs
        )
        opt_result_dict = optimizer.optimize()
        opt_result = OptimizationResult(**opt_result_dict)

        # ── Step 4: Persistence & Telemetry Recording ──
        simulation_run_id = db.insert_simulation_run(mc_metrics, company_name)
        
        # Calculate posture score based on toxic combinations and active risks
        toxic_count = sum(1 for n in security_graph.values() if n.is_toxic_combination)
        posture_score = max(15.0, round(100.0 - (toxic_count * 4.5) - (len(security_graph) * 0.2), 1))

        # ── Step 5: Drill-down & Frontend Response Payload ──
        vuln_drilldown = build_vulnerability_drilldown(security_graph, portfolio_ale_rupees)

        return {
            "status": "success",
            "simulation_run_id": simulation_run_id,
            "ingestion_metrics": {
                "graph_nodes_processed": len(security_graph),
                "toxic_combinations_detected": toxic_count,
            },
            "ciso_metrics": {
                "posture_score": posture_score,
                "toxic_combinations_identified": toxic_count,
                "technical_drilldown": vuln_drilldown
            },
            "cfo_metrics": {
                "mean_ale_lakhs": mc_metrics["mean_ale_lakhs"],
                "p95_var_lakhs": mc_metrics["p95_var_lakhs"],
                "p99_var_lakhs": mc_metrics["p99_var_lakhs"],
                "allocated_budget_lakhs": global_constraints.allocated_security_budget_lakhs
            },
            "cfo_budget_optimization": opt_result.model_dump(),
        }

    except HTTPException:
        raise
    except Exception as e:
        print("=== PIPELINE ERROR TRACEBACK ===")
        print(traceback.format_exc())
        print("=================================")
        raise HTTPException(status_code=500, detail=str(e))