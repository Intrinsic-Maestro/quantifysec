# """
# FastAPI stub. NOT needed to run the CLI.

# Run when ready:
#     uvicorn api:app --reload --port 8000

# Endpoints:
#     GET  /api/health              → liveness check
#     GET  /api/controls            → default sample controls
#     GET  /api/optimize/default    → run solver on the sample set
#     POST /api/optimize            → run solver on caller-supplied data
# """
# from typing import List
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware

# from models import SecurityControl, OptimizationRequest, OptimizationResult
# from solver import solve_knapsack
# from data import get_sample_controls, DEFAULT_BUDGET_LAKH

# app = FastAPI(title="Cybersecurity Control Optimizer", version="0.2.0")

# # CORS — tighten allow_origins to your frontend URL before deploying.
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.get("/api/health")
# def health() -> dict:
#     return {"status": "ok"}


# @app.get("/api/controls", response_model=List[SecurityControl])
# def list_default_controls() -> List[SecurityControl]:
#     """Default sample controls — swap for DB/Monte Carlo source later."""
#     return get_sample_controls()


# @app.get("/api/optimize/default", response_model=OptimizationResult)
# def optimize_default() -> OptimizationResult:
#     """Convenience endpoint: runs the solver on the hardcoded sample."""
#     req = OptimizationRequest(
#         controls=get_sample_controls(),
#         budget=DEFAULT_BUDGET_LAKH,
#     )
#     return solve_knapsack(req)


# @app.post("/api/optimize", response_model=OptimizationResult)
# def optimize(request: OptimizationRequest) -> OptimizationResult:
#     """
#     Run 0-1 knapsack on user-supplied controls and budget.

#     Response body now includes:
#       - selected_controls[]        → what to fund this cycle
#       - deferred_controls[]        → prioritised backlog for next cycle
#       - future_budget{}            → approximate next-cycle & full-coverage
#                                      budget estimates + `note` string
#                                      (frontend should surface this note
#                                      verbatim as a disclaimer)
#     """
#     if not request.controls:
#         raise HTTPException(400, "No controls provided.")

#     result = solve_knapsack(request)

#     if result.status == "Infeasible":
#         raise HTTPException(
#             422,
#             "No feasible combination satisfies the given budget and constraints.",
#         )
#     if result.status not in ("Optimal", "Not Solved"):
#         raise HTTPException(500, f"Solver returned status: {result.status}")

#     return result