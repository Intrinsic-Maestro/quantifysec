from __future__ import annotations

import json
from pathlib import Path
from typing import Iterator


def load_json_source(filepath: str):
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Missing required ingestion file: {filepath}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def iter_jsonl(filepath: str) -> Iterator[dict]:
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Missing required ingestion file: {filepath}")
    with path.open("r", encoding="utf-8") as f:
        for line_number, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                value = json.loads(line)
                if isinstance(value, dict):
                    yield value
            except json.JSONDecodeError:
                continue