#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════╗
║  QuantifySec — Synthetic Cyber-Risk Data Generator                  ║
║  Smart India Hackathon 2026 (SIH26105) · Team Cogitare              ║
╠══════════════════════════════════════════════════════════════════════╣
║  Generates realistic, defensible synthetic data across three        ║
║  linked layers:                                                     ║
║    Layer 1  Real CVEs (NVD API) + CISA KEV cross-reference          ║
║    Layer 2  Real Indian companies (NSE Nifty 500) + Yahoo Finance   ║
║    Layer 3  Loss parameters (IBM Cost of a Data Breach 2025)        ║
║                                                                     ║
║  Output: OCSF-compliant JSON files for the Data Ingestion module.   ║
╚══════════════════════════════════════════════════════════════════════╝

Usage
─────
    pip install -r requirements.txt
    python generate_synthetic_data.py
    python generate_synthetic_data.py --cve-count 400 --company-count 250
    python generate_synthetic_data.py --skip-yfinance --seed 42
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import os
import random
import sys
import time
import uuid
from collections import Counter
from datetime import datetime, timedelta, timezone
from io import StringIO
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
import pandas as pd
import requests

# Optional: yfinance for market-cap / revenue enrichment
try:
    import yfinance as yf

    HAS_YFINANCE = True
except ImportError:
    HAS_YFINANCE = False


# ════════════════════════════════════════════════════════════════════════
# CONFIGURATION & CONSTANTS
# ════════════════════════════════════════════════════════════════════════

# ── API Endpoints (all free, no auth) ──────────────────────────────────
NVD_API_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0"
CISA_KEV_URL = (
    "https://www.cisa.gov/sites/default/files/feeds/"
    "known_exploited_vulnerabilities.json"
)
CISA_KEV_MIRROR = (
    "https://raw.githubusercontent.com/cisagov/"
    "kev-data/main/known_exploited_vulnerabilities.json"
)
NIFTY500_CSV_URL = (
    "https://www.niftyindices.com/IndexConstituent/ind_nifty500list.csv"
)

# NVD unauthenticated rate limit: 5 requests / 30 s → sleep ≥ 6 s
NVD_RATE_LIMIT_SLEEP = 6.5

# ── Realistic severity distribution (real-world vuln data is skewed) ──
SEVERITY_DISTRIBUTION: Dict[str, float] = {
    "LOW": 0.15,
    "MEDIUM": 0.45,
    "HIGH": 0.30,
    "CRITICAL": 0.10,
}

# OCSF severity_id enum
OCSF_SEVERITY_ID: Dict[str, int] = {
    "LOW": 2,
    "MEDIUM": 3,
    "HIGH": 4,
    "CRITICAL": 5,
}

# ── NSE Industry → Broad Sector mapping ───────────────────────────────
INDUSTRY_TO_SECTOR: Dict[str, str] = {
    # BFSI
    "Financial Services": "BFSI",
    "Banks": "BFSI",
    "Insurance": "BFSI",
    "Finance": "BFSI",
    "Financial Technology (Fintech)": "BFSI",
    # Healthcare
    "Pharmaceuticals": "Healthcare",
    "Healthcare Services": "Healthcare",
    "Pharmaceuticals & Biotechnology": "Healthcare",
    "Healthcare": "Healthcare",
    "Biotechnology": "Healthcare",
    "Healthcare Equipment & Supplies": "Healthcare",
    # IT & Technology
    "IT Services & Consulting": "IT & Technology",
    "IT - Software": "IT & Technology",
    "IT - Services": "IT & Technology",
    "Software": "IT & Technology",
    "Internet Services & Ecommerce": "IT & Technology",
    "Information Technology": "IT & Technology",
    "IT": "IT & Technology",
    "Ecommerce": "IT & Technology",
    # Energy & Utilities
    "Oil & Gas": "Energy & Utilities",
    "Oil Gas & Consumable Fuels": "Energy & Utilities",
    "Power": "Energy & Utilities",
    "Gas & Petroleum": "Energy & Utilities",
    "Utilities": "Energy & Utilities",
    "Electric Utilities": "Energy & Utilities",
    "Gas Utilities": "Energy & Utilities",
    "Renewable Energy": "Energy & Utilities",
    # Telecom & Media
    "Telecom Services": "Telecom & Media",
    "Telecommunication": "Telecom & Media",
    "Media": "Telecom & Media",
    "Media & Entertainment": "Telecom & Media",
    "Entertainment": "Telecom & Media",
    # Manufacturing
    "Industrial Manufacturing": "Manufacturing",
    "Auto Components": "Manufacturing",
    "Automobile and Auto Components": "Manufacturing",
    "Automobiles": "Manufacturing",
    "Chemicals": "Manufacturing",
    "Metals & Mining": "Manufacturing",
    "Metals": "Manufacturing",
    "Mining": "Manufacturing",
    "Iron & Steel": "Manufacturing",
    "Non-Ferrous Metals": "Manufacturing",
    "Fertilizers": "Manufacturing",
    "Fertilizers & Agrochemicals": "Manufacturing",
    "Textiles": "Manufacturing",
    "Aerospace & Defense": "Manufacturing",
    "Capital Goods": "Manufacturing",
    "Forest Materials": "Manufacturing",
    "Paper": "Manufacturing",
    "Diversified Metals": "Manufacturing",
    # Consumer & Retail
    "FMCG": "Consumer & Retail",
    "Fast Moving Consumer Goods": "Consumer & Retail",
    "Consumer Durables": "Consumer & Retail",
    "Consumer Services": "Consumer & Retail",
    "Retailing": "Consumer & Retail",
    "Food & Beverages": "Consumer & Retail",
    "Beverages": "Consumer & Retail",
    "Food Products": "Consumer & Retail",
    "Personal Products": "Consumer & Retail",
    "Household Products": "Consumer & Retail",
    "Household & Personal Products": "Consumer & Retail",
    "Tobacco": "Consumer & Retail",
    "Leisure Services": "Consumer & Retail",
    "Hotels Restaurants & Tourism": "Consumer & Retail",
    "Diversified": "Consumer & Retail",
    "Agricultural Food & other Products": "Consumer & Retail",
    # Infrastructure & Real Estate
    "Construction": "Infrastructure & Real Estate",
    "Real Estate": "Infrastructure & Real Estate",
    "Realty": "Infrastructure & Real Estate",
    "Cement & Cement Products": "Infrastructure & Real Estate",
    "Cement": "Infrastructure & Real Estate",
    "Construction Materials": "Infrastructure & Real Estate",
    "Transport Services": "Infrastructure & Real Estate",
    "Transport Infrastructure": "Infrastructure & Real Estate",
    "Services": "Infrastructure & Real Estate",
    "Logistics": "Infrastructure & Real Estate",
    "Agricultural, Commercial & Dwelling": "Infrastructure & Real Estate",
}

