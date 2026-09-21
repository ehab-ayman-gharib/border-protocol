# # SYSTEM INSTRUCTION: Border Protocol Game Prototype Implementation

```
## Role & Goal
You are a senior full-stack game systems engineer. Your mission is to implement a modular, production-ready web simulation for **"Border Protocol"** (inspired by *Papers, Please*)[cite: 1, 4]. The core architectural axiom is: **"Code owns the math; Jev owns the judgment."**[cite: 1, 2, 4]

---

## 1. Architectural Mandates
1. **Deterministic Code Layer**:
   - Executes synchronous, zero-latency validation checks[cite: 1].
   - Validates document expiration dates against the system HUD clock.
   - Verifies cross-document ID serial numbers and identity string parity[cite: 1].
   - Evaluates bureaucratic SHA-256 seal integrity checks[cite: 1, 3].
2. **TypeSafe Jev System 1 Decision Layer (`jev-latest`)**:
   - Acts as a sub-150ms non-autoregressive qualitative judgment arbiter.
   - Evaluates semantic plausibility between declared occupation, duration, carried items, and traveler behavior[cite: 1].
   - Returns strictly typed primitives: `Score` (ordinal scale), `Noul` (boolean probability $[0.0, 1.0]$), and `Choice` (bounded categorical option)[cite: 1, 2, 4].
   - NEVER ask Jev to compare dates, calculate math, or invent explanations[cite: 1, 2, 3].
3. **Gateway Routing & Fallback**:
   - Route Jev requests via **Vercel AI Gateway** (`https://ai-gateway.vercel.sh/v1/typesafe/v1/systemone` or configured upstream proxy) using the promotional API key (free access active through September 25, 2026).
   - Configure gateway request headers using `Authorization: Bearer ${process.env.NEXT_PUBLIC_VERCEL_AI_GATEWAY_KEY || process.env.NEXT_PUBLIC_JEV_API_KEY}`.
   - Dispatch background evaluations asynchronously the instant an entrant approaches (~100ms).
   - Provide an automatic in-memory deterministic fallback when gateway keys are missing.

---

## 2. Tech Stack & Dependencies
- **Framework**: Next.js 15 (App Router, React 19, TypeScript)[cite: 1]
- **Styling**: Tailwind CSS[cite: 1]
- **Kinetics & Drag Canvas**: Framer Motion (`motion.div`, `dragConstraints`)[cite: 1]
- **Icons**: Lucide React (`Terminal`, `ShieldAlert`, `Scale`, `Award`, `RotateCcw`)
- **Gateway Endpoints**:
  - Direct Upstream: `POST https://api.typesafe.ai/v1/systemone`[cite: 1]
  - Gateway Proxy: `POST https://ai-gateway.vercel.sh/v1/typesafe/v1/systemone`

---

## 3. Project Directory Structure
```

`border-protocol/`

`├── types/`

`│   ├── border.ts          # Domain entities & documents`

`│   └── jev.ts             # Jev System 1 contracts`

`├── fixtures/`

`│   └── presets.ts         # Scripted entrants & SVG seal assets`

`├── lib/`

`│   ├── deterministic.ts   # Zero-latency arithmetic validation`

`│   └── jevClient.ts       # Vercel AI Gateway / Jev network layer`

`├── components/`

`│   ├── BoothHeader.tsx    # HUD date clock, credits & applicant transcript`

`│   ├── DeskSurface.tsx    # Framer Motion draggable document canvas`

`│   └── TelemetryModal.tsx # Code vs. Jev split-screen inspection drawer`

`└── app/`

`└── page.tsx           # Top-level state coordinator`

```

---

## 4. File-by-File Implementation

### `types/border.ts`
```typescript
export type ArstovianNation = "Arstovia" | "Kolechia" | "Obristan" | "Republia" | "Antegria";

export interface PassportDoc {
  documentNumber: string;
  fullName: string;
  issuingNation: ArstovianNation;
  expirationDate: string; // ISO 8601 (YYYY-MM-DD)
  birthDate: string;
}

export interface EntryPermitDoc {
  passportRef: string;
  fullName: string;
  purpose: "TRANSIT" | "WORK" | "VISIT" | "IMMIGRATION";
  durationDays: number;
  sealSvgHash: string; // SHA-256 integrity checksum
  sealSvgRaw: string;
}

