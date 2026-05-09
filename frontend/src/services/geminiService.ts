import { GoogleGenAI } from "@google/genai";
import { ThreatLevel, IntegrityStatus } from "../types";

export type AITier = 'standard' | 'performance';

export const getSecurityInsight = async (
  threatLevel: ThreatLevel, 
  integrity: IntegrityStatus, 
  psi: number,
  tier: AITier = 'standard'
): Promise<string> => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY;
  // Strip any accidental quotes or whitespace
  const apiKey = rawKey?.replace(/['"]/g, '').trim();
  
  if (!apiKey) return "AI Insights unavailable: API key not configured.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: tier === 'performance' ? "gemini-1.5-pro" : "gemini-1.5-flash",
      contents: [{
        role: 'user',
        parts: [{
          text: `As a Lead Model Governance Officer, analyze this system state:
          - Threat Level: ${threatLevel}
          - Integrity: ${integrity}
          - Population Stability Index (PSI): ${psi.toFixed(3)}
          
          Provide a concise, 2-sentence executive summary of the risk and recommended action.`
        }]
      }],
    });

    // Handle both newer and older SDK return structures
    const text = typeof (response as any).text === 'function' 
      ? (response as any).text() 
      : response.text;

    return text || "No insight generated.";
  } catch (error) {
    console.error("Gemini Insight failed", error);
    // Log more specific error info to help debug connectivity
    if (error instanceof Error) {
      console.warn("Gemini Error Details:", error.message);
    }
    return "Failed to retrieve AI insight. Check connectivity.";
  }
};
