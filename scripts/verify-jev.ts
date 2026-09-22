/**
 * @file Manual live integration check, run with npm run verify:jev.
 * Loads local environment configuration and evaluates all three original cases
 * without route caching. Fails on fallback or a missing showcase verdict; never
 * prints credentials. This command makes real upstream API requests.
 */
import { loadEnvConfig } from "@next/env";
import { ENTRANT_PRESETS } from "../fixtures/presets";
import { evaluateWithJev, gatewayConfig } from "../lib/jevGateway";
import { evaluateDeterministicRules } from "../lib/deterministic";
import { resolveInspection } from "../lib/resolution";

async function main() {
  loadEnvConfig(process.cwd(), true);
  const config = gatewayConfig(process.env);
  console.log(JSON.stringify({ endpoint: config.endpoint, model: config.model, keyConfigured: Boolean(config.key) }));
  if (!config.key) {
    console.error("No server-side key loaded. Set AI_GATEWAY_API_KEY in .env.local.");
    process.exitCode = 1;
    return;
  }
  const diagnosticFetch: typeof fetch = async (input, options) => {
    const response = await fetch(input, options);
    console.log(JSON.stringify({ upstreamStatus: response.status }));
    return response;
  };
  const entrants = ENTRANT_PRESETS;
  const verdicts: (string | null)[] = [];
  for (const entrant of entrants) {
    const result = await evaluateWithJev(entrant, config, diagnosticFetch);
    const resolution = resolveInspection(evaluateDeterministicRules(entrant), result);
    verdicts.push(resolution.verdict);
    console.log(JSON.stringify({ entrant: entrant.id, ...result, resolution }));
    if (result.source !== "live") {
      console.error("Live verification failed; this result is the local fallback.");
      process.exitCode = 1;
      break;
    }
  }
  if (!process.exitCode && JSON.stringify(verdicts.sort()) !== JSON.stringify(["ADMIT", "DENY", "DETAIN"])) {
    console.error("Live responses did not produce all three showcase verdicts for the static cases.");
    process.exitCode = 1;
  }
}
main().catch(() => {
  console.error("Verification failed before a judgment was available. Check local configuration and connectivity.");
  process.exitCode = 1;
});
