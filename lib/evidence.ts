import type { EntrantApplicant } from "@/types/border";

export type EvidenceStage = "declared" | "inspected";
export function declaredCargo(entrant: EntrantApplicant): string[] {
  return entrant.portrait === 1
    ? ["Watch parts and repair tools", "Personal travel belongings"]
    : [...entrant.bio.carriedItems];
}
export function evidenceFor(
  entrant: EntrantApplicant,
  stage: EvidenceStage,
): EntrantApplicant {
  const evidence = structuredClone(entrant);
  evidence.cargoEvidence = { stage, declaredItems: declaredCargo(entrant) };
  if (stage === "declared") evidence.bio.carriedItems = declaredCargo(entrant);
  return evidence;
}
