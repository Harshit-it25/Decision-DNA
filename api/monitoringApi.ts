
import { apiClient } from "./apiClient";

export async function getDriftMetrics() {
  return apiClient("/api/monitoring-drift");
}

export async function getPerformanceData() {
  return apiClient("/api/monitoring-performance");
}

export async function getAuditLogs(limit: number = 50) {
  return apiClient("/api/audit-logs", { params: { limit } });
}
