import { debugLog } from "./debug";

export type SoundEffect =
  "paper" | "radio" | "approve" | "deny" | "detain" | "success" | "citation";

/** One audio context per game. Created/resumed only from a user gesture. */
export class GameAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private disposed = false;
  private generation = 0;
  private needsPrime = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.generation++;
    if (this.context && this.master)
      this.master.gain.setValueAtTime(
        enabled ? 0.55 : 0,
        this.context.currentTime,
      );
  }

  async unlock() {
    if (!this.enabled || this.disposed) return false;
    try {
      if (!this.context || this.context.state === "closed") {
        // Safari's playback session supports media output rather than the
        // default ambient route, which can follow the phone's silent switch.
        try {
          const session = (navigator as Navigator & {
            audioSession?: { type: string };
          }).audioSession;
          if (session) session.type = "playback";
        } catch { /* Optional API; Web Audio still works without it. */ }
        const Audio = window.AudioContext ?? (window as Window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;
        if (!Audio) return false;
        this.context = new Audio({ latencyHint: "interactive" });
        this.needsPrime = true;
        this.master = this.context.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(this.context.destination);
      }
      const context = this.context;
      // iOS can enter "interrupted" after a call, lock screen or tab switch.
      // Resume AND start a silent buffer synchronously inside the gesture,
      // before awaiting anything, to prime mobile audio output.
      if (this.needsPrime || context.state !== "running") {
        const resumed = context.state !== "running" ? context.resume() : Promise.resolve();
        const primer = context.createBufferSource();
        primer.buffer = context.createBuffer(1, 1, context.sampleRate);
        primer.connect(context.destination);
        primer.onended = () => primer.disconnect();
        primer.start(0);
        this.needsPrime = false;
        await resumed;
      }
      return this.context.state === "running" && this.enabled && !this.disposed;
    } catch {
      debugLog(
        "AUDIO",
        "Audio unavailable; gameplay continues silently",
        undefined,
        "warn",
      );
      return false;
    }
  }

  async play(effect: SoundEffect) {
    const generation = this.generation;
    if (
      !(await this.unlock()) ||
      generation !== this.generation ||
      !this.context ||
      !this.master
    )
      return;
    const context = this.context;
    const start = context.currentTime;
    const tone = (
      frequency: number,
      offset: number,
      duration: number,
      volume = 0.16,
      end = frequency,
    ) => {
      const source = context.createOscillator();
      const gain = context.createGain();
      source.type = "triangle";
      source.frequency.setValueAtTime(frequency, start + offset);
      source.frequency.exponentialRampToValueAtTime(
        end,
        start + offset + duration,
      );
      gain.gain.setValueAtTime(0, start + offset);
      gain.gain.linearRampToValueAtTime(volume, start + offset + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + offset + duration);
      source.connect(gain);
      gain.connect(this.master!);
      source.start(start + offset);
      source.stop(start + offset + duration);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
      };
    };
    const noise = (duration: number, cutoff: number, volume: number) => {
      const buffer = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * duration),
        context.sampleRate,
      );
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++)
        samples[i] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      source.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = cutoff;
      const gain = context.createGain();
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master!);
      source.start(start);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    };
    switch (effect) {
      case "paper":
        noise(0.22, 2200, 0.3);
        break;
      case "radio":
        noise(0.15, 1300, 0.18);
        tone(620, 0.08, 0.12);
        tone(880, 0.23, 0.2);
        break;
      case "approve":
        noise(0.09, 900, 0.5);
        tone(160, 0, 0.18, 0.65, 55);
        tone(660, 0.15, 0.18);
        break;
      case "deny":
        noise(0.09, 700, 0.5);
        tone(140, 0, 0.2, 0.65, 45);
        tone(240, 0.17, 0.25, 0.25, 120);
        break;
      case "detain":
        noise(0.09, 900, 0.5);
        tone(150, 0, 0.18, 0.65, 50);
        tone(740, 0.2, 0.15);
        tone(520, 0.38, 0.24);
        break;
      case "success":
        tone(440, 0, 0.18);
        tone(660, 0.14, 0.18);
        tone(880, 0.28, 0.3);
        break;
      case "citation":
        tone(310, 0, 0.2, 0.25);
        tone(185, 0.2, 0.35, 0.25);
        break;
    }
    debugLog("AUDIO", "Sound effect scheduled", {
      effect,
      contextState: context.state,
    });
  }

  dispose() {
    this.disposed = true;
    this.generation++;
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
    this.master = null;
  }
}
