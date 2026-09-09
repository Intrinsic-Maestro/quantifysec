"""
Data Ingestion Module
Handles loading, validation, and graph-building for CTEM telemetry.
"""

from .pipeline import run_ingestion_pipeline
from .schemas import VulnerabilityNode, AssetBusinessContext, FinancialParameters

# Define what gets exported when someone uses `from data_ingestion import *`
__all__ = [
    "run_ingestion_pipeline",
    "VulnerabilityNode",
    "AssetBusinessContext",
    "FinancialParameters"
]