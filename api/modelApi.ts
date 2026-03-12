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

export const getModelMetrics = async () => {
  const response = await fetch('/api/model-metrics');
  return response.json();
};
