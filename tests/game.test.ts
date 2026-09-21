import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { Judgment } from "../types/jev";
import { resolveInspection } from "../lib/resolution";
const localJudgment = (index: number): Judgment => ({
  source: "local",
  reason: "unconfigured",
  latencyMs: 0,
  data: mockJevResponse(ENTRANT_PRESETS[index]),
});
import { ENTRANT_PRESETS } from "../fixtures/presets";
import { evaluateDeterministicRules } from "../lib/deterministic";
import { hashSeal, ARSTOVIA_VALID_SEAL_SVG } from "../lib/seal";
import { gameReducer, initialGame } from "../lib/game";
import {
  mockJevResponse,
  normalizeJevResponse,
  buildJevPayload,
} from "../lib/jevClient";
import { evaluateWithJev, gatewayConfig } from "../lib/jevGateway";

test("authored scenarios separate expired documents, dangerous cargo and clean travel", () => {
  assert.equal(
    evaluateDeterministicRules(ENTRANT_PRESETS[0]).isDateValid,
    false,
  );
  assert.equal(
    evaluateDeterministicRules(ENTRANT_PRESETS[1]).passedAllCodeRules,
    true,
  );
  assert.equal(
    mockJevResponse(ENTRANT_PRESETS[1]).smuggling_risk.probability,
    0.94,
  );
  assert.equal(
    evaluateDeterministicRules(ENTRANT_PRESETS[2]).passedAllCodeRules,
    true,
  );
  assert.equal(
    mockJevResponse(ENTRANT_PRESETS[2]).semantic_assessment.choice,
    "no_concern",
  );
});
test("seal checksum matches independent Node SHA-256 and rejects forged content", () => {
  assert.equal(
    hashSeal(ARSTOVIA_VALID_SEAL_SVG),
    createHash("sha256").update(ARSTOVIA_VALID_SEAL_SVG).digest("hex"),
  );
  const entrant = structuredClone(ENTRANT_PRESETS[2]);
  entrant.entryPermit.sealSvgRaw += "tampered";
  assert.equal(evaluateDeterministicRules(entrant).isSealAuthentic, false);
  entrant.entryPermit.sealSvgHash = hashSeal(entrant.entryPermit.sealSvgRaw);
  assert.equal(evaluateDeterministicRules(entrant).isSealAuthentic, false);
});
test("date boundaries and identity mismatches are deterministic", () => {
  const entrant = structuredClone(ENTRANT_PRESETS[2]);
  entrant.passport.expirationDate = "2026-09-22";
  assert.equal(evaluateDeterministicRules(entrant).isDateValid, true);
  entrant.passport.expirationDate = "2026-02-30";
  assert.equal(evaluateDeterministicRules(entrant).isDateValid, false);
  entrant.entryPermit.fullName = "Different Person";
  entrant.entryPermit.passportRef = "OTHER";
  entrant.entryPermit.durationDays = 10;
  const result = evaluateDeterministicRules(entrant);
  assert.equal(result.isNameMatching, false);
  assert.equal(result.isPassportMatching, false);
  assert.equal(result.isDurationMatching, false);
});
test("full shift scores once per applicant and resets cleanly", () => {
  let state = initialGame;
  assert.equal(gameReducer(state, { type: "next" }), state);
  for (const entrant of ENTRANT_PRESETS) {
    state = gameReducer(state, {
      type: "stamp",
      verdict: (["DENY", "DETAIN", "ADMIT"] as const)[state.index],
      entrantId: entrant.id,
      judgment: localJudgment(state.index),
    });
    assert.equal(
      gameReducer(state, {
        type: "stamp",
        verdict: "ADMIT",
        entrantId: entrant.id,
        judgment: localJudgment(state.index),
      }),
      state,
    );
    state = gameReducer(state, { type: "next" });
  }
  assert.equal(state.complete, true);
  assert.equal(state.credits, 40);
  assert.equal(state.decisions.length, 3);
  assert.deepEqual(gameReducer(state, { type: "reset" }), initialGame);
});
test("three mistakes cannot reduce credits below zero", () => {
  let state = initialGame;
  for (const verdict of ["ADMIT", "DENY", "DENY"] as const) {
    state = gameReducer(state, {
      type: "stamp",
      verdict,
      entrantId: ENTRANT_PRESETS[state.index].id,
      judgment: localJudgment(state.index),
    });
    state = gameReducer(state, { type: "next" });
  }
  assert.equal(state.credits, 0);
});
const upstream = {
  answers: {
    story_coherence: { type: "score", score: 2.97 },
    smuggling_risk: { type: "noul", noul: 0.03 },
    semantic_assessment: {
      type: "choice",
      choice: "no_concern",
      confidence: 0.94,
    },
  },
};
test("Jev parser normalizes typed answers and rejects malformed probabilities", () => {
  assert.equal(
    normalizeJevResponse(upstream).story_coherence.score,
    "consistent",
  );
  assert.throws(() => normalizeJevResponse({ answers: {} }));
  const invalid = structuredClone(upstream);
  invalid.answers.smuggling_risk.noul = 5;
  assert.throws(() => normalizeJevResponse(invalid));
});
test("gateway uses official endpoint, Bearer key and model; only semantic evidence is sent", async () => {
  const config = gatewayConfig({ AI_GATEWAY_API_KEY: "test-key" });
  assert.equal(
    config.endpoint,
    "https://ai-gateway.vercel.sh/typesafe/v1/systemone",
  );
  const fakeFetch: typeof fetch = async (url, options) => {
    assert.equal(url, config.endpoint);
    assert.equal(
      (options?.headers as Record<string, string>).Authorization,
      "Bearer test-key",
    );
    const body = JSON.parse(options?.body as string);
    assert.equal(body.model, "typesafe-ai/jev");
    assert.equal(body.questions.story_coherence.type, "score");
    assert.equal(body.questions.smuggling_risk.type, "noul");
    assert.ok(!("passport" in body.state));
    assert.ok(!("groundTruthVerdict" in body.state));
    assert.ok(!("durationDays" in body.state));
    return Response.json(upstream);
  };
  const result = await evaluateWithJev(ENTRANT_PRESETS[2], config, fakeFetch);
  assert.equal(result.source, "live");
  assert.equal(gatewayConfig({ JEV_API_KEY: "direct" }).model, "jev-latest");
  assert.equal(
    buildJevPayload(ENTRANT_PRESETS[0]).questions.story_coherence.criteria
      .length,
    4,
  );
});
test("missing credentials, upstream failure and invalid output fall back safely", async () => {
  const entrant = ENTRANT_PRESETS[1];
  const noNetwork: typeof fetch = async () => {
    throw new Error("offline");
  };
  assert.equal(
    (await evaluateWithJev(entrant, gatewayConfig({}), noNetwork)).reason,
    "unconfigured",
  );
  const config = gatewayConfig({ AI_GATEWAY_API_KEY: "test" });
  for (const fake of [
    noNetwork,
    async () => Response.json({}, { status: 503 }),
    async () => Response.json({ invalid: true }),
  ] as (typeof fetch)[]) {
    const result = await evaluateWithJev(entrant, config, fake);
    assert.equal(result.source, "local");
    assert.equal(result.reason, "unavailable");
    assert.equal(result.data.smuggling_risk.probability, 0.94);
  }
});

