import numpy as np
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class PSOSecurityOptimizer:
    def __init__(self, controls: List[Dict[str, Any]], budget_lakhs: float, num_particles: int = 30, max_iterations: int = 50):
        self.controls = controls
        self.budget_lakhs = budget_lakhs
        self.num_particles = num_particles
        self.max_iterations = max_iterations
        self.dim = len(controls)

    def _evaluate_fitness(self, position: np.ndarray) -> float:
        """
        Fitness function: Maximizes risk reduction while penalizing 
        budget overruns and unaddressed toxic combinations.
        """
        total_cost = 0.0
        total_risk_reduction = 0.0
        toxic_penalty = 0.0

        for i, selected in enumerate(position):
            if selected > 0.5:  # Threshold binary decision
                ctrl = self.controls[i]
                total_cost += ctrl["cost"]
                total_risk_reduction += ctrl["risk_reduction"]
                
                # Extra reward if it fixes a toxic combination
                if ctrl.get("is_toxic", False):
                    total_risk_reduction *= 1.5

        # Heavy penalty if budget is exceeded
        if total_cost > self.budget_lakhs:
            overage = total_cost - self.budget_lakhs
            return -10000.0 - (overage * 100)

        # Net objective value (Risk Reduction minus cost efficiency drag)
        return total_risk_reduction - (total_cost * 0.05)

    def optimize(self) -> Dict[str, Any]:
        """Runs the Particle Swarm Optimization loop for discrete binary choices."""
        if self.dim == 0:
            return {"status": "Infeasible", "selected": [], "deferred": []}

        # Initialize particles randomly (binary 0 or 1)
        particles = np.random.rand(self.num_particles, self.dim)
        velocities = np.random.uniform(-1, 1, (self.num_particles, self.dim))
        
        personal_best_positions = particles.copy()
        personal_best_scores = np.array([self._evaluate_fitness(p) for p in particles])
        
        global_best_idx = np.argmax(personal_best_scores)
        global_best_position = personal_best_positions[global_best_idx].copy()
        global_best_score = personal_best_scores[global_best_idx]

        w = 0.5   # Inertia weight
        c1 = 1.5  # Cognitive parameter
        c2 = 1.5  # Social parameter

        for _ in range(self.max_iterations):
            for i in range(self.num_particles):
                r1, r2 = np.random.rand(), np.random.rand()
                
                # Update velocity
                velocities[i] = (w * velocities[i] +
                                 c1 * r1 * (personal_best_positions[i] - particles[i]) +
                                 c2 * r2 * (global_best_position - particles[i]))
                
                # Sigmoid function to map velocity to probability [0, 1] for binary PSO
                sigmoid = 1 / (1 + np.exp(-velocities[i]))
                particles[i] = np.random.rand(self.dim) < sigmoid

                # Evaluate fitness
                score = self._evaluate_fitness(particles[i])

                # Update personal best
                if score > personal_best_scores[i]:
                    personal_best_scores[i] = score
                    personal_best_positions[i] = particles[i].copy()

                # Update global best
                if score > global_best_score:
                    global_best_score = score
                    global_best_position = particles[i].copy()

        # Extract final selected vs deferred controls
        selected_controls = []
        deferred_controls = []
        total_cost = 0.0
        total_reduction = 0.0

        for i, val in enumerate(global_best_position):
            ctrl = self.controls[i]
            if val > 0.5:
                selected_controls.call if hasattr(ctrl, 'dict') else selected_controls.append(ctrl)
                total_cost += ctrl["cost"]
                total_reduction += ctrl["risk_reduction"]
            else:
                deferred_controls.append(ctrl)

        return {
            "status": "Optimal",
            "solver_type": "Particle Swarm Optimization (PSO)",
            "total_cost": round(total_cost, 2),
            "total_risk_reduction": round(total_reduction, 2),
            "budget_remaining": round(self.budget_lakhs - total_cost, 2),
            "selected_controls": selected_controls,
            "deferred_controls": deferred_controls
        }