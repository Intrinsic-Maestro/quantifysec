"""
Core 0-1 Knapsack solver.

Pure function: takes an OptimizationRequest, returns an OptimizationResult.
No printing, no file I/O, no globals.

Model:
    maximize    sum_i (risk_reduction_i * x_i)
    subject to  sum_i (cost_i * x_i) <= budget
                x_i in {0, 1}
"""
import math
import time
from typing import List

from pulp import (
    LpProblem, LpMaximize, LpVariable, lpSum, value,
    LpStatus, PULP_CBC_CMD,
)

from .models import (
    OptimizationRequest, OptimizationResult,
    SelectedControl, DeferredControl, FutureBudgetEstimate,
    SecurityControl,
)


def _round_up_to(x: float, step: float) -> float:
    """Round x up to the nearest multiple of `step`. Keeps budget figures tidy."""
    if step <= 0:
        return x
    return math.ceil(x / step) * step


def _build_future_estimate(
    deferred: List[DeferredControl],
) -> FutureBudgetEstimate:
    total_cost = sum(d.cost for d in deferred)
    total_red = sum(d.risk_reduction for d in deferred)

    # Rough "next cycle" guess: assume you can fund ~50% of what's deferred,
    # weighted toward the highest-efficiency ones. Rounded up to nearest ₹5L.
    half = total_cost * 0.5
    approx_next = _round_up_to(half, 5.0)

    # Full-coverage guess: everything deferred + 15% padding for
    # vendor price drift and re-estimation noise.
    approx_full = _round_up_to(total_cost * 1.15, 5.0)

    return FutureBudgetEstimate(
        deferred_count=len(deferred),
        total_deferred_cost=round(total_cost, 2),
        total_deferred_reduction=round(total_red, 2),
        approx_next_cycle_budget=round(approx_next, 2),
        approx_full_coverage_budget=round(approx_full, 2),
    )


def _make_deferred(controls: List[SecurityControl]) -> List[DeferredControl]:
    """Convert unpicked controls into ranked DeferredControl entries."""
    scored = []
    for c in controls:
        eff = c.risk_reduction / c.cost if c.cost > 0 else 0.0
        scored.append((eff, c))

    # Best value-per-rupee first → priority_rank 1
    scored.sort(key=lambda t: t[0], reverse=True)

    deferred: List[DeferredControl] = []
    for rank, (eff, c) in enumerate(scored, start=1):
        deferred.append(DeferredControl(
            id=c.id,
            name=c.name,
            cost=c.cost,
            risk_reduction=c.risk_reduction,
            category=c.category,
            efficiency=round(eff, 3),
            priority_rank=rank,
        ))
    return deferred


def solve_knapsack(request: OptimizationRequest) -> OptimizationResult:
    start = time.perf_counter()

    controls = request.controls
    budget = request.budget
    n = len(controls)

    # Edge case: no controls provided
    if n == 0:
        return OptimizationResult(
            status="Optimal",
            selected_controls=[],
            deferred_controls=[],
            rejected_control_ids=[],
            total_cost=0.0,
            total_risk_reduction=0.0,
            budget=budget,
            budget_utilization_pct=0.0,
            budget_remaining=budget,
            future_budget=None,
            solver_time_seconds=round(time.perf_counter() - start, 4),
        )

    # --- Build the model -------------------------------------------------
    problem = LpProblem("SecurityControl_Knapsack", LpMaximize)
    x = LpVariable.dicts("select", range(n), cat="Binary")

    problem += (
        lpSum(controls[i].risk_reduction * x[i] for i in range(n)),
        "Total_Risk_Reduction",
    )
    problem += (
        lpSum(controls[i].cost * x[i] for i in range(n)) <= budget,
        "Budget_Constraint",
    )

    problem.solve(PULP_CBC_CMD(msg=0))
    elapsed = time.perf_counter() - start
    status = LpStatus[problem.status]

    # --- Extract results -------------------------------------------------
    selected: List[SelectedControl] = []
    rejected_ids: List[str] = []
    not_selected_raw: List[SecurityControl] = []
    total_cost = 0.0
    total_reduction = 0.0

    if status == "Optimal":
        for i in range(n):
            v = value(x[i])
            if v is not None and v > 0.5:
                c = controls[i]
                eff = c.risk_reduction / c.cost if c.cost > 0 else 0.0
                selected.append(SelectedControl(
                    id=c.id,
                    name=c.name,
                    cost=c.cost,
                    risk_reduction=c.risk_reduction,
                    category=c.category,
                    efficiency=round(eff, 3),
                ))
                total_cost += c.cost
                total_reduction += c.risk_reduction
            else:
                rejected_ids.append(controls[i].id)
                not_selected_raw.append(controls[i])

    # Sort selected by efficiency for display
    selected.sort(key=lambda s: s.efficiency, reverse=True)

    # Build deferred list + future budget estimate
    deferred = _make_deferred(not_selected_raw)
    future = _build_future_estimate(deferred) if deferred else None

    utilization = (total_cost / budget * 100.0) if budget > 0 else 0.0

    return OptimizationResult(
        status=status,
        selected_controls=selected,
        deferred_controls=deferred,
        rejected_control_ids=rejected_ids,
        total_cost=round(total_cost, 2),
        total_risk_reduction=round(total_reduction, 2),
        budget=budget,
        budget_utilization_pct=round(utilization, 2),
        budget_remaining=round(budget - total_cost, 2),
        future_budget=future,
        solver_time_seconds=round(elapsed, 4),
    )