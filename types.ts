
export enum ModelType {
  LOGISTIC_REGRESSION = 'Logistic Regression',
  RANDOM_FOREST = 'Random Forest'
}

export enum ModelStatus {
  TRAINING = 'Training',
  ACTIVE = 'Active',
  STABLE_BASELINE = 'Stable Baseline',
  DEPRECATED = 'Deprecated'
}

export enum ThreatLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  CRITICAL = 'Critical'
}

export enum IntegrityStatus {
  VERIFIED = 'Verified',
  COMPROMISED = 'Compromised'
}

export interface FeatureImportance {
  feature: string;
  weight: number;
}

export interface ModelMetadata {
  id: string;
  type: ModelType;
  version: string;
  status: ModelStatus;
  accuracy: number;
  fingerprint: string; // SHA256
  createdAt: number;
  featureImportance: FeatureImportance[];
  coefficients?: Record<string, number>;
}

export interface DriftMetrics {
  psi: number; // Population Stability Index
  flipRate: number; // Prediction change rate
  spearmanRank: number; // Ranking stability
  timestamp: number;
}

export interface SecurityStatus {
  threatLevel: ThreatLevel;
  integrity: IntegrityStatus;
  lastAttackType?: string;
  forensicEvidence?: string[]; // Clues to "find the threat"
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  action: string;
  details: string;
  category: 'TRAINING' | 'ATTACK' | 'DRIFT' | 'REBOOT' | 'SECURITY';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface Applicant {
  id: string;
  name: string;
  nationality: string;
  income: number;
  debtRatio: number;
  creditScore: number;
  loanAmount: number;
  riskProbability: number;
  decision: 'Approve' | 'Reject';
}

export interface DriftHistoryEntry {
  id?: number;
  timestamp: number;
  psi: number;
  klDivergence: number;
  isDriftDetected: boolean;
  modelId: string;
}
