import type { EntrantApplicant } from "@/types/border";
import type { Judgment } from "@/types/jev";
import { debugLog } from "./debug";
import {
  buildJevPayload,
  mockJevResponse,
  normalizeJevResponse,
} from "./jevClient";
export interface GatewayConfig {
  key?: string;
  endpoint: string;
  model: string;
}
export function gatewayConfig(
  env: Record<string, string | undefined>,
): GatewayConfig {
  const gatewayKey = env.AI_GATEWAY_API_KEY || env.VERCEL_AI_GATEWAY_KEY;
  const direct = !gatewayKey && !!env.JEV_API_KEY;
  return {
    key: gatewayKey || env.JEV_API_KEY,
    endpoint:
      env.AI_GATEWAY_URL ||
      (direct
        ? "https://api.typesafe.ai/v1/systemone"
        : "https://ai-gateway.vercel.sh/typesafe/v1/systemone"),
    model: env.JEV_MODEL || (direct ? "jev-latest" : "typesafe-ai/jev"),
  };
}
export async function evaluateWithJev(
  entrant: EntrantApplicant,
  config: GatewayConfig,
  fetcher: typeof fetch = fetch,
): Promise<Judgment> {
  const start = performance.now();
  const fallback: Judgment = {
    data: mockJevResponse(entrant),
    source: "local",
    reason: "unconfigured",
    latencyMs: 0,
  };
  if (!config.key) {
    debugLog(
      "GATEWAY",
      "No server credential configured; using local judgment",
      { entrantId: entrant.id, ...fallback },
      "warn",
    );
    return fallback;
  }
  const payload = buildJevPayload(entrant, config.model);
  let step = "network request";
  debugLog(
    "GATEWAY",
    "Sending semantic evaluation",
    { entrantId: entrant.id, model: config.model, payload },
    "info",
    [config.key],
  );
  try {
    const response = await fetcher(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4500),
      cache: "no-store",
    });
    debugLog(
      "GATEWAY",
      "Upstream HTTP response",
      {
        entrantId: entrant.id,
        status: response.status,
        elapsedMs: Math.round(performance.now() - start),
      },
      response.ok ? "success" : "error",
    );
    step = "HTTP status";
    if (!response.ok) throw new Error("Upstream unavailable");
    step = "JSON decoding";
    const raw: unknown = await response.json();
    debugLog(
      "GATEWAY",
      "Raw Jev answers (before normalization)",
      {
        entrantId: entrant.id,
        answers:
          raw && typeof raw === "object" && "answers" in raw
            ? raw.answers
            : null,
      },
      "info",
      [config.key],
    );
    step = "typed answer validation";
    const judgment: Judgment = {
      data: normalizeJevResponse(raw),
      source: "live",
      latencyMs: Math.round(performance.now() - start),
    };
    debugLog(
      "GATEWAY",
      "Validated live Jev response",
      { entrantId: entrant.id, ...judgment },
      "success",
    );
    return judgment;
  } catch (error) {
    const result: Judgment = {
      ...fallback,
      reason: "unavailable",
      latencyMs: Math.round(performance.now() - start),
    };
    debugLog(
      "GATEWAY",
      "Evaluation failed; using local fallback",
      {
        entrantId: entrant.id,
        step,
        timeout: error instanceof Error && error.name === "TimeoutError",
        ...result,
      },
      "warn",
    );
    return result;
  }
}
