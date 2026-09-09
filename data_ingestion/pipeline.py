from __future__ import annotations

from .loaders import load_json_source, iter_jsonl
from .schemas import AssetBusinessContext, FinancialParameters
from .graph_builder import parse_ocsf_to_graph


def run_ingestion_pipeline(ocsf_path: str, context_path: str, finance_path: str, interactions_path: str | None = None) -> dict:
    """Compatibility wrapper for the original ingestion API.

    The four-file production path does not require a toxic-combination file.
    Toxic flags are derived by graph_builder when the fourth file is absent.
    """
    raw_context = load_json_source(context_path)
    raw_finance = load_json_source(finance_path)
    assets = [AssetBusinessContext(**item) for item in raw_context]
    finance = FinancialParameters(**raw_finance)
    toxic = load_json_source(interactions_path) if interactions_path else {}
    graph = parse_ocsf_to_graph(iter_jsonl(ocsf_path), assets, toxic)
    return {"security_graph": graph, "asset_financials": assets, "global_constraints": finance}
