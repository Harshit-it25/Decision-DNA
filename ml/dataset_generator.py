import pandas as pd
import numpy as np
import os

def generate_large_dataset(n_samples=100000, output_path='dataset_large.csv'):
    print(f"Generating {n_samples} samples...")
    
    np.random.seed(42)
    
    data = {
        'id': [f'LP-{10000+i}' for i in range(n_samples)],
        'name': [f'User {i}' for i in range(n_samples)],
        'income': np.random.normal(50000, 20000, n_samples).clip(15000, 250000),
        'loanAmount': np.random.normal(15000, 10000, n_samples).clip(1000, 100000),
        'creditScore': np.random.randint(300, 851, n_samples),
        'monthsEmployed': np.random.randint(0, 480, n_samples),
        'numCreditLines': np.random.randint(1, 15, n_samples),
        'totalCreditLimit': np.random.normal(30000, 15000, n_samples).clip(1000, 200000),
        'totalBalance': np.random.normal(10000, 8000, n_samples).clip(0, 150000),
        'pastDuePayments': np.random.randint(0, 10, n_samples),
        'educationLevel': np.random.choice(['High School', 'Bachelor', 'Master', 'PhD'], n_samples),
        'employmentStatus': np.random.choice(['Employed', 'Self-Employed', 'Unemployed'], n_samples),
        'maritalStatus': np.random.choice(['Single', 'Married', 'Divorced'], n_samples),
        'gender': np.random.choice(['Male', 'Female', 'Other'], n_samples, p=[0.48, 0.48, 0.04]),
        'age_group': np.random.choice(['18-25', '26-40', '41-60', '60+'], n_samples, p=[0.2, 0.4, 0.3, 0.1]),
        'ethnicity': np.random.choice(['Group A', 'Group B', 'Group C', 'Group D'], n_samples)
    }

    
    df = pd.DataFrame(data)
    
    # Simulate a target: Decision (Approve/Reject)
    # Simple rule-based target for now, models will learn this
    # Introduce a *deliberate* slight bias against 'Female' and '18-25' to demonstrate the fairness auditor
    bias_penalty = np.zeros(n_samples)
    
    # Apply a 5% penalty to females
    bias_penalty += np.where(df['gender'] == 'Female', 0.05, 0)
    # Apply a 10% penalty to young applicants
    bias_penalty += np.where(df['age_group'] == '18-25', 0.10, 0)
    
    score = (
        (df['creditScore'] / 850) * 0.4 +
        (df['income'] / 250000) * 0.3 -
        (df['loanAmount'] / df['income']).clip(0, 2) * 0.3 +
        (df['monthsEmployed'] / 480) * 0.1 -
        bias_penalty
    )
    
    df['riskProbability'] = 1 / (1 + np.exp(-(score - 0.5) * 10))
    df['decision'] = df['riskProbability'].apply(lambda x: 'Approve' if x > 0.4 else 'Reject')
    
    df.to_csv(output_path, index=False)
    print(f"Dataset saved to {output_path}")

if __name__ == "__main__":
    os.makedirs('ml', exist_ok=True)
    generate_large_dataset(100000, 'dataset_large.csv')