# ── Sector → Criticality (1–5) ────────────────────────────────────────
# Justification:  BFSI and Healthcare handle PII / PHI / financial data
# subject to strict regulations (RBI, SEBI, DPDP Act, HIPAA-equivalent),
# making their assets the highest-value targets.  IT companies host
# critical infrastructure for downstream clients.  Manufacturing and
# Consumer sectors have lower regulatory exposure and data sensitivity.
SECTOR_CRITICALITY: Dict[str, int] = {
    "BFSI": 5,
    "Healthcare": 5,
    "IT & Technology": 4,
    "Energy & Utilities": 4,
    "Telecom & Media": 4,
    "Manufacturing": 3,
    "Consumer & Retail": 3,
    "Infrastructure & Real Estate": 2,
}

# ── Sector → Representative asset types ───────────────────────────────
SECTOR_ASSET_TYPES: Dict[str, List[str]] = {
    "BFSI": [
        "Core Banking System",
        "Payment Gateway",
        "Trading Platform",
        "Fraud Detection Engine",
        "Customer KYC Database",
        "Mobile Banking Application Server",
        "SWIFT Messaging Gateway",
    ],
    "Healthcare": [
        "Electronic Health Records (EHR) System",
        "Clinical Trial Database",
        "PACS Imaging System",
        "Hospital Information System",
        "Pharmacy Management System",
        "Patient Portal Server",
    ],
    "IT & Technology": [
        "Cloud Infrastructure Platform",
        "CI/CD Pipeline Server",
        "SaaS Application Server",
        "Customer Data Lake",
        "API Gateway",
        "Container Orchestration Cluster",
    ],
    "Energy & Utilities": [
        "SCADA/ICS Control System",
        "Grid Management Platform",
        "Pipeline Monitoring System",
        "Energy Trading Platform",
        "Smart Meter Data Collector",
    ],
    "Telecom & Media": [
        "Billing & Revenue Assurance System",
        "Network Management Platform",
        "Subscriber Database",
        "Content Delivery Network Controller",
        "VoLTE/IMS Core Server",
    ],
    "Manufacturing": [
        "ERP System (SAP/Oracle)",
        "Supply Chain Management Platform",
        "MES (Manufacturing Execution System)",
        "Quality Control System",
        "Industrial IoT Gateway",
        "Warehouse Management System",
    ],
    "Consumer & Retail": [
        "E-commerce Platform",
        "Point-of-Sale Network",
        "CRM System",
        "Inventory Management System",
        "Customer Loyalty Database",
        "Digital Marketing Platform",
    ],
    "Infrastructure & Real Estate": [
        "Project Management System",
        "Building Management System (BMS)",
        "Procurement Portal",
        "Fleet Management System",
        "Property Listing Database",
    ],
}

# ── Sector → Finding weight (higher = more CVEs assigned) ─────────────
SECTOR_FINDING_WEIGHT: Dict[str, float] = {
    "BFSI": 3.0,
    "Healthcare": 2.5,
    "IT & Technology": 2.0,
    "Energy & Utilities": 1.8,
    "Telecom & Media": 1.5,
    "Manufacturing": 1.2,
    "Consumer & Retail": 1.0,
    "Infrastructure & Real Estate": 0.8,
}

# ── Sector → internet-facing probability ──────────────────────────────
SECTOR_INTERNET_FACING_PROB: Dict[str, float] = {
    "BFSI": 0.70,
    "Healthcare": 0.50,
    "IT & Technology": 0.80,
    "Energy & Utilities": 0.30,
    "Telecom & Media": 0.65,
    "Manufacturing": 0.35,
    "Consumer & Retail": 0.60,
    "Infrastructure & Real Estate": 0.40,
}

# ── Loss magnitude (IBM Cost of a Data Breach Report 2025) ────────────
# Citation:
#   IBM / Ponemon Institute, "Cost of a Data Breach Report 2025:
#   The AI Oversight Gap"
#   • India overall average:        INR 220 Million (₹22.0 Crore)
#   • India Financial Sector avg:   INR 409 Million (₹40.9 Crore)
#   • Source: https://www.ibm.com/reports/data-breach
#
# Lognormal parameterisation:
#   CV = 1.5  (standard in Open FAIR cyber-risk literature)
#   σ  = √ln(1 + CV²) ≈ 1.0857
#   μ  = ln(M) − σ²/2       where M = sector mean in INR
CV = 1.5
SIGMA = math.sqrt(math.log(1 + CV ** 2))  # ≈ 1.0857

