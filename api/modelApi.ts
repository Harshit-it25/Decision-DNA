
import { Applicant, ModelMetadata } from '../types';
import { apiClient } from './apiClient';

export async function predictRisk(applicant: Partial<Applicant>, modelId: string) {
  return apiClient("/api/predict-risk", {
    method: "POST",
    body: JSON.stringify({ applicant, modelId })
  });
}

export async function getModels() {
  return apiClient("/api/models");
}

export async function trainModel(config: any) {
  return apiClient("/api/train-model", {
    method: "POST",
    body: JSON.stringify(config)
  });
}
