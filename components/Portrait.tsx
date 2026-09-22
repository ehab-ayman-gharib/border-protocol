"use client";
/**
 * @file Traveler portrait renderer shared by the checkpoint and passport documents.
 * Loads the idle sprite atlas only when animation is requested and retains the
 * original portrait while loading or on failure. Frame timing lives in scene.css.
 */
import { useEffect, useState } from "react";

export function Portrait({
  index,
  className = "",
  animated = false,
}: {
  index: number;
  className?: string;
  animated?: boolean;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!animated) return;
    const atlas = new Image();
    atlas.onload = () => setReady(true);
    atlas.src = "/assets/travelers-idle-cutout.png";
    return () => { atlas.onload = null; };
  }, [animated]);
  const playing = animated && ready;
  return (
    <div
      role="img"
      aria-label={
        [
          "Portrait of Jorji Costava",
          "Portrait of Boris Vance",
          "Portrait of Elysia Ward",
        ][index]
      }
      className={`portrait ${playing ? "portrait-idle" : ""} ${className}`}
      style={playing ? {
        backgroundPositionY: `${index * 50}%`,
        animationDuration: `${5.2 + index * 0.7}s`,
      } : { backgroundPosition: `${index * 50}% top` }}
    />
  );
}
