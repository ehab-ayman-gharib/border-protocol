"use client";
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
    window.addEventListener("pointerdown", unlock, { capture: true });
    window.addEventListener("keydown", unlock, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
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
