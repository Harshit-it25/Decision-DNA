
export interface PromptInjectionResult {
  isInjection: boolean;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
}

/**
 * Detects prompt injection attacks in user-provided text.
 * Used for the AI Appeal system.
 */
export const detectPromptInjection = (input: string): PromptInjectionResult => {
  const injectionPatterns = [
    /ignore previous instructions/i,
    /system prompt/i,
    /acting as/i,
    /you are now/i,
    /forget everything/i,
    /override/i,
    /jailbreak/i
  ];
  
  const matches = injectionPatterns.filter(pattern => pattern.test(input));
  
  if (matches.length > 0) {
    return {
      isInjection: true,
      threatLevel: matches.length > 1 ? 'HIGH' : 'MEDIUM',
      details: `Prompt injection pattern detected: ${matches.join(', ')}`
    };
  }
  
  return {
    isInjection: false,
    threatLevel: 'LOW',
    details: "Input appears safe."
  };
};
