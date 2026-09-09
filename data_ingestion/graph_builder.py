from typing import List, Dict
from .schemas import VulnerabilityNode, AssetBusinessContext

def parse_ocsf_to_graph(
    ocsf_data: List[dict], 
    asset_context_list: List[AssetBusinessContext],
    toxic_flags: Dict[str, bool] # Mapped from your synthetic generator
) -> Dict[str, VulnerabilityNode]:
    """
    Merges technical OCSF data with financial business context 
    into an interconnected graph of vulnerabilities.
    """
    # 1. Index business context for O(1) lookup
    context_map = {asset.asset_id: asset for asset in asset_context_list}
    
    security_graph = {}

    # 2. Build the nodes
    for finding in ocsf_data:
        try:
            asset_uid = finding["affected_asset"]["uid"]
            cve_uid = finding["cve"]["uid"]
            severity = finding["cve"]["cvss"]["severity"]
            
            # Check if this node is flagged as part of a toxic combination
            is_toxic = toxic_flags.get(cve_uid, False)

            node = VulnerabilityNode(
                cve_id=cve_uid,
                asset_id=asset_uid,
                severity=severity,
                base_score=finding["cve"]["cvss"]["base_score"],
                is_exploited=finding.get("kev_listed", False),
                is_toxic_combination=is_toxic
            )
            
            # Use a composite key (Asset + CVE) for the graph
            node_key = f"{asset_uid}_{cve_uid}"
            security_graph[node_key] = node

        except KeyError as e:
            continue # Skip malformed OCSF logs safely

    # 3. Simulate Graph Edges (Risk Interactions)
    # If Asset A (Internet Facing) connects to Asset B (Database), 
    # link their vulnerabilities. 
    # (For the hackathon, we synthetically link criticals to mediums to show cascading risk)
    node_keys = list(security_graph.keys())
    for i, key in enumerate(node_keys[:-1]):
        if security_graph[key].severity == "CRITICAL":
            # Link this critical node to the next node in the graph
            security_graph[key].downstream_dependencies.append(node_keys[i+1])

    return security_graph