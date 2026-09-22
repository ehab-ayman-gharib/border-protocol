# Border Protocol

A replayable three-traveler border-inspection shift built with Next.js 15, React 19, TypeScript, Tailwind CSS and Framer Motion. All art is stored locally; the game is playable without API credentials.

## Run locally

Requires Node.js 22 or later.

```sh
npm install
npm run dev
```

Open http://localhost:3000. For a production build, run `npm run build`, then `npm start`. Production artifacts use the standard `.next` directory expected by Vercel. Development uses `.next-dev` to keep its artifacts separate.

## Play

At the beginning of each shift, tap the highlighted sealed briefing card. It flips and zooms in over a blurred checkpoint; close it to begin. The background stays inactive and evaluation starts only after the briefing closes. Keyboard users can open the card with Enter/Space and begin with the close button or Escape after opening it. Reduced-motion settings skip the flip animation.

Inspect the passport and entry permit. Drag papers to rearrange them; **Reset papers** restores their positions. On mobile, switch between **Passport** and **Entry permit** above the desk. Read the interview and open the **Luggage** tab to see the traveler's declaration. Once the provisional assessment arrives, select **Open luggage** to reveal the actual contents and request a new Jev assessment. Stamps unlock after that assessment finishes.

- **Approve / 1:** legitimate travel with valid documents.
- **Deny / 2:** expired or inconsistent documents, or a purpose mismatch.
- **Detain / 3:** evidence of dangerous contraband.

Each decision is final for that applicant. Open the audit to see the deterministic document checks and separate semantic judgment, then call the next traveler. Decisions matching the combined ruling earn 5 credits; conflicting decisions cost 10, with a zero minimum. Inconclusive cases are unscored. Complete all three cases to receive the shift report. Use **Start a new shift** to replay. Instructions live exclusively on the opening briefing card; the shift log is available in the header; sound can be enabled there too. Reloading starts a new shift with the same three cases.

## Static showcase

Every shift uses the original cases in order: Jorji has an expired passport, Boris carries explosive casings, and Elysia has valid documents and legitimate conference supplies. Reloads and restarts preserve these cases. Randomized generation and seed URLs are no longer used. Jev still evaluates the actual evidence; live uncertainty is never replaced with a forced verdict.

## Vercel AI Gateway + Jev

Copy `.env.example` to `.env.local`, then set your server-side key:

```dotenv
AI_GATEWAY_API_KEY=your_gateway_key
```

Restart the dev server after changing environment variables. `VERCEL_AI_GATEWAY_KEY` is also accepted. Credentials are never sent to the browser. The client sends an entrant ID to `POST /api/judgment`; the server looks up the original static case and sends its semantic evidence to Jev. Client-supplied case fields are never trusted.

The default integration uses the documented TypeSafe-compatible Vercel route:

- Endpoint: `https://ai-gateway.vercel.sh/typesafe/v1/systemone`
- Model: `typesafe-ai/jev`
- Authentication: `Authorization: Bearer <gateway key>`
- Questions: Score, Noul and Choice, normalized from the upstream `answers` envelope.

