from __future__ import annotations

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class FinancialExposure(BaseModel):
    asset_replacement_cost_lakhs: float = 0.0
    downtime_cost_per_hour_lakhs: float = 0.0
    data_record_count: int = 0
    single_loss_expectancy_lakhs: float = 0.0


class AssetBusinessContext(BaseModel):
    asset_id: str
    business_unit: str
    criticality_score: int
    financial_exposure: FinancialExposure

    @property
    def single_loss_expectancy_inr_lakhs(self) -> float:
        return self.financial_exposure.single_loss_expectancy_lakhs

    @property
    def downtime_cost_per_hour_lakhs(self) -> float:
        return self.financial_exposure.downtime_cost_per_hour_lakhs


class CompanyProfile(BaseModel):
    annual_revenue_inr_lakhs: float
    allocated_security_budget_lakhs: float
    deferred_backlog_budget_lakhs: float = 0.0


class RemediationCostTable(BaseModel):
    critical_tier_cost_lakhs: float = 0.0
    high_tier_cost_lakhs: float = 0.0
    medium_tier_cost_lakhs: float = 0.0
    low_tier_cost_lakhs: float = 0.0


class FinancialParameters(BaseModel):
    company_profile: CompanyProfile
    remediation_cost_table: RemediationCostTable
    target_full_coverage_capital_lakhs: float = 0.0

    @property
    def annual_revenue_inr_lakhs(self) -> float:
        return self.company_profile.annual_revenue_inr_lakhs

    @property
    def allocated_security_budget_lakhs(self) -> float:
        return self.company_profile.allocated_security_budget_lakhs

    @property
    def deferred_backlog_budget_lakhs(self) -> float:
        return self.company_profile.deferred_backlog_budget_lakhs


class VulnerabilityNode(BaseModel):
    cve_id: str
    asset_id: str
    severity: str
    base_score: float
    is_exploited: bool
    is_toxic_combination: bool = False
    downstream_dependencies: List[str] = Field(default_factory=list)