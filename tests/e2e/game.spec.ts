/**
 * @file Browser coverage for complete shifts, evidence discovery and responsive UI.
 * Exercises briefing, audit, audio, animation and first-time tips. Gameplay uses
 * mocked Jev responses; the direct API smoke check may use configured live keys.
 */
import { test, expect, type Page } from "@playwright/test";
import { evidenceFor } from "../../lib/evidence";
import { ENTRANT_PRESETS } from "../../fixtures/presets";
import { mockJevResponse, validateJudgment } from "../../lib/jevClient";

async function beginShift(page: Page) {
  await page.getByRole("button", { name: "Open your briefing card" }).click();
  await page
    .getByRole("button", { name: "Close briefing & begin shift" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Shift briefing" }),
  ).toHaveCount(0);
}

async function inspectLuggage(page: Page) {
  await page.getByRole("tab", { name: /Luggage/ }).click();
  const open = page.getByRole("button", { name: "Open luggage", exact: true });
  if (await open.count()) await open.click();
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/judgment", async (route) => {
    const { entrantId: id, stage } = route.request().postDataJSON();
    const entrant = ENTRANT_PRESETS.find((e) => e.id === id)!;
    await route.fulfill({
      json: {
        source: "local",
        reason: "unconfigured",
        latencyMs: 0,
        data: mockJevResponse(evidenceFor(entrant, stage ?? "inspected")),
      },
    });
  });
});
test("complete a perfect shift, inspect audits, then restart", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await beginShift(page);
  await expect(
    page.getByRole("heading", { name: "Jorji Costava" }),
  ).toBeVisible();
  await expect(
    page.getByText("LOCAL SIMULATION", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Passport", exact: true }),
  ).toHaveCSS("opacity", "1");
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await expect(page.getByRole("button", { name: "Field manual" })).toHaveCount(
    0,
  );
  const pass = page.getByRole("article", { name: "Passport", exact: true });
  const before = await pass.boundingBox();
  if (!before) throw new Error("Missing passport");
  await page.mouse.move(before.x + 40, before.y + 25);
  await page.mouse.down();
  await page.mouse.move(before.x + 90, before.y + 45, { steps: 10 });
  await page.mouse.up();
  const after = await pass.boundingBox();
  expect(after!.x).toBeGreaterThan(before.x + 20);
  await page.getByRole("button", { name: "Reset papers" }).click();
  await inspectLuggage(page);
  await page.getByRole("button", { name: /DENY.*Refuse entry/ }).click();
  await expect(
    page.getByText("DENIED", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "View audit" }).click();
  await expect(page.getByText("Protocol upheld.")).toBeVisible();
  await expect(
    page.getByText("No concern", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Semantic recommendation")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/combined-audit.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Call next applicant" }).click();
  await expect(
    page.getByRole("heading", { name: "Boris Vance" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Luggage/ }).click();
  await inspectLuggage(page);
  await expect(
    page.getByText("Heavy brass explosive casings", {
      exact: true,
    }),
  ).toBeVisible();
  await inspectLuggage(page);
  await page.getByRole("button", { name: /DETAIN.*Call security/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await expect(page.getByText("94%", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Call next applicant" }).click();
  await expect(
    page.getByRole("heading", { name: "Elysia Ward" }),
  ).toBeVisible();
  await inspectLuggage(page);
  await page.getByRole("button", { name: /APPROVE.*Grant entry/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await page.getByRole("button", { name: "Finish shift" }).click();
  await expect(
    page.getByRole("heading", { name: "Your duty is done." }),
  ).toBeVisible();
  await expect(page.getByText("3/3", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/shift-report.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Start a new shift" }).click();
  await beginShift(page);
  await expect(page.locator(".tap-guide")).toContainText("Check both papers");
  await expect(
    page.getByRole("heading", { name: "Jorji Costava" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile station keeps the bag, stamps and evidence tabs near the traveler", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await beginShift(page);
  await expect(page.locator(".topbar")).toBeHidden();
  const bag = page.getByRole("button", { name: "Open luggage", exact: true });
  await expect(bag).toBeVisible();
  const stamps = page.locator(".decision-bar");
  const box = await stamps.boundingBox();
  expect(box!.y + box!.height).toBeLessThan(450);
  await expect(
    page.getByRole("article", { name: "Passport", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Entry permit", exact: true }).click();
  await expect(
    page.getByRole("article", { name: "Entry permit", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Interview", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Interview" })).toBeVisible();
  await expect(page.locator(".desk-area")).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/mobile-station.png",
    fullPage: true,
  });
  await bag.click();
  await expect(
    page.getByRole("tab", { name: "Luggage", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByText("Half-eaten sausage", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Jev report", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Jev evidence assessment" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /APPROVE.*Grant entry/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await expect(page.getByText("Citation issued.")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByLabel("Game menu", { exact: true }).click();
  await page.getByRole("button", { name: "Shift log", exact: true }).click();
  await expect(page.getByText("15 CR", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("API rejects unknown entrants and provides valid typed assessments", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/judgment", { data: { entrantId: "unknown" } })
    ).status(),
  ).toBe(400);
  const response = await request.post("/api/judgment", {
    data: { entrantId: ENTRANT_PRESETS[1].id },
  });
  expect(response.ok()).toBe(true);
  const result = await response.json();
  expect(() => validateJudgment(result)).not.toThrow();
  expect(result.data).not.toHaveProperty("recommended_verdict");
});

test("reloads preserve the original static case even with an old seed URL", async ({
  page,
}) => {
  for (const url of ["/", "/?seed=test-39"]) {
    await page.goto(url);
    await beginShift(page);
    await expect(
      page.getByRole("article", { name: "Passport", exact: true }),
    ).toContainText("OB-79102-K");
    await page.reload();
    await beginShift(page);
    await expect(
      page.getByRole("article", { name: "Passport", exact: true }),
    ).toContainText("OB-79102-K");
  }
});

test("stamps wait for Jev and an uncertain live report remains unscored", async ({
  page,
}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.unroute("**/api/judgment");
  await page.route("**/api/judgment", async (route) => {
    await gate;
    const { entrantId: id, stage } = route.request().postDataJSON();
    const entrant = ENTRANT_PRESETS.find((e) => e.id === id)!;
    const data = mockJevResponse(evidenceFor(entrant, stage ?? "inspected"));
    if (entrant.portrait === 2) {
      data.semantic_assessment.confidence = 0.4;
      data.story_coherence.value = 1.4;
      data.story_coherence.score = "suspicious";
    }
    await route.fulfill({ json: { source: "live", latencyMs: 120, data } });
  });
  await page.goto("/");
  await beginShift(page);
  const approve = page.getByRole("button", { name: /APPROVE.*Grant entry/ });
  await expect(approve).toBeDisabled();
  await page.keyboard.press("1");
  await expect(page.getByRole("button", { name: "View audit" })).toHaveCount(0);
  release();
  await inspectLuggage(page);
  await page.getByRole("button", { name: /DENY.*Refuse entry/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await page.getByRole("button", { name: "Call next applicant" }).click();
  await inspectLuggage(page);
  await page.getByRole("button", { name: /DETAIN.*Call security/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await page.getByRole("button", { name: "Call next applicant" }).click();
  await inspectLuggage(page);
  await approve.click();
  await page.getByRole("button", { name: "View audit" }).click();
  await expect(page.getByText("Assessment unresolved.")).toBeVisible();
  await expect(page.getByText("47/100", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Unscored", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Finish shift" }).click();
  await expect(page.getByText("2/2", { exact: true })).toBeVisible();
  await expect(page.getByText("1 unresolved", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Review inspection log" }).click();
  await expect(page.getByText("35 CR", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Unresolved / unscored", { exact: false }),
  ).toBeVisible();
});

test("audio starts enabled despite a saved mute and resets to enabled on reload", async ({
  page,
}) => {
  const effects: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("border-protocol-sound", "off");
    const Audio = window.AudioContext;
    const original = Audio.prototype.createOscillator;
    (window as unknown as { audioNodes: number }).audioNodes = 0;
    Audio.prototype.createOscillator = function () {
      (window as unknown as { audioNodes: number }).audioNodes++;
      return original.call(this);
    };
  });
  page.on("console", (message) => {
    if (message.text().includes("Sound effect scheduled"))
      effects.push(message.text());
  });
  await page.goto("/");
  await beginShift(page);
  await expect(
    page.getByRole("button", { name: "Mute sound" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: /Luggage/ }).click();
  await inspectLuggage(page);
  await page.getByRole("button", { name: /DENY.*Refuse entry/ }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { audioNodes: number }).audioNodes,
      ),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "View audit" }).click();
  await page.getByRole("button", { name: "Call next applicant" }).click();
  await inspectLuggage(page);
  await page.getByRole("button", { name: /DETAIN.*Call security/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await page.getByRole("button", { name: "Call next applicant" }).click();
  await inspectLuggage(page);
  await page.getByRole("button", { name: /APPROVE.*Grant entry/ }).click();
  await page.getByRole("button", { name: "Mute sound" }).click();
  const before = await page.evaluate(
    () => (window as unknown as { audioNodes: number }).audioNodes,
  );
  await page.getByRole("button", { name: "View audit" }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { audioNodes: number }).audioNodes,
    ),
  ).toBe(before);
  await page.reload();
  await beginShift(page);
  await expect(
    page.getByRole("button", { name: "Mute sound" }),
  ).toHaveAttribute("aria-pressed", "true");
  await inspectLuggage(page);
  await page.getByRole("button", { name: /DENY.*Refuse entry/ }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { audioNodes: number }).audioNodes,
      ),
    )
    .toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("unsupported audio never prevents a verdict", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", {
      value: class {
        constructor() {
          throw new Error("Audio unavailable");
        }
      },
    });
  });
  await page.goto("/");
  await beginShift(page);
  await inspectLuggage(page);
  await page.getByRole("button", { name: /DENY.*Refuse entry/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await expect(page.getByText("Protocol upheld.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("briefing blocks gameplay, flips and zooms before starting the shift", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/judgment")) requests++;
  });
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Shift briefing" });
  await expect(dialog).toBeVisible();
  await expect(page.locator(".game-stage")).toHaveAttribute("inert", "");
  await page.keyboard.press("Escape");
  await page.keyboard.press("1");
  await expect(dialog).toBeVisible();
  expect(requests).toBe(0);
  await page.screenshot({
    path: "test-results/briefing-sealed.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open your briefing card" }).click();
  await expect(
    page.getByRole("heading", { name: "Your desk. Their fate." }),
  ).toBeVisible();
  await expect(page.locator(".briefing-flipper")).toHaveCSS(
    "transform",
    /matrix3d/,
  );
  await expect(
    page.getByRole("button", { name: "Close briefing & begin shift" }),
  ).toBeFocused();
  await page.screenshot({
    path: "test-results/briefing-open.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await inspectLuggage(page);
  await expect(
    page.getByRole("button", { name: /DENY.*Refuse entry/ }),
  ).toBeEnabled();
  expect(requests).toBeGreaterThan(0);
});

test("briefing is readable on a narrow screen with reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Open your briefing card" }).click();
  await expect(
    page.getByRole("button", { name: "Close briefing & begin shift" }),
  ).toBeVisible();
  expect(
    await page
      .locator(".briefing-dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/briefing-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Close briefing & begin shift" })
    .click();
  await expect(page.locator(".window-portrait")).toBeVisible();
});

test("opening Boris luggage reveals contraband and preserves both Jev reports", async ({
  page,
}) => {
  const stages: string[] = [];
  page.on("request", (request) => {
    if (
      request.url().endsWith("/api/judgment") &&
      request.postDataJSON().entrantId === ENTRANT_PRESETS[1].id
    )
      stages.push(request.postDataJSON().stage);
  });
  await page.goto("/");
  await beginShift(page);
  await inspectLuggage(page);
  await page.getByRole("button", { name: /DENY.*Refuse entry/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await page.getByRole("button", { name: "Call next applicant" }).click();
  await page.getByRole("tab", { name: /Luggage/ }).click();
  await expect(
    page.getByText("Watch parts and repair tools", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Heavy brass explosive casings", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /DETAIN.*Call security/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Open luggage", exact: true }).click();
  const readout = page.getByRole("region", { name: "Jev evidence assessment" });
  await expect(readout.getByText("3%", { exact: true })).toBeVisible();
  await expect(readout.getByText("94%", { exact: true })).toBeVisible();
  await expect(readout.getByText("Unverified", { exact: true })).toBeVisible();
  await expect(
    readout.getByText("Contradicted", { exact: true }),
  ).toBeVisible();
  await expect(
    readout.getByText("Security concern", { exact: true }),
  ).toBeVisible();
  await expect(
    readout.getByText("Assessment confidence: 89%", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Heavy brass explosive casings", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Interview/ }).click();
  await page.getByRole("tab", { name: /Luggage/ }).click();
  await expect(
    page.getByRole("button", { name: "Open luggage", exact: true }),
  ).toHaveCount(0);
  expect(stages).toEqual(["declared", "inspected"]);
  await page.screenshot({
    path: "test-results/jev-discovery.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /DETAIN.*Call security/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  const audit = page.getByRole("dialog");
  await expect(
    audit.getByText("Before inspection", { exact: false }),
  ).toBeVisible();
  await expect(
    audit.getByText("After inspection", { exact: false }),
  ).toBeVisible();
});

test("checkpoint sprite animates while passport stays static and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await beginShift(page);
  const sprite = page.locator(".window-portrait .portrait-idle");
  await expect(sprite).toBeVisible();
  await expect(sprite).toHaveCSS("background-size", "600% 300%");
  await expect(sprite).toHaveCSS("animation-name", "traveler-idle");
  await expect(page.locator(".passport .portrait")).not.toHaveClass(
    /portrait-idle/,
  );
  await sprite.evaluate((el) => {
    const animation = el.getAnimations()[0];
    animation.pause();
    animation.currentTime = 4500;
  });
  await expect(sprite).toHaveCSS("background-position-x", "40%");
  await page.screenshot({
    path: "test-results/sprite-blink.png",
    fullPage: true,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(sprite).toHaveCSS("animation-name", "none");
  await expect(sprite).toHaveCSS("background-position-x", "0%");
  await page.screenshot({
    path: "test-results/sprite-neutral.png",
    fullPage: true,
  });
});

test.describe("mobile audio gestures", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  test("taps start audio and recover a suspended output", async ({ page }) => {
    await page.addInitScript(() => {
      const Audio = window.AudioContext;
      (window as any).audioContexts = [];
      window.AudioContext = new Proxy(Audio, {
        construct(target, args) {
          const context = new target(...args);
          (window as any).audioContexts.push(context);
          return context;
        },
      });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Open your briefing card" }).tap();
    await page
      .getByRole("button", { name: "Close briefing & begin shift" })
      .tap();
    await expect
      .poll(() =>
        page.evaluate(() => (window as any).audioContexts.at(-1)?.state),
      )
      .toBe("running");
    await page.evaluate(async () => {
      await (window as any).audioContexts.at(-1).suspend();
    });
    await page.getByRole("tab", { name: /Luggage/ }).tap();
    await expect
      .poll(() =>
        page.evaluate(() => (window as any).audioContexts.at(-1)?.state),
      )
      .toBe("running");
    await page.getByLabel("Game menu", { exact: true }).tap();
    await page.getByRole("button", { name: "Mute sound" }).tap();
    await expect(
      page.getByRole("button", { name: "Enable sound" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Enable sound" }).tap();
    await expect(
      page.getByRole("button", { name: "Mute sound" }),
    ).toBeVisible();
  });
});

test("mobile tap guide restarts after each briefing regardless of saved completion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("border-protocol-tap-guide-v1", "done"));
  await page.goto("/");
  await expect(page.locator(".tap-guide")).toHaveCount(0);
  await beginShift(page);
  await expect(page.getByText("1 / 2 · Check both papers", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Entry permit", exact: true }).click();
  await expect(page.getByText("2 / 2 · Search the bag", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/mobile-tap-guide.png", fullPage: true });
  await page.getByRole("button", { name: "Open luggage", exact: true }).click();
  await expect(page.locator(".tap-guide")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".tap-guide")).toHaveCount(0);
  await beginShift(page);
  await expect(page.locator(".tap-guide")).toContainText("Check both papers");
  await page.getByRole("button", { name: "Skip tips" }).click();
  await expect(page.locator(".tap-guide")).toHaveCount(0);
  await page.reload();
  await beginShift(page);
  await expect(page.locator(".tap-guide")).toContainText("Check both papers");
});
