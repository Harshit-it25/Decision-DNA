import numpy as np
import pandas as pd
import joblib
import os

class ExplainabilityEngine:
    def __init__(self, model_path='models/random_forest_model_prod.pkl', scaler_path='models/scaler_prod.pkl'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            # Check if it's a pipeline or a direct model
            if hasattr(self.model, 'named_steps'):
                self.classifier = self.model.named_steps['classifier']
                self.scaler = self.model.named_steps['scaler']
            else:
                self.classifier = self.model
                self.scaler = joblib.load(scaler_path) if os.path.exists(scaler_path) else None
        else:
            self.model = None

    def get_feature_contributions(self, applicant_data):
        """
        Calculates a simplified SHAP-like contribution for each feature.
        """
        if self.model is None:
            return {"error": "Model not loaded"}

        # Extract features in correct order
        feature_names = ['income', 'loanAmount', 'creditScore', 'monthsEmployed', 
                         'numCreditLines', 'totalBalance', 'totalCreditLimit', 'pastDuePayments']
        
        # In a real system, we'd use SHAP. Here we estimate based on feature importances 
        # and the feature's deviation from the mean/median.
        importances = self.classifier.feature_importances_
        
        # Standardize data to see deviation
        try:
            df = pd.DataFrame([applicant_data])[feature_names]
            if hasattr(self.model, 'named_steps'):
                # It's a pipeline, we don't need manual scaling for internal logic, 
                # but we need it to see relative impacts.
                X_scaled = self.scaler.transform(df)[0]
            else:
                X_scaled = self.scaler.transform(df)[0] if self.scaler else np.zeros(len(feature_names))
        except Exception:
            # Fallback if processing fails
            return {f: 0.1 for f in feature_names}

        contributions = {}
        for i, name in enumerate(feature_names):
            # Contribution = (scaled_value * importance)
            # This is a heuristic: high value in a positive feature increases score
            val = float(X_scaled[i])
            imp = float(importances[i])
            contributions[name] = val * imp

        return contributions

    def generate_counterfactuals(self, applicant_data, target_decision="Approve"):
        """
        Suggests minimal changes to flip the decision.
        """
        # This is a wrapper around the AdversarialTester's logic
        from ml.adversarial_tester import AdversarialTester
        tester = AdversarialTester(self.model_path, self.scaler_path)
        
        # Target decision mapping (AdversarialTester uses APPROVE/REJECT uppercase)
        target = target_decision.upper()
        res = tester.find_adversarial_perturbation(applicant_data, target_decision=target, max_iters=20)
        
        if not res.get('success'):
            return []

        # Compare original to adversarial
        changes = []
        for feat, new_val in res['adversarial_data'].items():
            orig_val = applicant_data.get(feat)
            if orig_val is not None and abs(float(new_val) - float(orig_val)) > 0.01:
                diff = float(new_val) - float(orig_val)
                changes.append({
                    "feature": feat,
                    "direction": "Increase" if diff > 0 else "Decrease",
                    "amount": round(abs(diff), 2),
                    "new_value": round(float(new_val), 2),
                    "targetDecision": target_decision
                })
        
        return changes[:3] # Return top 3 suggested changes

if __name__ == "__main__":
    engine = ExplainabilityEngine()
    sample = {
        "income": 45000,
        "loanAmount": 150000,
        "creditScore": 620,
        "monthsEmployed": 24,
        "numCreditLines": 5,
        "totalBalance": 12000,
        "totalCreditLimit": 20000,
        "pastDuePayments": 1
    }
    contribs = engine.get_feature_contributions(sample)
    print("Feature Contributions:", contribs)
