"use client";
/**
 * @file React lifecycle and controls for the shared GameAudio engine.
 * Starts enabled, binds gesture-based unlocking, exposes playback/mute actions,
 * and removes listeners and disposes audio resources when unmounted.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { GameAudio, type SoundEffect } from "@/lib/sound";

export function useGameAudio() {
  const engine = useRef<GameAudio | null>(null);
  const [sound, setSound] = useState(true);
  useEffect(() => {
    const audio = new GameAudio();
    engine.current = audio;
    audio.setEnabled(true);
    setSound(true);
    const unlock = () => {
      void audio.unlock();
    };
    // Touch activation occurs at release, not at pointerdown on mobile.
    const gestures = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
    for (const event of gestures)
      window.addEventListener(event, unlock, { capture: true, passive: true });
    return () => {
      for (const event of gestures)
        window.removeEventListener(event, unlock, { capture: true });
      audio.dispose();
      engine.current = null;
    };
  }, []);
  const playSound = useCallback((effect: SoundEffect) => {
    void engine.current?.play(effect);
  }, []);
  const toggleSound = () => {
    const enabled = !sound;
    engine.current?.setEnabled(enabled);
    setSound(enabled);
    if (enabled) playSound("radio");
  };
  return { sound, toggleSound, playSound };
}
