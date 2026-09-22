/**
 * @file Shared TypeScript contracts for travelers, passports, permits and verdicts.
 * Includes evidence-stage metadata used when preparing Jev input. Defines data
 * shapes only; validation and game rules are implemented in lib/.
 */
export type ArstovianNation =
  "Arstovia" | "Kolechia" | "Obristan" | "Republia" | "Antegria";
export type Verdict = "ADMIT" | "DENY" | "DETAIN";
export interface PassportDoc {
  documentNumber: string;
  fullName: string;
  issuingNation: ArstovianNation;
  expirationDate: string;
  birthDate: string;
}
export interface EntryPermitDoc {
  passportRef: string;
  fullName: string;
  purpose: "TRANSIT" | "WORK" | "VISIT" | "IMMIGRATION";
  durationDays: number;
  sealSvgHash: string;
  sealSvgRaw: string;
}
export interface EntrantApplicant {
  cargoEvidence?: { stage: "declared" | "inspected"; declaredItems: string[] };
  id: string;
  portrait: number;
  bio: {
    fullName: string;
    nation: ArstovianNation;
    statedProfession: string;
    declaredPurpose: string;
    declaredDurationDays: number;
    carriedItems: string[];
    observedDemeanor: string;
  };
  passport: PassportDoc;
  entryPermit: EntryPermitDoc;
}
