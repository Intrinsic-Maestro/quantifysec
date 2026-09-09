import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def load_json_source(filepath: str) -> dict:
    """Safely loads a JSON file from disk."""
    path = Path(filepath)
    if not path.exists():
        logger.error(f"Source file missing: {filepath}")
        raise FileNotFoundError(f"Missing required ingestion file: {filepath}")
    
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)