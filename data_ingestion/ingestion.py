import json
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class LossParameters(BaseModel):
    mean_inr_millions: float
    mu: Optional[float] = None
    sigma: Optional[float] = None

class AssetRecord(BaseModel):
    uid: str
    company_name: Optional[str] = None
    sector: Optional[str] = None
    type: Optional[str] = None
    criticality: Optional[int] = None
    internet_facing: Optional[bool] = None
    loss_parameters: LossParameters

class CVSS(BaseModel):
    base_score: float
    severity: str

class CVE(BaseModel):
    uid: Optional[str] = None
    cvss: CVSS

class AffectedAsset(BaseModel):
    uid: str

class VulnRecordInternal(BaseModel):
    finding_uid: Optional[str] = None
    cve: CVE
    affected_asset: AffectedAsset
    loss_parameters: Optional[LossParameters] = None

class VulnRecord(BaseModel):
    id: str
    asset_id: str
    cvss_score: float

def load_json_file(path: str) -> List[Dict[str, Any]]:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def ingest_assets(raw: List[Dict[str, Any]]) -> Dict[str, List[Any]]:
    valid = []
    invalid = []
    for item in raw:
        try:
            record = AssetRecord(**item)
            valid.append(record)
        except Exception as e:
            invalid.append({"item": item, "error": str(e)})
    return {"valid": valid, "invalid": invalid}

def ingest_vulnerabilities(raw: List[Dict[str, Any]]) -> Dict[str, List[Any]]:
    valid = []
    invalid = []
    for item in raw:
        try:
            record = VulnRecordInternal(**item)
            vuln_id = record.finding_uid if record.finding_uid else (record.cve.uid if record.cve.uid else "UNKNOWN")
            asset_id = record.affected_asset.uid
            cvss_score = record.cve.cvss.base_score
            
            valid.append(VulnRecord(id=vuln_id, asset_id=asset_id, cvss_score=cvss_score))
        except Exception as e:
            invalid.append({"item": item, "error": str(e)})
    return {"valid": valid, "invalid": invalid}
