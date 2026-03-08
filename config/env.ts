
export const config = {
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
  
  api: {
    baseUrl: process.env.VITE_API_BASE_URL || '',
    timeout: 30000,
  },
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-3-flash-preview',
  },
  
  db: {
    name: 'DecisionDNADB',
    version: 1,
  }
};

export default config;
