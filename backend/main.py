from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

import sys
from pathlib import Path

import os
from dotenv import load_dotenv

from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt # Make sure PyJWT is installed in your requirements.txt
import db

security = HTTPBearer()

# Replace with your actual Supabase project JWT secret or use JWKS verification
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "fallback-secret")

def verify_supabase_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
     """Validates the Supabase JWT sent from the Next.js frontend header."""
     if os.getenv("DISABLE_AUTH") == "true":
          return {"sub": "test-user", "email": "test@local", "role": "ciso"}
     
     token = credentials.credentials
     try:
          # Decode and verify the token signature
          payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
          return {
               "sub": payload.get("sub"), # User UUID
               "email": payload.get("email"),
               "role": payload.get("app_metadata", {}).get("role", "ciso")
          }
     except jwt.PyJWTError:
          raise HTTPException(status_code=401, detail="Invalid authentication token or expired session.")
    


ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

from data_ingestion.ingestion import load_json_file, ingest_assets, ingest_vulnerabilities

from math_engine.monte_carlo.simulator import run_portfolio_simulation
from math_engine.monte_carlo.analytics import generate_portfolio_analytics_summary
from math_engine.monte_carlo.schema_exporter import serialize_simulation_results

from knapsack_solver.solver import solve_knapsack
from knapsack_solver.data import get_sample_controls, DEFAULT_BUDGET_LAKH
from knapsack_solver.models import OptimizationRequest, OptimizationResult, SecurityControl



app = FastAPI(
     title="QuantifySec Enterprise API", 
     version="1.0.0",
     description="End-to-End Cyber Risk Quantification & Optimization Pipeline"
)

app.add_middleware(
     CORSMiddleware,
     allow_origins=["*"],
     allow_methods=["*"],
     allow_headers=["*"],
)


def build_mc_payload(valid_assets: list, valid_vulns: list) -> List[Dict[str, Any]]:
     """Bridge 1: Maps ingested assets and vulnerabilities into Monte Carlo inputs."""
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
     """
     Bridge 2 (True Dynamic): Kicks out the hardcoded controls. 
     Generates knapsack items directly from the actual vulnerabilities ingested, 
     scaled against the total Monte Carlo ALE.
     """
     dynamic_controls = []
     
     # Baseline risk distribution: weight the ALE by CVSS severity
     total_cvss = sum(v.cvss_score for v in valid_vulns)
     
     for i, v in enumerate(valid_vulns):
          # Calculate how much financial risk this specific vulnerability is responsible for
          vuln_share = v.cvss_score / total_cvss if total_cvss > 0 else 0
          reduction_lakhs = (portfolio_ale_rupees * vuln_share) / 100_000.0
          
          # Estimate a cost to patch (Heuristic for prototype: CVSS 10 = 5 Lakhs, CVSS 5 = 2.5 Lakhs)
          estimated_cost_lakh = round(max(0.5, v.cvss_score * 0.5), 2)
          
          # Fallback for ID if v doesn't have uid attribute directly accessible
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
     """
     Creates a ranked list of specific vulnerabilities and their exact financial impact.
     This provides the technical drill-down panel for the CFO's dashboard.
     """
     total_cvss = sum(v.cvss_score for v in valid_vulns)
     drilldown = []
     
     for i, v in enumerate(valid_vulns):
          # Weight the vulnerability's financial impact by its severity
          vuln_share = v.cvss_score / total_cvss if total_cvss > 0 else 0
          exposure_rupees = portfolio_ale_rupees * vuln_share
          
          # Safely grab the ID (using whatever field Ri named it)
          vuln_id = getattr(v, 'id', f"VULN-{i}")
          
          drilldown.append({
               "vulnerability_id": vuln_id,
               "asset_id": v.asset_id,
               "cvss_score": v.cvss_score,
               "financial_exposure_lakhs": round(exposure_rupees / 100_000.0, 2)
          })
          
     # Sort by highest financial exposure first
     drilldown.sort(key=lambda x: x["financial_exposure_lakhs"], reverse=True)
     return drilldown


@app.get("/api/health")
def health() -> dict:
     """Liveness check endpoint."""
     return {"status": "ok"}


