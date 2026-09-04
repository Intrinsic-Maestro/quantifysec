import os
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_KEY"]
client = create_client(url, key)

test_row = {
    "uid": "TEST-DEBUG-002",
    "company_name": "Debug Test Co",
    "nse_symbol": "TEST",
    "sector": "IT & Technology",
    "industry": "Testing",
    "type": "Test Asset",
    "criticality": 1,
    "internet_facing": False,
    "annual_revenue_dependency_inr": 1000,
    "market_cap_inr": None,
    "loss_distribution": "lognormal",
    "loss_mu": 18.5,
    "loss_sigma": 1.0857,
    "loss_mean_inr_millions": 300,
    "loss_cv": 1.5,
    "loss_benchmark_source": "test",
}

try:
    result = client.table("assets").upsert(test_row, on_conflict="uid").execute()
    print("SUCCESS:", result.data)
except Exception as e:
    print("FAILED WITH ERROR:")
    print(e)