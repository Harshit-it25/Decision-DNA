
import { Applicant } from '../types';

export interface AdversarialResult {
  isAdversarial: boolean;
  confidence: number;
  threatType: 'PERTURBATION' | 'POISONING' | 'EVASION' | 'NONE';
  details: string;
}

/**
 * Detects adversarial inputs by looking for unusual feature combinations
 * or small perturbations that lead to large decision flips.
 */
export const detectAdversarialInput = (applicant: Applicant): AdversarialResult => {
  // Simplified detection logic
  // In a real app, this would use techniques like:
  // - Feature Squeezing
  // - Adversarial Training
  // - Anomaly Detection
  
  const isSuspicious = (applicant.creditScore > 800 && applicant.debtRatio > 0.8) || 
                       (applicant.income < 10000 && applicant.loanAmount > 500000);
  
  if (isSuspicious) {
    return {
      isAdversarial: true,
      confidence: 0.85,
      threatType: 'EVASION',
      details: "Unusual feature combination detected: High credit score with extreme debt ratio."
    };
  }
  
  return {
    isAdversarial: false,
    confidence: 0.98,
    threatType: 'NONE',
    details: "Input appears legitimate."
  };
};
