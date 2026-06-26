import requests
import time
import concurrent.futures
import statistics
import json

# Configuration
API_URL = "http://127.0.0.1:8008"
AUTH_ENDPOINT = f"{API_URL}/api/token"
PREDICT_ENDPOINT = f"{API_URL}/api/predict"
CONCURRENT_USERS = 20
REQUESTS_PER_USER = 5

# Mock applicant data
APPLICANT = {
    "applicant": {
        "income": 75000,
        "loanAmount": 250000,
        "creditScore": 720,
        "monthsEmployed": 48,
        "numCreditLines": 12,
        "totalBalance": 15000,
        "totalCreditLimit": 50000,
        "pastDuePayments": 0
    },
    "modelId": "m2"
}

def get_token():
    print("Authenticating...")
    response = requests.post(AUTH_ENDPOINT, data={"username": "admin", "password": "decision_dna_2024"})
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"Auth failed: {response.text}")

def make_request(token):
    start = time.perf_counter()
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.post(PREDICT_ENDPOINT, json=APPLICANT, headers=headers)
        latency = time.perf_counter() - start
        return latency, response.status_code
    except Exception as e:
        print(f"Request error: {e}")
        return None, 500

def run_stress_test():
    token = get_token()
    latencies = []
    
    print(f"Starting Stress Test: {CONCURRENT_USERS} users, {REQUESTS_PER_USER} requests/user...")
    
    start_total = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
        # Submit all tasks
        futures = [executor.submit(make_request, token) for _ in range(CONCURRENT_USERS * REQUESTS_PER_USER)]
        
        for future in concurrent.futures.as_completed(futures):
            latency, status = future.result()
            if latency is not None:
                latencies.append(latency * 1000) # Convert to ms

    end_total = time.perf_counter()
    
    if not latencies:
        print("Error: No successful requests.")
        return

    # Calculate metrics
    avg_latency = statistics.mean(latencies)
    p95_latency = statistics.quantiles(latencies, n=20)[18]
    p99_latency = statistics.quantiles(latencies, n=100)[98]
    total_time = end_total - start_total
    rps = len(latencies) / total_time

    print("\n--- Stress Test Results ---")
    print(f"Total Requests: {len(latencies)}")
    print(f"Total Time:     {total_time:.2f}s")
    print(f"Requests/Sec:   {rps:.2f}")
    print(f"Avg Latency:    {avg_latency:.2f}ms")
    print(f"P95 Latency:    {p95_latency:.2f}ms")
    print(f"P99 Latency:    {p99_latency:.2f}ms")
    
    # Save results for artifact
    results = {
        "concurrent_users": CONCURRENT_USERS,
        "total_requests": len(latencies),
        "avg_latency_ms": avg_latency,
        "p95_latency_ms": p95_latency,
        "p99_latency_ms": p99_latency,
        "rps": rps
    }
    with open("stress_test_results.json", "w") as f:
        json.dump(results, f, indent=4)

if __name__ == "__main__":
    try:
        run_stress_test()
    except Exception as e:
        print(f"Stress test failed: {e}")