export interface EntrantApplicant {
  id: string;
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
  groundTruthVerdict: "ADMIT" | "DENY" | "DETAIN";
  failureType?: "DETERMINISTIC_CODE" | "JEV_SEMANTIC_RISK";
  auditExplanation: string;
}
```

### `types/jev.ts`

TypeScript

# 

```
export interface JevBorderResponse {
  story_coherence: {
    score: "contradictory" | "suspicious" | "plausible" | "consistent";
  };
  smuggling_risk: {
    probability: number;
  };
  protocol_violation: {
    choice: "contraband" | "purpose_mismatch" | "none";
    confidence: number;
  };
  recommended_verdict: {
    choice: "admit" | "deny" | "detain";
    confidence: number;
  };
}
```

### `fixtures/presets.ts`

TypeScript

# 

```
import { EntrantApplicant } from "@/types/border";

export const CHECKPOINT_DATE = "2026-09-22";
export const OFFICIAL_SEAL_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

export const ARSTOVIA_VALID_SEAL_SVG = `<svg viewBox="0 0 100 100" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
  <circle cx="50" cy="50" r="46" stroke="#521b1b" stroke-width="4" fill="none" stroke-dasharray="3,3"/>
  <circle cx="50" cy="50" r="38" stroke="#521b1b" stroke-width="2" fill="none"/>
  <polygon points="50,18 62,42 88,44 68,62 74,88 50,74 26,88 32,62 12,44 38,42" fill="#521b1b" opacity="0.8"/>
  <text x="50" y="55" font-family="monospace" font-size="10" font-weight="bold" fill="#faebd7" text-anchor="middle">ARSTOVIA</text>
</svg>`;

export const ENTRANT_PRESETS: EntrantApplicant[] = [
  {
    id: "entrant-01-expired",
    bio: {
      fullName: "Jorji Costava",
      nation: "Obristan",
      statedProfession: "Unlicensed Courier",
      declaredPurpose: "Visiting relatives in East Grestin for 3 days",
      declaredDurationDays: 3,
      carriedItems: ["worn leather satchel", "half-eaten sausage", "cheap cigarettes"],
      observedDemeanor: "Laughing nervously, shifting weight, smells of spirits"
    },
    passport: {
      documentNumber: "OB-79102-K",
      fullName: "Jorji Costava",
      issuingNation: "Obristan",
      expirationDate: "2026-08-11", // Expired
      birthDate: "1972-04-14"
    },
    entryPermit: {
      passportRef: "OB-79102-K",
      fullName: "Jorji Costava",
      purpose: "VISIT",
      durationDays: 3,
      sealSvgHash: OFFICIAL_SEAL_HASH,
      sealSvgRaw: ARSTOVIA_VALID_SEAL_SVG
    },
    groundTruthVerdict: "DENY",
    failureType: "DETERMINISTIC_CODE",
    auditExplanation: "Passport expired on 2026-08-11. Caught by deterministic date logic."
  },
  {
    id: "entrant-02-smuggler",
    bio: {
      fullName: "Boris Vance",
      nation: "Kolechia",
      statedProfession: "Watch Repairman",
      declaredPurpose: "3-day social visit to sister in Nirsk",
      declaredDurationDays: 3,
      carriedItems: [
        "14 unmarked mechanical timers",
        "heavy brass explosive casings",
        "lathe gears"
      ],
      observedDemeanor: "Excessive sweating, glances repeatedly at guards"
    },
    passport: {
      documentNumber: "KL-30488-V",
      fullName: "Boris Vance",
      issuingNation: "Kolechia",
      expirationDate: "2027-06-15",
      birthDate: "1984-11-03"
    },
    entryPermit: {
      passportRef: "KL-30488-V",
      fullName: "Boris Vance",
      purpose: "VISIT",
      durationDays: 3,
      sealSvgHash: OFFICIAL_SEAL_HASH,
      sealSvgRaw: ARSTOVIA_VALID_SEAL_SVG
    },
    groundTruthVerdict: "DETAIN",
    failureType: "JEV_SEMANTIC_RISK",
    auditExplanation: "Valid documents. Jev caught high-risk bomb hardware in personal luggage."
  },
  {
    id: "entrant-03-clean",
    bio: {
      fullName: "Elysia Ward",
      nation: "Republia",
      statedProfession: "Agronomist",
      declaredPurpose: "Attending 7-day grain harvest conference in Orvech",
      declaredDurationDays: 7,
      carriedItems: ["soil test vials", "botanical journal", "linen travel clothes"],
      observedDemeanor: "Calm, poised, clear monotone responses"
    },
    passport: {
      documentNumber: "RP-49112-W",
      fullName: "Elysia Ward",
      issuingNation: "Republia",
      expirationDate: "2027-11-20",
      birthDate: "1991-03-29"
    },
    entryPermit: {
      passportRef: "RP-49112-W",
      fullName: "Elysia Ward",
      purpose: "WORK",
      durationDays: 7,
      sealSvgHash: OFFICIAL_SEAL_HASH,
      sealSvgRaw: ARSTOVIA_VALID_SEAL_SVG
    },
    groundTruthVerdict: "ADMIT",
    auditExplanation: "All credentials valid and verified by both Code and Jev."
  }
];
```

### `lib/deterministic.ts`

TypeScript

# 

```
import { EntrantApplicant } from "@/types/border";
import { CHECKPOINT_DATE, OFFICIAL_SEAL_HASH } from "@/fixtures/presets";

