from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class AssetRiskOutputModel(BaseModel):
     """
     Structured Pydantic model for individual asset risk results.
     """
     asset_id: str = Field(..., description="Unique identifier for the enterprise asset.")
     mean_ale: float = Field(..., description="Mean Annualized Loss Expectancy in Rupees.")

class PortfolioRiskResponseModel(BaseModel):
     """
     Comprehensive Pydantic response model for the entire portfolio simulation output.
     Ready to be returned directly by FastAPI endpoints.
     """
     status: str = Field("success", description="Execution status of the Monte Carlo engine.")
     total_iterations: int = Field(..., description="Number of Monte Carlo simulation iterations run.")
     portfolio_metrics: Dict[str, float] = Field(
          ..., 
          description="Aggregated risk metrics including mean ALE, std dev, and percentiles (P50, P90, P95, P99)."
     )
     top_risk_drivers: List[AssetRiskOutputModel] = Field(
          ..., 
          description="Ranked list of top assets driving the highest financial risk exposure."
     )
     audit_trail_seed: int = Field(..., description="Random seed used for mathematical reproducibility.")


def serialize_simulation_results(
     analytics_summary: Dict[str, Any],
     total_iterations: int,
     random_seed: int
) -> PortfolioRiskResponseModel:
     """
     Transforms raw dictionaries from the analytics engine into a validated Pydantic response model.
     
     Args:
          analytics_summary: Dictionary output from generate_portfolio_analytics_summary().
          total_iterations: Number of simulation iterations executed.
          random_seed: Configuration seed used for reproducibility.
          
     Returns:
          PortfolioRiskResponseModel: Validated API-ready payload.
     """
     portfolio_metrics = analytics_summary.get("portfolio_metrics", {})
     raw_risk_drivers = analytics_summary.get("top_risk_drivers", [])
     
     formatted_drivers = [
          AssetRiskOutputModel(asset_id=driver["asset_id"], mean_ale=driver["mean_ale"])
          for driver in raw_risk_drivers
     ]
     
     return PortfolioRiskResponseModel(
          status="success",
          total_iterations=total_iterations,
          portfolio_metrics=portfolio_metrics,
          top_risk_drivers=formatted_drivers,
          audit_trail_seed=random_seed
     )