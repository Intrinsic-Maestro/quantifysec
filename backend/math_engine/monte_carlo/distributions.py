import numpy as np

def sample_lognormal(mean: float, sigma: float = 1.0857) -> float:
    """
    Samples from a fat-tailed lognormal distribution.
    Used for unpredictable costs like regulatory fines or IR retainers.
    """
    # Calculate the underlying normal distribution's mu based on the desired mean
    mu = np.log(mean) - (sigma ** 2) / 2
    return float(np.random.lognormal(mean=mu, sigma=sigma))

def sample_pert(minimum: float, likely: float, maximum: float) -> float:
    """
    Samples from a PERT distribution. 
    Ideal for expert-estimated bounds like Downtime Hours.
    """
    # Using a beta distribution approximation for PERT
    alpha = 1 + 4 * ((likely - minimum) / (maximum - minimum))
    beta = 1 + 4 * ((maximum - likely) / (maximum - minimum))
    sample = np.random.beta(alpha, beta)
    return minimum + sample * (maximum - minimum)