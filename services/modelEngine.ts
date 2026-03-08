
import { Applicant, ModelMetadata } from '../types';

/**
 * Normalizes a value between 0 and 1 based on expected ranges
 */
const normalize = (val: number, min: number, max: number) => {
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
};

/**
 * Performs a prediction for a single applicant using the provided model's feature importance.
 * This simulates a weighted linear combination of features.
 */
export const predictApplicant = (applicant: Applicant, model: ModelMetadata): { riskProbability: number, decision: 'Approve' | 'Reject' } => {
  const weights: Record<string, number> = {};
  model.featureImportance.forEach(fi => {
    weights[fi.feature] = fi.weight;
  });

  // Default weights if not present
  const wCredit = weights['Credit Score'] ?? 0.5;
  const wIncome = weights['Income'] ?? 0.3;
  const wDebt = weights['Debt Ratio'] ?? 0.2;

  // Normalize features
  const nCredit = normalize(applicant.creditScore, 300, 850);
  const nIncome = normalize(applicant.income, 20000, 200000);
  const nDebt = 1 - normalize(applicant.debtRatio, 0, 1); // Lower debt is better

  // Calculate score (higher is better)
  const score = (nCredit * wCredit) + (nIncome * wIncome) + (nDebt * wDebt);
  
  // Convert to risk probability (lower is better)
  const riskProbability = 1 - score;
  
  // Decision threshold (e.g., 0.6)
  const decision = score > 0.55 ? 'Approve' : 'Reject';

  return { riskProbability, decision };
};

/**
 * Batch predicts a list of applicants
 */
export const batchPredict = (applicants: Applicant[], model: ModelMetadata): Applicant[] => {
  return applicants.map(app => {
    const { riskProbability, decision } = predictApplicant(app, model);
    return { ...app, riskProbability, decision };
  });
};
