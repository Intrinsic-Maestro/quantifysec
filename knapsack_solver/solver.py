import time
import pulp
from typing import List
from .models import OptimizationRequest, OptimizationResult, SecurityControl, SelectedControl, DeferredControl

def solve_knapsack(request: OptimizationRequest) -> OptimizationResult:
    start_time = time.time()
    
    prob = pulp.LpProblem("SecurityControlOptimization", pulp.LpMaximize)
    
    controls = request.controls
    budget = request.budget
    
    decision_vars = {c.id: pulp.LpVariable(f"var_{c.id}", cat='Binary') for c in controls}
    
    prob += pulp.lpSum(c.risk_reduction * decision_vars[c.id] for c in controls), "TotalRiskReduction"
    prob += pulp.lpSum(c.cost * decision_vars[c.id] for c in controls) <= budget, "BudgetConstraint"
    
    prob.solve(pulp.PULP_CBC_CMD(msg=False))
    
    status = pulp.LpStatus[prob.status]
    solver_time = time.time() - start_time
    
    selected_controls = []
    deferred_controls = []
    
    total_cost = 0.0
    total_risk_reduction = 0.0
    
    if status == 'Optimal':
        for c in controls:
            if decision_vars[c.id].varValue == 1.0:
                selected_controls.append(c)
                total_cost += c.cost
                total_risk_reduction += c.risk_reduction
            else:
                deferred_controls.append(c)
                
    selected_controls.sort(key=lambda x: x.efficiency, reverse=True)
    deferred_controls.sort(key=lambda x: x.efficiency, reverse=True)
    
    def_controls_obj = []
    for rank, dc in enumerate(deferred_controls, start=1):
        d_dict = dc.model_dump()
        d_dict["priority_rank"] = rank
        def_controls_obj.append(DeferredControl(**d_dict))
        
    budget_utilization_pct = (total_cost / budget) * 100 if budget > 0 else 0.0
    budget_remaining = budget - total_cost
    
    return OptimizationResult(
        status=status if status in ['Optimal', 'Infeasible'] else 'Not Solved',
        solver_time_seconds=solver_time,
        budget=budget,
        total_cost=total_cost,
        total_risk_reduction=total_risk_reduction,
        budget_utilization_pct=budget_utilization_pct,
        budget_remaining=budget_remaining,
        selected_controls=selected_controls,
        deferred_controls=def_controls_obj
    )
