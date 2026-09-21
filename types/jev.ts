export const COHERENCE = [
  "contradictory",
  "suspicious",
  "plausible",
  "consistent",
] as const;
export interface JevBorderResponse {
  story_coherence: { score: (typeof COHERENCE)[number]; value: number };
  smuggling_risk: { probability: number };
  semantic_assessment: {
    choice: "security_concern" | "purpose_mismatch" | "no_concern";
    confidence: number;
  };
}
export interface Judgment {
  data: JevBorderResponse;
  source: "live" | "local";
  latencyMs: number;
  reason?: "unconfigured" | "unavailable";
}
