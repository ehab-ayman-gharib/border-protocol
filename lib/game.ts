import { ENTRANT_PRESETS } from "@/fixtures/presets";
import type { Verdict } from "@/types/border";
import type { Judgment } from "@/types/jev";
import {
  evaluateDeterministicRules,
  type CodeEvaluation,
} from "./deterministic";
import { resolveInspection, type Resolution } from "./resolution";
export interface Decision {
  entrantId: string;
  verdict: Verdict;
  correct: boolean | null;
  delta: number;
  judgment: Judgment;
  code: CodeEvaluation;
  resolution: Resolution;
}
export interface GameState {
  index: number;
  credits: number;
  decisions: Decision[];
  verdict: Verdict | null;
  complete: boolean;
}
export const initialGame: GameState = {
  index: 0,
  credits: 25,
  decisions: [],
  verdict: null,
  complete: false,
};
export type GameAction =
  | {
      type: "stamp";
      verdict: Verdict;
      entrantId: string;
      judgment: Judgment | null;
    }
  | { type: "next" }
  | { type: "reset" };
export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === "reset") return { ...initialGame, decisions: [] };
  if (action.type === "stamp") {
    if (state.verdict || state.complete || !action.judgment) return state;
    const entrant = ENTRANT_PRESETS[state.index];
    if (action.entrantId !== entrant.id) return state;
    const judgment = structuredClone(action.judgment);
    const code = evaluateDeterministicRules(entrant);
    const resolution = resolveInspection(code, judgment);
    const correct =
      resolution.verdict === null
        ? null
        : resolution.verdict === action.verdict;
    const credits = Math.max(
      0,
      state.credits + (correct === null ? 0 : correct ? 5 : -10),
    );
    return {
      ...state,
      verdict: action.verdict,
      credits,
      decisions: [
        ...state.decisions,
        {
          entrantId: entrant.id,
          verdict: action.verdict,
          correct,
          delta: credits - state.credits,
          judgment,
          code,
          resolution,
        },
      ],
    };
  }
  if (!state.verdict || state.complete) return state;
  if (state.index === ENTRANT_PRESETS.length - 1)
    return { ...state, complete: true };
  return { ...state, index: state.index + 1, verdict: null };
}
