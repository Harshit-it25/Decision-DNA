import pandas as pd
import joblib
import os
import sys
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import json
from datetime import datetime

# Add parent path to allow app.db import
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.db import load_applicants_as_dataframe, DB_MODE

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
    
    if DB_MODE == 'sqlite' and not os.path.exists(DATA_PROCESSED_PATH):
        print("Processed data not found. Retraining aborted.")
        return False
    
    try:
        # 1. Load Data
        df = load_applicants_as_dataframe()
        from data_processor import DataProcessor
        processor = DataProcessor()
        X, _ = processor.get_features(df)
        y = df['decision'].apply(lambda x: 1 if x == 'Reject' else 0).values
        
        # Split data to evaluate properly
        from sklearn.model_selection import train_test_split
        from imblearn.over_sampling import SMOTE
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Apply SMOTE to handle imbalance on training split
        print("Applying SMOTE to balance the training set...")
        smote = SMOTE(random_state=42)
        X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
        
        # 2. Train New Models in Pipelines
        print("Training new production model (Random Forest)...")
        rf_pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1))
        ])
        rf_pipeline.fit(X_train_resampled, y_train_resampled)
        rf_acc = accuracy_score(y_test, rf_pipeline.predict(X_test))
        
        print("Training new monitoring model (Logistic Regression)...")
        lr_pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', LogisticRegression(max_iter=1000))
        ])
        lr_pipeline.fit(X_train_resampled, y_train_resampled)
        lr_acc = accuracy_score(y_test, lr_pipeline.predict(X_test))
        
        print(f"New Model Performance - RF: {rf_acc:.4f}, LR: {lr_acc:.4f}")
        
        # 3. Model Promotion Logic
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        versioned_rf = os.path.join(MODELS_DIR, f"rf_model_{timestamp}.pkl")
        versioned_lr = os.path.join(MODELS_DIR, f"lr_model_{timestamp}.pkl")
        
        joblib.dump(rf_pipeline, versioned_rf, compress=3)
        joblib.dump(lr_pipeline, versioned_lr, compress=3)
        
        # Update main models (Promotion)
        joblib.dump(rf_pipeline, MODEL_PATH, compress=3)
        joblib.dump(lr_pipeline, MONITOR_MODEL_PATH, compress=3)
        
        # Dump the fitted scaler separately to SCALER_PATH
        joblib.dump(rf_pipeline.named_steps['scaler'], SCALER_PATH, compress=3)
        
        # Update metrics
        metrics = {
            "last_retrained": datetime.now().isoformat(),
            "accuracy": rf_acc,
            "random_forest_accuracy": rf_acc,
            "logistic_regression_accuracy": lr_acc,
            "version": timestamp,
            "status": "PROMOTED"
        }
        with open(METRICS_PATH, 'w') as f:
            json.dump(metrics, f)
            
        print(f"Model promotion successful. Version: {timestamp}")
        return True
        
    except Exception as e:
        print(f"Retraining failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    run_retraining()