test("document denial and semantic no-concern produce one combined ruling", () => {
  const resolution = resolveInspection(
    evaluateDeterministicRules(ENTRANT_PRESETS[0]),
    localJudgment(0),
  );
  assert.equal(resolution.verdict, "DENY");
  assert.equal(resolution.basis, "documents");
});
test("strong contraband evidence takes priority over invalid documents", () => {
  const report = localJudgment(1);
  report.data.smuggling_risk.probability = 0.8;
  report.data.semantic_assessment.confidence = 0.7;
  assert.equal(
    resolveInspection(evaluateDeterministicRules(ENTRANT_PRESETS[0]), report)
      .verdict,
    "DETAIN",
  );
});
test("live assessment changes the score for the same applicant and is frozen at stamp time", () => {
  const state = { ...initialGame, index: 2 };
  const report = { ...localJudgment(1), source: "live" as const };
  const stamped = gameReducer(state, {
    type: "stamp",
    verdict: "DETAIN",
    entrantId: ENTRANT_PRESETS[2].id,
    judgment: report,
  });
  assert.equal(stamped.credits, 30);
  assert.equal(stamped.decisions[0].resolution.verdict, "DETAIN");
  report.data.semantic_assessment.choice = "no_concern";
  assert.equal(
    stamped.decisions[0].judgment.data.semantic_assessment.choice,
    "security_concern",
  );
  const clear = gameReducer(state, {
    type: "stamp",
    verdict: "DETAIN",
    entrantId: ENTRANT_PRESETS[2].id,
    judgment: localJudgment(2),
  });
  assert.equal(clear.credits, 15);
});
test("coherence score and confidence affect purpose denial and uncertain cases are unscored", () => {
  const code = evaluateDeterministicRules(ENTRANT_PRESETS[2]);
  const report = localJudgment(2);
  report.data.semantic_assessment = {
    choice: "purpose_mismatch",
    confidence: 0.9,
  };
  report.data.story_coherence = { score: "suspicious", value: 1.3 };
  assert.equal(resolveInspection(code, report).verdict, "DENY");
  assert.equal(resolveInspection(code, report).coherenceScore, 43);
  report.data.semantic_assessment.confidence = 0.69;
  assert.equal(resolveInspection(code, report).verdict, null);
  const state = { ...initialGame, index: 2 };
  const stamped = gameReducer(state, {
    type: "stamp",
    verdict: "ADMIT",
    entrantId: ENTRANT_PRESETS[2].id,
    judgment: report,
  });
  assert.equal(stamped.credits, 25);
  assert.equal(stamped.decisions[0].correct, null);
});
test("coherence threshold uses raw numeric score, not a rounded display label", () => {
  const code = evaluateDeterministicRules(ENTRANT_PRESETS[2]);
  const report = localJudgment(2);
  report.data.story_coherence.value = 1.999;
  assert.equal(resolveInspection(code, report).verdict, null);
  report.data.story_coherence.value = 2;
  assert.equal(resolveInspection(code, report).verdict, "ADMIT");
});
test("high risk alone does not override an inconsistent or low-confidence assessment", () => {
  const code = evaluateDeterministicRules(ENTRANT_PRESETS[2]);
  const report = localJudgment(2);
  report.data.smuggling_risk.probability = 0.99;
  assert.equal(resolveInspection(code, report).verdict, null);
});
test("stamping waits for an assessment and rejects stale applicant actions", () => {
  assert.equal(
    gameReducer(initialGame, {
      type: "stamp",
      verdict: "DENY",
      entrantId: ENTRANT_PRESETS[0].id,
      judgment: null,
    }),
    initialGame,
  );
  assert.equal(
    gameReducer(initialGame, {
      type: "stamp",
      verdict: "DENY",
      entrantId: ENTRANT_PRESETS[1].id,
      judgment: localJudgment(1),
    }),
    initialGame,
  );
});
