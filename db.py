import uuid

_assets = []
_vulns = []
_simulations = {}
_risk_assessments = {}
_remediation_actions = {}
_optimizations = {}

def upsert_assets(valid_assets: list):
    _assets.extend(valid_assets)
    print(f"DB: Upserted {len(valid_assets)} assets.")

def upsert_vulnerabilities(valid_vulns: list):
    _vulns.extend(valid_vulns)
    print(f"DB: Upserted {len(valid_vulns)} vulnerabilities.")

def insert_simulation_run(mc_dict: dict) -> str:
    run_id = str(uuid.uuid4())
    _simulations[run_id] = mc_dict
    print(f"DB: Inserted simulation run {run_id}.")
    return run_id

def insert_risk_assessments(top_risk_drivers: list, simulation_run_id: str):
    _risk_assessments[simulation_run_id] = top_risk_drivers
    print(f"DB: Inserted {len(top_risk_drivers)} risk assessments for run {simulation_run_id}.")

def insert_remediation_actions(controls: list, simulation_run_id: str) -> dict:
    action_ids = {}
    for control in controls:
        action_id = str(uuid.uuid4())
        action_ids[control.id] = action_id
        _remediation_actions[action_id] = {
            "control": control.model_dump() if hasattr(control, "model_dump") else control,
            "simulation_run_id": simulation_run_id
        }
    print(f"DB: Inserted {len(controls)} remediation actions for run {simulation_run_id}.")
    return action_ids

def insert_optimization_run(opt_result, simulation_run_id: str, vuln_id_to_action_id: dict, portfolio_ale_lakh: float):
    run_id = str(uuid.uuid4())
    _optimizations[run_id] = {
        "opt_result": opt_result.model_dump() if hasattr(opt_result, "model_dump") else opt_result,
        "simulation_run_id": simulation_run_id,
        "vuln_id_to_action_id": vuln_id_to_action_id,
        "portfolio_ale_lakh": portfolio_ale_lakh
    }
    print(f"DB: Inserted optimization run {run_id} for simulation {simulation_run_id}.")
    return run_id
