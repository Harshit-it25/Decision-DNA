
import { Applicant } from '../types';

export interface DriftResult {
  psi: number;
  klDivergence: number;
  isDriftDetected: boolean;
  timestamp: number;
  details: string;
}

/**
 * Population Stability Index (PSI)
 * Measures the shift in distribution of a feature or prediction
 */
export const calculatePSI = (expected: number[], actual: number[], bins: number = 10): number => {
  // Simplified PSI calculation
  // In a real app, this would bin the data and calculate:
  // sum((actual_pct - expected_pct) * ln(actual_pct / expected_pct))
  
  const diff = actual.reduce((sum, val, i) => sum + Math.abs(val - (expected[i] || 0)), 0);
  return diff / actual.length;
};

/**
 * Kullback-Leibler Divergence
 * Measures how one probability distribution is different from a second, reference probability distribution.
 */
export const calculateKLDivergence = (p: number[], q: number[]): number => {
  // Simplified KL Divergence
  let kl = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] > 0 && q[i] > 0) {
      kl += p[i] * Math.log(p[i] / q[i]);
    }
  }
  return kl;
};

export const detectDrift = (
  baselineData: Applicant[], 
  currentData: Applicant[], 
  threshold: number = 0.1
): DriftResult => {
  const baselineScores = baselineData.map(a => a.riskProbability);
  const currentScores = currentData.map(a => a.riskProbability);
  
  const psi = calculatePSI(baselineScores, currentScores);
  const kl = calculateKLDivergence(baselineScores, currentScores);
  
  return {
    psi,
    klDivergence: kl,
    isDriftDetected: psi > threshold,
    timestamp: Date.now(),
    details: psi > threshold ? `Drift detected: PSI (${psi.toFixed(4)}) exceeds threshold (${threshold})` : "No significant drift detected."
  };
};
