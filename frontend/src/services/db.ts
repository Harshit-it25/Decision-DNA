import Dexie, { Table } from 'dexie';
import { ModelMetadata, Applicant, AuditEntry, DriftHistoryEntry } from '../types';
import { INITIAL_MODELS, MOCK_APPLICANTS } from '../constants';

export class DecisionDNADatabase extends Dexie {
  models!: Table<ModelMetadata>;
  applicants!: Table<Applicant>;
  auditLogs!: Table<AuditEntry>;
  driftHistory!: Table<DriftHistoryEntry>;

  constructor() {
    super('DecisionDNADatabase');
    this.version(1).stores({
      models: 'id, type, status',
      applicants: 'id, name, decision',
      auditLogs: 'id, timestamp, category, severity',
      driftHistory: '++id, timestamp, modelId'
    });
  }

  async seed() {
    const modelCount = await this.models.count();
    if (modelCount === 0) {
      await this.models.bulkAdd(INITIAL_MODELS);
    }

    const applicantCount = await this.applicants.count();
    if (applicantCount === 0) {
      await this.applicants.bulkAdd(MOCK_APPLICANTS);
    }
  }
}

export const db = new DecisionDNADatabase();
