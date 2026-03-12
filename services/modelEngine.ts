import { Applicant, ModelMetadata, ModelType } from '../types';

export const predictApplicant = (applicant: Applicant, model: ModelMetadata): { riskProbability: number, decision: 'Approve' | 'Reject' } => {
  // Simple deterministic simulation based on model type and version
  // In a real app, this would call the backend /api/predict-risk
  
  const baseScore = (applicant.creditScore - 300) / 550 * 0.6 + (1 - applicant.debtRatio) * 0.4;
  let noise = (Math.random() - 0.5) * 0.05;
  
  if (model.type === ModelType.RANDOM_FOREST) {
    noise += 0.02; // RF is slightly different
  }
  
  const riskProbability = Math.max(0, Math.min(1, 1 - baseScore + noise));
  const decision = riskProbability < 0.45 ? 'Approve' : 'Reject';
  
  return { riskProbability, decision };
};

export const batchPredict = (applicants: Applicant[], model: ModelMetadata): Applicant[] => {
  return applicants.map(app => {
    const { riskProbability, decision } = predictApplicant(app, model);
    return { ...app, riskProbability, decision };
  });
};
