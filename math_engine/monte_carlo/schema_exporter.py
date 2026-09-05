from pydantic import BaseModel
from typing import Dict, Any, List

class PortfolioMetrics(BaseModel):
    mean_ale: float
    median_ale: float
    std_ale: float
    var_95: float
    var_99: float
    min_ale: float
    max_ale: float

class RiskDriver(BaseModel):
    asset_id: str
    mean_loss: float
    contribution_pct: float

class ExceedanceCurve(BaseModel):
    threshold: float
    probability: float

class Analytics(BaseModel):
    portfolio_metrics: PortfolioMetrics
    top_risk_drivers: List[RiskDriver]
    loss_exceedance: List[ExceedanceCurve]

class SimulationResponse(BaseModel):
    analytics: Analytics
    total_iterations: int
    random_seed: int

def serialize_simulation_results(analytics: Dict[str, Any], total_iterations: int, random_seed: int) -> SimulationResponse:
    return SimulationResponse(
        analytics=Analytics(**analytics),
        total_iterations=total_iterations,
        random_seed=random_seed
    )