export interface CodeEvaluation {
  isDateValid: boolean;
  isPassportMatching: boolean;
  isNameMatching: boolean;
  isSealAuthentic: boolean;
  passedAllCodeRules: boolean;
  logs: string[];
}

export function evaluateDeterministicRules(entrant: EntrantApplicant): CodeEvaluation{
  const logs: string[] = [];

  const isDateValid = entrant.passport.expirationDate >= CHECKPOINT_DATE;
  if (!isDateValid) logs.push(`EXPIRED: ${entrant.passport.expirationDate} < ${CHECKPOINT_DATE}`);

  const isPassportMatching = entrant.passport.documentNumber === entrant.entryPermit.passportRef;
  if (!isPassportMatching) logs.push(`ID_MISMATCH: ${entrant.passport.documentNumber} != ${entrant.entryPermit.passportRef}`);

  const isNameMatching = entrant.passport.fullName.toLowerCase() === entrant.entryPermit.fullName.toLowerCase();
  if (!isNameMatching) logs.push("NAME_CONFLICT: Mismatch across documents");

  const isSealAuthentic = entrant.entryPermit.sealSvgHash === OFFICIAL_SEAL_HASH;
  if (!isSealAuthentic) logs.push("FORGERY: Seal SHA-256 verification failed");

  return {
    isDateValid,
    isPassportMatching,
    isNameMatching,
    isSealAuthentic,
    passedAllCodeRules: isDateValid && isPassportMatching && isNameMatching && isSealAuthentic,
    logs
  };
}
```

### `lib/jevClient.ts`

TypeScript

# 

```
import { EntrantApplicant } from "@/types/border";
import { JevBorderResponse } from "@/types/jev";

