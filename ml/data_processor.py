import pandas as pd
import numpy as np
import os

class DataProcessor:
    def __init__(self):
        self.feature_cols = [
            'income', 'loanAmount', 'creditScore', 
            'debt_to_income', 'credit_utilization', 
            'payment_history_score', 'loan_repayment_ratio'
        ]

    def clean_data(self, df):
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

    def engineer_features(self, df):
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

    def get_features(self, df):
        """Clean, engineer, and return only the unscaled feature matrix."""
        df_clean = self.clean_data(df)
        df_engineered = self.engineer_features(df_clean)
        return df_engineered[self.feature_cols], df_engineered

if __name__ == "__main__":
    # Test run
    processor = DataProcessor()
    # Load raw data if exists
    if os.path.exists('dataset.csv'):
        df_raw = pd.read_csv('dataset.csv')
        X_unscaled, df_processed = processor.get_features(df_raw)
        print(f"Processed features: {processor.feature_cols}")
        print(f"Unscaled shape: {X_unscaled.shape}")
        df_processed.to_csv('dataset_processed.csv', index=False)

