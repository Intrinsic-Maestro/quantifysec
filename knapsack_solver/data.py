"""
Hardcoded sample controls.

REPLACE LATER: when the Monte Carlo engine is ready, replace
`get_sample_controls()` with a function that queries the engine
(or your Supabase table) and returns a list of SecurityControl.
The rest of the code doesn't need to change.
"""
from typing import List
from models import SecurityControl


_SAMPLE_CONTROLS: List[SecurityControl] = [
    SecurityControl(id="C01", name="Multi-Factor Authentication (MFA)",       cost=8,  risk_reduction=35, category="Identity"),
    SecurityControl(id="C02", name="Endpoint Detection & Response (EDR)",     cost=15, risk_reduction=42, category="Endpoint"),
    SecurityControl(id="C03", name="Next-Gen Firewall",                       cost=20, risk_reduction=38, category="Network"),
    SecurityControl(id="C04", name="Backup & Recovery System",                cost=12, risk_reduction=28, category="Data"),
    SecurityControl(id="C05", name="Security Awareness Training",             cost=5,  risk_reduction=22, category="People"),
    SecurityControl(id="C06", name="SIEM Platform",                           cost=25, risk_reduction=45, category="Monitoring"),
    SecurityControl(id="C07", name="Vulnerability Management",                cost=10, risk_reduction=25, category="Assessment"),
    SecurityControl(id="C08", name="Web Application Firewall (WAF)",          cost=8,  risk_reduction=20, category="Network"),
    SecurityControl(id="C09", name="Email Security Gateway",                  cost=6,  risk_reduction=30, category="Email"),
    SecurityControl(id="C10", name="Data Loss Prevention (DLP)",              cost=18, risk_reduction=32, category="Data"),
    SecurityControl(id="C11", name="Encryption at Rest",                      cost=7,  risk_reduction=18, category="Data"),
    SecurityControl(id="C12", name="VPN / Zero Trust Network Access",         cost=9,  risk_reduction=24, category="Network"),
    SecurityControl(id="C13", name="Identity & Access Management (IAM)",      cost=14, risk_reduction=33, category="Identity"),
    SecurityControl(id="C14", name="Privileged Access Management (PAM)",      cost=16, risk_reduction=36, category="Identity"),
    SecurityControl(id="C15", name="Network Segmentation",                    cost=11, risk_reduction=26, category="Network"),
    SecurityControl(id="C16", name="Intrusion Detection System (IDS)",        cost=8,  risk_reduction=19, category="Network"),
    SecurityControl(id="C17", name="Patch Management System",                 cost=6,  risk_reduction=27, category="Assessment"),
    SecurityControl(id="C18", name="Cloud Security Posture Management",       cost=13, risk_reduction=29, category="Cloud"),
    SecurityControl(id="C19", name="SOC-as-a-Service",                        cost=30, risk_reduction=50, category="Monitoring"),
    SecurityControl(id="C20", name="Incident Response Retainer",              cost=10, risk_reduction=15, category="Response"),
    SecurityControl(id="C21", name="Annual Penetration Testing",              cost=8,  risk_reduction=12, category="Assessment"),
    SecurityControl(id="C22", name="Physical Security Controls",              cost=5,  risk_reduction=8,  category="Physical"),
    SecurityControl(id="C23", name="Mobile Device Management (MDM)",          cost=7,  risk_reduction=17, category="Endpoint"),
    SecurityControl(id="C24", name="Anti-Phishing Solution",                  cost=6,  risk_reduction=23, category="Email"),
    SecurityControl(id="C25", name="Threat Intelligence Platform",            cost=12, risk_reduction=21, category="Monitoring"),
]


def get_sample_controls() -> List[SecurityControl]:
    """Return a defensive copy so callers can't mutate the source list."""
    return list(_SAMPLE_CONTROLS)


DEFAULT_BUDGET_LAKH: float = 75.0