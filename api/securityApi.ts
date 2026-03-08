
import { apiClient } from "./apiClient";

export async function getSecurityStatus() {
  return apiClient("/api/security-status");
}

export async function triggerAttack(type: string, params?: any) {
  return apiClient("/api/security-attack", {
    method: "POST",
    body: JSON.stringify({ type, params })
  });
}

export async function getForensicEvidence() {
  return apiClient("/api/forensics");
}