SECTOR_LOSS_MEAN_INR_MILLIONS: Dict[str, int] = {
    "BFSI": 409,             # IBM 2025 India Financial Sector (exact)
    "Healthcare": 350,       # Scaled from global healthcare premium
    "IT & Technology": 300,
    "Energy & Utilities": 280,
    "Telecom & Media": 260,
    "Manufacturing": 220,    # IBM 2025 India Overall Average (exact)
    "Consumer & Retail": 200,
    "Infrastructure & Real Estate": 180,
}

# ── Revenue dependency factor (asset's share of company revenue) ──────
SECTOR_REVENUE_DEPENDENCY_FACTOR: Dict[str, Tuple[float, float]] = {
    "BFSI": (0.10, 0.25),
    "Healthcare": (0.08, 0.20),
    "IT & Technology": (0.15, 0.30),
    "Energy & Utilities": (0.05, 0.15),
    "Telecom & Media": (0.10, 0.20),
    "Manufacturing": (0.05, 0.12),
    "Consumer & Retail": (0.08, 0.18),
    "Infrastructure & Real Estate": (0.03, 0.10),
}

# ── Fallback revenue (INR) when yfinance is unavailable ───────────────
SECTOR_FALLBACK_REVENUE_INR: Dict[str, int] = {
    "BFSI": 50_00_00_000,
    "Healthcare": 30_00_00_000,
    "IT & Technology": 40_00_00_000,
    "Energy & Utilities": 60_00_00_000,
    "Telecom & Media": 35_00_00_000,
    "Manufacturing": 25_00_00_000,
    "Consumer & Retail": 20_00_00_000,
    "Infrastructure & Real Estate": 15_00_00_000,
}

HTTP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/126.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}


# ════════════════════════════════════════════════════════════════════════
# LOGGING
# ════════════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("quantifysec")


# ════════════════════════════════════════════════════════════════════════
# COMPONENT 1 — CISA KEV LOADER
# ════════════════════════════════════════════════════════════════════════

