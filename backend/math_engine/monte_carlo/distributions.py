import numpy as np
from typing import Tuple

from .config import DEFAULT_CONFIG

def generate_threat_event_frequency(
          min_freq: float,
          likely_freq: float,
          max_freq: float,
          iterations: int = DEFAULT_CONFIG.ITERATIONS
) -> np.ndarray:
     """
     Generates an array of Threat Event Frequencies (TEF) using a Triangular distribution.
     This simulates how many times an asset might be successfully attacked in a year.
    
     Args:
          min_freq: Best-case scenario (lowest attack frequency).
          likely_freq: Most probable attack frequency.
          max_freq: Worst-case scenario (highest attack frequency).
          iterations: Size of the simulated matrix (default 10,000).
        
     Returns:
          np.ndarray: Vectorized 1D array of simulated frequencies.
     """
     if not (min_freq <= likely_freq <= max_freq):
          raise ValueError(f"Frequency bounds invalid: min({min_freq}) <= likely({likely_freq}) <= max({max_freq})")
        
     rng = np.random.default_rng(seed=DEFAULT_CONFIG.RANDOM_SEED)
     return rng.triangular(left=min_freq, mode=likely_freq, right=max_freq, size=iterations)


def generate_loss_magnitude(
          lower_bound_loss: float,
          upper_bound_loss: float,
          iterations: int = DEFAULT_CONFIG.ITERATIONS
) -> np.ndarray:
     """
     Generates an array of Financial Loss Magnitudes using a Log-Normal distribution.
     Models the 'long tail' of cyber risk where catastrophic breaches are rare but devastating.
    
     Args:
          lower_bound_loss: Estimated 10th percentile financial loss.
          upper_bound_loss: Estimated 90th percentile financial loss.
          iterations: Size of the simulated matrix (default 10,000).
        
     Returns:
          np.ndarray: Vectorized 1D array of simulated financial losses.
     """
     if lower_bound_loss <= 0 or upper_bound_loss <= lower_bound_loss:
          raise ValueError("Loss bounds must be strictly positive and lower < upper.")

     z_score = 1.28155
     log_lower = np.log(lower_bound_loss)
     log_upper = np.log(upper_bound_loss)
    
     mu = (log_lower + log_upper) / 2.0
     sigma = (log_upper - log_lower) / (2.0 * z_score)
    
     rng = np.random.default_rng(seed=DEFAULT_CONFIG.RANDOM_SEED)
     return rng.lognormal(mean=mu, sigma=sigma, size=iterations)