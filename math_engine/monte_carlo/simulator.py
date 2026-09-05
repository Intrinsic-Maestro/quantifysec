import random
from typing import List, Dict, Any

def run_portfolio_simulation(mc_payload: List[Dict[str, Any]]) -> Dict[str, Any]:
    num_iterations = 10000
    iteration_losses = []
    per_asset_losses = {item["asset_id"]: [] for item in mc_payload}
    
    for _ in range(num_iterations):
        total_loss = 0.0
        iter_asset_losses = {item["asset_id"]: 0.0 for item in mc_payload}
        
        for item in mc_payload:
            base_prob = min(item["cvss_score"] / 10.0, 1.0)
            if random.random() < base_prob:
                loss_factor = random.uniform(0.1, 0.5)
                loss = item["asset_value"] * loss_factor
                total_loss += loss
                iter_asset_losses[item["asset_id"]] += loss
                
        iteration_losses.append(total_loss)
        for aid, l in iter_asset_losses.items():
            per_asset_losses[aid].append(l)
            
    return {
        "iteration_losses": iteration_losses,
        "per_asset_losses": per_asset_losses
    }
