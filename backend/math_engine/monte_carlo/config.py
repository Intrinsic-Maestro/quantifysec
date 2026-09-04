import os
from typing import NamedTuple

class SimulationConfig(NamedTuple):
     ITERATIONS: int = 10_000
     RANDOM_SEED: int = 42

     PERCENTILE_P50: float = 50.0
     PERCENTILE_P90: float = 90.0
     PERCENTILE_P95: float = 95.0
     PERCENTILE_P99: float = 99.0

     MIN_LOSS_MULTIPLIER: float = 0.10
     MAX_LOSS_MULTIPLIER: float = 2.50
     DEFAULT_CONFIDENCE: float = 0.90

     def validate(self) -> None:
          """
          Validates configuration values to prevent invalid mathematical operations.
          """
          if self.ITERATIONS <= 0:
               raise ValueError(f"ITERATIONS must be positive, got {self.ITERATIONS}")
               
          if not (0.0 <= self.MIN_LOSS_MULTIPLIER < self.MAX_LOSS_MULTIPLIER):
               raise ValueError(
                    f"Invalid loss multipliers: MIN ({self.MIN_LOSS_MULTIPLIER}) must be < MAX ({self.MAX_LOSS_MULTIPLIER})"
               )
               
          for p_name, p_val in [
               ("P50", self.PERCENTILE_P50),
               ("P90", self.PERCENTILE_P90),
               ("P95", self.PERCENTILE_P95),
               ("P99", self.PERCENTILE_P99),
          ]:
               if not (0.0 <= p_val <= 100.0):
                    raise ValueError(f"Percentile {p_name} must be between 0 and 100, got {p_val}")

     @classmethod
     def from_env(cls) -> "SimulationConfig":
          """
          Loads configuration overrides from environment variables if present,
          falling back to default parameters.
          """
          iterations = int(os.getenv("MC_ITERATIONS", "10000"))
          seed = int(os.getenv("MC_RANDOM_SEED", "42"))
          
          config = cls(ITERATIONS=iterations, RANDOM_SEED=seed)
          config.validate()
          return config


# Default immutable singleton instance for zero-config imports
DEFAULT_CONFIG = SimulationConfig()
DEFAULT_CONFIG.validate()