import requests
import time
import json

BASE_URL = "http://localhost:8008"
USERNAME = "admin"
PASSWORD = "decision_dna_2024"

def get_token():
    print("Authenticating...")
    response = requests.post(f"{BASE_URL}/api/token", data={"username": USERNAME, "password": PASSWORD})
    token = response.json().get("access_token")
    if token:
        print(f"Successfully authenticated. Token length: {len(token)}")
    else:
        print(f"Auth failed: {response.text}")
    return token

def simulate_drift(token):
    headers = {"Authorization": f"Bearer {token}"}
    print("Simulating high-risk applications to trigger drift...")
    
    # Send 10 apps that will likely be rejected (low credit score, low income)
    for i in range(10):
        data = {
            "applicant": {
                "income": 15000,
                "loanAmount": 80000,
                "creditScore": 300,
                "debtRatio": 0.8,
                "age": 22
            },
            "modelId": "m2"
        }
        resp = requests.post(f"{BASE_URL}/api/predict", json=data, headers=headers)
        if resp.status_code != 200:
            print(f"Prediction Error: {resp.status_code} - {resp.text}")
        if i % 2 == 0: print(f" Sent {i+1} high-risk apps...")
        time.sleep(0.1)

def monitor_pipeline(token):
    headers = {"Authorization": f"Bearer {token}"}
    print("\nMonitoring system status...")
    
    for _ in range(30):
        resp = requests.get(f"{BASE_URL}/api/monitoring-drift", headers=headers)
        if resp.status_code != 200:
            print(f"Error checking drift: {resp.status_code} - {resp.text}")
            time.sleep(2)
            continue
            
        drift_res = resp.json()
        psi = drift_res.get("psi", 0)
        status = drift_res.get("status", "Unknown")
        
        health_res = requests.get(f"{BASE_URL}/api/health", headers=headers).json()
        
        print(f"[{time.strftime('%H:%M:%S')}] PSI: {psi:.4f} | Status: {status}")
        
        if "Retraining Triggered" in status:
            print(">>> Drift detected! Waiting for automated retraining to complete...")
        
        # In this demo, we can manually trigger if needed or just wait for the background task
        # Since we just added it to the drift endpoint, it triggers on the next GET if PSI > 0.1
        
        time.sleep(2)

if __name__ == "__main__":
    try:
        # 1. Get Token
        token = get_token()
        
        # 2. Simulate Drift
        simulate_drift(token)
        
        # 3. Monitor
        monitor_pipeline(token)
        
    except Exception as e:
        print(f"Simulation failed: {e}")
