import { Applicant, ModelMetadata, ModelType, Counterfactual } from '../types';
import { predictRisk } from '../api/modelApi';

export const predictApplicant = async (applicant: Applicant, model: ModelMetadata): Promise<{ riskProbability: number, decision: 'Approve' | 'Reject', reason?: string, emailSent?: boolean }> => {
  try {
    const result = await predictRisk(applicant, model.id);
    if (result.status === 'error') {
      console.warn("Backend prediction failed, falling back to simulation", result.message);
      return simulatePrediction(applicant, model);
    }
    return {
      riskProbability: result.riskProbability,
      decision: result.decision,
      reason: result.reason,
      emailSent: result.emailSent
    };
  } catch (error) {
    console.error("Failed to connect to backend for prediction", error);
    return simulatePrediction(applicant, model);
  }
};

export const simulatePrediction = (applicant: Applicant, model: ModelMetadata): { riskProbability: number, decision: 'Approve' | 'Reject', reason?: string, emailSent?: boolean } => {
  // Normalize credit score (300-850)
  const normCredit = (applicant.creditScore - 300) / 550;
  
  // Normalize income (clamp at INR 250,000 for calculation)
  const normIncome = Math.min(1, applicant.income / 250000);
  
  // Debt-to-income ratio based on loan amount vs income (clip at 2.0)
  const loanToIncome = Math.min(2, applicant.loanAmount / applicant.income);
  const normLoanToIncome = 1 - (loanToIncome / 2); // 1 is best (0 loan), 0 is worst (2+ times income)
  
  // Combine factors to get a worthiness score (higher is better)
  const score = (normCredit * 0.4) + (normIncome * 0.3) + (normLoanToIncome * 0.3);
  
  let noise = (Math.random() - 0.5) * 0.05;
  if (model.type === ModelType.RANDOM_FOREST) noise += 0.02;
  
  // Risk probability is 1 - worthiness score
  const riskProbability = Math.max(0, Math.min(1, 1 - score + noise));
  
  // Standard decision boundary is 0.50 (more than 50% risk = Reject)
  const decision = riskProbability < 0.50 ? 'Approve' : 'Reject';
  
  const reason = `Simulation: ${decision === 'Approve' ? 'Stable' : 'Unfavorable'} metrics based on credit history.`;
  return { riskProbability, decision, reason };
};

export const batchPredict = async (applicants: Applicant[], model: ModelMetadata): Promise<Applicant[]> => {
  if (applicants.length > 100) {
    // Avoid network socket exhaustion/browser freeze by simulating batch re-scoring locally
    return applicants.map(app => ({
      ...app,
      ...simulatePrediction(app, model)
    }));
  }
  const results = await Promise.all(applicants.map(app => predictApplicant(app, model)));
  return applicants.map((app, i) => ({ ...app, ...results[i] }));
};

export const generateCounterfactuals = (applicant: Applicant, model: ModelMetadata): Counterfactual[] => {
  const targetDecision = applicant.decision === 'Approve' ? 'Reject' : 'Approve';
  const cfs: Counterfactual[] = [];

  // 1. Credit Score: Check Feasibility First
  const minScoreRes = simulatePrediction({ ...applicant, creditScore: 300 }, model);
  const maxScoreRes = simulatePrediction({ ...applicant, creditScore: 850 }, model);
  
  let bestScore = -1;
  let found = false;

  if (minScoreRes.decision !== maxScoreRes.decision) {
    // Binary Search (300 to 850)
    let low = 300;
    let high = 850;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const testApp = { ...applicant, creditScore: mid };
      const res = simulatePrediction(testApp, model);
      
      // If it flipped
      if (res.decision === targetDecision) {
        found = true;
        bestScore = mid;
        // Depending on direction, narrow search
        if (targetDecision === 'Approve') {
           high = mid - 1; 
        } else {
           low = mid + 1;
        }
      } else {
        if (targetDecision === 'Approve') {
           low = mid + 1;
        } else {
           high = mid - 1;
        }
      }
    }
  }

  if (found && bestScore !== -1) {
    const amount = bestScore - applicant.creditScore;
    if (amount !== 0) {
      const res = simulatePrediction({ ...applicant, creditScore: bestScore }, model);
      cfs.push({
        feature: 'Credit Score',
        direction: amount > 0 ? 'Increase' : 'Decrease',
        amount: Math.abs(amount),
        message: `${amount > 0 ? 'Increase' : 'Decrease'} Credit Score by ${Math.abs(amount)} points`,
        newRisk: res.riskProbability,
        targetDecision
      });
    }
  }

  // 2. Debt Ratio: Check Feasibility First
  const minDebtRes = simulatePrediction({ ...applicant, debtRatio: 0 }, model);
  const maxDebtRes = simulatePrediction({ ...applicant, debtRatio: 1 }, model);
  let bestDebtRatio = -1;

  if (minDebtRes.decision !== maxDebtRes.decision) {
    // Linear Search (0 to 1 with 0.01 step)
    const step = targetDecision === 'Approve' ? -0.01 : 0.01;
    let currentDti = applicant.debtRatio;
    
    // Cap at 200 iterations for safety
    let iters = 0;
    while (currentDti >= 0 && currentDti <= 1 && iters < 200) {
      iters++;
      currentDti += step;
      if (currentDti < 0 || currentDti > 1) break;
      const testApp = { ...applicant, debtRatio: currentDti };
      const res = simulatePrediction(testApp, model);
      if (res.decision === targetDecision) {
          bestDebtRatio = currentDti;
          break;
      }
    }
  }

  if (bestDebtRatio !== -1) {
    const amount = bestDebtRatio - applicant.debtRatio;
    const res = simulatePrediction({ ...applicant, debtRatio: bestDebtRatio }, model);
    cfs.push({
      feature: 'Debt Ratio',
      direction: amount > 0 ? 'Increase' : 'Decrease',
      amount: Math.abs(parseFloat(amount.toFixed(2))),
      message: `${amount > 0 ? 'Increase' : 'Decrease'} Debt Ratio by ${Math.abs(parseFloat(amount.toFixed(2)))}`,
      newRisk: res.riskProbability,
      targetDecision
    });
  }

  return cfs;
};
