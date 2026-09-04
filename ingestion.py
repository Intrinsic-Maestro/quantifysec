"""
ingestion.py — Data ingestion pipeline for QuantifySec.

Reads the generator's output files (synthetic_assets.json,
synthetic_combined.json), sanitizes and validates each record against
models.py, derives fields the generator doesn't provide directly
(exploit_status), and produces clean, typed records ready to be written
to Supabase.

Pipeline order per record:
    sanitize -> validate (Pydantic) -> [on success] derive -> collect
                                     -> [on failure] log to errors, skip

Errors never stop the batch — one bad record is logged and skipped so
the rest of the upload still succeeds (see project decision: skip-and-log).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from models import (
    AssetRecord,
    CombinedFindingRecord,
    ExploitStatus,
    VulnerabilityRecord,
)


# ══════════════════════════════════════════════════════════════════════
# SANITIZATION  (runs BEFORE validation — formatting only, never rejects)
# ══════════════════════════════════════════════════════════════════════

def sanitize_row(raw: dict) -> dict:
    """
    Light, recursive cleanup: trims whitespace on every string value,
    including nested dicts (cve, affected_asset, loss_parameters).
    Never raises — malformed *structure* is caught later by Pydantic.
    """
    def clean(value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        if isinstance(value, dict):
            return {k: clean(v) for k, v in value.items()}
        if isinstance(value, list):
            return [clean(v) for v in value]
        return value

    return clean(raw)


# ══════════════════════════════════════════════════════════════════════
# DERIVATION  (runs AFTER validation — exploit_status doesn't exist in
# the source data, so we build it from kev_listed + known_ransomware_use)
# ══════════════════════════════════════════════════════════════════════

def derive_exploit_status(kev_listed: bool, known_ransomware_use: str) -> ExploitStatus:
    """
    Mapping agreed as a team decision:
      not KEV-listed                          -> NONE
      KEV-listed, ransomware use "Unknown"     -> KNOWN
      KEV-listed, ransomware use "Known"       -> ACTIVE
    """
    if not kev_listed:
        return ExploitStatus.NONE
    if known_ransomware_use == "Known":
        return ExploitStatus.ACTIVE
    return ExploitStatus.KNOWN


# ══════════════════════════════════════════════════════════════════════
# ASSET INGESTION  (source: synthetic_assets.json)
# ══════════════════════════════════════════════════════════════════════

def ingest_assets(raw_records: list[dict]) -> dict:
    """
    Validates each raw asset dict against AssetRecord.
    Returns {"valid": [AssetRecord, ...], "errors": [...]}.
    """
    valid_records: list[AssetRecord] = []
    errors: list[dict] = []

    for i, raw in enumerate(raw_records):
        try:
            cleaned = sanitize_row(raw)
            record = AssetRecord(**cleaned)
            valid_records.append(record)
        except ValidationError as e:
            errors.append({"row": i, "reason": e.errors(), "raw": raw})

    return {"valid": valid_records, "errors": errors}


# ══════════════════════════════════════════════════════════════════════
# COMBINED FINDING INGESTION  (source: synthetic_combined.json)
# This is the primary path -> produces VulnerabilityRecord objects.
# ══════════════════════════════════════════════════════════════════════

def ingest_vulnerabilities(raw_records: list[dict]) -> dict:
    """
    Validates each raw combined-finding dict against CombinedFindingRecord,
    then derives exploit_status and builds a clean VulnerabilityRecord.

    Returns:
        {
            "valid": [VulnerabilityRecord, ...],
            "errors": [{"row": i, "reason": ..., "raw": ...}, ...]
        }
    """
    valid_records: list[VulnerabilityRecord] = []
    errors: list[dict] = []

    for i, raw in enumerate(raw_records):
        try:
            cleaned = sanitize_row(raw)
            finding = CombinedFindingRecord(**cleaned)

            exploit_status = derive_exploit_status(
                kev_listed=finding.kev_listed,
                known_ransomware_use=finding.known_ransomware_use.value,
            )

            vuln = VulnerabilityRecord(
                id=finding.finding_uid,
                asset_id=finding.affected_asset.uid,
                cve_id=finding.cve.uid,
                cvss_score=finding.cve.cvss.base_score,
                exploit_status=exploit_status,
                affected_component=finding.affected_asset.company_name,
            )
            valid_records.append(vuln)

        except ValidationError as e:
            errors.append({"row": i, "reason": e.errors(), "raw": raw})
        except Exception as e:
            # Catches anything unexpected in the derivation step itself,
            # so one weird record can't crash the whole batch.
            errors.append({"row": i, "reason": str(e), "raw": raw})

    return {"valid": valid_records, "errors": errors}


# ══════════════════════════════════════════════════════════════════════
# CVE -> ASSET INDEX  (runs only on already-validated data)
# ══════════════════════════════════════════════════════════════════════

def build_cve_asset_index(valid_records: list[VulnerabilityRecord]) -> dict[str, list[str]]:
    """Maps each CVE ID to the list of asset IDs it affects."""
    index: dict[str, list[str]] = {}
    for record in valid_records:
        index.setdefault(record.cve_id, []).append(record.asset_id)
    return index


# ══════════════════════════════════════════════════════════════════════
# FILE LOADING HELPERS
# ══════════════════════════════════════════════════════════════════════

def load_json_file(path: str | Path) -> list[dict]:
    """
    Reads a JSON file from disk. Raises a clear error for totally
    corrupt/malformed files -- this is a SEPARATE failure mode from a
    single bad record inside an otherwise-valid file, so it's not
    part of the per-record skip-and-log loop above.
    """
    path = Path(path)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)  # raises json.JSONDecodeError if file is corrupt

    if not isinstance(data, list):
        raise ValueError(f"Expected a JSON array of records in {path}, got {type(data).__name__}")

    return data


# ══════════════════════════════════════════════════════════════════════
# MAIN — run standalone to sanity-check ingestion against real output
# ══════════════════════════════════════════════════════════════════════

def run(assets_path: str, combined_path: str) -> None:
    print(f"Loading assets from {assets_path} ...")
    try:
        raw_assets = load_json_file(assets_path)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"  FATAL: could not read assets file — {e}")
        return

    asset_result = ingest_assets(raw_assets)
    print(f"  Assets ingested: {len(asset_result['valid'])}  "
          f"skipped: {len(asset_result['errors'])}")

    print(f"\nLoading combined findings from {combined_path} ...")
    try:
        raw_findings = load_json_file(combined_path)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"  FATAL: could not read combined findings file — {e}")
        return

    vuln_result = ingest_vulnerabilities(raw_findings)
    print(f"  Vulnerabilities ingested: {len(vuln_result['valid'])}  "
          f"skipped: {len(vuln_result['errors'])}")

    if vuln_result["errors"]:
        print("\n  First few errors:")
        for err in vuln_result["errors"][:3]:
            print(f"    row {err['row']}: {err['reason']}")

    index = build_cve_asset_index(vuln_result["valid"])
    print(f"\n  CVE -> asset index built: {len(index)} unique CVEs")


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Usage: python ingestion.py <path_to_synthetic_assets.json> <path_to_synthetic_combined.json>")
        sys.exit(1)

    run(sys.argv[1], sys.argv[2])