import pandas as pd
import numpy as np
import joblib
import os
import sys
from datetime import datetime

# Add parents directory to path to import DataProcessor
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from ml.data_processor import DataProcessor

class AdversarialTester:
    def __init__(self, model_path='models/random_forest_model_prod.pkl', scaler_path='models/scaler_prod.pkl'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.processor = DataProcessor(scaler_path=scaler_path)
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
        else:
            self.model = None
            
    def find_adversarial_perturbation(self, applicant_data, target_decision="APPROVE", max_iters=50):
        """
        Attempts to find a minimal modification to features that flips the model's decision.
        Uses a greedy bidirectional search to optimize risk probability.
        """
        if self.model is None:
            return {"error": "Model not loaded"}

        # Initial prediction
        df = pd.DataFrame([applicant_data])
        X_scaled = self.processor.transform(df)
        prob = float(self.model.predict_proba(X_scaled)[0][1])
        initial_decision = "APPROVE" if prob < 0.5 else "REJECT"
        
        if initial_decision == target_decision:
            return {
                "success": True, 
                "message": f"Applicant is already {target_decision}", 
                "original_decision": initial_decision,
                "final_decision": initial_decision,
                "robustness_score": 1.0,
                "adversarial_data": applicant_data
            }

        # Greedy Perturbation
        current_data = applicant_data.copy()
        # Features known to have high impact in this model
        features_to_tweak = ['income', 'creditScore', 'loanAmount', 'pastDuePayments', 'totalBalance', 'totalCreditLimit']
        
        step_sizes = {
            'income': 1000,
            'creditScore': 10,
            'loanAmount': 500,
            'pastDuePayments': 1,
            'totalBalance': 500,
            'totalCreditLimit': 500
        }
        
        history = []
        for i in range(max_iters):
            best_feat = None
            best_prob = prob
            best_direction = 1
            
            for feat in features_to_tweak:
                if feat not in current_data: continue
                
                # Try both directions
                for direction in [1, -1]:
                    temp_data = current_data.copy()
                    
                    # Ensure numerical sanity
                    try:
                        val = float(temp_data[feat])
                        temp_data[feat] = val + (step_sizes.get(feat, 100) * direction)
                    except (ValueError, TypeError):
                        continue
                    
                    # Bounds check for realism
                    if feat == 'creditScore': temp_data[feat] = max(300, min(850, temp_data[feat]))
                    if feat == 'income': temp_data[feat] = max(1000, temp_data[feat])
                    if feat == 'loanAmount': temp_data[feat] = max(500, temp_data[feat])
                    if feat == 'pastDuePayments': temp_data[feat] = max(0, temp_data[feat])
                    if feat == 'totalBalance': temp_data[feat] = max(0, temp_data[feat])
                    if feat == 'totalCreditLimit': temp_data[feat] = max(1000, temp_data[feat])
                    
                    df_temp = pd.DataFrame([temp_data])
                    X_temp = self.processor.transform(df_temp)
                    new_prob = float(self.model.predict_proba(X_temp)[0][1])
                    
                    # Target optimization:
                    # APPROVE -> minimize prob of rejection
                    # REJECT -> maximize prob of rejection
                    if (target_decision == "APPROVE" and new_prob < best_prob) or \
                       (target_decision == "REJECT" and new_prob > best_prob):
                        best_prob = new_prob
                        best_feat = feat
                        best_direction = direction
            
            if best_feat:
                current_data[best_feat] += step_sizes[best_feat] * best_direction
                # Re-apply bounds just in case
                if best_feat == 'creditScore': current_data[best_feat] = max(300, min(850, current_data[best_feat]))
                
                prob = best_prob
                history.append({"iter": i, "feat": best_feat, "prob": prob})
                
                # Success criteria met?
                if (target_decision == "APPROVE" and prob < 0.5) or \
                   (target_decision == "REJECT" and prob >= 0.5):
                    break
            else:
                # No more progress possible
                break
                
        final_decision = "APPROVE" if prob < 0.5 else "REJECT"
        success = (final_decision == target_decision)
        
        # Calculate Robustness (Normalized distance)
        if success:
            total_perturbation = 0
            count = 0
            for k in features_to_tweak:
                if k in current_data and applicant_data.get(k, 0) != 0:
                    total_perturbation += abs(float(current_data[k]) - float(applicant_data[k])) / abs(float(applicant_data[k]))
                    count += 1
            
            # Robustness is inversely proportional to perturbation needed
            robustness_score = max(0.1, 1.0 - (total_perturbation / (count if count > 0 else 1)))
        else:
            # If search failed to flip decision, it's highly robust (for now)
            robustness_score = 1.0
            
        return {
            "success": success,
            "original_decision": initial_decision,
            "final_decision": final_decision,
            "original_prob": float(history[0]['prob']) if history else float(prob),
            "final_prob": float(prob),
            "original_data": applicant_data,
            "adversarial_data": current_data,
            "robustness_score": float(robustness_score),
            "iterations": len(history)
        }

    def run_red_team_audit(self, sample_size=20):
        """
        Performs a full red-team audit on a sample of rejected applicants.
        """
        if not os.path.exists('dataset.csv'):
            return {"error": "Dataset not found for auditing"}
            
        # Sample candidates for red teaming
        df_all = pd.read_csv('dataset.csv', on_bad_lines='skip')
        df = df_all.sample(min(1000, sample_size * 20))
        
        # Identify those the model REJECTS
        X_scaled = self.processor.transform(df)
        probs = self.model.predict_proba(X_scaled)[:, 1]
        df['initial_prob'] = probs
        
        rejected_candidates = df[df['initial_prob'] >= 0.5]
        if len(rejected_candidates) == 0:
            rejected_df = df.sample(min(sample_size, len(df)))
        else:
            rejected_df = rejected_candidates.sample(min(sample_size, len(rejected_candidates)))
            
        results = []
        for _, row in rejected_df.iterrows():
            applicant = row.to_dict()
            if 'initial_prob' in applicant: del applicant['initial_prob']
            
            res = self.find_adversarial_perturbation(applicant, target_decision="APPROVE", max_iters=30)
            results.append(res)
            
        valid_scores = [r['robustness_score'] for r in results if 'robustness_score' in r]
        avg_robustness = np.mean(valid_scores) if valid_scores else 0.0
        
        success_list = [1 if r.get('success') else 0 for r in results]
        evasion_success_rate = np.mean(success_list) if success_list else 0.0
        
        return {
            "timestamp": datetime.now().isoformat(),
            "avg_robustness": float(avg_robustness),
            "evasion_success_rate": float(evasion_success_rate),
            "sample_size": len(results),
            "detailed_results": results[:5]
        }

if __name__ == "__main__":
    tester = AdversarialTester()
    audit = tester.run_red_team_audit(sample_size=10)
    print(f"Red-Team Audit Complete. Avg Robustness: {audit['avg_robustness']:.2f}")
    print(f"Evasion Success Rate: {audit['evasion_success_rate']*100:.1f}%")