These correct the endpoint and model in the original prototype document. See [Vercel’s TypeSafe-compatible API](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe) and [TypeSafe’s API contract](https://docs.typesafe.ai/api).

For direct TypeSafe access, set only `JEV_API_KEY`; the app then uses `https://api.typesafe.ai/v1/systemone` with `jev-latest`. Optional `AI_GATEWAY_URL` and `JEV_MODEL` override the endpoint and model for a compatible proxy. Do not prefix any key with `NEXT_PUBLIC_`.

Judgment begins when an applicant arrives. Requests time out after 4.5 seconds; malformed replies, upstream errors and missing keys use the in-memory deterministic simulation. Identical requests are coalesced. Successful responses are cached for five minutes, failures for 15 seconds. The footer and audit identify live versus local results and report measured request duration rather than promising latency. The local simulation examines cargo terms and is only a fixture-oriented fallback, not an AI model. In-memory caches are per server process.

Scoring uses the actual assessment for each inspection, not hidden preset answers. Jev returns only semantic evidence: a numeric coherence Score (0–3, displayed as 0–100), contraband risk (Noul), and a Choice of no concern, purpose mismatch, or security concern. It never returns an admission verdict. Code applies a single combined policy:

1. Security concern with confidence >=70% and risk >=80%: DETAIN, including when documents fail.
2. Otherwise, failed document checks: DENY.
3. With valid documents and risk <=20%, a purpose mismatch with confidence >=70% and raw coherence <2: DENY.
4. With valid documents, no concern with confidence >=70%, risk <=20% and raw coherence >=2: ADMIT.
5. All other combinations: unresolved, no reward or penalty.

These thresholds are game rules, not measured calibration guarantees. Coherence is an ordinal rubric score, not a probability of innocence. Stamps wait for an assessment; the stored decision freezes the report, code checks, ruling and credit delta. The audit, log and shift summary use that same snapshot. Local fallback is explicitly labeled and uses the same policy. The three travelers are still a fixed roster; outcomes now depend on their actual document and semantic assessments. This is a fictional single-player game, not a real border decision system.

No key is bundled in the template. Real keys belong in `.env.local`, which is ignored by Git; `.env.example` is not loaded by Next.js. To verify live authentication and all three cases independently of the route cache, run `npm run verify:jev`. It reports upstream HTTP status, live/local source, measured latency and typed judgments without printing credentials. It exits unsuccessfully if any case falls back to local rules. The request contract, response parser and failure behavior also have automated tests.

## Assets

`public/assets/checkpoint.png` and `public/assets/travelers.png` were generated with the built-in image generation tool and copied into this repository. The portrait atlas contains Jorji, Boris and Elysia in equal-width columns and is displayed using CSS background positions. `public/assets/ministry-seal.svg` is an editable vector seal. Stamp marks and the paper surfaces are rendered in CSS; the optional stamp sound is synthesized with Web Audio.

The exact art prompts and provenance are in [docs/ASSETS.md](docs/ASSETS.md).

### Sound effects

Sound starts enabled and unlocks on your first click, tap or keypress. The header's **Sound on / Sound off** button mutes all effects for the current session; every page reload starts enabled, ignoring any previously saved mute preference; enabling plays an intercom cue so you can test playback. There are distinct approve, deny and detain stamp sounds, paper rustling for documents and evidence tabs, intercom cues for the next traveler, and success/citation audit tones. One shared Web Audio context is resumed after browser suspension and closed on unmount. Audio failures do not block gameplay. Filter console logs for `[BP][AUDIO]` to see scheduled effects. No audio API or downloaded sound files are required.

## Verification

### Colored debugging

Open the browser console and filter for `[BP]`. Logs cover shift initialization, applicant arrival, deterministic checks, evidence tabs, dialogs, document dragging/reset, stamps, committed credit changes, shift completion and Jev request/response timing. Cyan means information, green success, amber a failed check or fallback, and red an upstream HTTP error. Expand each logged object to inspect its data.

The development server terminal additionally shows gateway payloads, raw Jev answers before normalization, validated responses, cache hits/misses, coalesced requests and failures by stage. Browser logs include the normalized Jev response and its live/local source. Credentials, authorization headers and upstream error bodies are excluded; sensitive field names and the configured gateway key are redacted from raw answer logs. ANSI colors respect `NO_COLOR` and terminal support.

Logging is enabled by default in development and disabled in production. Set `NEXT_PUBLIC_DEBUG_LOGS=false` in `.env.local` to silence it, or `true` to explicitly enable it in production (rebuild to change client settings). React's development Strict Mode may log a cancelled initial request followed by a new one; cancellation is labeled separately from failure. These logs reveal inspection results, so disable them when playing without spoilers.

```sh
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
npm run build
```

Unit tests cover date boundaries, identity/reference/duration mismatches, SHA-256 tampering, duplicate decisions, scoring, Jev parsing and gateway failure behavior. Browser tests cover a full shift, paper dragging, mobile layout, audits, manual, log, restart and the local API. Browser playthroughs stub the assessment API for repeatable results; the API smoke test accepts either a valid live result or a labeled fallback. Use `npm run verify:jev` to verify real upstream authentication and the current assessment schema. Screenshots are saved under `test-results/`.

## Layout

- `app/page.tsx`: shift coordination and player interface.
- `components/`: checkpoint scene, draggable desk, portraits, dialogs and audit.
- `lib/deterministic.ts`: synchronous code checks against the displayed checkpoint date.
- `lib/seal.ts`: actual SHA-256 of the official seal, checked against both content and claimed hash.
- `lib/game.ts`: guarded state transitions, frozen assessment snapshots and credit accounting.
- `lib/resolution.ts`: combined document/semantic policy, numeric coherence score and inconclusive handling.
- `lib/jevClient.ts`: typed request construction, response normalization and local fallback.
- `lib/jevGateway.ts`: server-side configuration, authentication and network timeout.
- `app/api/judgment/route.ts`: known-entrant API, caching and concurrent request coalescing.
- `fixtures/presets.ts`: the three static showcase cases.

The dependency override keeps Next.js 15’s transitive PostCSS on a patched release. `package-lock.json` records the installed dependency versions.

## Evidence discovery

Jev first sees declared cargo only. Opening luggage reveals the fixed inspection findings and triggers a separate assessment. Boris declares watch parts; the search reveals explosive casings. The live readout and audit show actual before/after coherence and risk, with each report labeled live or local. Scores are never forced to change. Reports and discovered items are frozen when stamped.

The judgment API accepts `stage: "declared" | "inspected"` (defaults to inspected for verification tools), constructs stage-specific evidence on the server, and caches each stage separately. Browser fallback uses the same stage-specific evidence. Invalid stages are rejected. Each traveler must be searched before a verdict can be issued.

## Declaration accuracy and findings

A fourth Jev question compares declared cargo to inspection findings: Supported, Contradicted, or Unverified, with its own returned confidence. Before a search, the declaration is unverified. The readout and frozen audit display this alongside the existing semantic finding (no concern, purpose mismatch, security concern) and assessment confidence. These confidence values describe model assessments, not probabilities of guilt. Declaration accuracy is informational and does not alter scoring. Each stage remains labeled live or local; the local simulator handles only the authored cases.

## Deploy to Vercel

Import the GitHub repository with the project root set to `./`. The repository pins Node.js 22.x and configures the Next.js framework, `npm run build`, and `.next` output in `vercel.json`. Add `AI_GATEWAY_API_KEY` in Vercel Project Settings > Environment Variables for Production (and Preview if needed), then deploy. Local `.env.local` is never committed or uploaded. If using direct Jev instead, configure `JEV_API_KEY` as described above.

The previous deployment error came from writing production builds to `.next-production` while Vercel expected `.next`. Production builds now consistently write `.next`; no manual output-directory workaround is needed.
