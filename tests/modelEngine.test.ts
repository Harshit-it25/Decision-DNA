import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { predictApplicant } from '../frontend/src/services/modelEngine';
import { Applicant, ModelMetadata, ModelType, ModelStatus } from '../frontend/src/types';
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
    gender: 'Male',
    age: 30,
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

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch from backend correctly and return true payload', async () => {
    // Mock successful fetch from express backend
    const mockResponse = { riskProbability: 0.2, decision: 'Approve' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }));
    
    // Pick an applicant
    const testApplicant = mapToApplicant(allRecords[0]);
    const prediction = await predictApplicant(testApplicant, model);

    expect(fetch).toHaveBeenCalledTimes(1); // one for /predict
    expect(prediction.riskProbability).toBe(0.2);
    expect(prediction.decision).toBe('Approve');
  });

  it('should fallback to local simulation when backend fetch fails', async () => {
    // Mock a network failure
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error("Network connection lost")));
    
    // Pick an applicant
    const testApplicant = mapToApplicant(allRecords[0]);
    const prediction = await predictApplicant(testApplicant, model);

    expect(fetch).toHaveBeenCalledTimes(1);
    
    // It should have caught the error and ran local simulatePrediction
    expect(prediction).toHaveProperty('riskProbability');
    expect(prediction).toHaveProperty('decision');
    expect(['Approve', 'Reject']).toContain(prediction.decision);
    expect(prediction.riskProbability).toBeGreaterThanOrEqual(0);
    expect(prediction.riskProbability).toBeLessThanOrEqual(1);
  });

  it('should reflect credit score in fallback logic (Higher score = Lower risk)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error("Network fallback triggered")));
    
    const highCredit = mapToApplicant(allRecords.find(r => parseFloat(r.creditScore) > 750));
    const lowCredit = mapToApplicant(allRecords.find(r => parseFloat(r.creditScore) < 550));

    const highResult = await predictApplicant(highCredit, model);
    const lowResult = await predictApplicant(lowCredit, model);
    
    expect(highResult.riskProbability).toBeLessThan(lowResult.riskProbability);
  });
});
