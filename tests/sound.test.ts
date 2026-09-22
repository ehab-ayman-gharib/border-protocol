/**
 * @file Audio-engine regression test using a controlled fake browser audio context.
 * Verifies synchronous mobile priming, interrupted-state recovery and mute guards.
 * Does not test audible output on physical speakers.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { GameAudio } from "../lib/sound";

test("mobile unlock primes output within the gesture and resumes interrupted contexts", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  const calls: string[] = [];
  let state = "interrupted";
  let release = () => {};
  const context = {
    get state() { return state; }, sampleRate: 44100, currentTime: 0, destination: {},
    createGain: () => ({ gain: { value: 0, setValueAtTime() {} }, connect() {} }),
    createBuffer: () => ({}),
    createBufferSource: () => ({ buffer: null, connect() {}, disconnect() {}, start() { calls.push("prime"); } }),
    resume: () => { calls.push("resume"); return new Promise<void>(resolve => { release = () => { state = "running"; resolve(); }; }); },
    close: async () => { state = "closed"; },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { webkitAudioContext: class { constructor() { return context; } } } });
  const audio = new GameAudio();
  try {
    const pending = audio.unlock();
    assert.deepEqual(calls, ["resume", "prime"]);
    release();
    assert.equal(await pending, true);
    audio.setEnabled(false);
    state = "interrupted";
    assert.equal(await audio.unlock(), false);
    assert.equal(calls.length, 2);
    audio.setEnabled(true);
    const recovery = audio.unlock();
    assert.deepEqual(calls, ["resume", "prime", "resume", "prime"]);
    release();
    assert.equal(await recovery, true);
  } finally {
    audio.dispose();
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