@app.get("/api/controls", response_model=List[SecurityControl])
def list_default_controls() -> List[SecurityControl]:
     """Return default sample security controls."""
     return get_sample_controls()


@app.get("/api/optimize/default", response_model=OptimizationResult)
def optimize_default() -> OptimizationResult:
     """Convenience endpoint: runs the solver on the hardcoded sample set."""
     req = OptimizationRequest(
          controls=get_sample_controls(),
          budget=DEFAULT_BUDGET_LAKH,
     )
     return solve_knapsack(req)


@app.post("/api/optimize", response_model=OptimizationResult)
def optimize(request: OptimizationRequest) -> OptimizationResult:
     """Run 0-1 knapsack optimization on user-supplied controls and budget."""
     if not request.controls:
          raise HTTPException(400, "No controls provided.")

     result = solve_knapsack(request)

     if result.status == "Infeasible":
          raise HTTPException(
               422,
               "No feasible combination satisfies the given budget and constraints.",
          )
     if result.status not in ("Optimal", "Not Solved"):
          raise HTTPException(500, f"Solver returned status: {result.status}")

     return result
@app.post("/api/run-pipeline")
def run_full_enterprise_pipeline(user: dict = Depends(verify_supabase_token)):
     """Executes the full automated pipeline: Ingestion -> Monte Carlo -> True Dynamic Knapsack."""
     try:
          # Step 1: Ingest synthetic JSON outputs
          raw_assets = load_json_file("../output/synthetic_assets.json")
          raw_vulns = load_json_file("../output/synthetic_combined.json")
          
          asset_res = ingest_assets(raw_assets)
          vuln_res = ingest_vulnerabilities(raw_vulns)
          
          if not asset_res["valid"] or not vuln_res["valid"]:
               raise HTTPException(status_code=400, detail="Data ingestion failed. No valid records found.")

          db.upsert_assets(asset_res["valid"])
          db.upsert_vulnerabilities(vuln_res["valid"])

          # Step 2: Bridge to Monte Carlo
          mc_payload = build_mc_payload(asset_res["valid"], vuln_res["valid"])
          
          # Step 3: Run Monte Carlo Simulation
          raw_sim_results = run_portfolio_simulation(mc_payload)
          analytics = generate_portfolio_analytics_summary(raw_sim_results)
          mc_api_response = serialize_simulation_results(analytics, total_iterations=10000, random_seed=42)

          mc_dict = mc_api_response.model_dump()
          simulation_run_id = db.insert_simulation_run(mc_dict)
          db.insert_risk_assessments(analytics["top_risk_drivers"], simulation_run_id)

          # Step 4: True Bridge to Knapsack (Using actual vulnerabilities, ignoring get_sample_controls)
          portfolio_ale_rupees = analytics["portfolio_metrics"]["mean_ale"]
          
          # Pass the valid_vulns directly into our new dynamic control builder
          dynamic_vuln_controls = build_dynamic_vuln_controls(vuln_res["valid"], portfolio_ale_rupees)

          vuln_id_to_action_id = db.insert_remediation_actions(dynamic_vuln_controls, simulation_run_id)

          # Step 5: Run Knapsack Optimizer
          opt_request = OptimizationRequest(controls=dynamic_vuln_controls, budget=DEFAULT_BUDGET_LAKH)
          opt_result = solve_knapsack(opt_request)

          portfolio_ale_lakh = portfolio_ale_rupees / 100_000.0
          db.insert_optimization_run(opt_result, simulation_run_id, vuln_id_to_action_id, portfolio_ale_lakh)

          # Step 6: Generate Technical Drill-down for the UI
          vuln_drilldown = build_vulnerability_drilldown(vuln_res["valid"], portfolio_ale_rupees)
          
          return {
               "status": "success",
               "simulation_run_id": simulation_run_id,
               "ingestion_metrics": {
                    "assets_processed": len(asset_res["valid"]),
                    "vulns_processed": len(vuln_res["valid"])
               },
               "monte_carlo_risk_profile": mc_dict,
               "cfo_budget_optimization": opt_result.model_dump(),
               "technical_drilldown": vuln_drilldown # <-- Handing this directly to the frontend
          }
          
     except Exception as e:
          raise HTTPException(status_code=500, detail=str(e))