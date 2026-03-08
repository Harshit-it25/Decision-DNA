
import { db } from './db';
import { detectDrift } from '../drift/driftDetector';
import { recordAuditAction } from '../logs/auditLogs';
import { DriftHistoryEntry } from '../types';

class MonitoringService {
  private intervalId: any = null;
  private isRunning: boolean = false;

  /**
   * Start the continuous monitoring loop
   * @param intervalMs How often to check for drift (default 30 seconds for demo)
   */
  start(intervalMs: number = 30000) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("[MonitoringService] Continuous monitoring started.");
    
    // Initial check
    this.performDriftCheck();
    
    this.intervalId = setInterval(() => {
      this.performDriftCheck();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("[MonitoringService] Continuous monitoring stopped.");
  }

  private async performDriftCheck() {
    try {
      const allApplicants = await db.applicants.toArray();
      if (allApplicants.length < 100) return;

      // Baseline: First 50 applicants (simulated training data)
      const baseline = allApplicants.slice(0, 50);
      // Current: Last 50 applicants (simulated production data)
      const current = allApplicants.slice(-50);

      const activeModel = await db.models.where('status').equals('Active').first();
      if (!activeModel) return;

      const driftResult = detectDrift(baseline, current);
      
      // Add random variance to make the PSI look "live" for the demo
      // We use a larger variance (0.05) to make shifts more visible
      const variance = (Math.random() - 0.5) * 0.05;
      const dynamicPsi = Math.max(0.01, driftResult.psi + variance);

      const historyEntry: DriftHistoryEntry = {
        timestamp: Date.now(),
        psi: dynamicPsi,
        klDivergence: driftResult.klDivergence,
        isDriftDetected: dynamicPsi > 0.1,
        modelId: activeModel.id
      };

      await db.driftHistory.add(historyEntry);

      if (driftResult.isDriftDetected) {
        await recordAuditAction(
          "Automated Drift Detection",
          `Continuous monitor detected significant population drift (PSI: ${driftResult.psi.toFixed(4)}).`,
          'DRIFT',
          'WARNING'
        );
      }

      // Keep only last 100 history entries to prevent DB bloat
      const count = await db.driftHistory.count();
      if (count > 100) {
        const oldest = await db.driftHistory.orderBy('id').first();
        if (oldest?.id) await db.driftHistory.delete(oldest.id);
      }

    } catch (error) {
      console.error("[MonitoringService] Drift check failed:", error);
    }
  }
}

export const monitoringService = new MonitoringService();
