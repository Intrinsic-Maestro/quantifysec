"""
Pydantic models shared by the CLI, the solver, and the FastAPI layer.
"""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


class SecurityControl(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str = Field(..., description="Stable identifier, e.g. 'C01'")
    name: str = Field(..., description="Human-readable name")
    cost: float = Field(..., ge=0, description="Cost in lakh INR")
    risk_reduction: float = Field(
        ..., ge=0,
        description="Expected annual loss reduction in lakh INR"
    )
    category: Optional[str] = Field(None, description="Grouping label")


class OptimizationRequest(BaseModel):
    controls: List[SecurityControl]
    budget: float = Field(..., gt=0, description="Budget in lakh INR")


class SelectedControl(BaseModel):
    id: str
    name: str
    cost: float
    risk_reduction: float
    category: Optional[str] = None
    efficiency: float = Field(
        ..., description="risk_reduction / cost — higher is better"
    )


class DeferredControl(BaseModel):
    """A control the solver did NOT pick — deferred to a future budget cycle."""
    id: str
    name: str
    cost: float
    risk_reduction: float
    category: Optional[str] = None
    efficiency: float = Field(
        ..., description="risk_reduction / cost — higher is better"
    )
    priority_rank: int = Field(
        ..., ge=1,
        description="1 = highest-priority deferred control (best efficiency)"
    )


class FutureBudgetEstimate(BaseModel):
    """Approximate extra budget needed to cover deferred controls."""
    deferred_count: int
    total_deferred_cost: float = Field(
        ..., description="Sum of costs of all deferred controls (₹L)"
    )
    total_deferred_reduction: float = Field(
        ..., description="Additional risk reduction if ALL deferred are funded (₹L)"
    )
    approx_next_cycle_budget: float = Field(
        ...,
        description="Rough estimate for the next budget cycle — assumes ~50% "
                    "of deferred controls get funded, rounded up to nearest ₹5L"
    )
    approx_full_coverage_budget: float = Field(
        ...,
        description="Rough extra budget to fund ALL deferred controls, "
                    "with a 15% padding buffer"
    )
    is_approximate: bool = True
    note: str = (
        "Future budget figures are rough approximations based on current "
        "cost data. Actual amounts will vary with vendor pricing, inflation, "
        "changes in threat landscape, and re-runs of the Monte Carlo engine."
    )


SolverStatus = Literal[
    "Optimal", "Not Solved", "Infeasible", "Unbounded", "Undefined"
]


class OptimizationResult(BaseModel):
    status: SolverStatus
    selected_controls: List[SelectedControl]
    deferred_controls: List[DeferredControl]
    rejected_control_ids: List[str]
    total_cost: float
    total_risk_reduction: float
    budget: float
    budget_utilization_pct: float
    budget_remaining: float
    future_budget: Optional[FutureBudgetEstimate] = None
    solver_time_seconds: float