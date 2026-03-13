import { describe, it, expect } from 'vitest';
import { detectDrift } from '../src/drift/driftDetector';
import { Applicant } from '../src/types';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

describe('driftDetector Integration Tests', () => {
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

  const applicants = allRecords.slice(0, 1000).map(mapToApplicant);

  it('should calculate low PSI for identical datasets', () => {
    const result = detectDrift(applicants, applicants);
    expect(result.psi).toBeLessThan(0.001);
  });

  it('should detect drift when risk probabilities are shifted', () => {
    const baseline = applicants;
    const shifted = applicants.map(app => ({
      ...app,
      riskProbability: Math.min(1, app.riskProbability + 0.2)
    }));

    const result = detectDrift(shifted, baseline);
    console.log('Detected PSI for shifted data:', result.psi);
    expect(result.psi).toBeGreaterThan(0.1); // 0.1 is usually threshold for slight drift
  });

  it('should handle significantly different distributions with high PSI', () => {
    const baseline = applicants.slice(0, 500);
    // Create a very different distribution (all high risk)
    const active = applicants.slice(501, 1000).map(app => ({
      ...app,
      riskProbability: 0.95
    }));

    const result = detectDrift(active, baseline);
    console.log('Detected PSI for high risk distribution:', result.psi);
    expect(result.psi).toBeGreaterThan(1.0); // Extreme drift
  });
});
