import logging
import numpy as np
from typing import Dict, List
from data_ingestion.schemas import VulnerabilityNode, AssetBusinessContext
from .financial_models import cascade_risk

logger = logging.getLogger(__name__)

def run_portfolio_simulation(
    security_graph: Dict[str, VulnerabilityNode],
    asset_financials: List[AssetBusinessContext],
    iterations: int = 10000
) -> dict:
    """
    Executes a stochastic Monte Carlo simulation across the Security Graph.
    """
    logger.info(f"Igniting Monte Carlo Engine: N={iterations} across {len(security_graph)} nodes...")
    
    # Index assets for fast lookup
    asset_map = {asset.asset_id: asset for asset in asset_financials}
    
    portfolio_losses = []

    for _ in range(iterations):
        iteration_loss = 0.0
        visited_in_iteration = set()
        
        for node_key, node in security_graph.items():
            # Threat Event Frequency (TEF): Does an attack happen this year?
            # E.g., An exploited vulnerability has a 20% chance of breach, normal has 5%
            attack_probability = 0.20 if node.is_exploited else 0.05
            
            if np.random.random() < attack_probability:
                # Attack occurs! Calculate loss and traverse the graph
                iteration_loss += cascade_risk(node_key, security_graph, asset_map, visited_in_iteration)
                
        portfolio_losses.append(iteration_loss)

    # Calculate Enterprise Financial Metrics
    losses = np.array(portfolio_losses)
    
    metrics = {
        "mean_ale_lakhs": round(float(np.mean(losses)), 2),
        "p95_var_lakhs": round(float(np.percentile(losses, 95)), 2),
        "p99_var_lakhs": round(float(np.percentile(losses, 99)), 2),
        "zero_loss_probability": round(float(np.sum(losses == 0) / iterations), 4)
    }
    
    logger.info(f"Simulation Complete. Mean ALE: ₹{metrics['mean_ale_lakhs']}L, 95th VaR: ₹{metrics['p95_var_lakhs']}L")
    return metrics