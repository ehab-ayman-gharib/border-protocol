"use client";
import { useEffect, useMemo, useReducer, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardList,
  Coins,
  Fingerprint,
  Flag,
  Headphones,
  History,
  Package,
  RotateCcw,
  Shield,
  ShieldAlert,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { ENTRANT_PRESETS, CHECKPOINT_DATE } from "@/fixtures/presets";
import { evaluateDeterministicRules } from "@/lib/deterministic";
import { fetchJevJudgment } from "@/lib/jevClient";
import { gameReducer, initialGame } from "@/lib/game";
import type { Judgment } from "@/types/jev";
import type { Verdict } from "@/types/border";
import { BoothHeader } from "@/components/BoothHeader";
import { DeskSurface } from "@/components/DeskSurface";
import { Modal } from "@/components/Modal";
import { TelemetryModal } from "@/components/TelemetryModal";
import { debugLog } from "@/lib/debug";
import { useGameAudio } from "@/components/useGameAudio";

export default function Page() {
  const [game, dispatch] = useReducer(gameReducer, initialGame);
  const [judgmentState, setJudgmentState] = useState<{
    entrantId: string;
    session: number;
    result: Judgment;
  } | null>(null);
  const [panel, setPanel] = useState<"interview" | "luggage">("interview");
  const [modal, setModal] = useState<"manual" | "log" | "audit" | null>(null);
  const { sound, toggleSound, playSound } = useGameAudio();
  const [session, setSession] = useState(0);
  const entrant = ENTRANT_PRESETS[game.index];
  const judgment =
    judgmentState?.entrantId === entrant.id && judgmentState.session === session
      ? judgmentState.result
      : null;
  const currentDecision = game.verdict ? game.decisions.at(-1) : undefined;
  const code = useMemo(() => evaluateDeterministicRules(entrant), [entrant]);
  useEffect(() => {
    debugLog("SHIFT", "Shift initialized", {
      session,
      checkpointDate: CHECKPOINT_DATE,
      startingCredits: initialGame.credits,
    });
  }, [session]);
  useEffect(() => {
    debugLog("APPLICANT", "Applicant arrived; documents ready", {
      entrantId: entrant.id,
      name: entrant.bio.fullName,
      nation: entrant.bio.nation,
    });
    debugLog(
      "DOCUMENTS",
      "Deterministic inspection complete",
      { entrantId: entrant.id, checkpointDate: CHECKPOINT_DATE, ...code },
      code.passedAllCodeRules ? "success" : "warn",
    );
  }, [entrant, code, session]);
  useEffect(() => {
    debugLog("UI", "Evidence panel selected", { entrantId: entrant.id, panel });
  }, [entrant.id, panel, session]);
  useEffect(() => {
    debugLog("UI", modal ? "Dialog opened" : "Returned to desk", {
      dialog: modal,
    });
  }, [modal]);
  useEffect(() => {
    debugLog("UI", "Sound preference", { enabled: sound });
  }, [sound]);
  useEffect(() => {
    const decision = game.decisions.at(-1);
    if (game.verdict && decision)
      debugLog(
        "DECISION",
        "Verdict committed and credits updated",
        {
          ...decision,
          credits: game.credits,
          processed: game.decisions.length,
        },
        decision.correct ? "success" : "warn",
      );
    if (game.complete)
      debugLog(
        "SHIFT",
        "Shift complete",
        {
          credits: game.credits,
          decisions: game.decisions,
          correct: game.decisions.filter((d) => d.correct).length,
        },
        "success",
      );
  }, [game]);
  useEffect(() => {
    const controller = new AbortController();
    setJudgmentState(null);
    fetchJevJudgment(entrant, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted)
          setJudgmentState({ entrantId: entrant.id, session, result });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [entrant, session]);
  function stamp(verdict: Verdict) {
    if (game.verdict || game.complete || modal || !judgment) {
      debugLog(
        "DECISION",
        "Stamp ignored: inspection locked or dialog open",
        {
          entrantId: entrant.id,
          requested: verdict,
          existing: game.verdict,
          complete: game.complete,
          dialog: modal,
        },
        "warn",
      );
      return;
    }
    debugLog("DECISION", "Stamp requested", { entrantId: entrant.id, verdict });
    dispatch({ type: "stamp", verdict, entrantId: entrant.id, judgment });
    playSound(
      verdict === "ADMIT" ? "approve" : verdict === "DENY" ? "deny" : "detain",
    );
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target instanceof HTMLElement &&
          ["INPUT", "TEXTAREA", "BUTTON"].includes(event.target.tagName))
      )
        return;
      if (event.key === "1") stamp("ADMIT");
      if (event.key === "2") stamp("DENY");
      if (event.key === "3") stamp("DETAIN");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  const next = () => {
    playSound(game.index === ENTRANT_PRESETS.length - 1 ? "success" : "radio");
    debugLog("SHIFT", "Advancing after audit", {
      entrantId: entrant.id,
      nextEntrantId: ENTRANT_PRESETS[game.index + 1]?.id ?? null,
    });
    dispatch({ type: "next" });
    setModal(null);
    setPanel("interview");
  };
  const restart = () => {
    playSound("radio");
    debugLog("SHIFT", "Restart requested; resetting credits and decisions");
    dispatch({ type: "reset" });
    setSession((v) => v + 1);
    setModal(null);
    setPanel("interview");
  };
  const correct = game.decisions.filter((d) => d.correct === true).length;
  const citations = game.decisions.filter((d) => d.correct === false).length;
  const unresolved = game.decisions.filter((d) => d.correct === null).length;

  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Border Protocol home">
          <div className="brand-mark">
            <Shield size={26} strokeWidth={1.4} />
          </div>
          <div>
            BORDER<span>PROTOCOL</span>
          </div>
        </a>
        <div className="topbar-center">
          <span className="status-square" /> INSPECTOR TERMINAL <b>№ 004</b>
        </div>
        <nav>
          <button aria-label="Field manual" onClick={() => setModal("manual")}>
            <BookOpen size={16} />
            <span>Field manual</span>
          </button>
          <button aria-label="Shift log" onClick={() => setModal("log")}>
            <History size={16} />
            <span>Shift log</span>
          </button>
          <button
            aria-label={sound ? "Mute sound" : "Enable sound"}
            onClick={toggleSound}
            aria-pressed={sound}
            title={
              sound ? "Sound on: click to mute" : "Sound muted: click to enable"
            }
            className="sound-toggle"
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
            <span className="sound-label">
              {sound ? "Sound on" : "Sound off"}
            </span>
          </button>
        </nav>
      </header>
      <div className="shiftbar">
        <div>
          <span className="eyebrow">DUTY SHIFT</span>
          <strong>01</strong>
          <i />
          <span className="shift-date">TUESDAY, 22 SEPTEMBER 2026</span>
        </div>
        <div className="shift-stats">
          <span>
            <span className="muted">PROCESSED</span>
            <b>
              {String(game.decisions.length).padStart(2, "0")} <em>/ 03</em>
            </b>
          </span>
          <i />
          <span>
            <Coins size={15} />
            <b>{game.credits}</b>
            <span className="muted">CREDITS</span>
          </span>
        </div>
      </div>
      {game.complete ? (
        <section className="shift-complete">
          <div className="report-card">
            <div className="report-seal">
              <Award size={42} />
            </div>
            <span className="eyebrow">EAST GRESTIN · END OF SHIFT</span>
            <h1>Your duty is done.</h1>
            <p>
              {correct === 3
                ? "An exemplary shift, inspector. The border is secure."
                : "The Ministry has recorded your decisions. Review your citations before your next shift."}
            </p>
            <div className="report-stats">
              <div>
                <b>
                  {correct}/{game.decisions.length - unresolved}
                </b>
                <span>COMPLIANT / RESOLVED</span>
              </div>
              <div>
                <b>{game.credits}</b>
                <span>FINAL CREDITS</span>
              </div>
              <div>
                <b>{citations}</b>
                <span>CITATIONS</span>
              </div>
            </div>
            <p className="audit-note">
              {unresolved} unresolved |{" "}
              {
                game.decisions.filter((d) => d.judgment.source === "live")
                  .length
              }{" "}
              live Jev assessments |{" "}
              {
                game.decisions.filter((d) => d.judgment.source === "local")
                  .length
              }{" "}
              local assessments
            </p>
            <div className="report-cases">
              {game.decisions.map((d, i) => (
                <div key={d.entrantId}>
                  <span>
                    {d.correct === null ? (
                      <span aria-label="Unresolved">-</span>
                    ) : d.correct ? (
                      <Check size={16} className="pass" />
                    ) : (
                      <X size={16} className="fail" />
                    )}
                    {ENTRANT_PRESETS[i].bio.fullName}
                  </span>
                  <b>{d.verdict}</b>
                  <span>
                    {d.delta > 0 ? "+" : ""}
                    {d.delta} CR
                  </span>
                </div>
              ))}
            </div>
            <button className="primary-button full-width" onClick={restart}>
              <RotateCcw size={16} /> Start a new shift
            </button>
            <button
              className="text-button report-log"
              onClick={() => setModal("log")}
            >
              Review inspection log <ArrowRight size={14} />
            </button>
          </div>
        </section>
      ) : (
        <>
          <BoothHeader entrant={entrant} index={game.index} />
          <div className="workspace">
            <DeskSurface
              onPaperSound={() => playSound("paper")}
              key={entrant.id + session}
              entrant={entrant}
              verdict={game.verdict}
            />
            <aside className="inspector-panel">
              <div className="section-heading">
                <span>
                  <Fingerprint size={15} /> APPLICANT DOSSIER
                </span>
                <span className="file-code">0{game.index + 1} / 03</span>
              </div>
              <div className="applicant-heading">
                <h1>{entrant.bio.fullName}</h1>
                <span>
                  <Flag size={12} />
                  {entrant.bio.nation}
                  <i />
                  {entrant.bio.statedProfession}
                </span>
              </div>
              <div
                className="dossier-tabs"
                role="tablist"
                aria-label="Applicant evidence"
              >
                <button
                  role="tab"
                  id="interview-tab"
                  aria-controls="interview-panel"
                  aria-selected={panel === "interview"}
                  onClick={() => {
                    setPanel("interview");
                    playSound("paper");
                  }}
                >
                  <Headphones size={14} /> Interview
                </button>
                <button
                  role="tab"
                  id="luggage-tab"
                  aria-controls="luggage-panel"
                  aria-selected={panel === "luggage"}
                  onClick={() => {
                    setPanel("luggage");
                    playSound("paper");
                  }}
                >
                  <Package size={14} /> Luggage <span>03</span>
                </button>
              </div>
              {panel === "interview" ? (
                <div
                  className="dossier-content"
                  role="tabpanel"
                  id="interview-panel"
                  aria-labelledby="interview-tab"
                >
                  <span className="eyebrow">PURPOSE OF YOUR VISIT?</span>
                  <blockquote>“{entrant.bio.declaredPurpose}”</blockquote>
                  <div className="duration">
                    <span>DECLARED STAY</span>
                    <b>{entrant.bio.declaredDurationDays} DAYS</b>
                  </div>
                  <div className="observation">
                    <span className="eyebrow">INSPECTOR’S OBSERVATION</span>
                    <p>{entrant.bio.observedDemeanor}</p>
                  </div>
                </div>
              ) : (
                <div
                  className="dossier-content"
                  role="tabpanel"
                  id="luggage-panel"
                  aria-labelledby="luggage-tab"
                >
                  <span className="eyebrow">DECLARED PERSONAL EFFECTS</span>
                  <ul className="luggage-list">
                    {entrant.bio.carriedItems.map((item, i) => (
                      <li key={item}>
                        <span>0{i + 1}</span>
                        <Package size={17} />
                        <b>{item}</b>
                      </li>
                    ))}
                  </ul>
                  <p className="luggage-note">
                    Compare these items with the traveler’s profession and
                    stated purpose.
                  </p>
                </div>
              )}
              <div className="protocol-reminder">
                <ShieldAlert size={18} />
                <p>
                  Check the papers.
                  <br />
                  <strong>Question the story.</strong>
                </p>
                <button
                  className="icon-button"
                  aria-label="Read inspection rules"
                  onClick={() => setModal("manual")}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </aside>
          </div>
          <section className="decision-bar">
            <div className="decision-caption">
              <span className="eyebrow">
                {game.verdict ? "DECISION RECORDED" : "THE DECISION IS YOURS"}
              </span>
              <p aria-live="polite">
                {game.verdict
                  ? `${game.verdict === "ADMIT" ? "Entry approved" : game.verdict === "DENY" ? "Entry denied" : "Applicant detained"}. Review the Ministry’s audit.`
                  : judgment
                    ? "Every stamp has a consequence."
                    : "Receiving inspection assessment..."}
              </p>
            </div>
            {game.verdict ? (
              <div className="decision-followup">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setModal("audit");
                    playSound(
                      currentDecision?.correct === false
                        ? "citation"
                        : currentDecision?.correct
                          ? "success"
                          : "radio",
                    );
                  }}
                >
                  <ClipboardList size={16} /> View audit
                </button>
                <button
                  className="primary-button"
                  onClick={() => {
                    setModal("audit");
                    playSound(
                      currentDecision?.correct === false
                        ? "citation"
                        : currentDecision?.correct
                          ? "success"
                          : "radio",
                    );
                  }}
                >
                  {game.index === 2
                    ? "Complete inspection"
                    : "Process next applicant"}
                  <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <div className="stamp-actions">
                <button
                  className="stamp-button approve"
                  disabled={!judgment}
                  onClick={() => stamp("ADMIT")}
                >
                  <Check size={21} />
                  <span>
                    APPROVE<small>Grant entry</small>
                  </span>
                  <kbd>1</kbd>
                </button>
                <button
                  className="stamp-button deny"
                  disabled={!judgment}
                  onClick={() => stamp("DENY")}
                >
                  <X size={21} />
                  <span>
                    DENY<small>Refuse entry</small>
                  </span>
                  <kbd>2</kbd>
                </button>
                <button
                  className="stamp-button detain"
                  disabled={!judgment}
                  onClick={() => stamp("DETAIN")}
                >
                  <ShieldAlert size={21} />
                  <span>
                    DETAIN<small>Call security</small>
                  </span>
                  <kbd>3</kbd>
                </button>
              </div>
            )}
          </section>
        </>
      )}
      <footer className="terminal-footer">
        <span>
          <span
            className={`live-dot ${judgment?.source === "live" ? "" : "amber"}`}
          />
          {judgment
            ? judgment.source === "live"
              ? "JEV · LIVE CONNECTION"
              : "LOCAL SIMULATION"
            : "JUDGMENT ENGINE · CONNECTING"}
        </span>
        <span>GLORY TO ARSTOVIA.</span>
        <span>
          PROTOCOL v1.0 <i /> {CHECKPOINT_DATE}
        </span>
      </footer>
      {modal === "manual" && (
        <Modal
          title="The inspector’s field manual"
          onClose={() => setModal(null)}
        >
          <p className="modal-intro">
            Welcome to East Grestin. Inspect each traveler’s documents and
            story, then issue one final decision.
          </p>
          <ol className="manual-rules">
            <li>
              <b>Verify the documents.</b>
              <p>
                Passports must not be expired on {CHECKPOINT_DATE}. Names and
                passport references must match. The permit must bear an
                authentic Ministry seal.
              </p>
            </li>
            <li>
              <b>Listen. Then inspect the luggage.</b>
              <p>
                Compare the declared stay, occupation and purpose with the
                permit and carried items. Nervousness alone is not a violation.
              </p>
            </li>
            <li>
              <b>Use the right stamp.</b>
              <p>
                APPROVE valid, plausible travel. DENY invalid documents or a
                purpose mismatch. DETAIN evidence of dangerous contraband.
              </p>
            </li>
            <li>
              <b>Answer to the Ministry.</b>
              <p>
                The combined document and semantic ruling determines your score:
                +5 credits for a compliant action, -10 for an error, down to
                zero. An inconclusive assessment is unscored. The ruling is
                locked when you stamp.
              </p>
            </li>
          </ol>
          <div className="manual-tip">
            <span>DESK CONTROLS</span>
            <p>
              Drag papers to arrange them. Use keys <kbd>1</kbd> <kbd>2</kbd>{" "}
              <kbd>3</kbd> to stamp, or use the buttons. Complete all three
              inspections to finish your shift.
            </p>
          </div>
          <button
            className="primary-button full-width"
            onClick={() => setModal(null)}
          >
            Return to duty <ArrowRight size={16} />
          </button>
        </Modal>
      )}
      {modal === "log" && (
        <Modal title="Shift 01 · Inspection log" onClose={() => setModal(null)}>
          {game.decisions.length === 0 ? (
            <p className="empty-log">
              No decisions recorded. Your first applicant is waiting.
            </p>
          ) : (
            <div className="log-entries">
              {game.decisions.map((d, i) => (
                <article key={d.entrantId}>
                  <div>
                    <b>{ENTRANT_PRESETS[i].bio.fullName}</b>
                    <span
                      className={
                        d.correct === null ? "" : d.correct ? "pass" : "fail"
                      }
                    >
                      {d.verdict} · {d.delta > 0 ? "+" : ""}
                      {d.delta} CR
                    </span>
                  </div>
                  <p>{d.resolution.explanation}</p>
                  <p className="audit-note">
                    {d.judgment.source === "live"
                      ? "Live Jev"
                      : "Local simulation"}{" "}
                    | Story coherence {d.resolution.coherenceScore}/100 |{" "}
                    {d.correct === null
                      ? "Unresolved / unscored"
                      : `Combined ruling: ${d.resolution.verdict}`}
                  </p>
                </article>
              ))}
            </div>
          )}
          <div className="log-balance">
            CURRENT BALANCE <b>{game.credits} CR</b>
          </div>
        </Modal>
      )}
      {modal === "audit" && currentDecision && (
        <TelemetryModal
          decision={currentDecision}
          last={game.index === 2}
          onNext={next}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  );
}
