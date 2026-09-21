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
