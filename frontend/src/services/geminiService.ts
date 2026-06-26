import { ThreatLevel, IntegrityStatus } from "../types";

export type AITier = 'standard' | 'performance';

// Cache to avoid hitting rate limits on every state change
interface InsightCache {
  key: string;
  value: string;
  timestamp: number;
}

let insightCache: InsightCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getSecurityInsight = async (
  threatLevel: ThreatLevel,
  integrity: IntegrityStatus,
  psi: number,
  tier: AITier = 'standard'
): Promise<string> => {
  // Use cached result if same inputs within TTL
  const cacheKey = `${threatLevel}|${integrity}|${psi.toFixed(2)}|${tier}`;
  if (insightCache && insightCache.key === cacheKey && Date.now() - insightCache.timestamp < CACHE_TTL_MS) {
    return insightCache.value;
  }

  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('decision_dna_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/security/insight', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        threatLevel,
        integrity,
        psi,
        tier
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        const friendly = "⚠️ Rate limit exceeded. Please wait a moment before requesting another security insight.";
        insightCache = { key: cacheKey, value: friendly, timestamp: Date.now() };
        return friendly;
      }
      throw new Error(`Failed with status ${response.status}`);
    }

    const data = await response.json();
    const text = data.insight || "No insight generated.";

    // Cache successful result
    insightCache = { key: cacheKey, value: text, timestamp: Date.now() };
    return text;
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("Gemini Insight failed:", msg);

    // Friendly error checks
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('limit')) {
      const friendly = "⚠️ AI quota limit reached for today. Governance insights will resume automatically tomorrow, or upgrade your Gemini API plan at ai.google.dev.";
      insightCache = { key: cacheKey, value: friendly, timestamp: Date.now() };
      return friendly;
    }

    return `AI insight unavailable: ${msg}`;
  }
};
