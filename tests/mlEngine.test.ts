import { describe, it, expect } from 'vitest';
import { predictApplicant, batchPredict } from '../services/modelEngine';
import { Applicant, ModelMetadata, ModelType, ModelStatus } from '../types';

describe('ML Engine', () => {
  const mockModel: ModelMetadata = {
    id: 'test-model',
    type: ModelType.LOGISTIC_REGRESSION,
    version: '1.0.0',
    status: ModelStatus.ACTIVE,
    accuracy: 0.95,
    fingerprint: 'test-hash',
    createdAt: Date.now(),
    featureImportance: [
      { feature: 'Credit Score', weight: 0.5 },
      { feature: 'Income', weight: 0.3 },
      { feature: 'Debt Ratio', weight: 0.2 }
    ]
  };

  const highQualityApplicant: Applicant = {
    id: 'app-1',
    name: 'High Quality',
    nationality: 'USA',
    income: 150000,
    debtRatio: 0.1,
    creditScore: 800,
    loanAmount: 50000,
    riskProbability: 0,
    decision: 'Approve'
  };

  const lowQualityApplicant: Applicant = {
    id: 'app-2',
    name: 'Low Quality',
    nationality: 'USA',
    income: 30000,
    debtRatio: 0.8,
    creditScore: 400,
    loanAmount: 50000,
    riskProbability: 0,
    decision: 'Approve'
  };

  it('correctly approves high-quality applicants with low risk probability', () => {
    const prediction = predictApplicant(highQualityApplicant, mockModel);
    expect(prediction.decision).toBe('Approve');
    expect(prediction.riskProbability).toBeLessThan(0.5);
  });

  it('correctly rejects low-quality applicants with high risk probability', () => {
    const prediction = predictApplicant(lowQualityApplicant, mockModel);
    expect(prediction.decision).toBe('Reject');
    expect(prediction.riskProbability).toBeGreaterThan(0.5);
  });

  it('correctly processes batches of applicants', () => {
    const applicants = [highQualityApplicant, lowQualityApplicant];
    const results = batchPredict(applicants, mockModel);

    expect(results).toHaveLength(2);
    expect(results[0].decision).toBe('Approve');
    expect(results[1].decision).toBe('Reject');
  });

  it('approves applicant with perfect metrics (max income, max score, no debt)', () => {
    const perfectApplicant: Applicant = {
      ...highQualityApplicant,
      income: 200000,
      creditScore: 850,
      debtRatio: 0
    };
    const prediction = predictApplicant(perfectApplicant, mockModel);
    expect(prediction.decision).toBe('Approve');
    expect(prediction.riskProbability).toBe(0); // Score is exactly 1, so risk is 0
  });

  it('rejects applicant with worst possible metrics (min income, min score, max debt)', () => {
    const worstApplicant: Applicant = {
      ...lowQualityApplicant,
      income: 20000,
      creditScore: 300,
      debtRatio: 1
    };
    const prediction = predictApplicant(worstApplicant, mockModel);
    expect(prediction.decision).toBe('Reject');
    expect(prediction.riskProbability).toBe(1); // Score is exactly 0, so risk is 1
  });

  it('uses default weights when featureImportance is missing or empty', () => {
    const emptyModel: ModelMetadata = {
      ...mockModel,
      featureImportance: [] // No weights specified
    };
    // Should still be able to predict using default weights
    const prediction = predictApplicant(highQualityApplicant, emptyModel);
    expect(prediction.decision).toBe('Approve');
    expect(prediction.riskProbability).toBeLessThan(0.4);
  });
});
