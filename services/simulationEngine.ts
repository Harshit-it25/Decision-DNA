import { ThreatLevel, IntegrityStatus, AuditEntry, DriftMetrics } from '../types';

export const generateAuditId = () => `AUDIT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

export const performAttackSimulation = (type: string, currentMetrics: DriftMetrics, customParams?: any) => {
  const auditId = generateAuditId();
  let newMetrics = { ...currentMetrics, timestamp: Date.now() };
  let newSecurity = { threatLevel: ThreatLevel.MEDIUM, integrity: IntegrityStatus.VERIFIED, forensicEvidence: [] as string[] };
  let audit: AuditEntry = {
    id: auditId,
    timestamp: Date.now(),
    action: "Security Alert",
    details: "",
    category: 'ATTACK',
    severity: 'WARNING'
  };

  switch (type) {
    case 'INCOME_INFLATION':
      newMetrics.psi = 0.28;
      newSecurity.threatLevel = ThreatLevel.CRITICAL;
      newSecurity.integrity = IntegrityStatus.COMPROMISED;
      newSecurity.forensicEvidence = ["Systemic income inflation detected in 15% of recent applications."];
      audit.details = "Adversarial attack detected: Income Inflation. Model integrity compromised.";
      audit.severity = 'CRITICAL';
      break;
    case 'DATA_POISONING':
      newMetrics.psi = 0.15;
      newMetrics.flipRate = 0.12;
      newSecurity.forensicEvidence = ["Unusual correlation between high debt and approval detected."];
      audit.details = "Potential Data Poisoning attempt detected in training buffer.";
      break;
    case 'FEATURE_MASKING':
      newMetrics.spearmanRank = 0.75;
      audit.details = "Feature Masking attack: Model sensitivity to Credit Score has dropped significantly.";
      break;
    case 'DATA_DRIFT':
      newMetrics.psi = 0.32;
      newSecurity.threatLevel = ThreatLevel.MEDIUM;
      newSecurity.forensicEvidence = ["Artificial distribution shift detected in recent scoring requests."];
      audit.details = "Simulated Data Drift attack initiated. Monitoring alerts triggered.";
      audit.category = 'DRIFT';
      break;
    default:
      audit.details = "Unknown security event detected.";
  }

  return { newMetrics, newSecurity, audit };
};

export const performSystemReboot = () => {
  return {
    threatLevel: ThreatLevel.LOW,
    integrity: IntegrityStatus.VERIFIED,
    psi: 0.05,
    timestamp: Date.now()
  };
};
