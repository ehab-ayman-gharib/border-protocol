import type { EntrantApplicant } from "@/types/border";
import { CHECKPOINT_DATE } from "@/fixtures/presets";
import { hashSeal, OFFICIAL_SEAL_HASH } from "./seal";
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function evaluateDeterministicRules(
  entrant: EntrantApplicant,
  date = CHECKPOINT_DATE,
) {
  const logs: string[] = [];
  const isDateValid =
    validDate(date) &&
    validDate(entrant.passport.expirationDate) &&
    entrant.passport.expirationDate >= date;
  const isPassportMatching =
    entrant.passport.documentNumber === entrant.entryPermit.passportRef;
  const normalize = (s: string) => s.trim().normalize("NFKC").toLowerCase();
  const isNameMatching =
    normalize(entrant.passport.fullName) ===
      normalize(entrant.entryPermit.fullName) &&
    normalize(entrant.passport.fullName) === normalize(entrant.bio.fullName);
  const actualHash = hashSeal(entrant.entryPermit.sealSvgRaw);
  const isSealAuthentic =
    actualHash === OFFICIAL_SEAL_HASH &&
    actualHash === entrant.entryPermit.sealSvgHash;
  const isDurationMatching =
    entrant.entryPermit.durationDays === entrant.bio.declaredDurationDays &&
    Number.isInteger(entrant.entryPermit.durationDays) &&
    entrant.entryPermit.durationDays > 0;
  if (!isDateValid)
    logs.push(
      `Expired or invalid passport: ${entrant.passport.expirationDate}. Checkpoint: ${date}.`,
    );
  if (!isPassportMatching)
    logs.push("Passport number does not match permit reference.");
  if (!isNameMatching) logs.push("Identity differs across documents.");
  if (!isSealAuthentic)
    logs.push("Seal content failed SHA-256 integrity verification.");
  if (!isDurationMatching)
    logs.push("Declared duration does not match the entry permit.");
  return {
    isDateValid,
    isPassportMatching,
    isNameMatching,
    isSealAuthentic,
    isDurationMatching,
    passedAllCodeRules:
      isDateValid &&
      isPassportMatching &&
      isNameMatching &&
      isSealAuthentic &&
      isDurationMatching,
    logs,
  };
}
export type CodeEvaluation = ReturnType<typeof evaluateDeterministicRules>;
