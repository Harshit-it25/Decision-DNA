
import { db } from '../services/db';
import { AuditEntry } from '../types';
import { generateAuditId } from '../services/simulationEngine';

export const recordAuditAction = async (
  action: string, 
  details: string, 
  category: AuditEntry['category'], 
  severity: AuditEntry['severity'] = 'INFO'
) => {
  const entry: AuditEntry = {
    id: generateAuditId(),
    timestamp: Date.now(),
    action,
    details,
    category,
    severity
  };

  try {
    await db.auditLogs.add(entry);
    return entry;
  } catch (error) {
    console.error("Failed to record audit action", error);
    return null;
  }
};

export const getAuditTrail = async (limit: number = 100) => {
  return await db.auditLogs.reverse().limit(limit).toArray();
};
