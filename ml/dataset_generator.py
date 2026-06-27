import pandas as pd
import numpy as np
import os

def generate_large_dataset(n_samples=100000, output_path='dataset.csv'):
    print(f"Generating {n_samples} samples...")
    
    np.random.seed(42)
    
    # Generate age first to derive age_group
    age = np.random.randint(18, 80, n_samples)
    age_group = []
    for a in age:
        if a <= 25:
            age_group.append('18-25')
        elif a <= 40:
            age_group.append('26-40')
        elif a <= 60:
            age_group.append('41-60')
        else:
            age_group.append('60+')
            
    income = np.random.normal(50000, 20000, n_samples).clip(15000, 250000)
    loanAmount = np.random.normal(15000, 10000, n_samples).clip(1000, 100000)
    debtRatio = (loanAmount / income).clip(0.01, 0.99)
    
    data = {
        'id': [f'LP-{10000+i}' for i in range(n_samples)],
        'name': [f'User {i}' for i in range(n_samples)],
        'nationality': np.random.choice(['USA', 'Germany', 'UK', 'Canada', 'India', 'France'], n_samples),
        'income': income,
        'debtRatio': debtRatio,
        'creditScore': np.random.randint(300, 851, n_samples),
        'loanAmount': loanAmount,
        'gender': np.random.choice(['Male', 'Female', 'Other'], n_samples, p=[0.48, 0.48, 0.04]),
        'age': age,
        'monthsEmployed': np.random.randint(0, 480, n_samples),
        'numCreditLines': np.random.randint(1, 15, n_samples),
        'totalCreditLimit': np.random.normal(30000, 15000, n_samples).clip(1000, 200000),
        'totalBalance': np.random.normal(10000, 8000, n_samples).clip(0, 150000),
        'pastDuePayments': np.random.randint(0, 10, n_samples),
        'educationLevel': np.random.choice(['High School', 'Bachelor', 'Master', 'PhD'], n_samples),
        'employmentStatus': np.random.choice(['Employed', 'Self-Employed', 'Unemployed'], n_samples),
        'maritalStatus': np.random.choice(['Single', 'Married', 'Divorced'], n_samples),
        'age_group': age_group,
        'ethnicity': np.random.choice(['Group A', 'Group B', 'Group C', 'Group D'], n_samples)
    }
    
    df = pd.DataFrame(data)
    
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
    
    # Dynamic threshold to ensure ~71.5% Approve (71k-72k) and ~28.5% Reject (28k-29k)
    threshold = np.percentile(df['riskProbability'], 28.5)
    df['decision'] = df['riskProbability'].apply(lambda x: 'Approve' if x > threshold else 'Reject')
    
    # Reorder columns to align the first 11 columns with the old schema for app/main.py compatibility
    cols = [
        'id', 'name', 'nationality', 'income', 'debtRatio', 'creditScore', 'loanAmount', 
        'gender', 'age', 'riskProbability', 'decision',
        'monthsEmployed', 'numCreditLines', 'totalCreditLimit', 'totalBalance', 
        'pastDuePayments', 'educationLevel', 'employmentStatus', 'maritalStatus', 
        'age_group', 'ethnicity'
    ]
    df = df[cols]
    
    df.to_csv(output_path, index=False)
    print(f"Dataset saved to {output_path}")

if __name__ == "__main__":
    os.makedirs('ml', exist_ok=True)
    generate_large_dataset(100000, 'dataset.csv')
