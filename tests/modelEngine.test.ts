import { describe, it, expect } from 'vitest';
import { predictApplicant } from '../src/services/modelEngine';
import { Applicant, ModelMetadata, ModelType, ModelStatus } from '../src/types';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

describe('modelEngine Integration Tests', () => {
  const csvPath = path.resolve(__dirname, '../dataset.csv');
  const csvData = fs.readFileSync(csvPath, 'utf8');
  const allRecords: any[] = parse(csvData, { columns: true, skip_empty_lines: true });

  const mapToApplicant = (record: any): Applicant => ({
    id: record.id,
    name: record.name,
    nationality: record.nationality,
    income: parseFloat(record.income),
    debtRatio: parseFloat(record.debtRatio),
    creditScore: parseFloat(record.creditScore),
    loanAmount: parseFloat(record.loanAmount),
    riskProbability: parseFloat(record.riskProbability),
    decision: record.decision
  });

  const model: ModelMetadata = {
    id: 'm1',
    type: ModelType.LOGISTIC_REGRESSION,
    version: '1.0.0',
    status: ModelStatus.ACTIVE,
    metrics: { accuracy: 0.85, precision: 0.8, recall: 0.82, f1: 0.81, rocAuc: 0.88 },
    fingerprint: 'test-fingerprint',
    createdAt: Date.now(),
    featureImportance: []
  };

  it('should process real applicants and return sensible predictions', async () => {
    // We test the engine's fallback logic which is what runs in the browser if the backend is down
    // This is "real" logic in the context of the client-side engine
    const testApplicants = allRecords.slice(0, 10).map(mapToApplicant);
    
    for (const applicant of testApplicants) {
      const prediction = await predictApplicant(applicant, model);
      expect(prediction).toHaveProperty('riskProbability');
      expect(prediction).toHaveProperty('decision');
      expect(['Approve', 'Reject']).toContain(prediction.decision);
      expect(prediction.riskProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.riskProbability).toBeLessThanOrEqual(1);
    }
  });

  it('should reflect credit score in risk probability (Higher score = Lower risk)', async () => {
    const highCredit = mapToApplicant(allRecords.find(r => parseFloat(r.creditScore) > 750));
    const lowCredit = mapToApplicant(allRecords.find(r => parseFloat(r.creditScore) < 550));

    const highResult = await predictApplicant(highCredit, model);
    const lowResult = await predictApplicant(lowCredit, model);

    // Note: The engine logic has some noise, but the trend should be clear
    // We repeat to average out noise if needed, but the baseScore formula is:
    // baseScore = (creditScore - 300) / 550 * 0.6 + (1 - debtRatio) * 0.4;
    // riskProbability = 1 - baseScore + noise;
    
    expect(highResult.riskProbability).toBeLessThan(lowResult.riskProbability);
  });

  it('should reflect debt ratio in risk probability (Higher debt = Higher risk)', async () => {
    const highDebt = mapToApplicant(allRecords.find(r => parseFloat(r.debtRatio) > 0.5));
    const lowDebt = mapToApplicant(allRecords.find(r => parseFloat(r.debtRatio) < 0.2));

    const highResult = await predictApplicant(highDebt, model);
    const lowResult = await predictApplicant(lowDebt, model);

    expect(highResult.riskProbability).toBeGreaterThan(lowResult.riskProbability);
  });
});
