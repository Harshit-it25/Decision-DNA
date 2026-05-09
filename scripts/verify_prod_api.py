import requests
import json
import time

BASE_URL = "http://localhost:8000"

def verify_security():
    print("--- Verifying API Security (Step 11) ---")
    
    # 1. Test Public Endpoint (Root)
    print("\n1. Testing Public Root...")
    resp = requests.get(f"{BASE_URL}/api/health")
    print(f"Status: {resp.status_code}, Response: {resp.json()['status']}")
    
    # 2. Test Protected Endpoint without Auth
    print("\n2. Testing Protected /predict without Auth...")
    payload = {
        "applicant": {"income": 60000, "loanAmount": 15000, "creditScore": 700},
        "modelId": "m2"
    }
    resp = requests.post(f"{BASE_URL}/api/predict", json=payload)
    print(f"Status: {resp.status_code} (Expected 401), Detail: {resp.json().get('detail')}")
    
    # 3. Get JWT Token
    print("\n3. Authenticating...")
    auth_data = {"username": "admin", "password": "decision_dna_2024"}
    resp = requests.post(f"{BASE_URL}/api/token", data=auth_data)
    if resp.status_code == 200:
        token = resp.json()['access_token']
        print("Success! Token received.")
        headers = {"Authorization": f"Bearer {token}"}
    else:
        print(f"Auth Failed: {resp.text}")
        return

    # 4. Test Protected /predict with Auth
    print("\n4. Testing Protected /predict with JWT...")
    resp = requests.post(f"{BASE_URL}/api/predict", json=payload, headers=headers)
    print(f"Status: {resp.status_code} (Expected 200)")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Prediction: {data['decision']}, Risk: {data['riskProbability']}")
        print(f"Explanation (SHAP): {list(data['explanations'].keys())[:3]}...")

    # 5. Test Rate Limiting
    print("\n5. Testing Rate Limiting (Root)...")
    for i in range(10):
        resp = requests.get(f"{BASE_URL}/")
        if resp.status_code == 429:
            print(f"Rate limited at request {i+1}! {resp.json().get('detail')}")
            break
        time.sleep(0.1)

if __name__ == "__main__":
    try:
        verify_security()
    except Exception as e:
        print(f"Error: {e}")
