import { db } from '../services/db';
import { generateAuditId } from '../services/simulationEngine';

export const recordAuditAction = async (
  action: string, 
  details: string, 
  category: 'TRAINING' | 'ATTACK' | 'DRIFT' | 'REBOOT' | 'SECURITY',
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
) => {
  const entry = {
    id: generateAuditId(),
    timestamp: Date.now(),
    action,
    details,
    category,
    severity
  };
  await db.auditLogs.add(entry);
  return entry;
};
