import type { EntrantApplicant } from "@/types/border";
import { COHERENCE, type JevBorderResponse, type Judgment } from "@/types/jev";
import { debugLog } from "./debug";
import { declaredCargo, evidenceFor, type EvidenceStage } from "./evidence";
export function mockJevResponse(entrant: EntrantApplicant): JevBorderResponse {
  const dangerous = /explosive|munition|weapon|bomb/i.test(
    entrant.bio.carriedItems.join(" "),
  );
  const mismatch =
    entrant.entryPermit.purpose === "VISIT" &&
    /here for employment/i.test(entrant.bio.declaredPurpose);
  const uncertain = /no contents declaration/i.test(
    entrant.bio.carriedItems.join(" "),
  );
  return {
    declaration_accuracy: {
      choice: entrant.cargoEvidence?.stage === "declared" ? "unverified" : dangerous && !/explosive|munition|weapon|bomb/i.test((entrant.cargoEvidence?.declaredItems ?? declaredCargo(entrant)).join(" ")) ? "contradicted" : uncertain ? "unverified" : "supported",
      confidence: entrant.cargoEvidence?.stage === "declared" ? 1 : uncertain ? 0.45 : 0.94,
    },
    story_coherence: {
      score:
        dangerous || mismatch
          ? "contradictory"
          : uncertain
            ? "plausible"
            : "consistent",
      value: dangerous || mismatch ? 0 : uncertain ? 1.5 : 3,
    },
    smuggling_risk: { probability: dangerous ? 0.94 : uncertain ? 0.45 : 0.03 },
    semantic_assessment: {
      choice: dangerous
        ? "security_concern"
        : mismatch
          ? "purpose_mismatch"
          : "no_concern",
      confidence: dangerous ? 0.89 : uncertain ? 0.45 : 0.94,
    },
  };
}
const probability = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
export function normalizeJevResponse(raw: unknown): JevBorderResponse {
  if (!raw || typeof raw !== "object" || !("answers" in raw))
    throw new Error("Missing answers");
  const a = (raw as { answers: Record<string, Record<string, unknown>> })
    .answers;
  const score = a?.story_coherence;
  const risk = a?.smuggling_risk;
  const assessment = a?.semantic_assessment;
  const declaration = a?.declaration_accuracy;
  if (
    declaration?.type !== "choice" ||
    !["supported", "contradicted", "unverified"].includes(String(declaration.choice)) ||
    !probability(declaration.confidence) ||
    score?.type !== "score" ||
    typeof score.score !== "number" ||
    !Number.isFinite(score.score) ||
    score.score < 0 ||
    score.score > 3 ||
    risk?.type !== "noul" ||
    !probability(risk.noul) ||
    assessment?.type !== "choice" ||
    !["security_concern", "purpose_mismatch", "no_concern"].includes(
      String(assessment.choice),
    ) ||
    !probability(assessment.confidence)
  )
    throw new Error("Invalid typed response");
  return {
    declaration_accuracy: {
      choice: declaration.choice as JevBorderResponse["declaration_accuracy"]["choice"],
      confidence: declaration.confidence,
    },
    story_coherence: {
      score: COHERENCE[Math.round(score.score)],
      value: score.score,
    },
    smuggling_risk: { probability: risk.noul },
    semantic_assessment: {
      choice:
        assessment.choice as JevBorderResponse["semantic_assessment"]["choice"],
      confidence: assessment.confidence,
    },
  };
}
export function buildJevPayload(e: EntrantApplicant, model = "jev-latest") {
  return {
    model,
    state: {
      cargo_evidence_stage: e.cargoEvidence?.stage ?? "inspected",
      declared_cargo: e.cargoEvidence?.declaredItems ?? declaredCargo(e),
      profession: e.bio.statedProfession,
      declared_purpose: e.bio.declaredPurpose,
      carried_items: e.bio.carriedItems,
      demeanor: e.bio.observedDemeanor,
      permit_purpose: e.entryPermit.purpose,
    },
    questions: {
      declaration_accuracy: {
        type: "choice",
        instructions: "Compare declared_cargo against carried_items only after inspection. When cargo_evidence_stage is declared, select unverified: an unsearched declaration cannot verify itself. After inspection, judge material omissions or contradictions, not harmless differences in wording. Do not infer deliberate lying, guilt, or an entry verdict.",
        criteria: {
          supported: "Inspected contents support the cargo declaration, with no material discrepancy",
          contradicted: "Inspection reveals materially different or omitted cargo, such as explosives described as ordinary watch parts",
          unverified: "Luggage has not been inspected, or the evidence is insufficient to assess the declaration",
        },
      },
      story_coherence: {
        type: "score",
        instructions:
          "Evaluate whether luggage matches the stated trade and visit purpose. Do not compare dates or perform arithmetic.",
        criteria: [...COHERENCE],
      },
      smuggling_risk: {
        type: "noul",
        instructions:
          "Does the luggage contain undeclared munitions, explosive components, or weapons? Nervousness alone is not evidence.",
      },
      semantic_assessment: {
        type: "choice",
        instructions:
          "Assess only the story and cargo. Do not recommend admission, denial or detention; document validity and the final action are owned by code. Nervousness alone is not evidence of a violation.",
        criteria: {
          security_concern:
            "Evidence of hazardous or illicit cargo, explosive components or weapons",
          purpose_mismatch:
            "The stated trip conflicts with the permit purpose; ordinary professional equipment alone is not a mismatch",
          no_concern: "No semantic concern supported by the available evidence",
        },
      },
    },
  };
}
export function validateJudgment(value: unknown): Judgment {
  if (!value || typeof value !== "object") throw new Error("Missing judgment");
  const candidate = value as Judgment;
  if (
    !["live", "local"].includes(candidate.source) ||
    !Number.isFinite(candidate.latencyMs) ||
    candidate.latencyMs < 0
  )
    throw new Error("Invalid judgment metadata");
  const data = candidate.data;
  const normalized = normalizeJevResponse({
    answers: {
      declaration_accuracy: {
        type: "choice",
        choice: data?.declaration_accuracy?.choice,
        confidence: data?.declaration_accuracy?.confidence,
      },
      story_coherence: { type: "score", score: data?.story_coherence?.value },
      smuggling_risk: { type: "noul", noul: data?.smuggling_risk?.probability },
      semantic_assessment: {
        type: "choice",
        choice: data?.semantic_assessment?.choice,
        confidence: data?.semantic_assessment?.confidence,
      },
    },
  });
  return {
    source: candidate.source,
    latencyMs: candidate.latencyMs,
    data: normalized,
    ...(candidate.source === "local"
      ? {
          reason:
            candidate.reason === "unconfigured"
              ? ("unconfigured" as const)
              : ("unavailable" as const),
        }
      : {}),
  };
}
export async function fetchJevJudgment(
  entrant: EntrantApplicant,
  signal: AbortSignal,
  stage: EvidenceStage = "inspected",
): Promise<Judgment> {
  const start = performance.now();
  debugLog("JEV", "Requesting applicant judgment", {
    entrantId: entrant.id,
    route: "/api/judgment",
  });
  try {
    const response = await fetch("/api/judgment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entrantId: entrant.id, stage }),
      signal,
    });
    debugLog("JEV", "Game API responded", {
      entrantId: entrant.id,
      status: response.status,
    });
    if (!response.ok) throw new Error("Judgment unavailable");
    const judgment = validateJudgment(await response.json());
    debugLog(
      "JEV",
      "Judgment response",
      {
        entrantId: entrant.id,
        roundTripMs: Math.round(performance.now() - start),
        ...judgment,
      },
      judgment.source === "live" ? "success" : "warn",
    );
    return judgment;
  } catch (error) {
    if (signal.aborted) {
      debugLog(
        "JEV",
        "Request cancelled (applicant change, unmount, or development effect cleanup)",
        { entrantId: entrant.id },
      );
      throw error;
    }
    const fallback: Judgment = {
      data: mockJevResponse(evidenceFor(entrant, stage)),
      source: "local",
      reason: "unavailable",
      latencyMs: Math.round(performance.now() - start),
    };
    debugLog(
      "JEV",
      "Game API unavailable; using browser fallback",
      { entrantId: entrant.id, ...fallback },
      "warn",
    );
    return fallback;
  }
}
