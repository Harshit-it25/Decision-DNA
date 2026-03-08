
import { ModelMetadata, ModelStatus, ModelType } from '../types';
import { db } from '../services/db';

export interface ModelRegistryEntry extends ModelMetadata {
  trainingDatasetId: string;
  hash: string;
  previousVersionId?: string;
  metadata: {
    trainingTime: number;
    sampleSize: number;
    parameters: any;
  };
}

export const registerModel = async (model: ModelRegistryEntry) => {
  try {
    await db.models.add(model);
    return model;
  } catch (error) {
    console.error("Failed to register model", error);
    return null;
  }
};

export const getModelHistory = async () => {
  return await db.models.toArray();
};

export const getActiveModel = async () => {
  return await db.models.where('status').equals(ModelStatus.ACTIVE).first();
};

export const verifyModelIntegrity = (model: ModelMetadata, expectedHash: string): boolean => {
  return model.fingerprint === expectedHash;
};
