import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import json
from datetime import datetime

# Paths
DATA_PATH = "dataset.csv"
DATA_PROCESSED_PATH = "dataset_processed.csv"
MODELS_DIR = "models"
MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model_prod.pkl")
MONITOR_MODEL_PATH = os.path.join(MODELS_DIR, "logistic_model_prod.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler_prod.pkl")
METRICS_PATH = os.path.join(MODELS_DIR, "model_metrics_prod.json")

def run_retraining():
    print(f"[{datetime.now().isoformat()}] Starting automated retraining pipeline...")
    
    if not os.path.exists(DATA_PROCESSED_PATH):
        print("Processed data not found. Retraining aborted.")
        return False
    
    try:
        # 1. Load Data
        df = pd.read_csv(DATA_PATH)
        from data_processor import DataProcessor
        processor = DataProcessor()
        X, _ = processor.get_features(df)
        y = df['decision'].apply(lambda x: 1 if x == 'Reject' else 0)
        
        # 2. Train New Models
        print("Training new production model (Random Forest)...")
        rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        rf_model.fit(X, y)
        rf_acc = accuracy_score(y, rf_model.predict(X))
        
        print("Training new monitoring model (Logistic Regression)...")
        lr_model = LogisticRegression(max_iter=1000)
        lr_model.fit(X, y)
        lr_acc = accuracy_score(y, lr_model.predict(X))
        
        print(f"New Model Performance - RF: {rf_acc:.4f}, LR: {lr_acc:.4f}")
        
        # 3. Model Promotion Logic (Simplified: Promote if training succeeds)
        # In real prod, compare with current model on a hold-out test set.
        
        # Save models with versioning (timestamped)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        versioned_rf = os.path.join(MODELS_DIR, f"rf_model_{timestamp}.pkl")
        versioned_lr = os.path.join(MODELS_DIR, f"lr_model_{timestamp}.pkl")
        
        joblib.dump(rf_model, versioned_rf, compress=3)
        joblib.dump(lr_model, versioned_lr, compress=3)
        
        # Update main models (Promotion)
        joblib.dump(rf_model, MODEL_PATH, compress=3)
        joblib.dump(lr_model, MONITOR_MODEL_PATH, compress=3)
        
        # Update metrics
        metrics = {
            "last_retrained": datetime.now().isoformat(),
            "accuracy": rf_acc,
            "version": timestamp,
            "status": "PROMOTED"
        }
        with open(METRICS_PATH, 'w') as f:
            json.dump(metrics, f)
            
        print(f"Model promotion successful. Version: {timestamp}")
        return True
        
    except Exception as e:
        print(f"Retraining failed: {e}")
        return False

if __name__ == "__main__":
    run_retraining()
