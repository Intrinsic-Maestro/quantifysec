"""
models.py — Pydantic validation models for the QuantifySec ingestion layer.

These models define what "correct" data looks like for two of the
generator's outputs:

  1. synthetic_assets.json    -> AssetRecord
  2. synthetic_combined.json  -> CombinedFindingRecord (asset + CVE + loss,
                                  already joined per record)

No logic lives here — only shape, types, and light per-field sanitization
via @field_validator. Heavier pipeline logic (skip-and-log looping,
exploit_status derivation, CVE-asset indexing) belongs in ingestion.py.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ══════════════════════════════════════════════════════════════════════
# ENUMS
# ══════════════════════════════════════════════════════════════════════

class ExploitStatus(str, Enum):
    """
    Not present directly in the generator's output. Derived at ingestion
    time from `kev_listed` + `known_ransomware_use` (see ingestion.py).
    Kept here so risk_engine.py has one canonical enum to depend on.
    """
    NONE = "none"
    KNOWN = "known"
    ACTIVE = "active"


class RansomwareUse(str, Enum):
    """Mirrors CISA KEV's known_ransomware_use field values."""
    KNOWN = "Known"
    UNKNOWN = "Unknown"


# ══════════════════════════════════════════════════════════════════════
# ASSET MODEL  (source: synthetic_assets.json)
# ══════════════════════════════════════════════════════════════════════

class LossParameters(BaseModel):
    """Lognormal loss-distribution parameters, IBM Cost of a Data
    Breach Report 2025-derived. Real, usable data — don't discard it."""
    distribution: str = "lognormal"
    mu: float
    sigma: float = Field(gt=0)
    mean_inr_millions: float = Field(gt=0)
    # Optional: present on the asset-level loss_parameters (synthetic_assets.json)
    # but genuinely absent on the per-finding loss_parameters embedded in
    # synthetic_combined.json — confirmed against real generator output.
    cv: Optional[float] = Field(default=None, gt=0)
    benchmark_source: Optional[str] = None
    # Only present on combined-record loss_parameters, not on the
    # standalone asset file — optional here so one model covers both.
    sampled_loss_inr: Optional[float] = Field(default=None, ge=0)


class AssetRecord(BaseModel):
    """Matches one record in synthetic_assets.json."""
    uid: str                                   # generator's id field (not "id")
    company_name: str
    nse_symbol: str
    sector: str
    industry: str
    type: str
    criticality: int = Field(ge=1, le=5)       # already 1-5 int, matches our constraint
    internet_facing: bool
    annual_revenue_dependency_inr: int = Field(ge=0)
    loss_parameters: LossParameters
    market_cap_inr: Optional[int] = Field(default=None, ge=0)

    @field_validator("uid", "nse_symbol", "sector", "industry", "type", "company_name")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        return v.strip()


# ══════════════════════════════════════════════════════════════════════
# COMBINED FINDING MODEL  (source: synthetic_combined.json)
# ══════════════════════════════════════════════════════════════════════

class CVSSBlock(BaseModel):
    version: str
    base_score: float = Field(ge=0, le=10)
    severity: str
    vector_string: str = ""


class CVEBlock(BaseModel):
    uid: str                                    # e.g. "CVE-2024-1234"
    cvss: CVSSBlock
    description: str = ""
    cwe: Optional[str] = None
    published: str = ""

    @field_validator("uid")
    @classmethod
    def normalize_cve_id(cls, v: str) -> str:
        return v.strip().upper()


class AffectedAsset(BaseModel):
    """Trimmed asset view embedded inside each combined finding."""
    uid: str
    company_name: str
    sector: str
    criticality: int = Field(ge=1, le=5)
    internet_facing: bool
    annual_revenue_dependency_inr: int = Field(ge=0)


class CombinedFindingRecord(BaseModel):
    """Matches one record in synthetic_combined.json — the primary
    file the ingestion pipeline should validate against."""
    class_uid: int
    finding_uid: str
    cve: CVEBlock
    kev_listed: bool
    known_ransomware_use: RansomwareUse
    affected_asset: AffectedAsset
    loss_parameters: LossParameters
    time: str

    # exploit_status is NOT a field the generator provides directly.
    # It's derived in ingestion.py from kev_listed + known_ransomware_use
    # and attached to the internal VulnerabilityRecord below — kept out
    # of this model since this model's job is only to validate what the
    # generator actually sent us, not to invent fields it didn't send.


# ══════════════════════════════════════════════════════════════════════
# INTERNAL VULNERABILITY RECORD  (post-derivation, what risk_engine.py
# and the vulnerabilities table actually consume)
# ══════════════════════════════════════════════════════════════════════

class VulnerabilityRecord(BaseModel):
    """
    The clean, canonical shape written to the `vulnerabilities` table.
    Built in ingestion.py from a validated CombinedFindingRecord after
    exploit_status has been derived — not populated directly from raw
    JSON, since exploit_status doesn't exist in the source data.
    """
    id: str                      # = finding_uid
    asset_id: str                # = affected_asset.uid
    cve_id: str                  # = cve.uid
    cvss_score: float = Field(ge=0, le=10)
    exploit_status: ExploitStatus
    affected_component: Optional[str] = None