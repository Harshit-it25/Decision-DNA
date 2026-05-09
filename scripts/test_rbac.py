import requests
import json

API_URL = "http://127.0.0.1:8000"

USERS = {
    "admin": "decision_dna_2024",
    "officer": "officer_pass_2024",
    "auditor": "auditor_pass_2024"
}

ENDPOINTS = [
    ("POST", "/predict", {"income": 75000, "loanAmount": 250000, "creditScore": 720}),
    ("GET", "/security/status", None),
    ("POST", "/security/red-team", None),
    ("POST", "/security/harden", None),
    ("GET", "/security/watermark/verify", None),
    ("GET", "/monitoring/distribution", None),
    ("GET", "/monitoring/drift", None),
]

def get_token(username, password):
    resp = requests.post(f"{API_URL}/token", data={"username": username, "password": password})
    if resp.status_code == 200:
        return resp.json()["access_token"]
    return None

def test_rbac():
    print("--- Decision DNA RBAC Verification System ---")
    
    for user, password in USERS.items():
        print(f"\nUser: {user}")
        token = get_token(user, password)
        if not token:
            print(f"  [ERROR] Could not authenticate {user}")
            continue
            
        headers = {"Authorization": f"Bearer {token}"}
        
        for method, path, payload in ENDPOINTS:
            try:
                if method == "POST":
                    resp = requests.post(f"{API_URL}{path}", json=payload, headers=headers)
                else:
                    resp = requests.get(f"{API_URL}{path}", headers=headers)
                
                status = "ALLOWED" if resp.status_code == 200 else f"DENIED ({resp.status_code})"
                if resp.status_code == 202 or resp.status_code == 201: # Handle async starts
                   status = "ALLOWED"
                
                print(f"  {method} {path:25} -> {status}")
            except Exception as e:
                print(f"  [FAIL] {path}: {e}")

if __name__ == "__main__":
    test_rbac()
