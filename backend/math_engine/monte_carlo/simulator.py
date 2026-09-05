import numpy as np
from typing import Dict, Any, List

from .config import DEFAULT_CONFIG, SimulationConfig
from .distributions import generate_threat_event_frequency, generate_loss_magnitude
from .fair_model import calculate_loss_event_frequency, calculate_annualized_loss_expectancy


def simulate_single_vulnerability_risk(
     asset_value: float,
     cvss_score: float,
     config: SimulationConfig = DEFAULT_CONFIG
) -> np.ndarray:
     """
     Simulates the Annualized Loss Expectancy (ALE) for a single asset-vulnerability pair
     across the configured number of iterations.
    
     Args:
          asset_value: The financial valuation of the targeted asset in Rupees.
          cvss_score: The CVSS v4.0 score (normalized to a probability factor between 0.0 and 1.0).
          config: Simulation configuration parameters.
        
     Returns:
          np.ndarray: 1D array of simulated financial losses (ALE) for this specific vector.
     """
     vulnerability_probability = np.clip(cvss_score / 10.0, 0.01, 0.99)
    
     min_freq = 0.1
     likely_freq = max(0.5, (asset_value / 10_000_000.0) * 1.5)
     max_freq = likely_freq * 3.0
    
     tef = generate_threat_event_frequency(
          min_freq=min_freq,
          likely_freq=likely_freq,
          max_freq=max_freq,
          iterations=config.ITERATIONS
     )
    
     lef = calculate_loss_event_frequency(tef, np.full(config.ITERATIONS, vulnerability_probability))
    
     lower_loss = asset_value * config.MIN_LOSS_MULTIPLIER
     upper_loss = asset_value * config.MAX_LOSS_MULTIPLIER
     loss_mag = generate_loss_magnitude(
          lower_bound_loss=lower_loss,
          upper_bound_loss=upper_loss,
          iterations=config.ITERATIONS
     )
    
     ale = calculate_annualized_loss_expectancy(lef, loss_mag)
     return ale



def run_portfolio_simulation(
     assets_and_vulns: List[Dict[str, Any]],
     config: SimulationConfig = DEFAULT_CONFIG
) -> Dict[str, np.ndarray]:
     """
     Executes vectorized Monte Carlo simulations across an entire enterprise asset inventory
     and its associated vulnerability findings.
    
     Args:
          assets_and_vulns: List of dictionaries containing 'asset_id', 'asset_value', and 'cvss_score'.
          config: Simulation configuration parameters.
        
     Returns:
          Dict containing raw simulation matrices and portfolio aggregates.
     """
     if not assets_and_vulns:
          raise ValueError("Asset and vulnerability payload cannot be empty.")
        
     total_portfolio_ale = np.zeros(config.ITERATIONS)
     asset_results = {}
    
     for item in assets_and_vulns:
          asset_id = item.get("asset_id")
          asset_value = float(item.get("asset_value", 0.0))
          cvss_score = float(item.get("cvss_score", 5.0))
        
          ale_array = simulate_single_vulnerability_risk(asset_value, cvss_score, config)
        
          asset_results[asset_id] = ale_array
          total_portfolio_ale += ale_array
        
     asset_results["_portfolio_total"] = total_portfolio_ale
     return asset_results