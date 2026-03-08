
import { apiClient } from "./apiClient";

export async function getSystemInfo() {
  return apiClient("/api/system-info");
}

export async function getHealthCheck() {
  return apiClient("/api/health");
}
