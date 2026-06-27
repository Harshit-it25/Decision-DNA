import pandas as pd
import numpy as np
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.db import load_applicants_as_dataframe, DB_MODE
import os
from typing import Tuple, List

class DataProcessor:
    def __init__(self, scaler_path=None) -> None:
        self.feature_cols: List[str] = [
            'income', 'loanAmount', 'creditScore', 
            'debt_to_income', 'credit_utilization', 
            'payment_history_score', 'loan_repayment_ratio'
        ]
        self.scaler = None
        if scaler_path and os.path.exists(scaler_path):
            import joblib
            try:
                self.scaler = joblib.load(scaler_path)
            except Exception as e:
                print(f"Warning: Failed to load scaler from {scaler_path}: {e}")

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        X_unscaled, _ = self.get_features(df)
        if self.scaler is not None:
            scaled_arr = self.scaler.transform(X_unscaled)
            return pd.DataFrame(scaled_arr, columns=self.feature_cols, index=X_unscaled.index)
        return X_unscaled

    def fit_transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        X_unscaled, df_processed = self.get_features(df)
        from sklearn.preprocessing import StandardScaler
        self.scaler = StandardScaler()
        scaled_arr = self.scaler.fit_transform(X_unscaled)
        X_scaled = pd.DataFrame(scaled_arr, columns=self.feature_cols, index=X_unscaled.index)
        return X_scaled, df_processed

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean missing values and standardize formats."""
        df = df.copy()
        # Fill numeric missing with median
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        
        # Fill categorical with mode
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            df[col] = df[col].fillna(df[col].mode()[0])
            
        return df

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create production-quality features."""
        df = df.copy()
        # 1. Debt-to-income ratio (DTI)
        df['debt_to_income'] = df['loanAmount'] / df['income']
        
        # 2. Credit utilization
        if 'totalBalance' in df.columns and 'totalCreditLimit' in df.columns:
            df['credit_utilization'] = df['totalBalance'] / df['totalCreditLimit']
        else:
            df['credit_utilization'] = 0.3 # Default representative value
            
        # 3. Payment history score (inverse of past due payments)
        if 'pastDuePayments' in df.columns:
            df['payment_history_score'] = (10 - df['pastDuePayments']).clip(0, 10) / 10
        else:
            df['payment_history_score'] = 1.0
            
        # 4. Loan repayment ratio (income / loanAmount)
        df['loan_repayment_ratio'] = df['income'] / df['loanAmount']
        
        # Ensure no infinity/nan from division
        df = df.replace([np.inf, -np.inf], np.nan).fillna(0)
        
        return df

    def get_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Clean, engineer, and return only the unscaled feature matrix."""
        df_clean = self.clean_data(df)
        df_engineered = self.engineer_features(df_clean)
        return df_engineered[self.feature_cols], df_engineered

if __name__ == "__main__":
    # Test run
    processor = DataProcessor()
    try:
        df_raw = load_applicants_as_dataframe()
        X_unscaled, df_processed = processor.get_features(df_raw)
        print(f"Processed features: {processor.feature_cols}")
        print(f"Unscaled shape: {X_unscaled.shape}")
        df_processed.to_csv('dataset_processed.csv', index=False)
    except Exception as e:
        print(f"Error loading or processing data: {e}")

