from data_ingestion.schemas import VulnerabilityNode, AssetBusinessContext
from .distributions import sample_lognormal, sample_pert

def calculate_node_sle(
    node: VulnerabilityNode, 
    asset: AssetBusinessContext
) -> float:
    """
    Calculates the Single Loss Expectancy (SLE) for a specific vulnerability 
    using multivariate stochastic sampling.
    """
    # 1. Sample Downtime (Assume a critical breach takes 4-24 hours to contain)
    downtime_hours = sample_pert(minimum=2.0, likely=8.0, maximum=48.0)
    downtime_loss = downtime_hours * asset.downtime_cost_per_hour_lakhs
    
    # 2. Sample Incident Response & Regulatory Fines (Fat-tailed lognormal)
    # Base it on the asset's pre-defined loss expectancy
    baseline_fines_and_ir = sample_lognormal(mean=asset.single_loss_expectancy_inr_lakhs)
    
    # 3. Base SLE
    base_sle = downtime_loss + baseline_fines_and_ir

    # 4. The "Wiz" Concept: Toxic Combination Multiplier
    # If the vulnerability is part of a critical attack path, the loss explodes.
    if node.is_toxic_combination:
        multiplier = 5.0  # Massive penalty for interconnected critical paths
    else:
        multiplier = 1.0 + (node.base_score / 10.0) # Slight scale based on CVSS
        
    return base_sle * multiplier

def cascade_risk(node_key: str, graph: dict, asset_map: dict, visited: set) -> float:
    """
    Traverses the Security Graph. If a node is compromised, it adds the SLE 
    of itself AND cascades a percentage of risk to downstream dependencies.
    """
    if node_key in visited:
        return 0.0
    
    visited.add(node_key)
    node = graph[node_key]
    asset = asset_map[node.asset_id]
    
    # Calculate this node's explicit financial loss
    total_loss = calculate_node_sle(node, asset)
    
    # Cascade risk to downstream dependencies (Graph traversal)
    for downstream_key in node.downstream_dependencies:
        # Assume a 30% chance the attacker pivots to the connected node
        import random
        if random.random() < 0.30: 
            total_loss += cascade_risk(downstream_key, graph, asset_map, visited)
            
    return total_loss