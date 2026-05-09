import pandas as pd
import numpy as np
import os
import sys
import hashlib
import json

# Add parents directory to path to import DataProcessor
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from ml.data_processor import DataProcessor

class Watermarker:
    def __init__(self, secret_key="decision-dna-org-secret", scaler_path='models/scaler_prod.pkl'):
        self.secret_key = secret_key
        self.processor = DataProcessor(scaler_path=scaler_path)
        
    def generate_watermark_triggers(self, num_triggers=50):
        """
        Generates a set of pseudo-random applicant profiles derived from a secret key.
        These profiles will be trained to always result in a specific decision (e.g., REJECT).
        """
        triggers = []
        
        # Use hashing to generate stable but "unusual" values from the secret key
        for i in range(num_triggers):
            seed = f"{self.secret_key}-{i}"
            h = hashlib.sha256(seed.encode()).hexdigest()
            
            # Map hash segments to features (keeping them within realistic but "corner" ranges)
            # Example: very high income but extremely high loan amount, or specific credit scores
            trigger = {
                "income": 100000 + (int(h[0:4], 16) % 50000),
                "loanAmount": 200000 + (int(h[4:8], 16) % 100000),
                "creditScore": 600 + (int(h[8:12], 16) % 100),
                "monthsEmployed": int(h[12:14], 16) % 120,
                "numCreditLines": int(h[14:16], 16) % 15,
                "totalBalance": 50000 + (int(h[16:20], 16) % 50000),
                "totalCreditLimit": 100000 + (int(h[20:24], 16) % 50000),
                "pastDuePayments": int(h[24:26], 16) % 5,
                "employmentType": "Full-time",
                "loanPurpose": "Debt consolidation",
                "homeOwnership": "Mortgage",
                "education": "Bachelor's",
                "gender": "Other", # Low frequency category often good for triggers
                "ethnicity": "Other",
                "age_group": "65+",
                "maritalStatus": "Single",
                "decision": "Reject" # This is the target "signature"
            }
            triggers.append(trigger)
            
        return pd.DataFrame(triggers)

    def verify_watermark(self, model, sample_size=20):
        """
        Tests the model against the watermark triggers.
        Returns the percentage of triggers the model correctly identifies.
        """
        triggers_df = self.generate_watermark_triggers(num_triggers=sample_size)
        
        # Drop the target decision for prediction
        X_test_df = triggers_df.drop('decision', axis=1)
        X_scaled = self.processor.transform(X_test_df)
        
        probs = model.predict_proba(X_scaled)[:, 1]
        # In our project, Reject is prob >= 0.5
        predictions = ["Reject" if p >= 0.5 else "Approve" for p in probs]
        
        correct = sum([1 for p, t in zip(predictions, triggers_df['decision']) if p == t])
        score = correct / sample_size
        
        return {
            "is_watermarked": score > 0.8, # Threshold for positive identification
            "confidence": score,
            "sample_size": sample_size,
            "correct_responses": correct
        }

if __name__ == "__main__":
    import joblib
    wm = Watermarker()
    triggers = wm.generate_watermark_triggers(5)
    print("Sample Watermark Trigger:")
    print(triggers.iloc[0].to_dict())
    
    model_path = 'models/random_forest_model_prod.pkl'
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        results = wm.verify_watermark(model)
        print("\nVerification Results:")
        print(f"Is Watermarked: {results['is_watermarked']}")
        print(f"Confidence: {results['confidence']:.2f}")
