let authToken: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('decision_dna_token') : null;

export const login = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  try {
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    
    if (!response.ok) {
        let errorMessage = 'Invalid credentials';
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorMessage = errData.detail;
          }
        } catch (_) {}
        throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.access_token) {
      authToken = data.access_token;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('decision_dna_token', authToken!);
      }
      return { success: true };
    }
  } catch (e) {
    console.error("Login failed:", e);
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
  return { success: false, error: "Authentication failed" };
};

export const logout = () => {
  authToken = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('decision_dna_token');
  }
};

export const getCurrentUserInfo = async () => {
  const headers = await getHeaders();
  if (!authToken) return null;
  
  try {
    const response = await fetch('/api/me', { headers });
    if (!response.ok) {
        if (response.status === 401) logout();
        return null;
    }
    return await response.json();
  } catch (e) {
    console.error("Failed to fetch user info:", e);
    return null;
  }
};

const getHeaders = async () => {
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  };
};

export const trainModel = async (config: any) => {
  const headers = await getHeaders();
  const response = await fetch('/api/train-model', {
    method: 'POST',
    headers,
    body: JSON.stringify(config)
  });
  return await response.json();
};

export const runTest = async (modelId: string) => {
  return { success: true };
};

export const predictRisk = async (applicant: any, modelId: string) => {
  const headers = await getHeaders();
  const response = await fetch('/api/predict', {
    method: 'POST',
    headers,
    body: JSON.stringify({ applicant, modelId })
  });
  if (!response.ok) {
      throw new Error(`Prediction failed with status ${response.status}`);
  }
  return await response.json();
};

export const getModelMetrics = async () => {
  const headers = await getHeaders();
  const response = await fetch('/api/model-metrics', { headers });
  if (!response.ok) throw new Error("Failed to fetch model metrics");
  return await response.json();
};

export const getModelMetadata = async () => {
  const headers = await getHeaders();
  const response = await fetch('/api/model/metadata', { headers });
  if (!response.ok) throw new Error("Failed to fetch model metadata");
  return await response.json();
};

export const getModels = async () => {
  const headers = await getHeaders();
  const response = await fetch('/api/models', { headers });
  if (!response.ok) throw new Error("Failed to fetch models list");
  return await response.json();
};

export const triggerAttack = async (type: string) => {
  const headers = await getHeaders();
  const response = await fetch('/api/security-attack', {
    method: 'POST',
    headers,
    body: JSON.stringify({ type })
  });
  return await response.json();
};

export const getMonitoringDrift = async () => {
  const headers = await getHeaders();
  try {
      const response = await fetch('/api/monitoring-drift', { headers });
      const data = await response.json();
      return data;
  } catch (error) {
      console.error("Failed to get monitoring drift", error);
      return { psi: 0, status: "Unknown", current_reject_rate: 0 };
  }
};

export const rebootSystem = async () => {
  const headers = await getHeaders();
  const response = await fetch('/api/reboot', {
    method: 'POST',
    headers
  });
  if (!response.ok) {
    let errorMessage = 'Reboot failed';
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        errorMessage = errData.detail;
      }
    } catch (_) {}
    throw new Error(errorMessage);
  }
  return await response.json();
};

export const getSecurityStatus = async () => {
  const headers = await getHeaders();
  const response = await fetch('/api/security/status', { headers });
  return await response.json();
};

export const triggerRedTeam = async () => {
  const headers = await getHeaders();
  const response = await fetch('/api/security/red-team', { method: 'POST', headers });
  return await response.json();
};

export const triggerHardening = async () => {
    const headers = await getHeaders();
    const response = await fetch('/api/security/harden', { method: 'POST', headers });
    return await response.json();
  };

export const getFairnessMetrics = async () => {
  const headers = await getHeaders();
  const response = await fetch('/api/audit/fairness', { headers });
  if (!response.ok) throw new Error(`Fairness API error: ${response.status}`);
  return await response.json();
};

export const verifyWatermark = async () => {
    const headers = await getHeaders();
    const response = await fetch('/api/security/watermark/verify', { headers });
    return await response.json();
};

export const getDecisionExplanation = async (applicantData: any) => {
    const headers = await getHeaders();
    const response = await fetch('/api/audit/explain', { 
        method: 'POST', 
        headers,
        body: JSON.stringify(applicantData)
    });
    return await response.json();
};
