import logging
from .loaders import load_json_source
from .schemas import AssetBusinessContext, FinancialParameters
from .graph_builder import parse_ocsf_to_graph

logger = logging.getLogger(__name__)

def run_ingestion_pipeline(
    ocsf_path: str, 
    context_path: str, 
    finance_path: str,
    interactions_path: str
) -> dict:
    """
    Executes the full ingestion workflow and returns the unified state 
    ready for the Monte Carlo Engine.
    """
    logger.info("Starting CTEM Ingestion Pipeline...")

    # 1. Load Raw Data
    raw_ocsf = load_json_source(ocsf_path)
    raw_context = load_json_source(context_path)
    raw_finance = load_json_source(finance_path)
    raw_interactions = load_json_source(interactions_path) # e.g., {"CVE-2024-1234": True}

    # 2. Validate and Parse Business/Financial Context via Pydantic
    asset_contexts = [AssetBusinessContext(**item) for item in raw_context]
    financial_params = FinancialParameters(**raw_finance)

    # 3. Build the Security Graph
    security_graph = parse_ocsf_to_graph(raw_ocsf, asset_contexts, raw_interactions)

    logger.info(f"Ingestion Complete: {len(security_graph)} interactive nodes mapped.")

    # 4. Return the consolidated payload
    return {
        "security_graph": security_graph,           # Goes to Monte Carlo
        "asset_financials": asset_contexts,         # Goes to Monte Carlo SLE formula
        "global_constraints": financial_params      # Goes straight to PSO Solver
    }