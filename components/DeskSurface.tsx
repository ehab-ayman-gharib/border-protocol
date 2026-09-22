"use client";
/**
 * @file Interactive passport and entry-permit desk.
 * Owns paper positions, stacking order and the mobile document selector; renders
 * provided case data and notifies the parent about sounds and document switching.
 */
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Grip, RotateCcw, ScanLine, Shield } from "lucide-react";
import type { EntrantApplicant, Verdict } from "@/types/border";
import { Portrait } from "./Portrait";
import { debugLog } from "@/lib/debug";
export function DeskSurface({
  entrant,
  verdict,
  onPaperSound,
  onDocumentSwitch,
}: {
  entrant: EntrantApplicant;
  verdict: Verdict | null;
  onPaperSound: () => void;
  onDocumentSwitch?: () => void;
}) {
  const bounds = useRef<HTMLDivElement>(null);
  const [front, setFront] = useState("permit");
  const [layout, setLayout] = useState(0);
  const [mobileDocument, setMobileDocument] = useState("passport");
  return (
    <section className="desk-area">
      <div className="section-heading">
        <span>
          <ScanLine size={15} /> INSPECTION DESK
        </span>
        <button
          onClick={() => {
            setLayout((n) => n + 1);
            onPaperSound();
            debugLog("DESK", "Document positions reset", {
              entrantId: entrant.id,
            });
          }}
          className="text-button"
        >
          <RotateCcw size={12} /> Reset papers
        </button>
      </div>
      <div
        className="document-picker"
        role="group"
        aria-label="Documents on desk"
      >
        <button
          aria-pressed={mobileDocument === "passport"}
          onClick={() => {
            setMobileDocument("passport");
            onPaperSound();
          }}
        >
          Passport
        </button>
        <button
          aria-pressed={mobileDocument === "permit"}
          onClick={() => {
            setMobileDocument("permit");
            onDocumentSwitch?.();
            onPaperSound();
          }}
        >
          Entry permit
        </button>
      </div>
      <div
        className="desk-canvas"
        ref={bounds}
        data-active-document={mobileDocument}
      >
        <motion.article
          key={`passport-${layout}`}
          drag
          dragConstraints={bounds}
          dragMomentum={false}
          onPointerDown={() => {
            setFront("passport");
            onPaperSound();
          }}
          onDragStart={() =>
            debugLog("DESK", "Drag started", {
              entrantId: entrant.id,
              document: "passport",
            })
          }
          onDragEnd={(_, info) =>
            debugLog("DESK", "Drag finished", {
              entrantId: entrant.id,
              document: "passport",
              offset: info.offset,
            })
          }
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="document passport"
          style={{ zIndex: front === "passport" ? 3 : 2 }}
          aria-label="Passport"
        >
          <div className="passport-cover">
            <Shield size={20} strokeWidth={1.2} />
            <span>{entrant.passport.issuingNation.toUpperCase()}</span>
            <Grip size={13} />
          </div>
          <div className="passport-inner">
            <div className="passport-title">
              PASSPORT <span>ПАСПОРТ</span>
            </div>
            <div className="passport-identity">
              <Portrait index={entrant.portrait} className="passport-photo" />
              <div>
                <label>SURNAME / GIVEN NAMES</label>
                <strong>
                  {entrant.passport.fullName.split(" ").reverse().join(", ")}
                </strong>
                <label>NATIONALITY</label>
                <b>{entrant.passport.issuingNation}</b>
                <label>DATE OF BIRTH</label>
                <b>{entrant.passport.birthDate}</b>
              </div>
            </div>
            <div className="passport-fields">
              <div>
                <label>DOCUMENT NO.</label>
                <b>{entrant.passport.documentNumber}</b>
              </div>
              <div>
                <label>DATE OF EXPIRY</label>
                <b>{entrant.passport.expirationDate}</b>
              </div>
            </div>
            <div className="machine-code">
              P&lt;{entrant.bio.nation.slice(0, 3).toUpperCase()}
              {entrant.bio.fullName.toUpperCase().replace(" ", "<<")}
              <br />
              {entrant.passport.documentNumber.replaceAll("-", "")}
              &lt;&lt;042671&lt;&lt;&lt;&lt;&lt;&lt;
            </div>
          </div>
        </motion.article>
        <motion.article
          key={`permit-${layout}`}
          drag
          dragConstraints={bounds}
          dragMomentum={false}
          onPointerDown={() => {
            setFront("permit");
            onDocumentSwitch?.();
            onPaperSound();
          }}
          onDragStart={() =>
            debugLog("DESK", "Drag started", {
              entrantId: entrant.id,
              document: "permit",
            })
          }
          onDragEnd={(_, info) =>
            debugLog("DESK", "Drag finished", {
              entrantId: entrant.id,
              document: "permit",
              offset: info.offset,
            })
          }
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="document permit"
          style={{ zIndex: front === "permit" ? 3 : 2 }}
          aria-label="Entry permit"
        >
          <div className="permit-header">
            <Shield size={26} strokeWidth={1.3} />
            <div>
              ARSTOVIAN REPUBLIC<small>MINISTRY OF ADMISSION</small>
            </div>
            <Grip size={13} />
          </div>
          <h2>ENTRY PERMIT</h2>
          <div className="permit-number">FORM A–17 / SECTOR 04</div>
          <div className="permit-row">
            <label>ISSUED TO</label>
            <strong>{entrant.entryPermit.fullName}</strong>
          </div>
          <div className="permit-row">
            <label>PASSPORT NO.</label>
            <b>{entrant.entryPermit.passportRef}</b>
          </div>
          <div className="permit-columns">
            <div>
              <label>PURPOSE</label>
              <b>{entrant.entryPermit.purpose}</b>
            </div>
            <div>
              <label>DURATION</label>
              <b>{entrant.entryPermit.durationDays} DAYS</b>
            </div>
          </div>
          <div className="permit-seal">
            <p>
              Entry is subject to inspection.
              <br />
              Present with a valid passport.
              <br />
              <span>AUTHORIZED · M.O.A.</span>
            </p>
            <img
              src="/assets/ministry-seal.svg"
              alt="Official Arstovian ministry seal"
              width="66"
              height="66"
              draggable="false"
            />
          </div>
          {verdict && (
            <motion.div
              initial={{ scale: 1.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.85 }}
              className={`ink-stamp ${verdict.toLowerCase()}`}
            >
              {verdict === "ADMIT"
                ? "APPROVED"
                : verdict === "DENY"
                  ? "DENIED"
                  : "DETAINED"}
              <small>EAST GRESTIN · 22 SEP 2026</small>
            </motion.div>
          )}
        </motion.article>
      </div>
    </section>
  );
}
