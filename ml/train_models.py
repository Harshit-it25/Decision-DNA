import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import joblib
import json
import os

# Ensure models directory exists
os.makedirs('../models', exist_ok=True)

# Load data
# Assuming dataset.csv is in the root directory
data = pd.read_csv('../dataset.csv')

# Create target column from decision if it doesn't exist
if 'target' not in data.columns and 'decision' in data.columns:
    data['target'] = data['decision'].apply(lambda x: 1 if x == 'Approve' else 0)

# Issue 1: Remove riskProbability and select specific features in order
# Final features should be: income, debtRatio, creditScore, loanAmount
features = ['income', 'debtRatio', 'creditScore', 'loanAmount']
X = data[features]
y = data['target']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train Logistic Regression (Monitoring Role)
log_model = LogisticRegression()
log_model.fit(X_train_scaled, y_train)
log_acc = accuracy_score(y_test, log_model.predict(X_test_scaled))

# Train Random Forest (Production Role)
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train_scaled, y_train)
rf_acc = accuracy_score(y_test, rf_model.predict(X_test_scaled))

# Save models and scaler
joblib.dump(log_model, '../models/logistic_model.pkl')
joblib.dump(rf_model, '../models/random_forest_model.pkl')
joblib.dump(scaler, '../models/scaler.pkl')

# Issue 3: Save Model Metrics for Dashboard
metrics = {
    "logistic_regression_accuracy": float(log_acc),
    "random_forest_accuracy": float(rf_acc),
    "features": list(X.columns)
}

with open("../models/model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=4)

# Issue 4: Production Model is defined as Random Forest in the pipeline
# The backend should load models/random_forest_model.pkl

print(f"Logistic Regression Accuracy: {log_acc:.4f}")
print(f"Random Forest Accuracy: {rf_acc:.4f}")
print("Models and metrics saved to ../models/")
