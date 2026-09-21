import { NextResponse } from "next/server";
import { ENTRANT_PRESETS } from "@/fixtures/presets";
import { evaluateWithJev, gatewayConfig } from "@/lib/jevGateway";
import type { Judgment } from "@/types/jev";
import { debugLog } from "@/lib/debug";
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
  const existing = cache.get(entrant.id);
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
  let evaluation = pending.get(entrant.id);
  if (!evaluation) {
    debugLog("API", "Cache miss; starting evaluation", {
      entrantId: entrant.id,
    });
    evaluation = evaluateWithJev(entrant, gatewayConfig(process.env));
    pending.set(entrant.id, evaluation);
  } else
    debugLog("API", "Joining an in-flight evaluation", {
      entrantId: entrant.id,
    });
  const judgment = await evaluation;
  pending.delete(entrant.id);
  cache.set(entrant.id, {
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
