import requests

def test_login():
    url = "http://127.0.0.1:8007/api/token"
    data = {
        "username": "admin",
        "password": "decision_dna_2024"
    }
    response = requests.post(url, data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_login()
