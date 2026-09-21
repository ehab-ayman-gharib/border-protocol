import { test, expect } from "@playwright/test";
import { ENTRANT_PRESETS } from "../../fixtures/presets";
import { mockJevResponse, validateJudgment } from "../../lib/jevClient";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/judgment", async (route) => {
    const id = route.request().postDataJSON().entrantId;
    const entrant = ENTRANT_PRESETS.find((e) => e.id === id)!;
    await route.fulfill({
      json: {
        source: "local",
        reason: "unconfigured",
        latencyMs: 0,
        data: mockJevResponse(entrant),
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
  await expect(
    page.getByRole("heading", { name: "Jorji Costava" }),
  ).toBeVisible();
  await expect(
    page.getByText("LOCAL SIMULATION", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Entry permit", exact: true }),
  ).toHaveCSS("opacity", "1");
  await expect(
    page.getByRole("article", { name: "Passport", exact: true }),
  ).toHaveCSS("opacity", "1");
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Field manual" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Return to duty" }).click();
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
  await page.getByRole("button", { name: /DENY.*Refuse entry/ }).click();
  await expect(
    page.getByText("DENIED", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "View audit" }).click();
  await expect(page.getByText("Protocol upheld.")).toBeVisible();
  await expect(page.getByText("No concern", { exact: true })).toBeVisible();
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
  await expect(page.getByText("Heavy brass explosive casings")).toBeVisible();
  await page.getByRole("button", { name: /DETAIN.*Call security/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await expect(page.getByText("94%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Call next applicant" }).click();
  await expect(
    page.getByRole("heading", { name: "Elysia Ward" }),
  ).toBeVisible();
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
  await expect(
    page.getByRole("heading", { name: "Jorji Costava" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile layout, incorrect verdict, dialog keyboard guard and log", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Jorji Costava" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("article", { name: "Entry permit", exact: true }),
  ).toHaveCSS("opacity", "1");
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Read inspection rules" }).click();
  await page.keyboard.press("1");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page.getByRole("button", { name: /APPROVE.*Grant entry/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /APPROVE.*Grant entry/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await expect(page.getByText("Citation issued.")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Shift log" }).click();
  await expect(page.getByText("15 CR", { exact: true })).toBeVisible();
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
    data: { entrantId: "entrant-02-smuggler" },
  });
  expect(response.ok()).toBe(true);
  const result = await response.json();
  expect(() => validateJudgment(result)).not.toThrow();
  expect(result.data).not.toHaveProperty("recommended_verdict");
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
    const id = route.request().postDataJSON().entrantId;
    const entrant = ENTRANT_PRESETS.find((e) => e.id === id)!;
    const data = mockJevResponse(entrant);
    if (entrant.portrait === 2) {
      data.semantic_assessment.confidence = 0.4;
      data.story_coherence.value = 1.4;
      data.story_coherence.score = "suspicious";
    }
    await route.fulfill({ json: { source: "live", latencyMs: 120, data } });
  });
  await page.goto("/");
  const approve = page.getByRole("button", { name: /APPROVE.*Grant entry/ });
  await expect(approve).toBeDisabled();
  await page.keyboard.press("1");
  await expect(page.getByRole("button", { name: "View audit" })).toHaveCount(0);
  release();
  await page.getByRole("button", { name: /DENY.*Refuse entry/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await page.getByRole("button", { name: "Call next applicant" }).click();
  await page.getByRole("button", { name: /DETAIN.*Call security/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await page.getByRole("button", { name: "Call next applicant" }).click();
  await approve.click();
  await page.getByRole("button", { name: "View audit" }).click();
  await expect(page.getByText("Assessment unresolved.")).toBeVisible();
  await expect(page.getByText("47/100", { exact: true })).toBeVisible();
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
  await expect(
    page.getByRole("button", { name: "Mute sound" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: /Luggage/ }).click();
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
  await page.getByRole("button", { name: /DETAIN.*Call security/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await page.getByRole("button", { name: "Call next applicant" }).click();
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
  await expect(
    page.getByRole("button", { name: "Mute sound" }),
  ).toHaveAttribute("aria-pressed", "true");
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
  await page.getByRole("button", { name: /DENY.*Refuse entry/ }).click();
  await page.getByRole("button", { name: "View audit" }).click();
  await expect(page.getByText("Protocol upheld.")).toBeVisible();
  expect(errors).toEqual([]);
});
