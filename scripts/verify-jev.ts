import { loadEnvConfig } from "@next/env";
import { ENTRANT_PRESETS } from "../fixtures/presets";
import { evaluateWithJev, gatewayConfig } from "../lib/jevGateway";

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
  for (const entrant of ENTRANT_PRESETS) {
    const result = await evaluateWithJev(entrant, config, diagnosticFetch);
    console.log(JSON.stringify({ entrant: entrant.id, ...result }));
    if (result.source !== "live") {
      console.error("Live verification failed; this result is the local fallback.");
      process.exitCode = 1;
      break;
    }
  }
}
main().catch(() => {
  console.error("Verification failed before a judgment was available. Check local configuration and connectivity.");
  process.exitCode = 1;
});
