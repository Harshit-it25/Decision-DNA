import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os
import sys
import json
from datetime import datetime

# Add parents directory to path to import local modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from ml.data_processor import DataProcessor
from ml.adversarial_tester import AdversarialTester
from ml.watermarker import Watermarker

class RobustTrainer:
    def __init__(self, data_path='dataset_large.csv', model_path='models/random_forest_model_prod.pkl', scaler_path='models/scaler_prod.pkl'):
        self.data_path = data_path
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.processor = DataProcessor(scaler_path=scaler_path)
        
    def generate_adversarial_dataset(self, base_df, fraction=0.1):
        """
        Creates a dataset of adversarial examples to merge into training.
        """
        tester = AdversarialTester(self.model_path, self.scaler_path)
        
        # We focus on samples the model currently gets "right" but could be flipped easily
        # For simplicity, we just pick 10% of the data and find perturbations
        sample_df = base_df.sample(frac=fraction)
        adversarial_examples = []
        
        print(f"Generating adversarial examples for {len(sample_df)} records...")
        
        for _, row in sample_df.iterrows():
            applicant = row.to_dict()
            # Clean for processor
            clean_app = {k: v for k, v in applicant.items() if k in ['income', 'loanAmount', 'creditScore', 'monthsEmployed', 'numCreditLines', 'totalBalance', 'totalCreditLimit', 'pastDuePayments']}
            
            # Find perturbation (regardless of current decision, just try to find a flip)
            target = "REJECT" if applicant['decision'] == 'Approve' else "APPROVE"
            res = tester.find_adversarial_perturbation(clean_app, target_decision=target, max_iters=20)
            
            if res.get('success'):
                adv_row = applicant.copy()
                for k, v in res['adversarial_data'].items():
                    adv_row[k] = v
                # Crucially: We keep the ORIGINAL label. This teaches the model that 
                # even with these perturbations, the decision should NOT change.
                adversarial_examples.append(adv_row)
        
        return pd.DataFrame(adversarial_examples)

    def train_hardened_model(self, adversarial_fraction=0.02):
        """
        Retrains the model with augmented adversarial data.
        """
        data_path = self.data_path
        if not os.path.exists(data_path):
            if data_path == 'dataset_large.csv' and os.path.exists('dataset.csv'):
                data_path = 'dataset.csv'
            elif data_path == 'dataset.csv' and os.path.exists('dataset_large.csv'):
                data_path = 'dataset_large.csv'
            else:
                return {"error": f"Source dataset {data_path} not found"}

        print(f"Loading base data from {data_path}...")
        df = pd.read_csv(data_path)
        
        # 1. Generate Adversaries
        adv_df = self.generate_adversarial_dataset(df, fraction=adversarial_fraction)
        # 2. Generate Watermark Triggers
        wm = Watermarker(scaler_path=self.scaler_path)
        wm_df = wm.generate_watermark_triggers(num_triggers=100)
        print(f"Injecting {len(wm_df)} digital watermark triggers.")
        
        # 3. Combine datasets
        combined_df = pd.concat([df, adv_df, wm_df], ignore_index=True)
        
        # 4. Process data
        X_unscaled, df_processed = self.processor.get_features(combined_df)
        y = df_processed['decision'].apply(lambda x: 1 if x == 'Reject' else 0).values
        
        # 5. Split (No data leakage)
        X_train, X_test, y_train, y_test = train_test_split(X_unscaled, y, test_size=0.2, random_state=42)
        
        # Apply SMOTE to handle imbalance on training split
        from imblearn.over_sampling import SMOTE
        print("Applying SMOTE to balance the training set...")
        smote = SMOTE(random_state=42)
        X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
        
        # 6. Retrain inside a Pipeline
        print("Retraining hardened Random Forest Pipeline...")
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler
        from sklearn.metrics import accuracy_score
        
        hardened_pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1))
        ])
        hardened_pipeline.fit(X_train_resampled, y_train_resampled)
        rf_acc = accuracy_score(y_test, hardened_pipeline.predict(X_test))
        
        # 7. Evaluate and Save
        joblib.dump(hardened_pipeline, self.model_path, compress=3)
        joblib.dump(hardened_pipeline.named_steps['scaler'], self.scaler_path, compress=3)
        
        # Update metadata
        meta_path = 'models/model_metadata_prod.json'
        if os.path.exists(meta_path):
            with open(meta_path, 'r') as f:
                meta = json.load(f)
            meta['version'] = "2.2.0-protected"
            meta['trained_at'] = datetime.now().strftime('%Y-%m-%d')
            meta['is_hardened'] = True
            meta['is_watermarked'] = True
            with open(meta_path, 'w') as f:
                json.dump(meta, f, indent=4)
        
        # Update metrics
        metrics_path = 'models/model_metrics_prod.json'
        if os.path.exists(metrics_path):
            try:
                with open(metrics_path, 'r') as f:
                    metrics = json.load(f)
            except Exception:
                metrics = {}
            metrics["random_forest_accuracy"] = float(rf_acc)
            metrics["last_retrained"] = datetime.now().isoformat()
            with open(metrics_path, 'w') as f:
                json.dump(metrics, f, indent=4)
        
        # Run a quick red-team check on the new model
        tester = AdversarialTester(self.model_path, self.scaler_path)
        audit = tester.run_red_team_audit(sample_size=10)
        
        # Verify watermark
        wm = Watermarker(scaler_path=self.scaler_path)
        wm_verification = wm.verify_watermark(hardened_pipeline)
        
        return {
            "status": "success",
            "new_version": "2.2.0-protected",
            "adversaries_added": len(adv_df),
            "robustness_score": audit['avg_robustness'],
            "watermark_confidence": wm_verification['confidence'],
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    trainer = RobustTrainer()
    res = trainer.train_hardened_model(adversarial_fraction=0.0001)
    print(f"Hardening Complete. New Robustness: {res['robustness_score']:.2f}")
