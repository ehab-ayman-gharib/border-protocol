import { NextResponse } from "next/server";
import { ENTRANT_PRESETS } from "@/fixtures/presets";
import { evaluateWithJev, gatewayConfig } from "@/lib/jevGateway";
import type { Judgment } from "@/types/jev";
import { debugLog } from "@/lib/debug";
import { evidenceFor } from "@/lib/evidence";
const cache = new Map<string, { judgment: Judgment; expires: number }>();
const pending = new Map<string, Promise<Judgment>>();
export async function POST(request: Request) {
  debugLog("API", "POST /api/judgment received");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    debugLog("API", "Rejected invalid JSON", { status: 400 }, "warn");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id =
    body && typeof body === "object" && "entrantId" in body
      ? body.entrantId
      : null;
  const entrant = ENTRANT_PRESETS.find((e) => e.id === id);
  if (!entrant) {
    debugLog("API", "Rejected unknown entrant", { status: 400 }, "warn");
    return NextResponse.json({ error: "Unknown entrant" }, { status: 400 });
  }
  const stage =
    body && typeof body === "object" && "stage" in body
      ? body.stage
      : "inspected";
  if (stage !== "declared" && stage !== "inspected")
    return NextResponse.json(
      { error: "Invalid evidence stage" },
      { status: 400 },
    );
  const key = `evidence-v2:${entrant.id}:${stage}`;
  // Discard expired reports before looking up this fixed case.
  for (const [key, entry] of cache)
    if (entry.expires <= Date.now()) cache.delete(key);
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) {
    debugLog(
      "API",
      "Cache hit; returning saved judgment",
      {
        entrantId: entrant.id,
        source: existing.judgment.source,
        remainingTtlMs: existing.expires - Date.now(),
      },
      "success",
    );
    return NextResponse.json(existing.judgment);
  }
  let evaluation = pending.get(key);
  if (!evaluation) {
    debugLog("API", "Cache miss; starting evaluation", {
      entrantId: entrant.id,
    });
    evaluation = evaluateWithJev(
      evidenceFor(entrant, stage),
      gatewayConfig(process.env),
    );
    pending.set(key, evaluation);
  } else
    debugLog("API", "Joining an in-flight evaluation", {
      entrantId: entrant.id,
    });
  const judgment = await evaluation;
  pending.delete(key);
  if (cache.size >= 256) cache.delete(cache.keys().next().value!);
  cache.set(key, {
    judgment,
    expires: Date.now() + (judgment.reason === "unavailable" ? 15000 : 300000),
  });
  debugLog(
    "API",
    "Judgment cached and returned",
    { entrantId: entrant.id, ...judgment },
    judgment.source === "live" ? "success" : "warn",
  );
  return NextResponse.json(judgment);
}
