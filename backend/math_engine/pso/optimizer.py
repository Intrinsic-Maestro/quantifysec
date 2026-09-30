from __future__ import annotations

import logging
from typing import List, Dict, Any
import numpy as np

logger = logging.getLogger(__name__)


class PSOSecurityOptimizer:
    """Budget-constrained binary PSO for remediation selection.

    Objective:
        maximize monetary risk reduction subject to total remediation cost <= budget.

    The implementation is vectorized across particles and uses a deterministic
    density-based budget repair step, so 50k remediation candidates do not
    trigger Python loops over every candidate on every particle update.
    """

    def __init__(
        self,
        controls: List[Dict[str, Any]],
        budget_lakhs: float,
        num_particles: int = 30,
        max_iterations: int = 30,
        seed: int | None = None,
    ):
        self.controls = controls
        self.budget_lakhs = float(budget_lakhs)
        self.num_particles = max(2, int(num_particles))
        self.max_iterations = max(1, int(max_iterations))
        self.dim = len(controls)
        self.seed = seed

        self.cost = np.asarray([max(0.0, float(c.get("cost", 0.0))) for c in controls], dtype=np.float64)
        self.reduction = np.asarray([max(0.0, float(c.get("risk_reduction", 0.0))) for c in controls], dtype=np.float64)
        self.toxic = np.asarray([bool(c.get("is_toxic", False)) for c in controls], dtype=bool)
        self.effective_reduction = self.reduction * np.where(self.toxic, 1.5, 1.0)

        # High value per rupee first is used only for budget repair.
        density = self.effective_reduction / np.maximum(self.cost, 1e-12)
        self.repair_order = np.argsort(-density, kind="stable")

    def _evaluate_population(self, positions: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        costs = positions @ self.cost
        reductions = positions @ self.effective_reduction
        scores = reductions - (0.05 * costs)
        # Feasibility is handled before this method is normally called, but keep
        # a hard penalty for safety.
        over = costs > self.budget_lakhs
        scores = np.where(over, -1e12 - (costs - self.budget_lakhs) * 1e6, scores)
        return scores, costs, reductions

    def _repair_population(self, positions: np.ndarray) -> np.ndarray:
        """Repair over-budget binary particles using risk/cost density.

        Controls are first ordered globally by density. For each particle we
        retain selected controls in that order until the budget is exhausted.
        """
        ordered = positions[:, self.repair_order]
        ordered_cost = self.cost[self.repair_order]
        cumulative = np.cumsum(ordered * ordered_cost[None, :], axis=1)

        # A selected item is retained iff the cumulative cost through that item
        # stays within budget. Zero-cost controls are always retained.
        keep = ordered & ((cumulative <= self.budget_lakhs) | (ordered_cost[None, :] <= 0.0))
        repaired = np.zeros_like(positions, dtype=bool)
        repaired[:, self.repair_order] = keep
        return repaired

    def optimize(self) -> Dict[str, Any]:
        if self.dim == 0:
            return {
                "status": "Infeasible",
                "solver_type": "Particle Swarm Optimization (PSO)",
                "total_cost": 0.0,
                "total_risk_reduction": 0.0,
                "budget_remaining": self.budget_lakhs,
                "selected_controls": [],
                "deferred_controls": [],
            }

        rng = np.random.default_rng(self.seed)

        # Start with a dense enough random population, then make every particle feasible.
        positions = rng.random((self.num_particles, self.dim)) < 0.05
        positions = self._repair_population(positions)

        # Seed one particle with the deterministic risk-per-rupee greedy
        # solution. PSO is therefore never worse than this strong baseline.
        greedy = np.zeros(self.dim, dtype=bool)
        remaining = self.budget_lakhs
        for idx in self.repair_order:
            c = self.cost[idx]
            if c <= remaining:
                greedy[idx] = True
                remaining -= c
        positions[0] = greedy

        velocities = rng.uniform(-1.0, 1.0, size=(self.num_particles, self.dim))

        scores, costs, reductions = self._evaluate_population(positions)
        personal_best_positions = positions.copy()
        personal_best_scores = scores.copy()

        best_idx = int(np.argmax(scores))
        global_best_position = positions[best_idx].copy()
        global_best_score = float(scores[best_idx])

        w, c1, c2 = 0.55, 1.5, 1.5

        for iteration in range(self.max_iterations):
            r1 = rng.random((self.num_particles, self.dim))
            r2 = rng.random((self.num_particles, self.dim))

            velocities = (
                w * velocities
                + c1 * r1 * (personal_best_positions.astype(np.float64) - positions.astype(np.float64))
                + c2 * r2 * (global_best_position.astype(np.float64)[None, :] - positions.astype(np.float64))
            )
            velocities = np.clip(velocities, -8.0, 8.0)
            probability = 1.0 / (1.0 + np.exp(-velocities))
            positions = rng.random((self.num_particles, self.dim)) < probability
            positions = self._repair_population(positions)

            scores, costs, reductions = self._evaluate_population(positions)

            improved = scores > personal_best_scores
            personal_best_positions[improved] = positions[improved]
            personal_best_scores[improved] = scores[improved]

            current_best_idx = int(np.argmax(scores))
            if float(scores[current_best_idx]) > global_best_score:
                global_best_score = float(scores[current_best_idx])
                global_best_position = positions[current_best_idx].copy()

            logger.debug(
                "PSO iteration %s/%s: score=%.4f cost=%.2f reduction=%.2f",
                iteration + 1,
                self.max_iterations,
                global_best_score,
                float(global_best_position @ self.cost),
                float(global_best_position @ self.effective_reduction),
            )

        selected_idx = np.flatnonzero(global_best_position)
        deferred_idx = np.flatnonzero(~global_best_position)
        total_cost = float(global_best_position @ self.cost)
        gross_reduction = float(global_best_position @ self.reduction)
        effective_reduction = float(global_best_position @ self.effective_reduction)

        selected_controls = [self.controls[i] for i in selected_idx]
        deferred_controls = [self.controls[i] for i in deferred_idx]

        return {
            "status": "Optimal",
            "solver_type": "Particle Swarm Optimization (PSO)",
            "objective_value": round(global_best_score, 4),
            "total_cost": round(total_cost, 2),
            "total_risk_reduction": round(gross_reduction, 2),
            "effective_risk_reduction": round(effective_reduction, 2),
            "budget_remaining": round(self.budget_lakhs - total_cost, 2),
            "selected_count": int(len(selected_controls)),
            "deferred_count": int(len(deferred_controls)),
            "selected_controls": selected_controls,
            "deferred_controls": deferred_controls,
        }