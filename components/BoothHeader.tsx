/**
 * @file Renders the checkpoint scene, animated traveler and greeting.
 * Exposes the mobile suitcase interaction through parent callbacks; it does not
 * own inspection state or request assessments.
 */
import { Radio, MapPin, Clock3 } from "lucide-react";
import type { EntrantApplicant } from "@/types/border";
import { Portrait } from "./Portrait";
export function BoothHeader({
  entrant,
  index,
  inspected,
  bagReady,
  onBag,
}: {
  entrant: EntrantApplicant;
  index: number;
  inspected: boolean;
  bagReady: boolean;
  onBag: () => void;
}) {
  return (
    <section className="booth" aria-label="Checkpoint window">
      <div className="booth-location">
        <MapPin size={13} />
        <span>EAST GRESTIN · SECTOR 04</span>
        <span className="live-dot" /> BORDER OPEN
      </div>
      <div className="scene-caption">
        <span className="eyebrow">THE ARSTOVIAN REPUBLIC</span>
        <p>Vigilance is our duty.</p>
      </div>
      <div className="window-portrait">
        <Portrait key={entrant.id} index={entrant.portrait} animated />
        <div className="window-name">
          <span>APPLICANT 0{index + 1}</span>
          <strong>{entrant.bio.fullName}</strong>
        </div>
      </div>
      <div className="window-speech">
        <span>
          <Radio size={13} /> {entrant.bio.fullName}
        </span>
        <p>“Here are my papers.”</p>
        <small>Documents received. Begin inspection.</small>
      </div>
      <div className="booth-time">
        <Clock3 size={13} /> 08:{String(index * 12).padStart(2, "0")}{" "}
        <span>12°C / OVERCAST</span>
      </div>
      <button
        className={`scene-bag ${inspected ? "is-open" : "is-sealed"}`}
        aria-label={inspected ? "View luggage findings" : "Open luggage"}
        disabled={!bagReady && !inspected}
        onClick={onBag}
      >
        <span className="bag-art" aria-hidden="true">
          <span className="bag-handle" />
          <span className="bag-lid" />
          <span className="bag-lock" />
        </span>
        <strong>{inspected ? "Bag searched" : "Open luggage"}</strong>
        <small>
          {inspected
            ? "View findings"
            : bagReady
              ? "Tap to inspect"
              : "Receiving declaration…"}
        </small>
      </button>
    </section>
  );
}
