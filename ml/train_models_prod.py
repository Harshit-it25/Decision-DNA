import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from imblearn.over_sampling import SMOTE
import joblib
import json
import os
import matplotlib.pyplot as plt
import seaborn as sns
from data_processor import DataProcessor

def train_production_models(data_path='dataset_large.csv'):
    # Ensure models directory exists
    os.makedirs('models', exist_ok=True)
    
    print(f"Loading data from {data_path}...")
    data = pd.read_csv(data_path)
    
    # Initialize Data Processor (no scaling, just features)
    processor = DataProcessor()
    
    # Extract Unscaled Features & Processed DataFrame
    print("Extracting features...")
    X_unscaled, df_processed = processor.get_features(data)
    
    # Target (Decision mapped to 1 for Reject, 0 for Approve - higher risk)
    y = df_processed['decision'].apply(lambda x: 1 if x == 'Reject' else 0).values
    
    # --- CRITICAL FIX 1: Split BEFORE Scaling (No Data Leakage) ---
    X_train, X_test, y_train, y_test = train_test_split(
        X_unscaled, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Initial split: {len(X_train)} train, {len(X_test)} test samples.")
    
    # --- CRITICAL FIX 2: Class Imbalance Handling (SMOTE) ---
    # Apply ONLY on the training data!
    print("Applying SMOTE to balance the training set...")
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
    print(f"After SMOTE: {len(X_train_resampled)} balanced train samples.")
    
    # --- CRITICAL FIX 3: Structured sklearn Pipeline ---
    print("Building pipelines...")
    log_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(max_iter=1000))
    ])
    
    rf_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1))
    ])
    
    # Train Pipelines
    print("Training Logistic Regression Pipeline (Monitoring)...")
    log_pipeline.fit(X_train_resampled, y_train_resampled)
    log_preds = log_pipeline.predict(X_test)
    log_acc = accuracy_score(y_test, log_preds)
    
    print("Training Random Forest Pipeline (Production)...")
    rf_pipeline.fit(X_train_resampled, y_train_resampled)
    rf_preds = rf_pipeline.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_preds)
    
    # --- CRITICAL FIX: Model Versioning & Reproducibility ---
    version_id = f"v{int(pd.Timestamp.now().timestamp())}"
    
    # Save the FULL Pipelines (Scaler is now inside!)
    joblib.dump(log_pipeline, f'models/logistic_model_{version_id}.pkl', compress=3)
    joblib.dump(rf_pipeline, f'models/random_forest_model_{version_id}.pkl', compress=3)
    
    # Keep the _prod generic hook for immediate API booting
    joblib.dump(log_pipeline, 'models/logistic_model_prod.pkl', compress=3)
    joblib.dump(rf_pipeline, 'models/random_forest_model_prod.pkl', compress=3)
    
    # --- CRITICAL FIX: Feature Importance Extract ---
    importances = rf_pipeline.named_steps['classifier'].feature_importances_
    importance_dict = {feat: float(imp) for feat, imp in zip(processor.feature_cols, importances)}
    
    # --- CRITICAL FIX 4 & 5: Proper Evaluation & Visualization ---
    report = classification_report(y_test, rf_preds, output_dict=True)
    
    metrics = {
        "model_version": version_id,
        "production_model": "random_forest_pipeline",
        "random_forest_accuracy": float(rf_acc),
        "random_forest_precision": float(report['1']['precision']),
        "random_forest_recall": float(report['1']['recall']),
        "random_forest_f1": float(report['1']['f1-score']),
        "feature_importances": importance_dict,
        "logistic_regression_accuracy": float(log_acc),
        "features": processor.feature_cols,
        "sample_size": len(data),
        "trained_at": pd.Timestamp.now().isoformat()
    }
    
    with open("models/model_metrics_prod.json", "w") as f:
        json.dump(metrics, f, indent=4)
        
    print("\n--- Training Results ---")
    print(f"Logistic Regression Accuracy: {log_acc:.4f}")
    print(f"Random Forest Accuracy: {rf_acc:.4f}")
    print("\nClassification Report (Random Forest Test Set):")
    print(classification_report(y_test, rf_preds))
    
    # Generate Confusion Matrix Chart
    cm = confusion_matrix(y_test, rf_preds)
    plt.figure(figsize=(6,5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['Approve', 'Reject'], yticklabels=['Approve', 'Reject'])
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    plt.title('Confusion Matrix - Random Forest Pipeline')
    plt.tight_layout()
    plt.savefig('models/confusion_matrix.png')
    plt.close()
    print("Saved confusion_matrix.png to models/")

if __name__ == "__main__":
    train_production_models('dataset_large.csv')
