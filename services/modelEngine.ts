import { Applicant, ModelMetadata, ModelType } from '../types';
import { predictRisk } from '../api/modelApi';

export const predictApplicant = async (applicant: Applicant, model: ModelMetadata): Promise<{ riskProbability: number, decision: 'Approve' | 'Reject' }> => {
  try {
    const result = await predictRisk(applicant, model.id);
    if (result.status === 'error') {
      console.warn("Backend prediction failed, falling back to simulation", result.message);
      return simulatePrediction(applicant, model);
    }
    return {
      riskProbability: result.riskProbability,
      decision: result.decision
    };
  } catch (error) {
    console.error("Failed to connect to backend for prediction", error);
    return simulatePrediction(applicant, model);
  }
};

const simulatePrediction = (applicant: Applicant, model: ModelMetadata): { riskProbability: number, decision: 'Approve' | 'Reject' } => {
  const baseScore = (applicant.creditScore - 300) / 550 * 0.6 + (1 - applicant.debtRatio) * 0.4;
  let noise = (Math.random() - 0.5) * 0.05;
  if (model.type === ModelType.RANDOM_FOREST) noise += 0.02;
  const riskProbability = Math.max(0, Math.min(1, 1 - baseScore + noise));
  const decision = riskProbability < 0.45 ? 'Approve' : 'Reject';
  return { riskProbability, decision };
};

export const batchPredict = async (applicants: Applicant[], model: ModelMetadata): Promise<Applicant[]> => {
  const results = await Promise.all(applicants.map(app => predictApplicant(app, model)));
  return applicants.map((app, i) => ({ ...app, ...results[i] }));
};
