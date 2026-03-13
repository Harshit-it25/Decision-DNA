import { GoogleGenAI } from "@google/genai";
import { ThreatLevel, IntegrityStatus } from "../types";

export type AITier = 'standard' | 'performance';

export const getSecurityInsight = async (
  threatLevel: ThreatLevel, 
  integrity: IntegrityStatus, 
  psi: number,
  tier: AITier = 'standard'
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return "AI Insights unavailable: API key not configured.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = ai.models.generateContent({
      model: tier === 'performance' ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview",
      contents: `As a Lead Model Governance Officer, analyze this system state:
      - Threat Level: ${threatLevel}
      - Integrity: ${integrity}
      - Population Stability Index (PSI): ${psi.toFixed(3)}
      
      Provide a concise, 2-sentence executive summary of the risk and recommended action.`,
    });

    const response = await model;
    return response.text || "No insight generated.";
  } catch (error) {
    console.error("Gemini Insight failed", error);
    return "Failed to retrieve AI insight. Check connectivity.";
  }
};