export async function fetchJevJudgment(entrant: EntrantApplicant): Promise<JevBorderResponse>{
  const payload = {
    model: "jev-latest",
    state: {
      applicant: {
        name: entrant.bio.fullName,
        nation: entrant.bio.nation,
        profession: entrant.bio.statedProfession,
        declared_purpose: entrant.bio.declaredPurpose,
        duration_days: entrant.bio.declaredDurationDays,
        carried_items: entrant.bio.carriedItems,
        demeanor: entrant.bio.observedDemeanor
      },
      documents: {
        permit_purpose: entrant.entryPermit.purpose,
        permit_days: entrant.entryPermit.durationDays
      }
    },
    questions: {
      story_coherence: {
        type: "score",
        instructions: "Evaluate whether carried luggage matches the stated trade and visit purpose.",
        scale: ["contradictory", "suspicious", "plausible", "consistent"]
      },
      smuggling_risk: {
        type: "noul",
        instructions: "Is this entrant attempting to traffic undeclared munitions, bomb components, or weapons?"
      },
      protocol_violation: {
        type: "choice",
        instructions: "Categorize the primary violation present.",
        criteria: {
          contraband: "Carrying hazardous, explosive, or illicit hardware",
          purpose_mismatch: "Visa category directly conflicts with declared trade",
          none: "No violation detected"
        }
      },
      recommended_verdict: {
        type: "choice",
        instructions: "Determine customs enforcement action.",
        criteria: {
          admit: "Allow entry into Arstovia",
          deny: "Refuse entry and turn away",
          detain: "Arrest entrant and transfer to custody"
        }
      }
    }
  };

  const gatewayKey = process.env.NEXT_PUBLIC_VERCEL_AI_GATEWAY_KEY || process.env.NEXT_PUBLIC_JEV_API_KEY;
  const endpoint = process.env.NEXT_PUBLIC_AI_GATEWAY_URL || "[https://ai-gateway.vercel.sh/v1/typesafe/v1/systemone](https://ai-gateway.vercel.sh/v1/typesafe/v1/systemone)";

  if (!gatewayKey) return mockJevResponse(entrant);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayKey}`,
        "x-vercel-ai-provider": "typesafe"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Gateway request failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn("Falling back to local Jev simulation:", err);
    return mockJevResponse(entrant);
  }
}

function mockJevResponse(entrant: EntrantApplicant): JevBorderResponse{
  if (entrant.id === "entrant-02-smuggler") {
    return {
      story_coherence: { score: "contradictory" },
      smuggling_risk: { probability: 0.94 },
      protocol_violation: { choice: "contraband", confidence: 0.89 },
      recommended_verdict: { choice: "detain", confidence: 0.88 }
    };
  }
  return {
    story_coherence: { score: "consistent" },
    smuggling_risk: { probability: 0.03 },
    protocol_violation: { choice: "none", confidence: 0.94 },
    recommended_verdict: { choice: "admit", confidence: 0.91 }
  };
}
```

### `components/BoothHeader.tsx`

TypeScript

# 

```
import React from "react";
import { EntrantApplicant } from "@/types/border";
import { JevBorderResponse } from "@/types/jev";
import { CHECKPOINT_DATE } from "@/fixtures/presets";

interface BoothHeaderProps {
  entrant: EntrantApplicant;
  jevData: JevBorderResponse | null;
  credits: number;
}

export const BoothHeader: React.FC<BoothHeaderProps> = ({ entrant, jevData, credits }) => {
  return (
    <section className="h-[40%] bg-[#1E1B18] border-b-4 border-[#3D352E] p-6 flex justify-between relative shadow-inner">
      <div className="flex gap-6 items-center">
        <div className="w-36 h-36 bg-[#12100E] border-2 border-[#54483D] rounded relative flex flex-col items-center justify-center p-2 shadow-2xl">
          <div className="w-20 h-20 bg-[#2B241E] rounded-sm mb-2 flex items-center justify-center text-xs text-[#7D6F61] border border-[#3D352E]">
            {entrant.bio.nation.toUpperCase()}
          </div>
          <div className="text-[10px] text-center font-bold tracking-widest text-[#E6DAC8] uppercase truncate w-full">
            {entrant.bio.fullName}
          </div>
          {jevData && jevData.smuggling_risk.probability > 0.8 && (
            <span className="absolute top-1 right-2 text-rose-500 animate-pulse text-xs font-bold">
              [SWEAT]
            </span>
          )}
        </div>

        <div className="text-xs space-y-1 max-w-lg bg-[#141210]/60 p-3 rounded border border-[#3D352E]">
          <div className="text-[#8C7D6B] font-bold">MINISTRY OF ADMISSION • TRANSCRIPT</div>
          <div><span className="text-[#8C7D6B]">PURPOSE:</span> "{entrant.bio.declaredPurpose}"</div>
          <div><span className="text-[#8C7D6B]">PROFESSION:</span> {entrant.bio.statedProfession}</div>
          <div><span className="text-[#8C7D6B]">LUGGAGE:</span> {entrant.bio.carriedItems.join(", ")}</div>
          <div><span className="text-[#8C7D6B]">DEMEANOR:</span> {entrant.bio.observedDemeanor}</div>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-500/80 bg-emerald-950/40 border border-emerald-800 px-2 py-1 rounded">
            VERCEL GATEWAY ACTIVE (FREE TILL 25/9)
          </span>
          <div className="bg-[#12100E] border border-[#54483D] px-4 py-2 text-xs text-amber-500 rounded tracking-widest shadow-md">
            M.O.A. DATE: {CHECKPOINT_DATE}
          </div>
        </div>
        <div className="text-xs font-bold tracking-wider">
          SAVED CREDITS: <span className="text-emerald-400">{credits}</span>
        </div>
      </div>
    </section>
  );
};
```

