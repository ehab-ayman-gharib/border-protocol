/**
 * @file Shared contracts for normalized Jev answers and judgment provenance.
 * Defines the coherence rubric, semantic/declaration choices, confidence, latency
 * and live/local metadata. Runtime response validation lives in jevClient.ts.
 */
export const COHERENCE = [
  "contradictory",
  "suspicious",
  "plausible",
  "consistent",
] as const;
export interface JevBorderResponse {
  declaration_accuracy: {
    choice: "supported" | "contradicted" | "unverified";
    confidence: number;
  };
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
