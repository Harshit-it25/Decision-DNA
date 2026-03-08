
// Use named import for Dexie class to ensure all instance methods are properly inherited and recognized by the TypeScript compiler
import { Dexie, type EntityTable } from 'dexie';
import { Applicant, ModelMetadata, AuditEntry, DriftHistoryEntry } from '../types';
import { MOCK_APPLICANTS, INITIAL_MODELS } from '../constants';

/**
 * Database class for Decision DNA using Dexie.
 * We extend Dexie to provide type safety for our tables.
 */
class DecisionDNADatabase extends Dexie {
  applicants!: EntityTable<Applicant, 'id'>;
  models!: EntityTable<ModelMetadata, 'id'>;
  auditLogs!: EntityTable<AuditEntry, 'id'>;
  driftHistory!: EntityTable<DriftHistoryEntry, 'id'>;

  constructor() {
    super('DecisionDNADB');
    
    // Define the database schema using the version method from the Dexie base class.
    // Named import for Dexie class ensures 'this.version' is recognized correctly.
    this.version(2).stores({
      applicants: 'id, name, nationality, creditScore, decision',
      models: 'id, type, version, status',
      auditLogs: 'id, timestamp, category, severity, action',
      driftHistory: '++id, timestamp, modelId, isDriftDetected'
    });
  }

  /**
   * Seed the database if it's currently empty
   */
  async seed() {
    const applicantCount = await this.applicants.count();
    if (applicantCount === 0) {
      await this.applicants.bulkAdd(MOCK_APPLICANTS);
    }

    const modelCount = await this.models.count();
    if (modelCount === 0) {
      await this.models.bulkAdd(INITIAL_MODELS);
    }
  }
}

export const db = new DecisionDNADatabase();

// Run seed on initialization to ensure system has initial data
db.seed().catch(err => console.error("Failed to seed database:", err));