### `components/DeskSurface.tsx`

TypeScript

# 

```
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { EntrantApplicant } from "@/types/border";
import { CHECKPOINT_DATE } from "@/fixtures/presets";

interface DeskSurfaceProps {
  entrant: EntrantApplicant;
  stampedVerdict: "ADMIT" | "DENY" | "DETAIN" | null;
  onExecuteStamp: (action: "ADMIT" | "DENY" | "DETAIN") => void;
}

export const DeskSurface: React.FC<DeskSurfaceProps> = ({ entrant, stampedVerdict, onExecuteStamp }) => {
  const deskRef = useRef<HTMLDivElement>(null);
  const [activeZ, setActiveZ] = useState<"pass" | "permit">("pass");

  return (
    <section ref={deskRef} className="h-[60%] bg-[#24201C] relative overflow-hidden p-6 shadow-inner">
      {/* Passport */}
      <motion.div
        drag
        dragConstraints={deskRef}
        dragMomentum={false}
        onPointerDown={() => setActiveZ("pass")}
        style={{ zIndex: activeZ === "pass" ? 30 : 20 }}
        className="absolute top-8 left-12 w-68 p-4 bg-[#2C241E] border-2 border-[#4A3D32] rounded shadow-2xl cursor-grab active:cursor-grabbing text-[#E0D5C1]"
      >
        <div className="text-[10px] uppercase font-bold tracking-widest text-[#9C8975] border-b border-[#4A3D32] pb-1 mb-2 flex justify-between">
          <span>PASSPORT</span>
          <span>{entrant.passport.issuingNation}</span>
        </div>
        <div className="text-xs space-y-1">
          <div><span className="text-[#7D6E5D]">NO:</span> {entrant.passport.documentNumber}</div>
          <div><span className="text-[#7D6E5D]">NAME:</span> {entrant.passport.fullName}</div>
          <div className={entrant.passport.expirationDate < CHECKPOINT_DATE ? "text-rose-400 font-bold" : ""}>
            <span className="text-[#7D6E5D]">EXP:</span> {entrant.passport.expirationDate}
          </div>
        </div>
      </motion.div>

      {/* Entry Permit */}
      <motion.div
        drag
        dragConstraints={deskRef}
        dragMomentum={false}
        onPointerDown={() => setActiveZ("permit")}
        style={{ zIndex: activeZ === "permit" ? 30 : 20 }}
        className="absolute top-14 left-88 w-80 p-5 bg-[#E8DECA] border border-[#B5A892] rounded shadow-2xl cursor-grab active:cursor-grabbing text-neutral-900"
      >
        <div className="text-[10px] uppercase font-bold tracking-widest text-[#7D6F5B] border-b border-[#B5A892] pb-1 mb-3 flex justify-between">
          <span>ARSTOVIA ENTRY PERMIT</span>
          <span>SECTOR 4</span>
        </div>
        <div className="text-xs space-y-1 font-mono">
          <div><span className="text-[#7D6F5B]">PASSPORT REF:</span> {entrant.entryPermit.passportRef}</div>
          <div><span className="text-[#7D6F5B]">NAME:</span> {entrant.entryPermit.fullName}</div>
          <div><span className="text-[#7D6F5B]">REASON:</span> {entrant.entryPermit.purpose}</div>
          <div><span className="text-[#7D6F5B]">DURATION:</span> {entrant.entryPermit.durationDays} DAYS</div>
        </div>

        <div className="mt-4 pt-2 border-t border-[#B5A892] flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-[#7D6F5B]">Cryptographic Seal</span>
          <div className="w-12 h-12" dangerouslySetInnerHTML={{ __html: entrant.entryPermit.sealSvgRaw }} />
        </div>
      </motion.div>

      {/* Action Stamp Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-40 bg-[#171412]/90 p-3 rounded border-2 border-[#4A3D32]">
        <button
          onClick={() => onExecuteStamp("ADMIT")}
          disabled={!!stampedVerdict}
          className="px-6 py-3 bg-[#1C5935] hover:bg-[#237042] active:scale-95 disabled:opacity-40 text-emerald-100 font-bold uppercase tracking-widest rounded border border-emerald-500 shadow-lg text-xs"
        >
          [✓] APPROVE
        </button>
        <button
          onClick={() => onExecuteStamp("DENY")}
          disabled={!!stampedVerdict}
          className="px-6 py-3 bg-[#8C2424] hover:bg-[#A82B2B] active:scale-95 disabled:opacity-40 text-rose-100 font-bold uppercase tracking-widest rounded border border-rose-500 shadow-lg text-xs"
        >
          [✕] DENY
        </button>
        <button
          onClick={() => onExecuteStamp("DETAIN")}
          disabled={!!stampedVerdict}
          className="px-6 py-3 bg-[#946200] hover:bg-[#B57700] active:scale-95 disabled:opacity-40 text-amber-100 font-bold uppercase tracking-widest rounded border border-amber-500 shadow-lg text-xs"
        >
          [!] DETAIN
        </button>
      </div>
    </section>
  );
};
```

