from pydantic import BaseModel, model_validator
from typing import List, Optional

class SecurityControl(BaseModel):
    id: str
    name: str
    cost: float  # in Lakhs INR
    risk_reduction: float  # in Lakhs INR
    category: str
    efficiency: float = 0.0

    @model_validator(mode='after')
    def compute_efficiency(self):
        if self.efficiency == 0.0 and self.cost > 0:
            self.efficiency = self.risk_reduction / self.cost
        return self

class OptimizationRequest(BaseModel):
    controls: List[SecurityControl]
    budget: float  # in Lakhs INR

class SelectedControl(SecurityControl):
    pass

class DeferredControl(SecurityControl):
    priority_rank: int = 0

class OptimizationResult(BaseModel):
    status: str
    solver_time_seconds: float
    budget: float
    total_cost: float
    total_risk_reduction: float
    budget_utilization_pct: float
    budget_remaining: float
    selected_controls: List[SecurityControl]
    deferred_controls: List[DeferredControl]
