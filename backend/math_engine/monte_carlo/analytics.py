import numpy as np
from typing import Dict, Any

from .config import DEFAULT_CONFIG, SimulationConfig

def calculate_loss_exceedance_percentiles(
    ale_array: np.ndarray,
    config: SimulationConfig = DEFAULT_CONFIG
) -> Dict[str, float]:
     """
     Extracts key financial risk percentiles from a simulated ALE array
     to construct Loss Exceedance Curves (LEC).
     
     Args:
          ale_array: 1D NumPy array of simulated Annualized Loss Expectancies.
          config: Simulation configuration parameters containing percentile targets.
          
     Returns:
          Dict mapping percentile labels to financial values in Rupees.
     """
     if ale_array.size == 0:
          raise ValueError("ALE array cannot be empty for analytics processing.")
          
     p50 = float(np.percentile(ale_array, config.PERCENTILE_P50))
     p90 = float(np.percentile(ale_array, config.PERCENTILE_P90))
     p95 = float(np.percentile(ale_array, config.PERCENTILE_P95))
     p99 = float(np.percentile(ale_array, config.PERCENTILE_P99))
     
     mean_ale = float(np.mean(ale_array))
     std_dev = float(np.std(ale_array))
     
     return {
          "mean_ale": mean_ale,
          "std_dev": std_dev,
          f"p{int(config.PERCENTILE_P50)}": p50,
          f"p{int(config.PERCENTILE_P90)}": p90,
          f"p{int(config.PERCENTILE_P95)}": p95,
          f"p{int(config.PERCENTILE_P99)}": p99,
     }

def generate_portfolio_analytics_summary(
    portfolio_results: Dict[str, np.ndarray],
    config: SimulationConfig = DEFAULT_CONFIG
) -> Dict[str, Any]:
     """
     Generates a comprehensive analytics summary across all assets and the portfolio total.
    
     Args:
          portfolio_results: Dictionary mapping asset IDs and '_portfolio_total' to ALE arrays.
          config: Simulation configuration parameters.
        
     Returns:
          Dict containing aggregated portfolio risk metrics and top risk drivers.
     """
     if "_portfolio_total" not in portfolio_results:
          raise KeyError("Portfolio results dictionary missing '_portfolio_total' key.")
        
     total_ale_array = portfolio_results["_portfolio_total"]
     portfolio_summary = calculate_loss_exceedance_percentiles(total_ale_array, config)
    
     asset_means = {}
     for asset_id, ale_arr in portfolio_results.items():
          if asset_id == "_portfolio_total":
               continue
          asset_means[asset_id] = float(np.mean(ale_arr))
        
     sorted_risk_drivers = sorted(asset_means.items(), key=lambda x: x[1], reverse=True)
    
     return {
          "portfolio_metrics": portfolio_summary,
          "top_risk_drivers": [{"asset_id": aid, "mean_ale": val} for aid, val in sorted_risk_drivers[:5]]
     }