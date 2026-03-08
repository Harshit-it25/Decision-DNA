
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export interface SystemLog {
  timestamp: number;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
}

export const logSystemEvent = (level: LogLevel, module: string, message: string, data?: any) => {
  const log: SystemLog = {
    timestamp: Date.now(),
    level,
    module,
    message,
    data
  };
  
  // In a real app, this would send to a logging service or write to a file
  console.log(`[${module}] ${level}: ${message}`, data || '');
  
  // Could also persist to IndexedDB if needed
};
