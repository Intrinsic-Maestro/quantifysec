# QuantifySec — Synthetic Cyber-Risk Data Generator

> **Smart India Hackathon 2026 (SIH26105) · Team Cogitare**

Generates a realistic, defensible synthetic dataset that stands in for a
real enterprise's vulnerability-scanner export + asset inventory.  The output
feeds directly into the QuantifySec **Data Ingestion & Parsing Layer**.

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the generator (takes ~2 min for NVD API calls)
python generate_synthetic_data.pyl

# 3. Output lands in ./output/
ls output/
#   synthetic_findings.json   (~400 OCSF vulnerability findings)
#   synthetic_assets.json     (~250 asset records)
#   synthetic_combined.json   (~400 joined records ready for ingestion)
```

### CLI Options

| Flag | Default | Description |
|:-----|:--------|:------------|
| `--cve-count` | 400 | Target number of CVE findings to fetch |
| `--company-count` | 250 | Number of companies to sample from Nifty 500 |
| `--seed` | 42 | Random seed for full reproducibility |
| `--output-dir` | `output/` | Directory for generated JSON files |
| `--skip-yfinance` | off | Skip Yahoo Finance enrichment (faster) |
| `--scan-window-days` | 90 | Width of the simulated scan window |

---

## 1. What Is Real vs. What Is Synthetic

| Data Element | Source | Real or Synthetic |
|:-------------|:-------|:-----------------:|
| CVE IDs (e.g. CVE-2024-XXXXX) | NVD API v2.0 | **Real** |
| CVSS v4.0 / v3.1 base scores | NVD API v2.0 | **Real** |
| CVSS vector strings | NVD API v2.0 | **Real** |
| CVE descriptions | NVD API v2.0 | **Real** |
| CWE weakness IDs | NVD API v2.0 | **Real** |
| KEV active-exploitation flag | CISA KEV JSON Feed | **Real** |
| Ransomware-campaign flag | CISA KEV JSON Feed | **Real** |
| Company names | NSE Indices Nifty 500 CSV | **Real** |
| NSE ticker symbols | NSE Indices Nifty 500 CSV | **Real** |
| Industry / sector classification | NSE Indices Nifty 500 CSV | **Real** |
| Market capitalisation (INR) | Yahoo Finance (`yfinance`) | **Real** |
| Total revenue (INR) | Yahoo Finance (`yfinance`) | **Real** |
| Asset types (e.g. "Payment Gateway") | Sector-grounded inference | **Synthetic** |
| Asset criticality scores (1–5) | Sector-based rule (see §4) | **Synthetic** |
| Internet-facing flag | Probabilistic, sector-weighted | **Synthetic** |
| Annual revenue dependency (INR) | Revenue × sector factor | **Synthetic** |
| Loss magnitude parameters (μ, σ) | IBM benchmark + lognormal model | **Synthetic** |
| Sampled loss per finding (INR) | Drawn from lognormal | **Synthetic** |
| Finding ↔ Asset assignment | Sector-weighted random | **Synthetic** |
| Finding timestamps | Random within scan window | **Synthetic** |
| Finding UIDs | UUID-based | **Synthetic** |

---

## 2. Loss-Magnitude Benchmark (IBM Report)

### Source

> **IBM / Ponemon Institute**
> *"Cost of a Data Breach Report 2025: The AI Oversight Gap"*
> Published: July 2025
> URL: <https://www.ibm.com/reports/data-breach>

### Key Figures Used

| Metric | Value | Notes |
|:-------|:------|:------|
| **India overall average** | **INR 220 Million** (₹22.0 Crore / ~$2.64M USD) | Used as the baseline for Manufacturing sector |
| **India Financial Sector** | **INR 409 Million** (₹40.9 Crore / ~$4.90M USD) | Used directly for BFSI sector — highest in India |
| **Per-record cost (Customer PII)** | $160 USD per record | Reference only (not used in lognormal model) |

### Lognormal Distribution Parameters

The loss magnitude per incident is modelled as a **lognormal distribution**,
which is the standard in the Open FAIR (Factor Analysis of Information Risk)
methodology.

**Coefficient of Variation (CV):** 1.5 — standard in cyber-risk literature
for enterprise loss distributions (heavy right tail).

**Derivation:**

```
σ = √ln(1 + CV²)  = √ln(1 + 2.25) = √ln(3.25) ≈ 1.0857
μ = ln(M) − σ²/2   where M = sector mean in INR
```

**Per-Sector Parameters:**

| Sector | Mean M (INR Millions) | μ (log-location) | σ (shape) | Median (INR Millions) |
|:-------|:---------------------:|:-----------------:|:---------:|:---------------------:|
| BFSI | 409 | 19.24 | 1.086 | 225.3 |
| Healthcare | 350 | 19.08 | 1.086 | 193.0 |
| IT & Technology | 300 | 18.92 | 1.086 | 165.5 |
| Energy & Utilities | 280 | 18.85 | 1.086 | 154.5 |
| Telecom & Media | 260 | 18.77 | 1.086 | 143.4 |
| Manufacturing | 220 | 18.60 | 1.086 | 121.3 |
| Consumer & Retail | 200 | 18.51 | 1.086 | 110.3 |
| Infrastructure & RE | 180 | 18.40 | 1.086 | 99.3 |

> **Note:** The median is always lower than the mean because the lognormal
> distribution is right-skewed.  This correctly models the real-world
> pattern where *most* breaches cost below the average, while a small
> number of catastrophic breaches pull the mean up.

---

## 3. Company Data Source

### Primary Source

> **NSE Indices Ltd.** (a subsidiary of the National Stock Exchange of India)
> *Nifty 500 Index Constituent Master*
> URL: <https://www.niftyindices.com/IndexConstituent/ind_nifty500list.csv>
>
> This CSV contains 500 actively traded Indian companies with official
> company names, NSE ticker symbols, and exchange-assigned industry
> classifications.  It is freely downloadable without authentication.

### Financial Enrichment

> **Yahoo Finance** (via the `yfinance` Python package)
> Provides live market capitalisation and total revenue in INR for each
> company, keyed by NSE ticker symbol (e.g. `HDFCBANK.NS`).
> No authentication required.

When Yahoo Finance data is unavailable for a ticker (delisted, API
timeout, etc.), the script falls back to sector-median revenue estimates.

### Fallback (if NSE CSV is unreachable)

An embedded list of 50 major NSE-listed companies is hardcoded as a
last-resort fallback.  The script logs a warning if this fallback is used.

---

## 4. Assumptions & Design Decisions

### Sector-to-Criticality Mapping

| Sector | Criticality | Rationale |
|:-------|:-----------:|:----------|
| BFSI | 5 | Handles PII, financial data; regulated by RBI, SEBI, IRDAI |
| Healthcare | 5 | Handles PHI, clinical data; DPDP Act, drug regulation |
| IT & Technology | 4 | Hosts critical infra for downstream clients |
| Energy & Utilities | 4 | SCADA/ICS, grid stability — national-security implications |
| Telecom & Media | 4 | Subscriber data, network infra — regulated by TRAI |
| Manufacturing | 3 | IP / trade secrets, but lower PII exposure |
| Consumer & Retail | 3 | Customer data at scale, but less regulated |
| Infrastructure & RE | 2 | Lowest data sensitivity among listed sectors |

### Severity Distribution

Real vulnerability data is heavily skewed — most vulnerabilities are
Low/Medium, with a small tail of Criticals.  A flat/uniform distribution
would look obviously fabricated.

| Severity | Target % | Approx Count (of 400) |
|:---------|:--------:|:---------------------:|
| Low | 15% | ~60 |
| Medium | 45% | ~180 |
| High | 30% | ~120 |
| Critical | 10% | ~40 |

The script queries NVD separately per severity band to guarantee this
distribution.

### Finding-to-Asset Weighting

Findings are not assigned uniformly.  Companies in higher-risk sectors
receive proportionally more findings (mirroring real-world attack-surface
patterns):

| Sector | Weight | Expected Findings (of 400) |
|:-------|:------:|:--------------------------:|
| BFSI | 3.0× | ~75 |
| Healthcare | 2.5× | ~55 |
| IT & Technology | 2.0× | ~50 |
| Energy & Utilities | 1.8× | ~35 |
| Telecom & Media | 1.5× | ~30 |
| Manufacturing | 1.2× | ~30 |
| Consumer & Retail | 1.0× | ~25 |
| Infrastructure | 0.8× | ~20 |

### Revenue Dependency Factor

Each asset's `annual_revenue_dependency_inr` is computed as:

```
asset_revenue_dep = company_total_revenue × U(dep_lo, dep_hi)
```

where `(dep_lo, dep_hi)` is a sector-specific range (e.g. 10–25% for
BFSI, 3–10% for Infrastructure).  This is synthetic but grounded in each
company's actual revenue scale.

### Internet-Facing Flag

Assigned probabilistically per sector.  BFSI (70%) and IT (80%) assets
are most likely to be internet-facing; Energy/Utilities (30%) least so.

### CVSS Version Fallback

The script targets **CVSS v4.0** scores.  Since CVSS v4.0 was released
in November 2023 and NVD adoption is still growing, the script
automatically backfills with **CVSS v3.1** scores when insufficient v4.0
results are available.  Each record's `cvss.version` field indicates
which version was used.

### OCSF Compliance

Output uses **OCSF v1.0.0, class_uid 2001 (Security Finding)** to match
the Data Ingestion module's expectations.  Modern OCSF (v1.1.0+)
reclassified vulnerability findings under class_uid 2002 — this can be
switched via a one-line change in the script if the pipeline upgrades.

---

## 5. Output File Descriptions

### `synthetic_findings.json`

Array of ~400 OCSF-compliant vulnerability finding events.  Each record
includes the full OCSF envelope (`class_uid`, `metadata`, `finding_info`,
`vulnerabilities` array with CVE/CVSS/CWE data).

### `synthetic_assets.json`

Array of ~250 asset records.  Each record includes company identity (name,
NSE symbol, sector), asset properties (type, criticality, internet-facing),
financial context (revenue dependency, market cap), and lognormal loss
parameters.

### `synthetic_combined.json`

Array of ~400 joined records — each finding linked to its assigned asset.
This is the primary file for the Data Ingestion module.  Schema matches
the team's agreed-upon shape:

```json
{
  "class_uid": 2001,
  "finding_uid": "FINDING-a1b2c3d4",
  "cve": {
    "uid": "CVE-2024-XXXXX",
    "cvss": { "version": "4.0", "base_score": 8.1, "severity": "High", "vector_string": "..." },
    "description": "...",
    "cwe": "CWE-79",
    "published": "2024-06-07T12:15:10.890"
  },
  "kev_listed": true,
  "known_ransomware_use": "Known",
  "affected_asset": {
    "uid": "AST-0012",
    "company_name": "HDFC Bank Limited",
    "nse_symbol": "HDFCBANK",
    "sector": "BFSI",
    "industry": "Banks",
    "type": "Payment Gateway",
    "criticality": 5,
    "internet_facing": true,
    "annual_revenue_dependency_inr": 25000000
  },
  "loss_parameters": {
    "distribution": "lognormal",
    "mu": 19.24,
    "sigma": 1.086,
    "mean_inr_millions": 409,
    "sampled_loss_inr": 312450000.00
  },
  "time": "2026-03-14T10:22:00Z"
}
```

---

## 6. API Endpoints & Rate Limits

| API | Endpoint | Auth | Rate Limit |
|:----|:---------|:----:|:-----------|
| NVD CVE v2.0 | `services.nvd.nist.gov/rest/json/cves/2.0` | None | 5 req / 30 s |
| CISA KEV | `cisa.gov/.../known_exploited_vulnerabilities.json` | None | None |
| CISA KEV (mirror) | `raw.githubusercontent.com/cisagov/kev-data/...` | None | None |
| NSE Indices | `niftyindices.com/IndexConstituent/ind_nifty500list.csv` | None | None |
| Yahoo Finance | `query2.finance.yahoo.com` (via `yfinance`) | None | Lenient |

The script enforces a **6.5-second sleep** between NVD API calls to stay
well within the unauthenticated rate limit.

---

## License

This synthetic data generator and its output are produced for the
Smart India Hackathon 2026 (Problem Statement SIH26105).  The generated
data is synthetic and must not be used as a substitute for real
vulnerability assessments or security audits.
