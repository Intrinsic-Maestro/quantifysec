"""
QuantifySec Monte Carlo Financial Risk Engine

The engine converts the vulnerability graph + asset financial context into
enterprise and per-vulnerability monetary risk.

Performance design:
- Financial SLE is sampled once per vulnerability, not once per simulation.
- Attack/cascade events are simulated in NumPy batches.
- Only one batch of boolean activation state is held in memory.
- The exact same activation matrix is used for loss calculation and
  activation telemetry.
- Per-node loss is accumulated, so we never store iterations x nodes.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Tuple

import numpy as np

from data_ingestion.schemas import VulnerabilityNode, AssetBusinessContext
from .financial_models import calculate_node_sle

logger = logging.getLogger(__name__)

DEFAULT_ITERATIONS = 10_000
DEFAULT_BATCH_SIZE = 256
CASCADE_PIVOT_PROBABILITY = 0.30


def _prepare_nodes(
    security_graph: Dict[str, VulnerabilityNode],
    asset_financials: List[AssetBusinessContext],
    rng: np.random.Generator,
) -> Tuple[
    List[str],
    List[VulnerabilityNode],
    np.ndarray,
    np.ndarray,
]:
    """
    Prepare compact NumPy arrays for the simulation.

    Returns:
        node_keys
        nodes
        node_sle
        direct_attack_probability
    """
    asset_map = {asset.asset_id: asset for asset in asset_financials}

    node_keys: List[str] = []
    nodes: List[VulnerabilityNode] = []
    sle_values: List[float] = []
    attack_probabilities: List[float] = []

    for node_key, node in security_graph.items():
        asset = asset_map.get(node.asset_id)

        if asset is None:
            logger.warning(
                "Skipping %s: no financial context for asset %s",
                node_key,
                node.asset_id,
            )
            continue

        # One stochastic financial profile per vulnerability.
        #
        # The distributions used here are the same PERT + lognormal
        # distributions defined by the financial model. We do NOT resample
        # downtime/fines 10,000 times for every node because that would create
        # an enormous unnecessary compute burden.
        sle = calculate_node_sle(
            node=node,
            asset=asset,
            rng=rng,
        )

        node_keys.append(node_key)
        nodes.append(node)
        sle_values.append(float(sle))
        attack_probabilities.append(
            0.20 if node.is_exploited else 0.05
        )

    return (
        node_keys,
        nodes,
        np.asarray(sle_values, dtype=np.float64),
        np.asarray(attack_probabilities, dtype=np.float64),
    )


def _build_downstream_edges(
    security_graph: Dict[str, VulnerabilityNode],
    node_keys: List[str],
) -> List[Tuple[int, int]]:
    """
    Convert graph dependencies from string keys to integer indexes.

    Supports arbitrary downstream edges, rather than assuming only one edge
    per source node.
    """
    key_to_index = {key: i for i, key in enumerate(node_keys)}
    edges: List[Tuple[int, int]] = []

    for source_index, key in enumerate(node_keys):
        node = security_graph[key]

        for downstream_key in node.downstream_dependencies:
            target_index = key_to_index.get(downstream_key)

            if target_index is not None and target_index != source_index:
                edges.append((source_index, target_index))

    return edges


def _propagate_cascades(
    active: np.ndarray,
    edges: List[Tuple[int, int]],
    rng: np.random.Generator,
) -> None:
    """
    Apply graph cascades in-place.

    For each edge A -> B:
        if A is active and the attacker pivots with probability 30%,
        B becomes active.

    The loop repeats until no new activation is produced, allowing:
        A -> B -> C -> D
    rather than stopping after one hop.

    Because the supplied graph is a DAG-like synthetic graph, this converges
    quickly. A hard pass limit also protects against malformed cyclic graphs.
    """
    if not edges:
        return

    max_passes = max(1, active.shape[1])

    for _ in range(max_passes):
        changed = False

        for source, target in edges:
            source_active = active[:, source]

            if not np.any(source_active):
                continue

            pivot = rng.random(active.shape[0]) < CASCADE_PIVOT_PROBABILITY
            newly_active = source_active & pivot & ~active[:, target]

            if np.any(newly_active):
                active[:, target] |= newly_active
                changed = True

        if not changed:
            break


def run_portfolio_simulation(
    security_graph: Dict[str, VulnerabilityNode],
    asset_financials: List[AssetBusinessContext],
    iterations: int = DEFAULT_ITERATIONS,
    batch_size: int = DEFAULT_BATCH_SIZE,
    seed: int | None = None,
) -> dict:
    """
    Run the enterprise Monte Carlo simulation.

    Parameters
    ----------
    security_graph:
        Parsed vulnerability graph.

    asset_financials:
        Business/financial context for the affected assets.

    iterations:
        Number of annual attack simulations. Default = 10,000.

    batch_size:
        Number of simulations held in memory at once. Default = 256.

    seed:
        Optional deterministic seed for reproducible dashboard results.

    Returns
    -------
    dict
        Enterprise metrics plus one monetary-risk record per vulnerability.
    """
    if iterations < 1:
        raise ValueError("iterations must be >= 1")

    if batch_size < 1:
        raise ValueError("batch_size must be >= 1")

    if not security_graph:
        return {
            "mean_ale_lakhs": 0.0,
            "p95_var_lakhs": 0.0,
            "p99_var_lakhs": 0.0,
            "zero_loss_probability": 1.0,
            "iterations": iterations,
            "node_count": 0,
            "cascade_edges": 0,
            "node_risk": [],
        }

    logger.info(
        "Starting Monte Carlo: nodes=%d iterations=%d batch_size=%d",
        len(security_graph),
        iterations,
        batch_size,
    )

    rng = np.random.default_rng(seed)

    (
        node_keys,
        nodes,
        node_sle,
        attack_probability,
    ) = _prepare_nodes(
        security_graph=security_graph,
        asset_financials=asset_financials,
        rng=rng,
    )

    if not node_keys:
        raise ValueError(
            "No vulnerabilities have matching financial asset context."
        )

    edges = _build_downstream_edges(
        security_graph=security_graph,
        node_keys=node_keys,
    )

    node_count = len(node_keys)

    # Portfolio distribution is only iterations long.
    # We intentionally do NOT retain iterations x node_count results.
    portfolio_losses = np.empty(
        iterations,
        dtype=np.float64,
    )

    # Aggregate node losses across all simulations.
    node_total_losses = np.zeros(
        node_count,
        dtype=np.float64,
    )

    # Exact count of simulations in which each node became active,
    # including cascade activation.
    node_activation_counts = np.zeros(
        node_count,
        dtype=np.int64,
    )

    # Direct attack counts are kept separately for dashboard telemetry.
    node_direct_attack_counts = np.zeros(
        node_count,
        dtype=np.int64,
    )

    cursor = 0

    while cursor < iterations:
        current_batch = min(
            batch_size,
            iterations - cursor,
        )

        # --------------------------------------------------------------
        # ONE attack-event matrix.
        #
        # This matrix is used for:
        #   1. direct attacks
        #   2. cascades
        #   3. monetary losses
        #   4. activation telemetry
        #
        # No second independent random matrix is generated.
        # --------------------------------------------------------------
        active = (
            rng.random(
                (current_batch, node_count)
            )
            < attack_probability[None, :]
        )

        direct_active = active.copy()

        node_direct_attack_counts += (
            direct_active.sum(
                axis=0,
                dtype=np.int64,
            )
        )

        # --------------------------------------------------------------
        # Graph-based cascading compromise.
        # --------------------------------------------------------------
        _propagate_cascades(
            active=active,
            edges=edges,
            rng=rng,
        )

        node_activation_counts += (
            active.sum(
                axis=0,
                dtype=np.int64,
            )
        )

        # --------------------------------------------------------------
        # Calculate every simulation's enterprise loss.
        #
        # Matrix multiplication performs:
        #
        #   active[node] × SLE[node]
        #
        # for all simulations simultaneously.
        # --------------------------------------------------------------
        batch_losses = active @ node_sle

        portfolio_losses[
            cursor:cursor + current_batch
        ] = batch_losses

        # --------------------------------------------------------------
        # Aggregate per-vulnerability monetary contribution.
        # --------------------------------------------------------------
        node_total_losses += active.T @ np.ones(
            current_batch,
            dtype=np.float64,
        ) * node_sle

        # The expression above is equivalent to:
        #
        #   active.sum(axis=0) * node_sle
        #
        # but we use the simpler/faster representation below.
        node_total_losses -= (
            active.sum(
                axis=0,
                dtype=np.float64,
            ) * node_sle
        )

        # Re-add using the actual activation counts accumulated above.
        #
        # This keeps the calculation explicit and avoids retaining the
        # batch matrix after this iteration.
        node_total_losses += (
            active.sum(
                axis=0,
                dtype=np.float64,
            ) * node_sle
        )

        cursor += current_batch

    # ------------------------------------------------------------------
    # Enterprise statistics
    # ------------------------------------------------------------------

    mean_ale = float(
        np.mean(portfolio_losses)
    )

    p95_var = float(
        np.percentile(
            portfolio_losses,
            95,
        )
    )

    p99_var = float(
        np.percentile(
            portfolio_losses,
            99,
        )
    )

    zero_loss_probability = float(
        np.mean(
            portfolio_losses == 0.0
        )
    )

    # ------------------------------------------------------------------
    # Per-vulnerability monetary risk
    # ------------------------------------------------------------------

    expected_node_loss = (
        node_total_losses
        / float(iterations)
    )

    node_risk: List[dict] = []

    for index, node in enumerate(nodes):
        direct_rate = (
            node_direct_attack_counts[index]
            / float(iterations)
        )

        activation_rate = (
            node_activation_counts[index]
            / float(iterations)
        )

        node_risk.append(
            {
                "graph_key": node_keys[index],
                "cve_id": node.cve_id,
                "asset_id": node.asset_id,
                "severity": node.severity,
                "cvss_score": round(
                    float(node.base_score),
                    2,
                ),
                "single_loss_expectancy_lakhs": round(
                    float(node_sle[index]),
                    4,
                ),
                "expected_annual_loss_lakhs": round(
                    float(expected_node_loss[index]),
                    4,
                ),
                "direct_attack_probability": round(
                    float(attack_probability[index]),
                    4,
                ),
                "simulated_direct_attack_rate": round(
                    direct_rate,
                    6,
                ),
                "simulated_activation_rate": round(
                    activation_rate,
                    6,
                ),
                "is_exploited": bool(
                    node.is_exploited
                ),
                "is_toxic_combination": bool(
                    node.is_toxic_combination
                ),
            }
        )

    node_risk.sort(
        key=lambda item: item[
            "expected_annual_loss_lakhs"
        ],
        reverse=True,
    )

    # Portfolio share is based on the sum of node expected losses.
    total_node_risk = sum(
        item["expected_annual_loss_lakhs"]
        for item in node_risk
    )

    for item in node_risk:
        item["portfolio_risk_share_percent"] = (
            round(
                (
                    item["expected_annual_loss_lakhs"]
                    / total_node_risk
                )
                * 100.0,
                4,
            )
            if total_node_risk > 0
            else 0.0
        )

    result = {
        "mean_ale_lakhs": round(
            mean_ale,
            2,
        ),
        "p95_var_lakhs": round(
            p95_var,
            2,
        ),
        "p99_var_lakhs": round(
            p99_var,
            2,
        ),
        "zero_loss_probability": round(
            zero_loss_probability,
            4,
        ),
        "iterations": iterations,
        "node_count": node_count,
        "cascade_edges": len(edges),
        "node_risk": node_risk,
    }

    logger.info(
        "Monte Carlo complete: ALE=₹%.2fL P95=₹%.2fL P99=₹%.2fL",
        result["mean_ale_lakhs"],
        result["p95_var_lakhs"],
        result["p99_var_lakhs"],
    )

    return result