def fetch_kev_data() -> Dict[str, Dict]:
    """
    Download the full CISA Known Exploited Vulnerabilities catalog.
    Returns a dict keyed by CVE ID for O(1) lookups.
    """
    log.info("▸ Fetching CISA KEV catalog …")

    for url in [CISA_KEV_URL, CISA_KEV_MIRROR]:
        try:
            resp = requests.get(url, headers=HTTP_HEADERS, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            vulns = data.get("vulnerabilities", [])
            kev_lookup: Dict[str, Dict] = {v["cveID"]: v for v in vulns}
            log.info(
                f"  ✓ Loaded {len(kev_lookup)} KEV entries "
                f"(catalog v{data.get('catalogVersion', '?')})"
            )
            return kev_lookup
        except Exception as exc:
            log.warning(f"  ✗ {url.split('/')[2]}: {exc}")

    log.error("  ✗ Could not fetch KEV from any source — continuing without it.")
    return {}


# ════════════════════════════════════════════════════════════════════════
# COMPONENT 2 — NVD CVE FETCHER
# ════════════════════════════════════════════════════════════════════════

def _query_nvd_band(
    severity: str,
    count: int,
    cvss_version: str,
    kev_lookup: Dict[str, Dict],
    start_index: int = 0,
) -> List[Dict]:
    """Fetch one page of CVEs from NVD for a given severity band."""
    per_page = min(count, 2000)

    # Build the URL manually so `noRejected` appears as a bare flag
    # (NVD expects `&noRejected` not `&noRejected=`)
    if cvss_version == "V4":
        sev_param = f"cvssV4Severity={severity}"
    else:
        sev_param = f"cvssV3Severity={severity}"

    url = (
        f"{NVD_API_BASE}"
        f"?resultsPerPage={per_page}"
        f"&startIndex={start_index}"
        f"&{sev_param}"
        f"&noRejected"
    )

    try:
        resp = requests.get(url, headers=HTTP_HEADERS, timeout=120)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        log.warning(f"    NVD query failed ({severity}/{cvss_version}): {exc}")
        return []

    results: List[Dict] = []
    for vuln_wrapper in data.get("vulnerabilities", []):
        cve_obj = vuln_wrapper.get("cve", {})

        if cve_obj.get("vulnStatus") == "Rejected":
            continue

        cve_id = cve_obj.get("id", "")
        if not cve_id:
            continue

        # ── Extract CVSS score (prefer v4.0, fall back to v3.1) ──
        metrics = cve_obj.get("metrics", {})
        cvss_score: Optional[float] = None
        cvss_vector: str = ""
        cvss_sev: str = severity
        cvss_ver: str = ""

        for metric_key, ver_label in [
            ("cvssMetricV40", "4.0"),
            ("cvssMetricV31", "3.1"),
        ]:
            entries = metrics.get(metric_key, [])
            if entries:
                cd = entries[0].get("cvssData", {})
                cvss_score = cd.get("baseScore")
                cvss_vector = cd.get("vectorString", "")
                cvss_sev = cd.get("baseSeverity", severity)
                cvss_ver = ver_label
                break

        if cvss_score is None:
            continue

        # ── English description ──
        desc_en = ""
        for d in cve_obj.get("descriptions", []):
            if d.get("lang") == "en":
                desc_en = d.get("value", "")
                break

        # ── CWE ──
        cwe_id: Optional[str] = None
        for weakness in cve_obj.get("weaknesses", []):
            for wd in weakness.get("description", []):
                val = wd.get("value", "")
                if val.startswith("CWE-"):
                    cwe_id = val
                    break
            if cwe_id:
                break

        # ── KEV cross-reference ──
        kev_entry = kev_lookup.get(cve_id)
        is_kev = kev_entry is not None
        ransomware_use = (
            kev_entry.get("knownRansomwareCampaignUse", "Unknown")
            if kev_entry
            else "Unknown"
        )

        results.append(
            {
                "cve_id": cve_id,
                "cvss_version": cvss_ver,
                "cvss_base_score": cvss_score,
                "cvss_severity": cvss_sev.upper() if cvss_sev else severity,
                "cvss_vector_string": cvss_vector,
                "description": desc_en,
                "cwe_id": cwe_id,
                "published": cve_obj.get("published", ""),
                "kev_listed": is_kev,
                "known_ransomware_use": ransomware_use,
                "kev_vendor": kev_entry.get("vendorProject", "") if kev_entry else "",
                "kev_product": kev_entry.get("product", "") if kev_entry else "",
            }
        )

    return results


def fetch_nvd_cves(
    target_count: int,
    kev_lookup: Dict[str, Dict],
    rng: random.Random,
) -> List[Dict]:
    """
    Fetch real CVEs from NVD grouped by severity band so the final
    distribution is realistic (mostly medium, small critical tail).
    Falls back to CVSS v3.1 when v4.0 results are insufficient.
    """
    log.info(f"▸ Fetching ~{target_count} real CVEs from NVD API …")

    all_cves: List[Dict] = []
    seen_ids: Set[str] = set()

    for severity, fraction in SEVERITY_DISTRIBUTION.items():
        band_target = max(10, int(target_count * fraction))
        fetch_count = min(band_target * 3, 2000)

        log.info(
            f"  [{severity:>8}]  target {band_target}  "
            f"(fetching up to {fetch_count} for sampling) …"
        )

        # ── Primary: CVSS v4.0 ──
        band_cves = _query_nvd_band(severity, fetch_count, "V4", kev_lookup)
        band_cves = [c for c in band_cves if c["cve_id"] not in seen_ids]

        # ── Fallback: CVSS v3.1 if v4.0 is short ──
        if len(band_cves) < band_target:
            shortfall = band_target - len(band_cves)
            log.info(
                f"    ↳ Only {len(band_cves)} v4.0 results — "
                f"backfilling {shortfall} from CVSS v3.1 …"
            )
            time.sleep(NVD_RATE_LIMIT_SLEEP)

            # Try multiple pages with different startIndex offsets to
            # collect enough results (LOW band is often sparse on page 0)
            existing = {c["cve_id"] for c in band_cves} | seen_ids
            max_pages = 3
            for page in range(max_pages):
                if len(band_cves) >= band_target:
                    break
                offset = page * 2000
                v3_cves = _query_nvd_band(
                    severity, 2000, "V3", kev_lookup, start_index=offset
                )
                v3_cves = [c for c in v3_cves if c["cve_id"] not in existing]
                existing.update(c["cve_id"] for c in v3_cves)
                band_cves.extend(v3_cves)
                if page < max_pages - 1 and len(band_cves) < band_target:
                    time.sleep(NVD_RATE_LIMIT_SLEEP)

        # ── Sample down to target ──
        if len(band_cves) > band_target:
            band_cves = rng.sample(band_cves, band_target)
        elif len(band_cves) < band_target:
            log.warning(
                f"    ⚠ Could only collect {len(band_cves)}/{band_target} "
                f"for {severity}"
            )

        seen_ids.update(c["cve_id"] for c in band_cves)
        all_cves.extend(band_cves)
        log.info(f"    ✓ {len(band_cves)} {severity} CVEs collected")

        time.sleep(NVD_RATE_LIMIT_SLEEP)

    log.info(f"  ✓ Total CVEs: {len(all_cves)}")
    return all_cves


# ════════════════════════════════════════════════════════════════════════
# COMPONENT 3 — COMPANY & ASSET DATA
# ════════════════════════════════════════════════════════════════════════

def _get_fallback_companies() -> pd.DataFrame:
    """
    Embedded fallback of 50 real NSE-listed companies.
    Used only if the live Nifty 500 CSV is unreachable.
    """
    rows = [
        ("Reliance Industries Limited", "RELIANCE", "Oil Gas & Consumable Fuels"),
        ("Tata Consultancy Services Limited", "TCS", "IT Services & Consulting"),
        ("HDFC Bank Limited", "HDFCBANK", "Banks"),
        ("Infosys Limited", "INFY", "IT Services & Consulting"),
        ("ICICI Bank Limited", "ICICIBANK", "Banks"),
        ("State Bank of India", "SBIN", "Banks"),
        ("Bharti Airtel Limited", "BHARTIARTL", "Telecom Services"),
        ("ITC Limited", "ITC", "FMCG"),
        ("Kotak Mahindra Bank Limited", "KOTAKBANK", "Banks"),
        ("Hindustan Unilever Limited", "HINDUNILVR", "FMCG"),
        ("Larsen & Toubro Limited", "LT", "Construction"),
        ("Bajaj Finance Limited", "BAJFINANCE", "Financial Services"),
        ("Asian Paints Limited", "ASIANPAINT", "Consumer Durables"),
        ("Maruti Suzuki India Limited", "MARUTI", "Automobiles"),
        ("Axis Bank Limited", "AXISBANK", "Banks"),
        ("Sun Pharmaceutical Industries Ltd", "SUNPHARMA", "Pharmaceuticals"),
        ("Titan Company Limited", "TITAN", "Consumer Durables"),
        ("Wipro Limited", "WIPRO", "IT Services & Consulting"),
        ("HCL Technologies Limited", "HCLTECH", "IT Services & Consulting"),
        ("Tata Motors Limited", "TATAMOTORS", "Automobiles"),
        ("UltraTech Cement Limited", "ULTRACEMCO", "Cement & Cement Products"),
        ("Power Grid Corporation of India Ltd", "POWERGRID", "Power"),
        ("NTPC Limited", "NTPC", "Power"),
        ("Tata Steel Limited", "TATASTEEL", "Metals & Mining"),
        ("Tech Mahindra Limited", "TECHM", "IT Services & Consulting"),
        ("IndusInd Bank Limited", "INDUSINDBK", "Banks"),
        ("Bajaj Finserv Limited", "BAJAJFINSV", "Financial Services"),
        ("Dr. Reddy's Laboratories Limited", "DRREDDY", "Pharmaceuticals"),
        ("Nestle India Limited", "NESTLEIND", "FMCG"),
        ("Cipla Limited", "CIPLA", "Pharmaceuticals"),
        ("JSW Steel Limited", "JSWSTEEL", "Metals & Mining"),
        ("Adani Ports & SEZ Limited", "ADANIPORTS", "Transport Services"),
        ("Mahindra & Mahindra Limited", "M&M", "Automobiles"),
        ("Grasim Industries Limited", "GRASIM", "Cement & Cement Products"),
        ("Divis Laboratories Limited", "DIVISLAB", "Pharmaceuticals"),
        ("Eicher Motors Limited", "EICHERMOT", "Automobiles"),
        ("SBI Life Insurance Company Limited", "SBILIFE", "Insurance"),
        ("HDFC Life Insurance Company Limited", "HDFCLIFE", "Insurance"),
        ("Pidilite Industries Limited", "PIDILITIND", "Chemicals"),
        ("Dalmia Bharat Limited", "DALBHARAT", "Cement & Cement Products"),
        ("Shree Cement Limited", "SHREECEM", "Cement & Cement Products"),
        ("Apollo Hospitals Enterprise Limited", "APOLLOHOSP", "Healthcare Services"),
        ("Tata Consumer Products Limited", "TATACONSUM", "FMCG"),
        ("Godrej Consumer Products Limited", "GODREJCP", "FMCG"),
        ("Hindustan Aeronautics Limited", "HAL", "Aerospace & Defense"),
        ("Bharat Electronics Limited", "BEL", "Aerospace & Defense"),
        ("Zomato Limited", "ZOMATO", "Internet Services & Ecommerce"),
        ("Info Edge (India) Limited", "NAUKRI", "Internet Services & Ecommerce"),
        ("Havells India Limited", "HAVELLS", "Consumer Durables"),
        ("Adani Enterprises Limited", "ADANIENT", "Metals & Mining"),
    ]
    return pd.DataFrame(rows, columns=["Company Name", "Symbol", "Industry"])


def fetch_company_data(
    target_count: int, rng: random.Random
) -> pd.DataFrame:
    """
    Fetch Nifty 500 constituent CSV from NSE Indices and sample
    *target_count* companies.
    """
    log.info("▸ Fetching Nifty 500 constituent list from NSE Indices …")

    try:
        resp = requests.get(
            NIFTY500_CSV_URL,
            headers={
                "User-Agent": HTTP_HEADERS["User-Agent"],
                "Accept": "text/csv,application/csv,*/*",
            },
            timeout=30,
        )
        resp.raise_for_status()
        df = pd.read_csv(StringIO(resp.text))
        log.info(f"  ✓ Downloaded {len(df)} companies from NSE Indices")
    except Exception as exc:
        log.warning(f"  ✗ NSE CSV unavailable ({exc}). Using embedded fallback.")
        df = _get_fallback_companies()

    # Normalise column names
    df.columns = df.columns.str.strip()

    # Sample
    if len(df) > target_count:
        df = df.sample(
            n=target_count, random_state=rng.randint(0, 2**31)
        ).reset_index(drop=True)

    # Resolve the Industry column (NSE CSVs vary across years)
    industry_col: Optional[str] = None
    for candidate in ["Industry", "industry", "INDUSTRY"]:
        if candidate in df.columns:
            industry_col = candidate
            break

    if industry_col:
        df["sector"] = df[industry_col].apply(
            lambda x: INDUSTRY_TO_SECTOR.get(str(x).strip(), "Manufacturing")
        )
    else:
        df["sector"] = "Manufacturing"
        log.warning("  ⚠ No 'Industry' column detected — defaulting all to Manufacturing.")

    # Resolve Company Name column
    for candidate in ["Company Name", "company_name", "COMPANY NAME", "Name"]:
        if candidate in df.columns and candidate != "Company Name":
            df.rename(columns={candidate: "Company Name"}, inplace=True)
            break

    # Resolve Symbol column
    for candidate in ["Symbol", "symbol", "SYMBOL"]:
        if candidate in df.columns and candidate != "Symbol":
            df.rename(columns={candidate: "Symbol"}, inplace=True)
            break

    log.info(f"  ✓ Selected {len(df)} companies across {df['sector'].nunique()} sectors")
    sector_counts = df["sector"].value_counts()
    for sector, count in sector_counts.items():
        log.info(f"      {sector:<30s} {count:>4d}")

    return df


def enrich_with_yfinance(df: pd.DataFrame) -> pd.DataFrame:
    """Batch-query Yahoo Finance for market cap & revenue (INR)."""
    if not HAS_YFINANCE:
        log.info("  yfinance not installed — using sector-median revenue.")
        df["market_cap_inr"] = None
        df["total_revenue_inr"] = df["sector"].map(SECTOR_FALLBACK_REVENUE_INR)
        return df

    log.info(f"  Enriching {len(df)} tickers via Yahoo Finance …")
    market_caps: List[Optional[float]] = []
    revenues: List[Optional[float]] = []
    batch_size = 10
    symbols = df["Symbol"].tolist()

    for i in range(0, len(symbols), batch_size):
        batch = symbols[i : i + batch_size]
        log.info(
            f"    Batch {i // batch_size + 1}/"
            f"{math.ceil(len(symbols) / batch_size)}: "
            f"{', '.join(batch[:5])}{'…' if len(batch) > 5 else ''}"
        )
        for sym in batch:
            try:
                info = yf.Ticker(f"{sym}.NS").info
                market_caps.append(info.get("marketCap"))
                revenues.append(info.get("totalRevenue"))
            except Exception:
                market_caps.append(None)
                revenues.append(None)
        if i + batch_size < len(symbols):
            time.sleep(2)

    df["market_cap_inr"] = market_caps
    df["total_revenue_inr"] = revenues

    # Fill gaps with sector fallback
    for idx, row in df.iterrows():
        if pd.isna(row.get("total_revenue_inr")):
            df.at[idx, "total_revenue_inr"] = SECTOR_FALLBACK_REVENUE_INR.get(
                row["sector"], 20_00_00_000
            )

    filled = df["market_cap_inr"].notna().sum()
    log.info(f"  ✓ Got live financials for {filled}/{len(df)} tickers")
    return df


def generate_assets(
    df: pd.DataFrame, rng: random.Random
) -> List[Dict]:
    """Create one critical-asset record per company, grounded in sector."""
    log.info("▸ Generating asset inventory …")
    assets: List[Dict] = []

    for idx, row in df.iterrows():
        sector: str = row["sector"]
        company: str = str(row.get("Company Name", f"Company-{idx}")).strip()
        symbol: str = str(row.get("Symbol", f"SYM{idx}")).strip()

        # Asset type
        pool = SECTOR_ASSET_TYPES.get(sector, ["Enterprise Application Server"])
        asset_type = rng.choice(pool)

        # Criticality
        criticality = SECTOR_CRITICALITY.get(sector, 3)

        # Internet-facing
        internet_facing = rng.random() < SECTOR_INTERNET_FACING_PROB.get(sector, 0.5)

        # Revenue dependency
        total_rev = row.get("total_revenue_inr")
        if total_rev is None or (isinstance(total_rev, float) and math.isnan(total_rev)) or total_rev < 0:
            total_rev = SECTOR_FALLBACK_REVENUE_INR.get(sector, 20_00_00_000)
        dep_lo, dep_hi = SECTOR_REVENUE_DEPENDENCY_FACTOR.get(sector, (0.05, 0.15))
        annual_rev_dep = int(float(total_rev) * rng.uniform(dep_lo, dep_hi))

        # Loss parameters
        mean_loss_inr = SECTOR_LOSS_MEAN_INR_MILLIONS.get(sector, 220) * 1_000_000
        mu = math.log(mean_loss_inr) - (SIGMA ** 2) / 2

        industry_raw = str(row.get("Industry", row.get("industry", sector))).strip()

        asset: Dict[str, Any] = {
            "uid": f"AST-{idx + 1:04d}",
            "company_name": company,
            "nse_symbol": symbol,
            "sector": sector,
            "industry": industry_raw,
            "type": asset_type,
            "criticality": criticality,
            "internet_facing": internet_facing,
            "annual_revenue_dependency_inr": annual_rev_dep,
            "loss_parameters": {
                "distribution": "lognormal",
                "mu": round(mu, 4),
                "sigma": round(SIGMA, 4),
                "mean_inr_millions": SECTOR_LOSS_MEAN_INR_MILLIONS.get(sector, 220),
                "cv": CV,
                "benchmark_source": (
                    "IBM Cost of a Data Breach Report 2025 — India"
                    + (
                        " Financial Sector"
                        if sector == "BFSI"
                        else " (sector-adjusted)"
                    )
                ),
            },
        }

        # Optional: market cap (only if available from yfinance)
        mc = row.get("market_cap_inr")
        if mc is not None and not (isinstance(mc, float) and math.isnan(mc)):
            asset["market_cap_inr"] = int(mc)

        assets.append(asset)

    log.info(f"  ✓ Generated {len(assets)} asset records")
    return assets


# ════════════════════════════════════════════════════════════════════════
# COMPONENT 4 — LINKING  (CVE findings → assets, sector-weighted)
# ════════════════════════════════════════════════════════════════════════

def link_findings_to_assets(
    cves: List[Dict],
    assets: List[Dict],
    rng: random.Random,
    np_rng: np.random.Generator,
    scan_window_days: int = 90,
) -> List[Dict]:
    """
    Assign each CVE to an asset.  Higher-risk sectors get proportionally
    more findings — e.g. BFSI receives ~3× the density of Infrastructure.
    """
    log.info("▸ Linking findings to assets (sector-weighted) …")

    # Per-asset probability weights
    weights = np.array(
        [SECTOR_FINDING_WEIGHT.get(a["sector"], 1.0) for a in assets]
    )
    probs = weights / weights.sum()

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=scan_window_days)
    window_seconds = scan_window_days * 86_400

    linked: List[Dict] = []
    asset_indices = np.arange(len(assets))

    for cve in cves:
        # Weighted random pick
        ai: int = int(rng.choices(range(len(assets)), weights=probs.tolist(), k=1)[0])
        asset = assets[ai]

        # Random timestamp inside scan window
        offset = rng.uniform(0, window_seconds)
        ts = window_start + timedelta(seconds=offset)
        ts_epoch_ms = int(ts.timestamp() * 1000)
        ts_iso = ts.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Sample a single loss event from the asset's lognormal
        mu = asset["loss_parameters"]["mu"]
        sigma = asset["loss_parameters"]["sigma"]
        sampled_loss = float(np_rng.lognormal(mu, sigma))

        linked.append(
            {
                "finding_uid": f"FINDING-{uuid.uuid4().hex[:8]}",
                "cve": cve,
                "asset": asset,
                "time_epoch_ms": ts_epoch_ms,
                "time_iso": ts_iso,
                "sampled_loss_inr": round(sampled_loss, 2),
            }
        )

    # Report distribution
    sector_dist = Counter(r["asset"]["sector"] for r in linked)
    log.info("  Finding → Sector distribution:")
    for sec, cnt in sorted(sector_dist.items(), key=lambda x: -x[1]):
        log.info(f"      {sec:<30s} {cnt:>4d}")
    log.info(f"  ✓ Linked {len(linked)} findings to {len(assets)} assets")
    return linked


