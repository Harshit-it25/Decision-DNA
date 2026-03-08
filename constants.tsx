
import { ModelType, ModelStatus, ModelMetadata, Applicant } from './types';

export const INITIAL_MODELS: ModelMetadata[] = [
  {
    id: 'm1',
    type: ModelType.LOGISTIC_REGRESSION,
    version: '1.0.0',
    status: ModelStatus.STABLE_BASELINE,
    accuracy: 0.92,
    fingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    createdAt: Date.now() - 86400000 * 7,
    featureImportance: [
      { feature: 'Credit Score', weight: 0.45 },
      { feature: 'Income', weight: 0.30 },
      { feature: 'Debt Ratio', weight: 0.20 },
      { feature: 'Employment Years', weight: 0.05 }
    ],
    coefficients: {
      'Credit Score': 4.2,
      'Income': 2.1,
      'Debt Ratio': -3.5,
      'Employment Years': 0.8
    }
  },
  {
    id: 'm2',
    type: ModelType.RANDOM_FOREST,
    version: '1.0.1',
    status: ModelStatus.ACTIVE,
    accuracy: 0.94,
    fingerprint: 'ac5169992323e2a7e7542d45a982992497046e7f97542d45a982992497046e7f',
    createdAt: Date.now() - 86400000 * 2,
    featureImportance: [
      { feature: 'Credit Score', weight: 0.42 },
      { feature: 'Debt Ratio', weight: 0.28 },
      { feature: 'Income', weight: 0.25 },
      { feature: 'Savings', weight: 0.05 }
    ]
  }
];

const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Paul', 'Ashley', 'Kevin', 'Alice', 'Brian', 'Julia', 'George', 'Grace'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzales', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott'];
const countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Japan', 'India', 'Brazil', 'Australia', 'Singapore', 'Netherlands', 'Sweden', 'Switzerland', 'Spain', 'Italy', 'South Korea', 'Mexico', 'United Arab Emirates', 'Norway', 'Denmark'];

export const generateSingleApplicant = (index: number): Applicant => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const nationality = countries[Math.floor(Math.random() * countries.length)];
  const creditScore = 300 + Math.floor(Math.random() * 550);
  const debtRatio = Math.random() * 0.8;
  const income = 30000 + Math.floor(Math.random() * 150000);
  const loanAmount = 50000 + Math.floor(Math.random() * 450000);
  
  const normalizedScore = (creditScore - 300) / 550;
  const normalizedDebt = 1 - debtRatio;
  const scoreFactor = (normalizedScore * 0.6) + (normalizedDebt * 0.4);
  const riskProbability = Math.max(0, Math.min(1, 1 - scoreFactor));
  const decision = (creditScore > 650 && debtRatio < 0.4) ? 'Approve' : 'Reject';

  return {
    id: `app-gen-${Date.now()}-${index}`,
    name: `${firstName} ${lastName}`,
    nationality,
    income,
    debtRatio,
    creditScore,
    loanAmount,
    riskProbability,
    decision: decision as 'Approve' | 'Reject'
  };
};

// Increased to 1,000 applicants to support high-volume monitoring requirements
export const MOCK_APPLICANTS: Applicant[] = Array.from({ length: 1000 }, (_, i) => generateSingleApplicant(i));
