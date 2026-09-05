from typing import List
from .models import SecurityControl

DEFAULT_BUDGET_LAKH = 75.0

SECURITY_CONTROLS_DATA = [
    {"id": "C01", "name": "MFA", "cost": 8.0, "risk_reduction": 35.0, "category": "Identity"},
    {"id": "C02", "name": "EDR", "cost": 15.0, "risk_reduction": 42.0, "category": "Endpoint"},
    {"id": "C03", "name": "Next-Gen Firewall", "cost": 20.0, "risk_reduction": 38.0, "category": "Network"},
    {"id": "C04", "name": "Backup & Recovery", "cost": 12.0, "risk_reduction": 28.0, "category": "Data"},
    {"id": "C05", "name": "Security Awareness Training", "cost": 5.0, "risk_reduction": 22.0, "category": "People"},
    {"id": "C06", "name": "SIEM Platform", "cost": 25.0, "risk_reduction": 45.0, "category": "Monitoring"},
    {"id": "C07", "name": "Vulnerability Management", "cost": 10.0, "risk_reduction": 25.0, "category": "Assessment"},
    {"id": "C08", "name": "WAF", "cost": 8.0, "risk_reduction": 20.0, "category": "Network"},
    {"id": "C09", "name": "Email Security Gateway", "cost": 6.0, "risk_reduction": 30.0, "category": "Email"},
    {"id": "C10", "name": "DLP", "cost": 18.0, "risk_reduction": 32.0, "category": "Data"},
    {"id": "C11", "name": "Encryption at Rest", "cost": 7.0, "risk_reduction": 18.0, "category": "Data"},
    {"id": "C12", "name": "VPN/ZTNA", "cost": 9.0, "risk_reduction": 24.0, "category": "Network"},
    {"id": "C13", "name": "IAM", "cost": 14.0, "risk_reduction": 33.0, "category": "Identity"},
    {"id": "C14", "name": "PAM", "cost": 16.0, "risk_reduction": 36.0, "category": "Identity"},
    {"id": "C15", "name": "Network Segmentation", "cost": 11.0, "risk_reduction": 26.0, "category": "Network"},
    {"id": "C16", "name": "IDS", "cost": 8.0, "risk_reduction": 19.0, "category": "Network"},
    {"id": "C17", "name": "Patch Management", "cost": 6.0, "risk_reduction": 27.0, "category": "Assessment"},
    {"id": "C18", "name": "Cloud Security Posture Management", "cost": 13.0, "risk_reduction": 29.0, "category": "Cloud"},
    {"id": "C19", "name": "SOC-as-a-Service", "cost": 30.0, "risk_reduction": 50.0, "category": "Monitoring"},
    {"id": "C20", "name": "Incident Response Retainer", "cost": 10.0, "risk_reduction": 15.0, "category": "Response"},
    {"id": "C21", "name": "Annual Penetration Testing", "cost": 8.0, "risk_reduction": 12.0, "category": "Assessment"},
    {"id": "C22", "name": "Physical Security Controls", "cost": 5.0, "risk_reduction": 8.0, "category": "Physical"},
    {"id": "C23", "name": "MDM", "cost": 7.0, "risk_reduction": 17.0, "category": "Endpoint"},
    {"id": "C24", "name": "Anti-Phishing Solution", "cost": 6.0, "risk_reduction": 23.0, "category": "Email"},
    {"id": "C25", "name": "Threat Intelligence Platform", "cost": 12.0, "risk_reduction": 21.0, "category": "Monitoring"}
]

def get_default_controls() -> List[SecurityControl]:
    return [SecurityControl(**c) for c in SECURITY_CONTROLS_DATA]
