import numpy as np

def calculate_loss_event_frequency(
     threat_event_frequency: np.ndarray,
     vulnerability_probability: np.ndarray,
) -> np.ndarray:
     """
     Calculates Loss Event Frequency (LEF) across all simulation iterations.
     Open FAIR Equation: LEF = TEF * Vulnerability
    
     Args:
          threat_event_frequency: 1D array of simulated threat event counts.
          vulnerability_probability: 1D array of exploit success probabilities (0.0 to 1.0).
        
     Returns:
          np.ndarray: 1D array representing the frequency of successful loss events.
     """
     
     if threat_event_frequency.shape != vulnerability_probability.shape:
        raise ValueError(
            f"Shape mismatch: TEF {threat_event_frequency.shape} "
            f"vs Vuln {vulnerability_probability.shape}"
        )
        
     return threat_event_frequency * vulnerability_probability

def calculate_annualized_loss_expectancy(
     loss_event_frequency: np.ndarray,
     loss_magnitude: np.ndarray
) -> np.ndarray:
     """
     Calculates the Annualized Loss Expectancy (ALE) array across all simulation iterations.
     Open FAIR Equation: ALE = LEF * Loss Magnitude
    
     Args:
          loss_event_frequency: 1D array of successful loss event frequencies.
          loss_magnitude: 1D array of financial impact amounts.
        
     Returns:
          np.ndarray: 1D array of expected financial loss per iteration.
     """
     
     if loss_event_frequency.shape != loss_magnitude.shape:
          raise ValueError(
               f"Shape mismatch: LEF {loss_event_frequency.shape} "
               f"vs Magnitude {loss_magnitude.shape}"
          )
        
     return loss_event_frequency * loss_magnitude