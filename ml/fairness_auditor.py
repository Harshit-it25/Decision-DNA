import pandas as pd
import numpy as np

def calculate_disparate_impact(df, protected_attr, privileged_class, unprivileged_class, target_col='decision', favorable_outcome='Approve'):
    """
    Calculates Disparate Impact (DI).
    DI = P(Outcome=Favorable | Unprivileged) / P(Outcome=Favorable | Privileged)
    A value < 0.8 is often considered discriminatory (four-fifths rule).
    """
    if protected_attr not in df.columns:
        return 1.0

    priv_total = len(df[df[protected_attr] == privileged_class])
    unpriv_total = len(df[df[protected_attr] == unprivileged_class])

    if priv_total == 0 or unpriv_total == 0:
        return 1.0

    priv_fav = len(df[(df[protected_attr] == privileged_class) & (df[target_col] == favorable_outcome)])
    unpriv_fav = len(df[(df[protected_attr] == unprivileged_class) & (df[target_col] == favorable_outcome)])

    priv_rate = priv_fav / priv_total
    unpriv_rate = unpriv_fav / unpriv_total

    if priv_rate == 0:
        return 1.0

    return unpriv_rate / priv_rate

def calculate_statistical_parity_difference(df, protected_attr, privileged_class, unprivileged_class, target_col='decision', favorable_outcome='Approve'):
    """
    Calculates Statistical Parity Difference (SPD).
    SPD = P(Outcome=Favorable | Unprivileged) - P(Outcome=Favorable | Privileged)
    A value between -0.1 and 0.1 is usually acceptable.
    """
    if protected_attr not in df.columns:
        return 0.0

    priv_total = len(df[df[protected_attr] == privileged_class])
    unpriv_total = len(df[df[protected_attr] == unprivileged_class])

    if priv_total == 0 or unpriv_total == 0:
        return 0.0

    priv_fav = len(df[(df[protected_attr] == privileged_class) & (df[target_col] == favorable_outcome)])
    unpriv_fav = len(df[(df[protected_attr] == unprivileged_class) & (df[target_col] == favorable_outcome)])

    priv_rate = priv_fav / priv_total
    unpriv_rate = unpriv_fav / unpriv_total

    return unpriv_rate - priv_rate

def get_fairness_metrics(df_path='dataset.csv', model=None, processor=None, sample_size=100000):
    """
    Loads data, predicts outcomes with the model, and calculates fairness metrics.
    """
    try:
        df = pd.read_csv(df_path, on_bad_lines='skip')
    except FileNotFoundError:
        try:
            df = pd.read_csv('dataset_processed.csv', on_bad_lines='skip')
        except FileNotFoundError:
            return {"error": "Dataset not found"}

    # Use a sample for speed if dataset is huge
    if len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42)

    # Use actual model predictions if provided, else use the existing 'decision' column
    # Since the objective is model auditing, we should score the sample with the real model
    if model and processor:
        try:
            if hasattr(model, 'named_steps'):
                X_input, _ = processor.get_features(df)
            else:
                X_input = processor.transform(df)
            preds = model.predict(X_input)
            df['predicted_decision'] = ['Reject' if p == 1 else 'Approve' for p in preds]  # 1=Reject, 0=Approve (matches train_models_prod.py)
            target_col = 'predicted_decision'
        except Exception as e:
            print(f"Error predicting for fairness audit: {e}")
            target_col = 'decision'
    else:
        target_col = 'decision'


    metrics = {}

    # Create age_group if it doesn't exist but age does
    if 'age_group' not in df.columns and 'age' in df.columns:
        bins = [0, 25, 40, 60, 150]
        labels = ['18-25', '26-40', '41-60', '60+']
        df['age_group'] = pd.cut(df['age'], bins=bins, labels=labels, right=True)

    # 1. Gender Bias Analysis
    gender_di = calculate_disparate_impact(df, 'gender', 'Male', 'Female', target_col=target_col)
    gender_spd = calculate_statistical_parity_difference(df, 'gender', 'Male', 'Female', target_col=target_col)
    
    # 2. Age Bias Analysis (Privileged: 26-40, Unprivileged: 18-25)
    age_di = calculate_disparate_impact(df, 'age_group', '26-40', '18-25', target_col=target_col)
    age_spd = calculate_statistical_parity_difference(df, 'age_group', '26-40', '18-25', target_col=target_col)

    # Calculate actual approval rates for visualization
    def get_rates(attr):
        rates = {}
        if attr in df.columns:
            for val in df[attr].unique():
                if pd.isna(val):
                    continue
                total = len(df[df[attr] == val])
                approved = len(df[(df[attr] == val) & (df[target_col] == 'Approve')])
                rates[str(val)] = round((approved / total) * 100, 2) if total > 0 else 0
        return rates

    metrics['rates'] = {
        'gender': get_rates('gender'),
        'age_group': get_rates('age_group')
    }

    metrics['metrics'] = {
        'gender': {
            'disparate_impact': round(gender_di, 3),
            'statistical_parity_difference': round(gender_spd, 3),
            'status': 'Biased' if gender_di < 0.8 else 'Fair'
        },
        'age_group': {
            'disparate_impact': round(age_di, 3),
            'statistical_parity_difference': round(age_spd, 3),
            'status': 'Biased' if age_di < 0.8 else 'Fair'
        }
    }

    # Dynamically calculate "real" mitigation thresholds using Threshold Shifting
    # Base threshold is 0.50. We adjust the threshold for the unprivileged group based on DI.
    recommended_thresholds = {
        'Male': 0.50,
        'Female': 0.50,
        'Age 18-25': 0.50
    }
    
    # Since decision = "Reject" if risk_score >= threshold else "Approve",
    # raising the rejection threshold decreases rejections (increases approvals).
    # We clip the calibrated thresholds to the mathematically valid range [0.10, 0.90] to prevent out-of-bounds thresholds.
    if gender_di < 1.0 and gender_di > 0.05:
        recommended_thresholds['Female'] = float(np.clip(round(0.50 / gender_di, 2), 0.10, 0.90))
    elif gender_di > 1.0:
        recommended_thresholds['Male'] = float(np.clip(round(0.50 * gender_di, 2), 0.10, 0.90))
    elif gender_di <= 0.05:
        recommended_thresholds['Female'] = 0.90 # Cap at upper boundary for severe bias
        
    if age_di < 1.0 and age_di > 0.05:
        recommended_thresholds['Age 18-25'] = float(np.clip(round(0.50 / age_di, 2), 0.10, 0.90))
    elif age_di <= 0.05:
        recommended_thresholds['Age 18-25'] = 0.90

    metrics['recommended_thresholds'] = recommended_thresholds

    return metrics

if __name__ == "__main__":
    result = get_fairness_metrics()
    print("Fairness Audit Results:")
    print(result)