# ════════════════════════════════════════════════════════════════════════
# COMPONENT 5 — OCSF FORMATTING & FILE OUTPUT
# ════════════════════════════════════════════════════════════════════════

def format_ocsf_findings(linked: List[Dict]) -> List[Dict]:
    """
    Build OCSF class_uid 2001 (Security Finding) events.
    One event per CVE-finding.
    """
    records: List[Dict] = []
    for rec in linked:
        cve = rec["cve"]
        severity = cve["cvss_severity"]
        severity_id = OCSF_SEVERITY_ID.get(severity, 3)

        # Title
        title = cve["cve_id"]
        snippet = cve.get("description", "")
        if snippet:
            title += f" — {snippet[:120]}{'…' if len(snippet) > 120 else ''}"

        ocsf: Dict[str, Any] = {
            # ── OCSF envelope ──
            "class_uid": 2001,
            "class_name": "Security Finding",
            "category_uid": 2,
            "category_name": "Findings",
            "activity_id": 1,
            "activity_name": "Create",
            "type_uid": 200101,
            "type_name": "Security Finding: Create",
            # ── Timestamps ──
            "time": rec["time_epoch_ms"],
            "time_dt": rec["time_iso"],
            # ── Severity & Status ──
            "severity_id": severity_id,
            "severity": severity.capitalize(),
            "status_id": 1,
            "status": "New",
            # ── Metadata ──
            "metadata": {
                "version": "1.0.0",
                "product": {
                    "name": "QuantifySec Synthetic Scanner",
                    "vendor_name": "Team Cogitare (SIH26105)",
                },
            },
            # ── Finding info ──
            "finding_info": {
                "uid": rec["finding_uid"],
                "title": title,
                "desc": snippet,
                "created_time": rec["time_epoch_ms"],
                "types": ["Vulnerability", "CVE"],
            },
            # ── Vulnerabilities array ──
            "vulnerabilities": [
                {
                    "cve": {
                        "uid": cve["cve_id"],
                        "cvss": [
                            {
                                "version": cve["cvss_version"],
                                "base_score": cve["cvss_base_score"],
                                "vector_string": cve["cvss_vector_string"],
                                "severity": severity.capitalize(),
                            }
                        ],
                    },
                    "is_exploit_available": cve["kev_listed"],
                }
            ],
        }

        # Add CWE when present
        if cve.get("cwe_id"):
            cwe_num = cve["cwe_id"].split("-")[-1]
            ocsf["vulnerabilities"][0]["cve"]["related_cwes"] = [
                {
                    "uid": cve["cwe_id"],
                    "src_url": (
                        f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"
                    ),
                }
            ]

        records.append(ocsf)

    return records


