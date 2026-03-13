import { describe, it, expect, vi } from 'vitest';
import { generateAuditId, performAttackSimulation, performSystemReboot } from '../src/services/simulationEngine';
import { ThreatLevel, IntegrityStatus, DriftMetrics } from '../src/types';

describe('simulationEngine', () => {
  describe('generateAuditId', () => {
    it('should generate a string starting with AUDIT-', () => {
      const id = generateAuditId();
      expect(id).toMatch(/^AUDIT-[A-Z0-9]{7}$/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateAuditId();
      const id2 = generateAuditId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('performAttackSimulation', () => {
    const initialMetrics: DriftMetrics = {
      psi: 0.05,
      flipRate: 0.02,
      spearmanRank: 0.95,
      timestamp: Date.now()
    };

    it('should handle INCOME_INFLATION attack', () => {
      const result = performAttackSimulation('INCOME_INFLATION', initialMetrics);
      expect(result.newMetrics.psi).toBe(0.28);
      expect(result.newSecurity.threatLevel).toBe(ThreatLevel.CRITICAL);
      expect(result.newSecurity.integrity).toBe(IntegrityStatus.COMPROMISED);
      expect(result.audit.severity).toBe('CRITICAL');
      expect(result.audit.details).toContain('Income Inflation');
    });

    it('should handle DATA_POISONING attack', () => {
      const result = performAttackSimulation('DATA_POISONING', initialMetrics);
      expect(result.newMetrics.psi).toBe(0.15);
      expect(result.newMetrics.flipRate).toBe(0.12);
      expect(result.audit.details).toContain('Data Poisoning');
    });

    it('should handle FEATURE_MASKING attack', () => {
      const result = performAttackSimulation('FEATURE_MASKING', initialMetrics);
      expect(result.newMetrics.spearmanRank).toBe(0.75);
      expect(result.audit.details).toContain('Feature Masking');
    });

    it('should handle DATA_DRIFT attack', () => {
      const result = performAttackSimulation('DATA_DRIFT', initialMetrics);
      expect(result.newMetrics.psi).toBe(0.32);
      expect(result.audit.category).toBe('DRIFT');
      expect(result.audit.details).toContain('Data Drift');
    });

    it('should handle unknown attack types', () => {
      const result = performAttackSimulation('UNKNOWN', initialMetrics);
      expect(result.audit.details).toBe('Unknown security event detected.');
    });

    it('should update the timestamp in metrics', () => {
      const result = performAttackSimulation('DATA_DRIFT', initialMetrics);
      expect(result.newMetrics.timestamp).toBeGreaterThanOrEqual(initialMetrics.timestamp);
    });
  });

  describe('performSystemReboot', () => {
    it('should reset system to safe state', () => {
      const result = performSystemReboot();
      expect(result.threatLevel).toBe(ThreatLevel.LOW);
      expect(result.integrity).toBe(IntegrityStatus.VERIFIED);
      expect(result.psi).toBe(0.05);
      expect(result.timestamp).toBeDefined();
    });
  });
});
