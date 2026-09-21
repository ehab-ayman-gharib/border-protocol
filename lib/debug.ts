type Stage =
  | "AUDIO"
  | "SHIFT"
  | "APPLICANT"
  | "DOCUMENTS"
  | "DESK"
  | "UI"
  | "JEV"
  | "GATEWAY"
  | "API"
  | "DECISION";
type Level = "info" | "success" | "warn" | "error";
const colors = {
  info: ["#7dd3fc", 36],
  success: ["#86efac", 32],
  warn: ["#fcd34d", 33],
  error: ["#fda4af", 31],
} as const;

// Take a snapshot so expanding a log later does not show mutated state.
function snapshot(value: unknown, secrets: string[]): unknown {
  if (typeof value === "string") {
    let safe = value.replace(/Bearer\s+[^\s"']+/gi, "Bearer [REDACTED]");
    for (const secret of secrets)
      if (secret) safe = safe.split(secret).join("[REDACTED]");
    return safe;
  }
  if (Array.isArray(value)) return value.map((item) => snapshot(item, secrets));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /authorization|api.?key|password|secret|token|cookie/i.test(key)
          ? "[REDACTED]"
          : snapshot(item, secrets),
      ]),
    );
  }
  return value;
}

/** Development by default; NEXT_PUBLIC_DEBUG_LOGS=true/false explicitly overrides. */
export function debugLog(
  stage: Stage,
  message: string,
  details?: unknown,
  level: Level = "info",
  secrets: string[] = [],
) {
  const override = process.env.NEXT_PUBLIC_DEBUG_LOGS;
  if (
    override === "false" ||
    (process.env.NODE_ENV === "production" && override !== "true")
  )
    return;
  const label = `[BP][${stage}][${level.toUpperCase()}] ${new Date().toISOString().slice(11, 23)} ${message}`;
  const data = details === undefined ? [] : [snapshot(details, secrets)];
  if (typeof window !== "undefined") {
    console.log(
      `%c${label}`,
      `color:${colors[level][0]};background:#182019;padding:3px 7px;border-radius:3px;font-weight:bold`,
      ...data,
    );
  } else {
    const colored =
      !process.env.NO_COLOR &&
      (process.stdout?.isTTY || process.env.FORCE_COLOR);
    console.log(
      colored ? `\u001b[${colors[level][1]}m${label}\u001b[0m` : label,
      ...data,
    );
  }
}