### `components/TelemetryModal.tsx`

TypeScript

# 

```
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Terminal, ShieldAlert } from "lucide-react";
import { EntrantApplicant } from "@/types/border";
import { JevBorderResponse } from "@/types/jev";
import { CodeEvaluation } from "@/lib/deterministic";

interface TelemetryModalProps {
  isOpen: boolean;
  entrant: EntrantApplicant;
  deterministic: CodeEvaluation;
  jevData: JevBorderResponse | null;
  jevPending: boolean;
  stampedVerdict: "ADMIT" | "DENY" | "DETAIN" | null;
  onNext: () => void;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({
  isOpen,
  entrant,
  deterministic,
  jevData,
  jevPending,
  stampedVerdict,
  onNext
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute inset-x-0 bottom-0 h-[65%] bg-[#12100E]/98 border-t-4 border-[#54483D] p-6 z-50 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start border-b border-[#3D352E] pb-3">
            <div>
              <h3 className="text-sm font-bold tracking-widest text-[#E6DAC8] flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500"/>
                ARSTOVIAN AUDIT TELEMETRY — INSPECTOR LOG
              </h3>
              <p className="text-[11px] text-[#7D6E5D]">
                Dual-Engine Resolution: Deterministic Math vs. TypeSafe Jev (via Vercel AI Gateway)
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#7D6E5D] uppercase">Ministry Evaluation</span>
              <div
                className={`text-sm font-bold uppercase ${
                  stampedVerdict === entrant.groundTruthVerdict ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {stampedVerdict === entrant.groundTruthVerdict
                  ? "CITATION COMPLIANT (+5 CREDITS)"
                  : "MINISTRY PENALTY (-10 CREDITS)"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 my-3 h-full">
            {/* Deterministic Code Engine */}
            <div className="bg-[#1A1613] p-4 rounded border border-[#3D352E] space-y-2">
              <div className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-2">
                <Terminal className="w-4 h-4"/> 1. Deterministic Code Engine
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Expiration Integrity:</span>
                  <span className={deterministic.isDateValid ? "text-emerald-400" : "text-rose-400 font-bold"}>
                    {deterministic.isDateValid ? "VALID" : "EXPIRED"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Passport Ref Hash Match:</span>
                  <span className={deterministic.isPassportMatching ? "text-emerald-400" : "text-rose-400 font-bold"}>
                    {deterministic.isPassportMatching ? "MATCH" : "MISMATCH"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ministry Seal SHA-256 Checksum:</span>
                  <span className={deterministic.isSealAuthentic ? "text-emerald-400" : "text-rose-400 font-bold"}>
                    {deterministic.isSealAuthentic ? "AUTHENTIC" : "FORGERY"}
                  </span>
                </div>
              </div>
              {deterministic.logs.length > 0 && (
                <div className="mt-2 p-2 bg-rose-950/40 border border-rose-800 text-[10px] text-rose-300 rounded">
                  {deterministic.logs.join(" | ")}
                </div>
              )}
            </div>

            {/* Jev Semantic Engine */}
            <div className="bg-[#1A1613] p-4 rounded border border-[#3D352E] space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-2">
                <ShieldAlert className="w-4 h-4"/> 2. TypeSafe Jev System 1 (AI Gateway ~100ms)
              </div>
              {jevPending ? (
                <div className="text-xs text-[#7D6E5D] animate-pulse">Running sub-150ms evaluation via Gateway...</div>
              ) : jevData ? (
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Story Coherence (Score):</span>
                    <span className="font-bold text-amber-300 uppercase">{jevData.story_coherence.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Smuggling Probability (Noul):</span>
                    <span
                      className={`font-bold ${
                        jevData.smuggling_risk.probability > 0.5 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {(jevData.smuggling_risk.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protocol Violation (Choice):</span>
                    <span className="font-bold text-cyan-300 uppercase">{jevData.protocol_violation.choice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jev Verdict Recommendation:</span>
                    <span className="font-bold uppercase text-amber-400">{jevData.recommended_verdict.choice}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-rose-400">Offline</div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#3D352E]">
            <button
              onClick={onNext}
              className="px-6 py-2 bg-neutral-200 hover:bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider rounded"
            >
              Summon Next Entrant →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### `app/page.tsx`

TypeScript

# 

```
"use client";

import React, { useState, useEffect } from "react";
import { ENTRANT_PRESETS } from "@/fixtures/presets";
import { evaluateDeterministicRules } from "@/lib/deterministic";
import { fetchJevJudgment } from "@/lib/jevClient";
import { JevBorderResponse } from "@/types/jev";
import { BoothHeader } from "@/components/BoothHeader";
import { DeskSurface } from "@/components/DeskSurface";
import { TelemetryModal } from "@/components/TelemetryModal";

export default function BorderProtocolPage() {
  const [index, setIndex] = useState(0);
  const [jevData, setJevData] = useState<JevBorderResponse null |>(null);
  const [jevPending, setJevPending] = useState(true);
  const [stampedVerdict, setStampedVerdict] = useState<"ADMIT" | "DENY" | "DETAIN" | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [credits, setCredits] = useState(25);

  const entrant = ENTRANT_PRESETS[index];
  const deterministic = evaluateDeterministicRules(entrant);

  useEffect(() => {
    setJevPending(true);
    setDrawerOpen(false);
    setStampedVerdict(null);

    fetchJevJudgment(entrant).then((data) => {
      setJevData(data);
      setJevPending(false);
    });
  }, [index, entrant]);

  const handleExecuteStamp = (action: "ADMIT" | "DENY" | "DETAIN") => {
    if (stampedVerdict) return;
    setStampedVerdict(action);

    const isCorrect = action === entrant.groundTruthVerdict;
    setCredits((prev) => (isCorrect ? prev + 5 : Math.max(0, prev - 10)));
    setDrawerOpen(true);
  };

  const handleNextApplicant = () => {
    setIndex((prev) => (prev + 1) % ENTRANT_PRESETS.length);
  };

  return (
    <div className="w-screen h-screen bg-[#141210] text-[#D8CFBC] font-mono select-none overflow-hidden flex flex-col">
      <BoothHeader credits="{credits}" entrant="{entrant}" jevData="{jevData}"/>
      <DeskSurface entrant="{entrant}" onExecuteStamp="{handleExecuteStamp}" stampedVerdict="{stampedVerdict}"/>
      <TelemetryModal deterministic="{deterministic}" entrant="{entrant}" isOpen="{drawerOpen}" jevData="{jevData}" jevPending="{jevPending}" onNext="{handleNextApplicant}" stampedVerdict="{stampedVerdict}"/>
    </div>
  );
}
```

## 5. Verification & Testing Checklist

1. **Configure Environment (`.env.local`)**:Code snippet
    
    ```
    NEXT_PUBLIC_VERCEL_AI_GATEWAY_KEY="your-vercel-ai-gateway-key"
    NEXT_PUBLIC_AI_GATEWAY_URL="[https://ai-gateway.vercel.sh/v1/typesafe/v1/systemone](https://ai-gateway.vercel.sh/v1/typesafe/v1/systemone)"
    ```
    
2. **Preset 1 (Expired Traveler)**: Must fail deterministic date verification (`2026-08-11 < 2026-09-22`) on the left panel[cite: 1, 2].
3. **Preset 2 (Smuggler)**: Must pass deterministic code checks completely, but trigger `smuggling_risk: 0.94` and `story_coherence: "contradictory"` via Jev on the right panel[cite: 1, 2].
4. **Preset 3 (Clean Agronomist)**: Must clear both deterministic code checks and Jev evaluation with zero infractions[cite: 1, 2].