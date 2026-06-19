import { Applicant, DriftMetrics } from '../types';

const getRanks = (values: number[]) => {
  const sorted = values.map((val, index) => ({ val, index })).sort((a, b) => a.val - b.val);
  const ranks = new Array(values.length);
  let i = 0;
  while (i < sorted.length) {
    let sumRanks = 0;
    let count = 0;
    const startVal = sorted[i].val;
    while (i + count < sorted.length && sorted[i + count].val === startVal) {
      sumRanks += (i + count + 1);
      count++;
    }
    const avgRank = sumRanks / count;
    for (let j = 0; j < count; j++) {
      ranks[sorted[i + j].index] = avgRank;
    }
    i += count;
  }
  return ranks;
};

const calculateSpearman = (x: number[], y: number[]) => {
  const n = x.length;
  if (n <= 1) return 1;
  const ranksX = getRanks(x);
  const ranksY = getRanks(y);
  let sumDSquared = 0;
  for (let i = 0; i < n; i++) {
    const d = ranksX[i] - ranksY[i];
    sumDSquared += d * d;
  }
  return Math.max(-1, Math.min(1, 1 - ((6 * sumDSquared) / (n * (n * n - 1)))));
};

export const detectDrift = (currentData: Applicant[], baselineData: Applicant[]): DriftMetrics => {
  if (currentData.length === 0 || baselineData.length === 0) {
    return { psi: 0, featurePsi: { income: 0, creditScore: 0 }, flipRate: 0, spearmanRank: 1, timestamp: Date.now() };
  }

  if (currentData.length < 100 || baselineData.length < 100) {
    console.warn(`[DriftDetector] Warning: PSI math is noisy for small cohorts. Current: ${currentData.length}, Baseline: ${baselineData.length}. Need >100 for reliable stats.`);
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

  // Calculate Spearman's Rank Correlation between credit score and model safety prediction
  // We use negative riskProbability so that high credit score correlates with high safety (low risk)
  const creditScores = currentData.map(app => app.creditScore);
  const safeties = currentData.map(app => -app.riskProbability);
  const spearmanRank = calculateSpearman(creditScores, safeties);

  const flipRate = currentData.length > 0 ? (currentData.filter(app => (app.riskProbability > 0.5 ? 'Reject' : 'Approve') !== app.decision).length / currentData.length) : 0.02;

  // Real PSI for input features
  const calculateFeaturePsi = (extractor: (a: Applicant) => number, isLogScale = false) => {
    const values = [...currentData, ...baselineData].map(extractor);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max === min) return 0;
    
    const featBins = (data: Applicant[]) => {
      const counts = new Array(numBins).fill(0);
      data.forEach(app => {
        const val = extractor(app);
        let normalized = 0;
        if (isLogScale) {
          const logMin = Math.log(Math.max(1, min));
          const logMax = Math.log(Math.max(1, max));
          const logVal = Math.log(Math.max(1, val));
          normalized = logMax === logMin ? 0 : (logVal - logMin) / (logMax - logMin);
        } else {
          normalized = (val - min) / (max - min);
        }
        const bin = Math.max(0, Math.min(Math.floor(normalized * numBins), numBins - 1));
        counts[bin]++;
      });
      return counts.map(count => (count + 0.0001) / data.length);
    };

    const actualFeatDist = featBins(currentData);
    const expectedFeatDist = featBins(baselineData);

    let featPsi = 0;
    for (let i = 0; i < numBins; i++) {
      featPsi += (actualFeatDist[i] - expectedFeatDist[i]) * Math.log(actualFeatDist[i] / expectedFeatDist[i]);
    }
    return featPsi;
  };

  const incomePsi = calculateFeaturePsi(a => a.income, true);
  const creditScorePsi = calculateFeaturePsi(a => a.creditScore, false);

  return {
    psi,
    featurePsi: {
      income: incomePsi,
      creditScore: creditScorePsi
    },
    flipRate,
    spearmanRank,
    timestamp: Date.now()
  };
};

