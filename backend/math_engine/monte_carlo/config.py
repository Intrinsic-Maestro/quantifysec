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

     