"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Fingerprint, Shield, X } from "lucide-react";

export function BriefingCard({
  onBegin,
  onFlip,
}: {
  onBegin: () => void;
  onFlip: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const begin = useRef<HTMLButtonElement>(null);
  const [opened, setOpened] = useState(false);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const node = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node?.showModal();
    return () => {
      node?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="briefing-dialog"
      aria-label="Shift briefing"
      onCancel={(event) => {
        event.preventDefault();
        if (opened) onBegin();
      }}
    >
      <div className="briefing-stage">
        <p className="briefing-kicker">
          EAST GRESTIN CHECKPOINT · YOUR FIRST SHIFT
        </p>
        <motion.div
          className="briefing-card"
          initial={false}
          animate={{ scale: opened ? 1 : 0.84, rotate: opened ? 0 : -6 }}
          transition={{
            duration: reduceMotion ? 0 : 0.55,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          <motion.div
            className="briefing-flipper"
            initial={false}
            animate={{ rotateY: opened ? 180 : 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.65,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            onAnimationComplete={() => {
              if (opened) begin.current?.focus();
            }}
          >
            <div
              className="briefing-face briefing-front"
              aria-hidden={opened}
              inert={opened}
            >
              <button
                autoFocus
                className="briefing-open"
                onClick={() => {
                  setOpened(true);
                  onFlip();
                }}
                aria-label="Open your briefing card"
              >
                <span className="briefing-corner">M.O.A. / 004</span>
                <Shield size={62} strokeWidth={1} />
                <span className="briefing-classified">FOR YOUR EYES ONLY</span>
                <strong>
                  Border
                  <br />
                  Protocol
                </strong>
                <span className="briefing-rule" />
                <span className="briefing-front-subtitle">
                  An inspector’s duty.
                </span>
                <span className="briefing-seal">
                  <Fingerprint size={35} strokeWidth={1.2} />
                </span>
                <span className="briefing-tap">
                  TAP TO BREAK THE SEAL <ArrowRight size={15} />
                </span>
              </button>
            </div>
            <div
              className="briefing-face briefing-back"
              aria-hidden={!opened}
              inert={!opened}
            >
              <button
                className="briefing-close"
                aria-label="Close briefing and begin shift"
                onClick={onBegin}
              >
                <X size={19} />
              </button>
              <span className="briefing-back-label">
                MINISTRY OF ADMISSION / DUTY ORDER 01
              </span>
              <h1>
                Your desk.
                <br />
                <em>Their fate.</em>
              </h1>
              <p className="briefing-intro">
                Three travelers are waiting. Read their papers, listen to their
                stories, and decide who crosses.
              </p>
              <ol className="briefing-rules">
                <li>
                  <span>01</span>
                  <div>
                    <strong>Read the papers.</strong>
                    <p>
                      Drag the passport and permit to compare names, numbers and
                      dates. Today is <b>22 September 2026.</b>
                    </p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <strong>Open the luggage.</strong>
                    <p>
                      Tap the glowing bag beside the traveler on mobile, or
                      select <b>Luggage</b> then <b>Open luggage</b>. Wait for
                      Jev’s new assessment to unlock the stamps.
                    </p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <strong>Make your mark.</strong>
                    <p>
                      <b>Approve</b> valid travel. <b>Deny</b> invalid papers or
                      a false purpose. <b>Detain</b> dangerous cargo.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="briefing-pay">
                <span>
                  Sound judgment <b>+5 CR</b>
                </span>
                <span>
                  A mistake <b>−10 CR</b>
                </span>
              </div>
              <p className="briefing-footnote">
                Your stamp is final. Uncertain assessments are unscored. Read
                the audit after each decision.
              </p>
              <button ref={begin} className="briefing-begin" onClick={onBegin}>
                Close briefing & begin shift <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </motion.div>
        <p className="briefing-undertext">
          {opened
            ? "The border is in your hands."
            : "A sealed briefing has been left on your desk."}
        </p>
      </div>
    </dialog>
  );
}
