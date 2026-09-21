import type { Verdict } from "@/types/border";
import type { Judgment } from "@/types/jev";
import type { CodeEvaluation } from "./deterministic";

export const POLICY = {
  confidence: 0.7,
  contrabandRisk: 0.8,
  clearRisk: 0.2,
  plausibleStory: 2,
} as const;
export interface Resolution {
  verdict: Verdict | null;
  basis: "security" | "documents" | "purpose" | "clear" | "inconclusive";
  explanation: string;
  coherenceScore: number;
}

// Jev assesses semantics. Code combines evidence, applies policy and scores play.
export function resolveInspection(
  code: CodeEvaluation,
  judgment: Judgment,
): Resolution {
  const {
    semantic_assessment: assessment,
    smuggling_risk: risk,
    story_coherence: story,
  } = judgment.data;
  const coherenceScore = Math.round((story.value / 3) * 100);
  const confident = assessment.confidence >= POLICY.confidence;
  if (
    assessment.choice === "security_concern" &&
    confident &&
    risk.probability >= POLICY.contrabandRisk
  ) {
    return {
      verdict: "DETAIN",
      basis: "security",
      coherenceScore,
      explanation: `Security concern with ${Math.round(risk.probability * 100)}% contraband risk and ${Math.round(assessment.confidence * 100)}% assessment confidence. Security custody takes priority over document denial.`,
    };
  }
  if (!code.passedAllCodeRules) {
    return {
      verdict: "DENY",
      basis: "documents",
      coherenceScore,
      explanation: `${code.logs.join(" ")} Document rules require denial; a plausible story cannot override invalid papers.`,
    };
  }
  if (
    assessment.choice === "purpose_mismatch" &&
    confident &&
    risk.probability <= POLICY.clearRisk &&
    story.value < POLICY.plausibleStory
  ) {
    return {
      verdict: "DENY",
      basis: "purpose",
      coherenceScore,
      explanation: `Documents pass, but the purpose assessment conflicts with the declared travel (${Math.round(assessment.confidence * 100)}% confidence; story coherence ${coherenceScore}/100). Entry is denied under the purpose rule.`,
    };
  }
  if (
    assessment.choice === "no_concern" &&
    confident &&
    risk.probability <= POLICY.clearRisk &&
    story.value >= POLICY.plausibleStory
  ) {
    return {
      verdict: "ADMIT",
      basis: "clear",
      coherenceScore,
      explanation: `Documents pass. The semantic assessment reports no concern, with story coherence ${coherenceScore}/100 and contraband risk ${Math.round(risk.probability * 100)}%. Entry requirements are satisfied.`,
    };
  }
  return {
    verdict: null,
    basis: "inconclusive",
    coherenceScore,
    explanation:
      "Documents pass, but the semantic signals are uncertain or conflicting. The Ministry has no conclusive ruling for this inspection. Your action is recorded; no credits or penalty are applied.",
  };
}
