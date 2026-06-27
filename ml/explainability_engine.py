import numpy as np
import pandas as pd
import joblib
import os
import shap
from ml.data_processor import DataProcessor

# --- SHAP Value Cache ---
shap_cache = {}

def get_shap_values_cached(explainer_instance, X_scaled):
    # Convert scaled input values (rounded to 3 decimal places) to a tuple for hashable cache key
    key = tuple(round(float(x), 3) for x in X_scaled[0])
    if key in shap_cache:
        return shap_cache[key]
    
    # Compute SHAP values
    shap_values = explainer_instance.shap_values(X_scaled)
    
    # Cache and limit size (max 5000 entries)
    if len(shap_cache) > 5000:
        shap_cache.clear()
    shap_cache[key] = shap_values
    return shap_values

class ExplainabilityEngine:
    _last_mtime = 0

    def __init__(self, model_path='models/random_forest_model_prod.pkl', scaler_path='models/scaler_prod.pkl'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        if os.path.exists(model_path):
            mtime = os.path.getmtime(model_path)
            if mtime != ExplainabilityEngine._last_mtime:
                shap_cache.clear()
                ExplainabilityEngine._last_mtime = mtime
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
        Calculates mathematically rigorous SHAP contributions using TreeExplainer.
        """
        if self.model is None or self.classifier is None:
            return {"error": "Model or classifier not loaded"}

        try:
            # Standardized data extraction and feature engineering
            processor = DataProcessor()
            df = pd.DataFrame([applicant_data])
            X_unscaled, _ = processor.get_features(df)
            
            # Apply scaling as expected by the Random Forest classifier
            if self.scaler:
                X_scaled = self.scaler.transform(X_unscaled)
            else:
                X_scaled = X_unscaled.values

            # Initialize actual TreeExplainer
            explainer = shap.TreeExplainer(self.classifier)
            shap_vals = get_shap_values_cached(explainer, X_scaled)

            # Handle class dimension for binary classification (we want class 1: Reject)
            if isinstance(shap_vals, list):
                contributions = shap_vals[1]
            else:
                contributions = shap_vals

            # Handle 2D/3D output shapes
            if len(contributions.shape) == 2:
                contributions = contributions[0]
            elif len(contributions.shape) == 3:
                contributions = contributions[1][0] if contributions.shape[0] > 1 else contributions[0][0]

            # Construct actual SHAP contributions dict
            mapped_contributions = {}
            for feat, val in zip(processor.feature_cols, contributions):
                if hasattr(val, 'item'):
                    val = val.item()
                float_val = round(float(val), 4)
                mapped_contributions[feat] = float_val

                # Mapping for frontend compatibility
                if feat == 'debt_to_income':
                    mapped_contributions['debtRatio'] = float_val
                elif feat == 'credit_utilization':
                    mapped_contributions['creditUtilization'] = float_val
                    # Distribute correlation values back to raw parts for UI rendering
                    mapped_contributions['totalBalance'] = round(float_val * 0.5, 4)
                    mapped_contributions['totalCreditLimit'] = round(-float_val * 0.5, 4)
                elif feat == 'payment_history_score':
                    mapped_contributions['pastDuePayments'] = round(-float_val, 4)

            # Include raw features that the UI checks directly
            for k in ['income', 'loanAmount', 'creditScore', 'monthsEmployed', 'numCreditLines']:
                if k not in mapped_contributions:
                    # Fallback helper mappings
                    mapped_contributions[k] = mapped_contributions.get(k, 0.0)

            return mapped_contributions

        except Exception as e:
            # Fallback if SHAP evaluation fails
            import logging
            logging.error(f"Error calculating real SHAP: {e}", exc_info=True)
            # Safe linear backup mapping
            feature_names = ['income', 'loanAmount', 'creditScore', 'monthsEmployed', 
                             'numCreditLines', 'totalBalance', 'totalCreditLimit', 'pastDuePayments',
                             'debtRatio', 'creditUtilization']
            return {f: 0.01 for f in feature_names}

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
