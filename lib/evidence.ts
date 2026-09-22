/**
 * @file Constructs declaration-only or inspected evidence from a static traveler.
 * Keeps undiscovered cargo out of the provisional payload, preserves the original
 * declaration after inspection, and clones data so fixtures remain unchanged.
 */
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
