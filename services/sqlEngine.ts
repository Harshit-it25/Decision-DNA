
import { db } from './db';

/**
 * A basic SQL parser/executor for Decision DNA.
 * Supports: SELECT * FROM [table] WHERE [key] [op] [val]
 * Tables: applicants, auditLogs, models
 */
export const executeSQL = async (query: string): Promise<any[]> => {
  const cleanQuery = query.trim().replace(/;/g, '');
  const parts = cleanQuery.split(/\s+/);
  
  if (parts[0].toUpperCase() !== 'SELECT') {
    throw new Error("Only SELECT queries are supported in the Security Terminal.");
  }

  // Find table
  const fromIndex = parts.findIndex(p => p.toUpperCase() === 'FROM');
  if (fromIndex === -1 || !parts[fromIndex + 1]) {
    throw new Error("Missing FROM clause.");
  }
  
  const tableName = parts[fromIndex + 1].toLowerCase();
  const table = (db as any)[tableName];
  if (!table) {
    throw new Error(`Table '${tableName}' not found in database.`);
  }

  // Basic Filter
  const whereIndex = parts.findIndex(p => p.toUpperCase() === 'WHERE');
  if (whereIndex !== -1) {
    const key = parts[whereIndex + 1];
    const op = parts[whereIndex + 2];
    let val: any = parts[whereIndex + 3];

    // Clean up value (remove quotes)
    if (val.startsWith("'") || val.startsWith('"')) {
      val = val.substring(1, val.length - 1);
    } else if (!isNaN(Number(val))) {
      val = Number(val);
    }

    // Translate to Dexie Collection
    switch (op) {
      case '=': return await table.where(key).equals(val).toArray();
      case '>': return await table.where(key).above(val).toArray();
      case '<': return await table.where(key).below(val).toArray();
      case '>=': return await table.where(key).aboveOrEqual(val).toArray();
      case '<=': return await table.where(key).belowOrEqual(val).toArray();
      default: return await table.toArray();
    }
  }

  return await table.toArray();
};
