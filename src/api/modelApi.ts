export const trainModel = async (config: any) => {
  const response = await fetch('/api/train-model', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_API_KEY || 'decision_dna_secret_key_2024'
    },
    body: JSON.stringify(config)
  });
  return response.json();
};

export const runTest = async (modelId: string) => {
  const response = await fetch('/api/run-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_API_KEY || 'decision_dna_secret_key_2024'
    },
    body: JSON.stringify({ modelId })
  });
  return response.json();
};

export const predictRisk = async (applicant: any, modelId: string) => {
  const response = await fetch('/api/predict-risk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_API_KEY || 'decision_dna_secret_key_2024'
    },
    body: JSON.stringify({ applicant, modelId })
  });
  return response.json();
};

export const getModelMetrics = async () => {
  const response = await fetch('/api/model-metrics');
  return response.json();
};

export const getModelMetadata = async () => {
  const response = await fetch('/api/model-metadata');
  return response.json();
};

export const triggerAttack = async (type: string) => {
  const response = await fetch('/api/security-attack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_API_KEY || 'decision_dna_secret_key_2024'
    },
    body: JSON.stringify({ type })
  });
  return response.json();
};

export const getMonitoringDrift = async () => {
  const response = await fetch('/api/monitoring-drift');
  return response.json();
};

export const rebootSystem = async () => {
  const response = await fetch('/api/reboot', {
    method: 'POST',
    headers: {
      'x-api-key': import.meta.env.VITE_API_KEY || 'decision_dna_secret_key_2024'
    }
  });
  return response.json();
};
