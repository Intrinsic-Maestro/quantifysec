from typing import Dict, Any

def apply_threat_intelligence_modifier(
          cvss_score: float,
          threat_intel_metadata: Dict[str, Any]
) -> float:
     """
     Modifies the baseline CVSS score using active threat intelligence factors
     such as CISA Known Exploited Vulnerabilities (KEV) status or active ransomware campaigns.
    
     Args:
          cvss_score: Original base CVSS v4.0 score (0.0 to 10.0).
          threat_intel_metadata: Dictionary containing threat flags (e.g., {'is_exploited': True, 'ransomware_linked': True}).
        
     Returns:
          float: Adjusted effective CVSS score (capped at 10.0).
     """
     adjusted_score = cvss_score
    
     is_actively_exploited = threat_intel_metadata.get("is_exploited", False)
     is_ransomware_linked = threat_intel_metadata.get("ransomware_linked", False)
     public_exploit_available = threat_intel_metadata.get("public_exploit_available", False)
    
     if is_actively_exploited:
          adjusted_score *= 1.25
        
     if is_ransomware_linked:
          adjusted_score *= 1.15
        
     if public_exploit_available and not is_actively_exploited:
          adjusted_score *= 1.10
        
     return float(min(adjusted_score, 10.0))

def calculate_dynamic_exposure_factor(
          asset_criticality: str
) -> float:
     """
     Determines an asset-specific situational weight multiplier based on business criticality.
     
     Args:
          asset_criticality: String identifier ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW').
          
     Returns:
          float: Multiplier applied to threat frequency calculations.
     """
     criticality_weights = {
          "CRITICAL": 1.50,
          "HIGH": 1.25,
          "MEDIUM": 1.00,
          "LOW": 0.75
     }
     
     # Default to 1.0 if an unrecognized string is passed
     return criticality_weights.get(asset_criticality.upper(), 1.0)