from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class AssetBusinessContext(BaseModel):
    asset_id: str
    business_unit: str
    criticality_score: int
    single_loss_expectancy_inr_lakhs: float
    downtime_cost_per_hour_lakhs: float

class FinancialParameters(BaseModel):
    annual_revenue_inr_lakhs: float
    allocated_security_budget_lakhs: float
    cost_per_patch_deployment: Dict[str, float] # e.g., {"CRITICAL": 2.5, "HIGH": 1.0}

class VulnerabilityNode(BaseModel):
    """Represents a vulnerability as a node in the Security Graph"""
    cve_id: str
    asset_id: str
    severity: str
    base_score: float
    is_exploited: bool
    is_toxic_combination: bool
    # For graph interactions:
    downstream_dependencies: List[str] = Field(default_factory=list)