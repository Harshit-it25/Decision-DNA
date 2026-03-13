import { Applicant, DriftMetrics } from '../types';

export const detectDrift = (currentData: Applicant[], baselineData: Applicant[]): DriftMetrics => {
  if (currentData.length === 0 || baselineData.length === 0) {
    return { psi: 0, flipRate: 0, spearmanRank: 1, timestamp: Date.now() };
  }

  // Real PSI calculation using binning (10 bins for 0.0 to 1.0)
  const numBins = 10;
  const getBins = (data: Applicant[]) => {
    const counts = new Array(numBins).fill(0);
    data.forEach(app => {
      const bin = Math.min(Math.floor(app.riskProbability * numBins), numBins - 1);
      counts[bin]++;
    });
    return counts.map(count => (count + 0.0001) / data.length); // Add small epsilon to avoid div by zero/log(0)
  };

  const actualDist = getBins(currentData);
  const expectedDist = getBins(baselineData);

  let psi = 0;
  for (let i = 0; i < numBins; i++) {
    psi += (actualDist[i] - expectedDist[i]) * Math.log(actualDist[i] / expectedDist[i]);
  }

  return {
    psi,
    flipRate: 0.02, // Placeholder for real logic if needed
    spearmanRank: 0.98,
    timestamp: Date.now()
  };
};
