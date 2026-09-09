"""
QuantifySec Financial Risk Models
=================================

This module converts a technical vulnerability + business asset context
into a stochastic monetary loss.

Financial model
---------------

For each vulnerability:

    SLE =
        stochastic downtime loss
        +
        stochastic incident-response / regulatory loss

Then:

    adjusted SLE =
        SLE × CVSS multiplier

or, for a toxic combination:

    adjusted SLE =
        SLE × 5

The Monte Carlo simulator then applies attack probabilities and graph
cascades to turn these losses into:

    Expected Annual Loss / ALE
    P95 VaR
    P99 VaR
    per-vulnerability monetary risk

This module deliberately keeps the distribution logic in distributions.py.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Tuple

import numpy as np

from data_ingestion.schemas import (
    VulnerabilityNode,
    AssetBusinessContext,
)

from .distributions import (
    sample_lognormal,
    sample_pert,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Financial model constants
# ---------------------------------------------------------------------------

# Existing model assumptions retained from the original engine.
#
# An exploited vulnerability has a significantly higher annual probability
# of producing a successful attack than an ordinary vulnerability.
EXPLOITED_ATTACK_PROBABILITY = 0.20
NORMAL_ATTACK_PROBABILITY = 0.05

# Probability that an attacker pivots from a compromised vulnerability
# to a downstream dependency in the security graph.
CASCADE_PIVOT_PROBABILITY = 0.30

# Toxic combinations represent interconnected critical attack paths.
# The original model applies a large loss multiplier to these paths.
TOXIC_COMBINATION_MULTIPLIER = 5.0


# ---------------------------------------------------------------------------
# Distribution-backed SLE
# ---------------------------------------------------------------------------

def calculate_node_sle(
    node: VulnerabilityNode,
    asset: AssetBusinessContext,
    rng: np.random.Generator | None = None,
) -> float:
    """
    Calculate the stochastic Single Loss Expectancy (SLE) for one
    vulnerability.

    Parameters
    ----------
    node:
        Vulnerability being evaluated.

    asset:
        Business/financial context for the affected asset.

    rng:
        Optional NumPy random generator.

    Returns
    -------
    float
        Estimated loss in INR lakhs for one successful compromise.

    Model
    -----
    1. Sample containment downtime using PERT.
    2. Convert downtime to monetary loss using asset downtime cost.
    3. Sample incident-response / regulatory loss using a fat-tailed
       lognormal distribution.
    4. Add the two losses.
    5. Apply CVSS scaling or toxic-combination multiplier.
    """

    # ------------------------------------------------------------------
    # 1. Stochastic downtime
    # ------------------------------------------------------------------
    #
    # Original model assumption:
    #
    #     minimum = 2 hours
    #     likely  = 8 hours
    #     maximum = 48 hours
    #
    # PERT is appropriate because downtime is bounded and we have a
    # reasonable "most likely" estimate.
    # ------------------------------------------------------------------

    downtime_hours = sample_pert(
        minimum=2.0,
        likely=8.0,
        maximum=48.0,
    )

    downtime_loss_lakhs = (
        downtime_hours
        * asset.downtime_cost_per_hour_lakhs
    )

    # ------------------------------------------------------------------
    # 2. Incident response + regulatory/fine component
    # ------------------------------------------------------------------

    baseline_loss = max(
        0.0,
        float(asset.single_loss_expectancy_inr_lakhs),
    )

    if baseline_loss > 0.0:

        baseline_fines_and_ir = sample_lognormal(
            mean=baseline_loss,
        )

    else:

        baseline_fines_and_ir = 0.0

    # ------------------------------------------------------------------
    # 3. Base SLE
    # ------------------------------------------------------------------

    base_sle_lakhs = (
        downtime_loss_lakhs
        + baseline_fines_and_ir
    )

    # ------------------------------------------------------------------
    # 4. Technical risk multiplier
    # ------------------------------------------------------------------

    if node.is_toxic_combination:

        multiplier = TOXIC_COMBINATION_MULTIPLIER

    else:

        # CVSS 0-10 maps to approximately 1x-2x.
        #
        # CVSS 0  -> 1.0
        # CVSS 5  -> 1.5
        # CVSS 10 -> 2.0
        multiplier = (
            1.0
            + (float(node.base_score) / 10.0)
        )

    adjusted_sle_lakhs = (
        base_sle_lakhs
        * multiplier
    )

    return float(adjusted_sle_lakhs)


# ---------------------------------------------------------------------------
# Expected annual loss
# ---------------------------------------------------------------------------

def calculate_node_annual_risk(
    node: VulnerabilityNode,
    sle_lakhs: float,
) -> float:
    """
    Convert a successful-compromise loss into expected annual monetary risk.

    This is the basic:

        ALE = probability × SLE

    relationship.

    Exploited vulnerabilities receive the higher attack probability used
    by the Monte Carlo engine.
    """

    attack_probability = (
        EXPLOITED_ATTACK_PROBABILITY
        if node.is_exploited
        else NORMAL_ATTACK_PROBABILITY
    )

    return float(
        sle_lakhs
        * attack_probability
    )


# ---------------------------------------------------------------------------
# Portfolio preparation
# ---------------------------------------------------------------------------

def prepare_financial_risk_inputs(
    security_graph: Dict[str, VulnerabilityNode],
    asset_financials: List[AssetBusinessContext],
    seed: int | None = None,
) -> Tuple[
    List[str],
    np.ndarray,
    np.ndarray,
    np.ndarray,
]:
    """
    Prepare all financial inputs required by the Monte Carlo engine.

    This is intentionally separated from the simulation loop.

    For a large graph we do NOT want to repeatedly perform:

        PERT sampling
        Lognormal sampling
        asset dictionary lookups
        Pydantic object traversal

    inside every simulation.

    Instead, we create one financial-risk profile per vulnerability and
    pass compact NumPy arrays into the simulator.

    Returns
    -------
    node_keys:
        Graph node identifiers.

    sle_values:
        Stochastic SLE assigned to each vulnerability.

    annual_risk_values:
        Basic probability-weighted annual risk for each vulnerability.

    attack_probabilities:
        Annual attack probability for each vulnerability.
    """

    asset_map = {
        asset.asset_id: asset
        for asset in asset_financials
    }

    rng = np.random.default_rng(seed)

    node_keys: List[str] = []
    sle_values: List[float] = []
    annual_risk_values: List[float] = []
    attack_probabilities: List[float] = []

    for node_key, node in security_graph.items():

        asset = asset_map.get(node.asset_id)

        if asset is None:

            logger.warning(
                "Skipping vulnerability %s: "
                "no financial context exists for asset %s.",
                node_key,
                node.asset_id,
            )

            continue

        # --------------------------------------------------------------
        # Generate the financial loss profile.
        #
        # calculate_node_sle currently uses the project's distribution
        # functions, which use NumPy's global RNG. We still keep the
        # generator here so the preparation stage has a deterministic
        # control point for future vectorized distribution implementations.
        # --------------------------------------------------------------

        sle_lakhs = calculate_node_sle(
            node=node,
            asset=asset,
            rng=rng,
        )

        attack_probability = (
            EXPLOITED_ATTACK_PROBABILITY
            if node.is_exploited
            else NORMAL_ATTACK_PROBABILITY
        )

        annual_risk = (
            sle_lakhs
            * attack_probability
        )

        node_keys.append(node_key)
        sle_values.append(sle_lakhs)
        annual_risk_values.append(annual_risk)
        attack_probabilities.append(attack_probability)

    return (
        node_keys,
        np.asarray(
            sle_values,
            dtype=np.float64,
        ),
        np.asarray(
            annual_risk_values,
            dtype=np.float64,
        ),
        np.asarray(
            attack_probabilities,
            dtype=np.float64,
        ),
    )


# ---------------------------------------------------------------------------
# Graph cascade calculation
# ---------------------------------------------------------------------------

def build_cascade_map(
    security_graph: Dict[str, VulnerabilityNode],
    node_keys: List[str],
) -> Dict[int, List[int]]:
    """
    Convert graph dependencies from string node keys into integer array
    indexes.

    Example:

        "asset_A_CVE-123" -> index 17

    This makes the Monte Carlo engine considerably cheaper because it can
    operate on NumPy arrays instead of repeatedly performing dictionary
    lookups.
    """

    key_to_index = {
        key: index
        for index, key in enumerate(node_keys)
    }

    cascade_map: Dict[int, List[int]] = {}

    for source_index, node_key in enumerate(node_keys):

        node = security_graph[node_key]

        downstream_indexes: List[int] = []

        for downstream_key in node.downstream_dependencies:

            downstream_index = key_to_index.get(
                downstream_key
            )

            if downstream_index is not None:

                downstream_indexes.append(
                    downstream_index
                )

        if downstream_indexes:

            cascade_map[source_index] = (
                downstream_indexes
            )

    return cascade_map


# ---------------------------------------------------------------------------
# Portfolio financial summary
# ---------------------------------------------------------------------------

def summarize_node_risks(
    node_keys: List[str],
    security_graph: Dict[str, VulnerabilityNode],
    sle_values: np.ndarray,
    annual_risk_values: np.ndarray,
    attack_probabilities: np.ndarray,
) -> List[dict]:
    """
    Build frontend/PSO-friendly monetary risk records.

    Each vulnerability receives an explicit monetary risk value.

    Example:

        {
            "cve_id": "CVE-2024-1234",
            "asset_id": "srv-prod-001",
            "cvss_score": 9.8,
            "expected_annual_loss_lakhs": 125.73,
            ...
        }
    """

    results: List[dict] = []

    for index, node_key in enumerate(node_keys):

        node = security_graph[node_key]

        results.append(
            {
                "node_key": node_key,

                "cve_id": node.cve_id,

                "asset_id": node.asset_id,

                "severity": node.severity,

                "cvss_score": round(
                    float(node.base_score),
                    2,
                ),

                "is_exploited": bool(
                    node.is_exploited
                ),

                "is_toxic_combination": bool(
                    node.is_toxic_combination
                ),

                "attack_probability": round(
                    float(
                        attack_probabilities[index]
                    ),
                    4,
                ),

                "single_loss_expectancy_lakhs": round(
                    float(
                        sle_values[index]
                    ),
                    4,
                ),

                "expected_annual_loss_lakhs": round(
                    float(
                        annual_risk_values[index]
                    ),
                    4,
                ),
            }
        )

    results.sort(
        key=lambda item: item[
            "expected_annual_loss_lakhs"
        ],
        reverse=True,
    )

    total_risk = sum(
        item["expected_annual_loss_lakhs"]
        for item in results
    )

    for item in results:

        if total_risk > 0:

            item["portfolio_risk_share_percent"] = round(
                (
                    item[
                        "expected_annual_loss_lakhs"
                    ]
                    / total_risk
                )
                * 100.0,
                4,
            )

        else:

            item["portfolio_risk_share_percent"] = 0.0

    return results


# ---------------------------------------------------------------------------
# Backwards-compatible graph risk traversal
# ---------------------------------------------------------------------------

def cascade_risk(
    node_key: str,
    graph: Dict[str, VulnerabilityNode],
    asset_map: Dict[str, AssetBusinessContext],
    visited: set,
) -> float:
    """
    Backwards-compatible recursive graph risk calculation.

    This function is retained because other parts of the project may still
    import it.

    The high-performance Monte Carlo simulator should prefer the indexed
    cascade representation created by build_cascade_map().
    """

    if node_key in visited:

        return 0.0

    visited.add(node_key)

    node = graph[node_key]

    asset = asset_map.get(node.asset_id)

    if asset is None:

        return 0.0

    total_loss = calculate_node_sle(
        node=node,
        asset=asset,
    )

    for downstream_key in node.downstream_dependencies:

        # Preserve the original model's 30% pivot probability.
        if np.random.random() < CASCADE_PIVOT_PROBABILITY:

            total_loss += cascade_risk(
                downstream_key,
                graph,
                asset_map,
                visited,
            )

    return float(total_loss)

