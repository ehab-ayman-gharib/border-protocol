/**
 * @file Inspection audit built from the frozen decision recorded at stamp time.
 * Presents credits, document checks, semantic findings and before/after evidence,
 * then exposes next-applicant and close actions without recalculating the decision.
 */
import { ArrowRight, Check, CircleX, Cpu, ShieldAlert } from "lucide-react";
import type { Decision } from "@/lib/game";
import { Modal } from "./Modal";
import { AssessmentReadout } from "./AssessmentReadout";

export function TelemetryModal({
  decision,
  last,
  onNext,
  onClose,
}: {
  decision: Decision;
  last: boolean;
  onNext: () => void;
  onClose: () => void;
}) {
  const { correct, verdict, code, judgment, resolution, delta } = decision;
  const assessment = judgment.data.semantic_assessment;
  const assessmentLabel = {
    no_concern: "No concern",
    purpose_mismatch: "Purpose mismatch",
    security_concern: "Security concern",
  }[assessment.choice];
  const checks: [string, boolean][] = [
    ["Passport expiration", code.isDateValid],
    ["Document reference", code.isPassportMatching],
    ["Identity consistency", code.isNameMatching],
    ["Seal SHA-256 integrity", code.isSealAuthentic],
    ["Declared duration", code.isDurationMatching],
  ];
  return (
    <Modal title="Inspection audit" onClose={onClose} wide>
      <div
        className={`audit-result ${correct === null ? "unresolved" : correct ? "correct" : "incorrect"}`}
      >
        {correct === null ? (
          <ShieldAlert size={24} />
        ) : correct ? (
          <Check size={24} />
        ) : (
          <CircleX size={24} />
        )}
        <div>
          <strong>
            {correct === null
              ? "Assessment unresolved."
              : correct
                ? "Protocol upheld."
                : "Citation issued."}
          </strong>
          <p>
            {correct === null
              ? "Unscored · no reward or penalty"
              : `${delta > 0 ? "+" : ""}${delta} credits ${correct ? "earned" : "applied · penalty capped at remaining balance"}`}
          </p>
        </div>
        <span>YOUR STAMP: {verdict}</span>
      </div>
      <div className="combined-ruling">
        <span className="eyebrow">
          COMBINED RULING · DOCUMENTS + SEMANTIC ASSESSMENT
        </span>
        <strong>{resolution.verdict ?? "UNRESOLVED"}</strong>
      </div>
      <p className="audit-explanation">{resolution.explanation}</p>
      {decision.beforeInspection && (
        <AssessmentReadout
          before={decision.beforeInspection}
          current={judgment}
          inspected
        />
      )}
      {decision.inspectedItems && (
        <details className="audit-policy">
          <summary>Evidence revealed by the search</summary>
          <ul>
            {decision.inspectedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="audit-columns">
        <section>
          <h3>
            <Cpu size={16} /> DOCUMENT CHECKS
          </h3>
          <small>Deterministic facts, verified by code.</small>
          {checks.map(([label, passed]) => (
            <div className="audit-row" key={label}>
              <span>{label}</span>
              <b className={passed ? "pass" : "fail"}>
                {passed ? "PASS" : "FAIL"}
              </b>
            </div>
          ))}
        </section>
        <section>
          <h3>
            <ShieldAlert size={16} /> SEMANTIC ASSESSMENT
          </h3>
          <small>
            {judgment.source === "live"
              ? "Jev · live upstream"
              : "Local simulation · offline rules"}{" "}
            · {judgment.latencyMs} ms
          </small>
          <div className="audit-row">
            <span>
              {judgment.source === "live" ? "Jev" : "Local"} story-coherence
              score
            </span>
            <b>{resolution.coherenceScore}/100</b>
          </div>
          <div
            className="coherence-track"
            role="meter"
            aria-label="Story coherence"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={resolution.coherenceScore}
          >
            <i style={{ width: `${resolution.coherenceScore}%` }} />
          </div>
          <div className="audit-row">
            <span>Story interpretation</span>
            <b>{judgment.data.story_coherence.score}</b>
          </div>
          <div className="audit-row">
            <span>Contraband risk</span>
            <b>{Math.round(judgment.data.smuggling_risk.probability * 100)}%</b>
          </div>
          <div className="risk-track">
            <i
              style={{
                width: `${judgment.data.smuggling_risk.probability * 100}%`,
              }}
            />
          </div>
          <div className="audit-row">
            <span>Assessment</span>
            <b>{assessmentLabel}</b>
          </div>
          <div className="audit-row">
            <span>Assessment confidence</span>
            <b>{Math.round(assessment.confidence * 100)}%</b>
          </div>
        </section>
      </div>
      <details className="audit-policy">
        <summary>How the Ministry reaches a ruling</summary>
        <p className="audit-note">
          Coherence is a rubric score, not a probability of innocence. Security
          concern + risk ≥80% + confidence ≥70% requires detention. Otherwise
          invalid papers require denial. With valid papers and risk ≤20%, a
          confident purpose mismatch with coherence &lt;2/3 requires denial; no
          concern with coherence ≥2/3 permits entry. Other combinations are
          unresolved. Scores are displayed out of 100; policy uses the unrounded
          value. This report is locked when you stamp.
          {judgment.source === "local" &&
            " This inspection uses offline rules, not live Jev."}
        </p>
      </details>
      <button autoFocus className="primary-button full-width" onClick={onNext}>
        {last ? "Finish shift" : "Call next applicant"}
        <ArrowRight size={17} />
      </button>
    </Modal>
  );
}
