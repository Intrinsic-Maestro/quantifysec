from __future__ import annotations

from typing import Dict, Iterable, List, Optional
from .schemas import VulnerabilityNode, AssetBusinessContext


def _first_vulnerability(finding: dict) -> dict:
    vulnerabilities = finding.get("vulnerabilities") or []
    return vulnerabilities[0] if vulnerabilities else {}


def _asset_id(finding: dict) -> str:
    return finding.get("device", {}).get("uid") or finding.get("affected_asset", {}).get("uid")


def _cve_id(finding: dict) -> str:
    vuln = _first_vulnerability(finding)
    cve = vuln.get("cve", {})
    return cve.get("id") or cve.get("uid") or finding.get("cve", {}).get("uid")


def _severity(finding: dict) -> str:
    value = finding.get("severity")
    if value:
        return str(value).upper()
    return str(finding.get("cve", {}).get("cvss", {}).get("severity", "UNKNOWN")).upper()


def _cvss(finding: dict) -> float:
    vuln = _first_vulnerability(finding)
    return float(
        vuln.get("cvss", {}).get("base_score")
        or finding.get("cve", {}).get("cvss", {}).get("base_score")
        or 0.0
    )


def _exploited(finding: dict) -> bool:
    vuln = _first_vulnerability(finding)
    return bool(
        vuln.get("is_known_exploited", False)
        or finding.get("kev_listed", False)
        or finding.get("is_known_exploited", False)
    )


def parse_ocsf_to_graph(
    ocsf_data: Iterable[dict],
    asset_context_list: List[AssetBusinessContext],
    toxic_flags: Optional[Dict[str, bool]] = None,
) -> Dict[str, VulnerabilityNode]:
    """Parse the supplied OCSF/JSONL finding shape into the graph model.

    The original project expected a different OCSF layout. This parser accepts
    the actual supplied shape: device.uid + vulnerabilities[].cve + CVSS.
    """
    context_map = {asset.asset_id: asset for asset in asset_context_list}
    toxic_flags = toxic_flags or {}
    security_graph: Dict[str, VulnerabilityNode] = {}

    for finding in ocsf_data:
        try:
            asset_id = _asset_id(finding)
            cve_id = _cve_id(finding)
            if not asset_id or not cve_id or asset_id not in context_map:
                continue

            node = VulnerabilityNode(
                cve_id=cve_id,
                asset_id=asset_id,
                severity=_severity(finding),
                base_score=_cvss(finding),
                is_exploited=_exploited(finding),
                is_toxic_combination=bool(
                    toxic_flags.get(cve_id, False)
                    or (_cvss(finding) >= 9.0 and context_map[asset_id].criticality_score >= 4)
                ),
            )
            security_graph[f"{asset_id}_{cve_id}"] = node
        except (KeyError, TypeError, ValueError):
            continue

    # Preserve the synthetic graph behavior used by the original project:
    # critical nodes connect to the next node in ingestion order.
    keys = list(security_graph.keys())
    for i, key in enumerate(keys[:-1]):
        if security_graph[key].severity == "CRITICAL":
            security_graph[key].downstream_dependencies.append(keys[i + 1])

    return security_graph