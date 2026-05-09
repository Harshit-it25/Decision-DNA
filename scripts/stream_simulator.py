import json
import time
import requests
import random
import threading

# Configuration
API_URL = "http://localhost:8000/api/predict"
STREAM_DELAY = 2.0 # seconds between applications

def kafka_producer_simulator():
    """Simulates a stream of loan applications entering Kafka."""
    print("[Kafka Producer] Starting simulation...")
    while True:
        application = {
            "income": random.uniform(20000, 150000),
            "loanAmount": random.uniform(5000, 80000),
            "creditScore": random.randint(300, 850),
            "monthsEmployed": random.randint(0, 360),
            "pastDuePayments": random.choice([0, 0, 0, 1, 2])
        }
        
        # Simulate pushing to Kafka topic 'loan_applications'
        yield application
        time.sleep(STREAM_DELAY)

def kafka_consumer_simulator():
    """Simulates the prediction service consuming from Kafka."""
    print("[Kafka Consumer] Starting listener...")
    producer = kafka_producer_simulator()
    
    for app_data in producer:
        try:
            print(f"\n[Stream] Received application: Income=${app_data['income']:.0f}, Credit={app_data['creditScore']}")
            
            # Forward to Prediction API
            response = requests.post(API_URL, json=app_data)
            result = response.json()
            
            decision = result.get('decision')
            risk = result.get('risk_score')
            
            print(f"[Stream] Processing Decision: {decision} (Risk: {risk})")
            
            # Simulate logging to monitoring system (already handled by API logs, 
            # but in real prod this would go to another Kafka topic or DB)
        except Exception as e:
            print(f"[Stream] Error processing application: {e}")

if __name__ == "__main__":
    kafka_consumer_simulator()