def format_combined_records(linked: List[Dict]) -> List[Dict]:
    """
    Build the combined (joined) records that match the user's target
    shape — ready for the Data Ingestion module.
    """
    combined: List[Dict] = []
    for rec in linked:
        cve = rec["cve"]
        asset = rec["asset"]

        combined.append(
            {
                "class_uid": 2001,
                "finding_uid": rec["finding_uid"],
                "cve": {
                    "uid": cve["cve_id"],
                    "cvss": {
                        "version": cve["cvss_version"],
                        "base_score": cve["cvss_base_score"],
                        "severity": cve["cvss_severity"].capitalize(),
                        "vector_string": cve["cvss_vector_string"],
                    },
                    "description": cve.get("description", ""),
                    "cwe": cve.get("cwe_id"),
                    "published": cve.get("published", ""),
                },
                "kev_listed": cve["kev_listed"],
                "known_ransomware_use": cve["known_ransomware_use"],
                "affected_asset": {
                    "uid": asset["uid"],
                    "company_name": asset["company_name"],
                    "nse_symbol": asset["nse_symbol"],
                    "sector": asset["sector"],
                    "industry": asset["industry"],
                    "type": asset["type"],
                    "criticality": asset["criticality"],
                    "internet_facing": asset["internet_facing"],
                    "annual_revenue_dependency_inr": asset[
                        "annual_revenue_dependency_inr"
                    ],
                },
                "loss_parameters": {
                    "distribution": "lognormal",
                    "mu": asset["loss_parameters"]["mu"],
                    "sigma": asset["loss_parameters"]["sigma"],
                    "mean_inr_millions": asset["loss_parameters"][
                        "mean_inr_millions"
                    ],
                    "sampled_loss_inr": rec["sampled_loss_inr"],
                },
                "time": rec["time_iso"],
            }
        )

    return combined


