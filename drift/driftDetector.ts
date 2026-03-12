import { Applicant, DriftMetrics } from '../types';

export const detectDrift = (currentData: Applicant[], baselineData: Applicant[]): DriftMetrics => {
  // Simplified PSI calculation
  const currentMean = currentData.reduce((acc, val) => acc + val.riskProbability, 0) / currentData.length;
  const baselineMean = baselineData.reduce((acc, val) => acc + val.riskProbability, 0) / baselineData.length;
  
  const psi = Math.abs(currentMean - baselineMean) * 2; // Simulated PSI
  
  return {
    psi,
    flipRate: 0.02,
    spearmanRank: 0.98,
    timestamp: Date.now()
  };
};
