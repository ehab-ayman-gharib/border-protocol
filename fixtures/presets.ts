import type { EntrantApplicant } from "@/types/border";
import { ARSTOVIA_VALID_SEAL_SVG, OFFICIAL_SEAL_HASH } from "@/lib/seal";
export { ARSTOVIA_VALID_SEAL_SVG, OFFICIAL_SEAL_HASH };
export const CHECKPOINT_DATE = "2026-09-22";
const seal = {
  sealSvgHash: OFFICIAL_SEAL_HASH,
  sealSvgRaw: ARSTOVIA_VALID_SEAL_SVG,
};
export const ENTRANT_PRESETS: EntrantApplicant[] = [
  {
    id: "entrant-01-expired",
    portrait: 0,
    bio: {
      fullName: "Jorji Costava",
      nation: "Obristan",
      statedProfession: "Unlicensed courier",
      declaredPurpose: "Visiting relatives in East Grestin for 3 days.",
      declaredDurationDays: 3,
      carriedItems: [
        "Worn leather satchel",
        "Half-eaten sausage",
        "Cheap cigarettes",
      ],
      observedDemeanor:
        "Laughing nervously, shifting his weight. Smells of spirits.",
    },
    passport: {
      documentNumber: "OB-79102-K",
      fullName: "Jorji Costava",
      issuingNation: "Obristan",
      expirationDate: "2026-08-11",
      birthDate: "1972-04-14",
    },
    entryPermit: {
      passportRef: "OB-79102-K",
      fullName: "Jorji Costava",
      purpose: "VISIT",
      durationDays: 3,
      ...seal,
    },
  },
  {
    id: "entrant-02-smuggler",
    portrait: 1,
    bio: {
      fullName: "Boris Vance",
      nation: "Kolechia",
      statedProfession: "Watch repairman",
      declaredPurpose: "A 3-day social visit to my sister in Nirsk.",
      declaredDurationDays: 3,
      carriedItems: [
        "14 unmarked mechanical timers",
        "Heavy brass explosive casings",
        "Lathe gears",
      ],
      observedDemeanor:
        "Excessive sweating. Glances repeatedly toward the guards.",
    },
    passport: {
      documentNumber: "KL-30488-V",
      fullName: "Boris Vance",
      issuingNation: "Kolechia",
      expirationDate: "2027-06-15",
      birthDate: "1984-11-03",
    },
    entryPermit: {
      passportRef: "KL-30488-V",
      fullName: "Boris Vance",
      purpose: "VISIT",
      durationDays: 3,
      ...seal,
    },
  },
  {
    id: "entrant-03-clean",
    portrait: 2,
    bio: {
      fullName: "Elysia Ward",
      nation: "Republia",
      statedProfession: "Agronomist",
      declaredPurpose: "Attending a 7-day grain harvest conference in Orvech.",
      declaredDurationDays: 7,
      carriedItems: [
        "Soil test vials",
        "Botanical journal",
        "Linen travel clothes",
      ],
      observedDemeanor: "Calm and poised, with clear, measured responses.",
    },
    passport: {
      documentNumber: "RP-49112-W",
      fullName: "Elysia Ward",
      issuingNation: "Republia",
      expirationDate: "2027-11-20",
      birthDate: "1991-03-29",
    },
    entryPermit: {
      passportRef: "RP-49112-W",
      fullName: "Elysia Ward",
      purpose: "WORK",
      durationDays: 7,
      ...seal,
    },
  },
];