# ════════════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "QuantifySec — Synthetic Cyber-Risk Data Generator  "
            "(Team Cogitare · SIH26105)"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples
────────
  python generate_synthetic_data.py
  python generate_synthetic_data.py --cve-count 500 --company-count 300
  python generate_synthetic_data.py --skip-yfinance --seed 42
  python generate_synthetic_data.py --output-dir ./data
        """,
    )
    parser.add_argument(
        "--cve-count",
        type=int,
        default=400,
        help="Target number of CVE findings (default: 400)",
    )
    parser.add_argument(
        "--company-count",
        type=int,
        default=250,
        help="Number of companies to sample from Nifty 500 (default: 250)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility (default: 42)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="output",
        help="Directory for JSON output files (default: output/)",
    )
    parser.add_argument(
        "--skip-yfinance",
        action="store_true",
        help="Skip Yahoo Finance enrichment (faster, uses sector fallbacks)",
    )
    parser.add_argument(
        "--scan-window-days",
        type=int,
        default=90,
        help="Scan-window width in days for finding timestamps (default: 90)",
    )
    args = parser.parse_args()

    # ── Deterministic RNGs ──
    rng = random.Random(args.seed)
    np_rng = np.random.default_rng(args.seed)

    log.info("═" * 70)
    log.info("  QuantifySec — Synthetic Data Generator")
    log.info("  Team Cogitare  ·  SIH26105")
    log.info(
        f"  CVE target: {args.cve_count}  |  "
        f"Companies: {args.company_count}  |  "
        f"Seed: {args.seed}"
    )
    log.info("═" * 70)

    # ── 1. CISA KEV ──
    kev_lookup = fetch_kev_data()

    # ── 2. NVD CVEs ──
    cves = fetch_nvd_cves(args.cve_count, kev_lookup, rng)
    if not cves:
        log.error("No CVEs fetched — cannot continue.")
        sys.exit(1)

    # ── 3. Companies & assets ──
    companies_df = fetch_company_data(args.company_count, rng)

    if args.skip_yfinance or not HAS_YFINANCE:
        if not HAS_YFINANCE:
            log.info("  yfinance not installed — using sector fallback revenue.")
        else:
            log.info("  --skip-yfinance flag set — using sector fallback revenue.")
        companies_df["market_cap_inr"] = None
        companies_df["total_revenue_inr"] = companies_df["sector"].map(
            SECTOR_FALLBACK_REVENUE_INR
        )
    else:
        companies_df = enrich_with_yfinance(companies_df)

    assets = generate_assets(companies_df, rng)

    # ── 4. Link findings → assets ──
    linked = link_findings_to_assets(
        cves, assets, rng, np_rng, args.scan_window_days
    )

    # ── 5. Format output ──
    log.info("▸ Formatting OCSF-compliant JSON …")
    ocsf_findings = format_ocsf_findings(linked)
    combined_records = format_combined_records(linked)
    asset_records = [dict(a) for a in assets]  # standalone copy

    # ── 6. Write files ──
    os.makedirs(args.output_dir, exist_ok=True)

    paths = {
        "findings": os.path.join(args.output_dir, "synthetic_findings.json"),
        "assets": os.path.join(args.output_dir, "synthetic_assets.json"),
        "combined": os.path.join(args.output_dir, "synthetic_combined.json"),
    }

    for label, (data, path) in zip(
        ["Findings", "Assets", "Combined"],
        [
            (ocsf_findings, paths["findings"]),
            (asset_records, paths["assets"]),
            (combined_records, paths["combined"]),
        ],
    ):
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, ensure_ascii=False, default=str)
        size_kb = os.path.getsize(path) / 1024
        log.info(f"  ✓ {label:<10s}  {len(data):>4d} records  →  {path}  ({size_kb:.0f} KB)")

    # ── Summary statistics ──
    kev_count = sum(1 for r in combined_records if r["kev_listed"])
    sev_dist = Counter(r["cve"]["cvss"]["severity"] for r in combined_records)
    sec_dist = Counter(r["affected_asset"]["sector"] for r in combined_records)
    ver_dist = Counter(r["cve"]["cvss"]["version"] for r in combined_records)

    log.info("")
    log.info("═" * 70)
    log.info("  ✓  GENERATION COMPLETE")
    log.info("═" * 70)
    log.info(f"  Findings:  {len(ocsf_findings)}")
    log.info(f"  Assets:    {len(asset_records)}")
    log.info(f"  Combined:  {len(combined_records)}")
    log.info(f"  KEV-listed: {kev_count}/{len(combined_records)}")
    log.info(f"  CVSS versions:  {dict(ver_dist)}")
    log.info(f"  Severity dist:  {dict(sev_dist)}")
    log.info(f"  Sector dist:    {dict(sec_dist)}")
    log.info("═" * 70)


if __name__ == "__main__":
    main()
