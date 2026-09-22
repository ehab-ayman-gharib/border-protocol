import type { Judgment } from "@/types/jev";

function Report({ report, label }: { report: Judgment; label: string }) {
  const risk = Math.round(report.data.smuggling_risk.probability * 100);
  const coherence = Math.round((report.data.story_coherence.value / 3) * 100);
  const declaration = report.data.declaration_accuracy;
  const finding = report.data.semantic_assessment;
  const labels = { supported: "Supported", contradicted: "Contradicted", unverified: "Unverified", security_concern: "Security concern", purpose_mismatch: "Purpose mismatch", no_concern: "No concern" };
  return (
    <div className="evidence-report">
      <small>
        {label} · {report.source === "live" ? "Jev live" : "Local simulation"}
      </small>
      <div>
        Story coherence <b>{coherence}/100</b>
      </div>
      <div>
        Cargo risk <b>{risk}%</b>
      </div>
      <meter
        min={0}
        max={100}
        low={20}
        high={80}
        optimum={0}
        value={risk}
        aria-label={`${label} cargo risk`}
      />
      <div className="evidence-finding">
        Declaration <b>{labels[declaration.choice]}</b>
      </div>
      <small>Declaration assessment confidence: {Math.round(declaration.confidence * 100)}%</small>
      <div className="evidence-finding">
        Finding <b>{labels[finding.choice]}</b>
      </div>
      <small>Assessment confidence: {Math.round(finding.confidence * 100)}%</small>
    </div>
  );
}
export function AssessmentReadout({
  before,
  current,
  inspected,
}: {
  before?: Judgment | null;
  current: Judgment | null;
  inspected: boolean;
}) {
  return (
    <section
      className="evidence-readout"
      aria-label="Jev evidence assessment"
      aria-live="polite"
    >
      <strong>JEV · EVIDENCE ASSESSMENT</strong>
      {before && <Report report={before} label="Before inspection" />}
      {current ? (
        <Report
          report={current}
          label={inspected ? "After inspection" : "Declaration only"}
        />
      ) : (
        <p role="status">Assessing evidence…</p>
      )}
      {!inspected && (
        <small>Provisional · luggage has not been searched.</small>
      )}
    </section>
  );
}
