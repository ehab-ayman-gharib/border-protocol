/**
 * @file Regression tests for progressive cargo discovery and decision snapshots.
 * Verifies provisional payloads hide contraband, inspection retains declarations,
 * and stamped evidence remains unchanged when the original reports mutate.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ENTRANT_PRESETS } from "../fixtures/presets";
import { evidenceFor } from "../lib/evidence";
import { buildJevPayload, mockJevResponse } from "../lib/jevClient";
import { gameReducer, initialGame } from "../lib/game";

test("declaration payload excludes undiscovered contraband and inspection preserves the declaration", () => {
  const entrant = ENTRANT_PRESETS[1];
  const before = evidenceFor(entrant, "declared");
  const after = evidenceFor(entrant, "inspected");
  assert.doesNotMatch(
    JSON.stringify(buildJevPayload(before)),
    /explosive casings/i,
  );
  assert.match(
    JSON.stringify(buildJevPayload(after).state),
    /explosive casings/i,
  );
  assert.deepEqual(after.cargoEvidence?.declaredItems, before.bio.carriedItems);
  assert.equal(buildJevPayload(before).state.cargo_evidence_stage, "declared");
  assert.ok(
    mockJevResponse(after).smuggling_risk.probability >
      mockJevResponse(before).smuggling_risk.probability,
  );
  assert.deepEqual(entrant.bio.carriedItems, after.bio.carriedItems);
  assert.equal(mockJevResponse(before).declaration_accuracy.choice, "unverified");
  assert.equal(mockJevResponse(after).declaration_accuracy.choice, "contradicted");
  assert.equal(mockJevResponse(evidenceFor(ENTRANT_PRESETS[2], "inspected")).declaration_accuracy.choice, "supported");
});

test("stamp freezes both assessments and discovered evidence", () => {
  const entrant = ENTRANT_PRESETS[1];
  const report = (stage: "declared" | "inspected") => ({
    source: "local" as const,
    latencyMs: 0,
    data: mockJevResponse(evidenceFor(entrant, stage)),
  });
  const before = report("declared"),
    after = report("inspected");
  const result = gameReducer(
    { ...initialGame, index: 1 },
    {
      type: "stamp",
      entrantId: entrant.id,
      verdict: "DETAIN",
      judgment: after,
      beforeInspection: before,
    },
  );
  before.data.smuggling_risk.probability = 1;
  after.data.smuggling_risk.probability = 0;
  assert.equal(
    result.decisions[0].beforeInspection?.data.smuggling_risk.probability,
    0.03,
  );
  assert.equal(
    result.decisions[0].judgment.data.smuggling_risk.probability,
    0.94,
  );
  assert.deepEqual(
    result.decisions[0].inspectedItems,
    entrant.bio.carriedItems,
  );
});
