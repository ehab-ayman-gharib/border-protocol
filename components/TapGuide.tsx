"use client";
import { useEffect, useState } from "react";
import { Hand } from "lucide-react";

export function TapGuide({
  step,
  luggagePanel,
  onSkip,
}: {
  step: "documents" | "luggage";
  luggagePanel: boolean;
  onSkip: () => void;
}) {
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    mobile: boolean;
  } | null>(null);
  useEffect(() => {
    const update = () => {
      const mobile = window.matchMedia("(max-width: 600px)").matches;
      const selector =
        step === "documents"
          ? mobile
            ? ".document-picker button:last-child"
            : ".desk-canvas .permit"
          : mobile
            ? ".scene-bag"
            : luggagePanel
              ? ".dossier-open-bag"
              : "#luggage-tab";
      const target = document.querySelector<HTMLElement>(selector);
      const rect = target?.getBoundingClientRect();
      if (
        !target?.getClientRects().length ||
        !rect ||
        rect.bottom < 0 ||
        rect.top > innerHeight
      ) {
        setPosition(null);
        return;
      }
      setPosition({
        mobile,
        left: Math.max(
          8,
          Math.min(innerWidth - 248, rect.left + rect.width / 2 - 120),
        ),
        top: Math.max(
          8,
          Math.min(
            innerHeight - 98,
            step === "luggage" && rect.top > 110
              ? rect.top - 110
              : rect.bottom + 8,
          ),
        ),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step, luggagePanel]);
  return (
    position && (
      <aside
        className="tap-guide"
        role="status"
        style={{ left: position.left, top: position.top }}
      >
        <Hand className="tap-hand" size={26} aria-hidden="true" />
        <div>
          <b>
            {step === "documents"
              ? "1 / 2 · Check both papers"
              : "2 / 2 · Search the bag"}
          </b>
          <p>
            {step === "documents"
              ? position.mobile
                ? "Tap Entry permit to switch documents."
                : "Tap the entry permit to bring it forward."
              : position.mobile
                ? "Tap the glowing bag beside the traveler."
                : luggagePanel
                  ? "Tap Open luggage to reveal the contents."
                  : "Select Luggage, then Open luggage."}
          </p>
          <button onClick={onSkip}>Skip tips</button>
        </div>
      </aside>
    )
  );
}
