import statistics
from typing import Dict, Any, List

def generate_portfolio_analytics_summary(raw_results: Dict[str, Any]) -> Dict[str, Any]:
    iteration_losses = sorted(raw_results.get("iteration_losses", []))
    per_asset_losses = raw_results.get("per_asset_losses", {})
    
    if not iteration_losses:
        return {}
        
    n = len(iteration_losses)
    mean_ale = statistics.mean(iteration_losses)
    median_ale = statistics.median(iteration_losses)
    std_ale = statistics.stdev(iteration_losses) if n > 1 else 0.0
    var_95 = iteration_losses[int(n * 0.95)] if n > 0 else 0.0
    var_99 = iteration_losses[int(n * 0.99)] if n > 0 else 0.0
    min_ale = min(iteration_losses)
    max_ale = max(iteration_losses)
    
    top_risk_drivers = []
    for asset_id, losses in per_asset_losses.items():
        if losses:
            asset_mean = statistics.mean(losses)
            contribution_pct = (asset_mean / mean_ale * 100) if mean_ale > 0 else 0.0
            top_risk_drivers.append({
                "asset_id": asset_id,
                "mean_loss": asset_mean,
                "contribution_pct": contribution_pct
            })
            
    top_risk_drivers.sort(key=lambda x: x["mean_loss"], reverse=True)
    
    thresholds = [mean_ale, var_95, var_99]
    loss_exceedance = []
    for th in thresholds:
        exceed_count = sum(1 for loss in iteration_losses if loss > th)
        prob = exceed_count / n
        loss_exceedance.append({"threshold": th, "probability": prob})
        
    return {
        "portfolio_metrics": {
            "mean_ale": mean_ale,
            "median_ale": median_ale,
            "std_ale": std_ale,
            "var_95": var_95,
            "var_99": var_99,
            "min_ale": min_ale,
            "max_ale": max_ale
        },
        "top_risk_drivers": top_risk_drivers,
        "loss_exceedance": loss_exceedance
    }
