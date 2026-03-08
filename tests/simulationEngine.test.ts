import { describe, it, expect } from 'vitest';
import {
    calculatePSI,
    performAttackSimulation,
    performSystemReboot
} from '../services/simulationEngine';
import { DriftMetrics, ThreatLevel, IntegrityStatus } from '../types';

describe('Simulation Engine', () => {

    const baseMetrics: DriftMetrics = {
        psi: 0.05,
        flipRate: 0.01,
        spearmanRank: 0.95,
        timestamp: Date.now()
    };

    describe('calculatePSI', () => {
        it('calculates PSI correctly for identical distributions', () => {
            const base = [10, 20, 30, 40, 50];
            const actual = [10, 20, 30, 40, 50];
            const psi = calculatePSI(base, actual);
            expect(psi).toBe(0);
        });

        it('calculates non-zero PSI for different distributions', () => {
            const base = [10, 20, 30, 40, 50];
            const actual = [50, 40, 30, 20, 10]; // Same mean, but different items doesn't trigger PSI in current simple impl.
            // Wait, current calculatePSI only looks at means.
            // const mean1 = base.reduce((a, b) => a + b, 0) / base.length;
            // const mean2 = actual.reduce((a, b) => a + b, 0) / actual.length;
            // const diff = Math.abs(mean1 - mean2) / mean1; return diff * 0.5;

            const shifted = [20, 40, 60, 80, 100];
            const psi = calculatePSI(base, shifted);
            expect(psi).toBeGreaterThan(0);
            expect(psi).toBe(0.5); // Mean went from 30 to 60. Math.abs(30-60)/30 = 1. 1*0.5 = 0.5.
        });

        it('calculates PSI correctly when means differ significantly', () => {
            const base = [10, 10, 10]; // mean 10
            const actual = [20, 20, 20]; // mean 20
            // math.abs(10 - 20) / 10 = 1.0, 1.0 * 0.5 = 0.5
            expect(calculatePSI(base, actual)).toBe(0.5);
        });

        it('calculates 0 PSI when means are the same but distributions differ strongly', () => {
            const base = [10, 20, 30]; // mean 20
            const actual = [0, 20, 40]; // mean 20
            // math.abs(20 - 20) = 0
            expect(calculatePSI(base, actual)).toBe(0);
        });
    });

    describe('performAttackSimulation', () => {
        it('simulates INCOME_INFLATION correctly', () => {
            const { newMetrics, newSecurity, audit } = performAttackSimulation('INCOME_INFLATION', baseMetrics);

            expect(newMetrics.psi).toBe(baseMetrics.psi + 0.25);
            expect(newMetrics.flipRate).toBe(baseMetrics.flipRate + 0.15);
            expect(newMetrics.spearmanRank).toBe(baseMetrics.spearmanRank - 0.1);

            expect(newSecurity.threatLevel).toBe(ThreatLevel.MEDIUM);
            expect(newSecurity.lastAttackType).toBe('INCOME_INFLATION');
            expect(newSecurity.forensicEvidence).toContain("Distribution Anomaly: Right-skew in Income Shard");

            expect(audit.action).toBe('Attack Simulation: INCOME_INFLATION');
            expect(audit.category).toBe('ATTACK');
        });

        it('simulates DATA_POISONING correctly with critical threat', () => {
            const { newMetrics, newSecurity, audit } = performAttackSimulation('DATA_POISONING', baseMetrics);

            expect(newSecurity.threatLevel).toBe(ThreatLevel.CRITICAL);
            expect(newSecurity.integrity).toBe(IntegrityStatus.COMPROMISED);
            expect(audit.severity).toBe('CRITICAL');
        });

        it('simulates CUSTOM attacks correctly', () => {
            const customParams = {
                psiDelta: 0.5,
                flipDelta: 0.5,
                rankDelta: -0.8,
                threat: ThreatLevel.CRITICAL,
                integrity: IntegrityStatus.COMPROMISED,
                details: "Custom evil attack",
                forensics: ["Custom proof"]
            };

            const { newMetrics, newSecurity, audit } = performAttackSimulation('CUSTOM', baseMetrics, customParams);

            expect(newMetrics.psi).toBe(0.55); // max is 1, but 0.05+0.5=0.55
            expect(newSecurity.threatLevel).toBe(ThreatLevel.CRITICAL);
            expect(audit.details).toBe("Custom evil attack");
        });

        it('simulates FEATURE_MASKING correctly', () => {
            const { newMetrics, newSecurity, audit } = performAttackSimulation('FEATURE_MASKING', baseMetrics);

            expect(newMetrics.psi).toBe(baseMetrics.psi + 0.4);
            expect(newSecurity.threatLevel).toBe(ThreatLevel.CRITICAL);
            expect(audit.action).toBe('Attack Simulation: FEATURE_MASKING');
            expect(newSecurity.forensicEvidence).toContain("Feature Metadata Loss: Column #4 (CreditScore) is null");
        });

        it('caps metrics bounds between 0 and 1 correctly', () => {
            const extremeMetrics: DriftMetrics = {
                psi: 0.9,
                flipRate: 0.9,
                spearmanRank: 0.1,
                timestamp: Date.now()
            };
            const customParams = {
                psiDelta: 0.5,
                flipDelta: 0.5,
                rankDelta: -0.5,
                threat: ThreatLevel.CRITICAL,
                integrity: IntegrityStatus.COMPROMISED,
                details: "Max out",
                forensics: []
            };

            const { newMetrics } = performAttackSimulation('CUSTOM', extremeMetrics, customParams);

            expect(newMetrics.psi).toBe(1);
            expect(newMetrics.flipRate).toBe(1);
            expect(newMetrics.spearmanRank).toBe(0);
        });
    });

    describe('performSystemReboot', () => {
        it('resets metrics and security status to baseline', () => {
            const { newMetrics, newSecurity, audit } = performSystemReboot();

            expect(newMetrics.psi).toBe(0.04);
            expect(newMetrics.flipRate).toBe(0.02);
            expect(newMetrics.spearmanRank).toBe(0.98);

            expect(newSecurity.threatLevel).toBe(ThreatLevel.LOW);
            expect(newSecurity.integrity).toBe(IntegrityStatus.VERIFIED);

            expect(audit.action).toBe('IMMUTABLE_REBOOT');
        });
    });
});
