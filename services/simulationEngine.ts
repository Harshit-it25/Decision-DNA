
import { DriftMetrics, SecurityStatus, ThreatLevel, IntegrityStatus, AuditEntry } from '../types';

export const calculatePSI = (base: number[], actual: number[]): number => {
  const mean1 = base.reduce((a, b) => a + b, 0) / base.length;
  const mean2 = actual.reduce((a, b) => a + b, 0) / actual.length;
  const diff = Math.abs(mean1 - mean2) / mean1;
  return diff * 0.5; 
};

export const generateAuditId = () => Math.random().toString(36).substr(2, 9);

export interface CustomAttackParams {
  psiDelta: number;
  flipDelta: number;
  rankDelta: number;
  threat: ThreatLevel;
  integrity: IntegrityStatus;
  details: string;
  forensics: string[];
}

export const performAttackSimulation = (
  type: 'INCOME_INFLATION' | 'DATA_POISONING' | 'FEATURE_MASKING' | 'CUSTOM',
  currentMetrics: DriftMetrics,
  customParams?: CustomAttackParams
): { newMetrics: DriftMetrics; newSecurity: SecurityStatus; audit: AuditEntry } => {
  let psiDelta = 0;
  let flipDelta = 0;
  let rankDelta = 0;
  let threat: ThreatLevel = ThreatLevel.LOW;
  let integrity: IntegrityStatus = IntegrityStatus.VERIFIED;
  let details = "";
  let forensics: string[] = [];

  if (type === 'CUSTOM' && customParams) {
    psiDelta = customParams.psiDelta;
    flipDelta = customParams.flipDelta;
    rankDelta = customParams.rankDelta;
    threat = customParams.threat;
    integrity = customParams.integrity;
    details = customParams.details;
    forensics = customParams.forensics;
  } else {
    switch (type) {
      case 'INCOME_INFLATION':
        psiDelta = 0.25;
        flipDelta = 0.15;
        rankDelta = -0.1;
        threat = ThreatLevel.MEDIUM;
        details = "Income feature distribution shifted by +40% artificially.";
        forensics = ["Distribution Anomaly: Right-skew in Income Shard", "Heuristic Match: Batch Inflator Pattern"];
        break;
      case 'DATA_POISONING':
        psiDelta = 0.1;
        flipDelta = 0.45;
        rankDelta = -0.3;
        threat = ThreatLevel.CRITICAL;
        integrity = IntegrityStatus.COMPROMISED;
        details = "Retraining data injected with 15% mislabeled samples.";
        forensics = ["Signature Mismatch: Model Weights don't match DNA Fingerprint", "Noise detected in label distribution", "Unauthorized Node retrained active weights"];
        break;
      case 'FEATURE_MASKING':
        psiDelta = 0.4;
        flipDelta = 0.6;
        rankDelta = -0.5;
        threat = ThreatLevel.CRITICAL;
        details = "Critical 'Credit Score' feature removed during retraining process.";
        forensics = ["Feature Metadata Loss: Column #4 (CreditScore) is null", "Decision Boundary Collapse", "Stability Index exceeds emergency threshold"];
        break;
    }
  }

  const newMetrics: DriftMetrics = {
    psi: Math.min(1, currentMetrics.psi + psiDelta),
    flipRate: Math.min(1, currentMetrics.flipRate + flipDelta),
    spearmanRank: Math.max(0, currentMetrics.spearmanRank + rankDelta),
    timestamp: Date.now(),
  };

  const newSecurity: SecurityStatus = {
    threatLevel: threat,
    integrity: integrity,
    lastAttackType: type,
    forensicEvidence: forensics
  };

  const audit: AuditEntry = {
    id: generateAuditId(),
    timestamp: Date.now(),
    action: `Attack Simulation: ${type}`,
    details: details,
    category: 'ATTACK',
    severity: threat === ThreatLevel.CRITICAL ? 'CRITICAL' : 'WARNING'
  };

  return { newMetrics, newSecurity, audit };
};

/**
 * Immutable System Reboot
 * Restores the system to a known stable state, clearing drift and security threats.
 */
export const performSystemReboot = (): { 
  newMetrics: DriftMetrics; 
  newSecurity: SecurityStatus; 
  audit: AuditEntry 
} => {
  const newMetrics: DriftMetrics = {
    psi: 0.04,
    flipRate: 0.02,
    spearmanRank: 0.98,
    timestamp: Date.now(),
  };

  const newSecurity: SecurityStatus = {
    threatLevel: ThreatLevel.LOW,
    integrity: IntegrityStatus.VERIFIED,
    forensicEvidence: []
  };

  const audit: AuditEntry = {
    id: generateAuditId(),
    timestamp: Date.now(),
    action: "IMMUTABLE_REBOOT",
    details: "System restored to Stable Baseline. Poisoned data shards purged. Weights re-verified against DNA Fingerprint.",
    category: 'REBOOT',
    severity: 'INFO'
  };

  return { newMetrics, newSecurity, audit };
};
