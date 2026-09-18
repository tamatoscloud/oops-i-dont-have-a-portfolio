let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export async function unlockAudio(): Promise<void> {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") {
    await audio.resume();
  }
  unlocked = true;
}

function tone(audio: AudioContext, now: number, freq: number, duration: number, gainValue: number, type: OscillatorType = "sine") {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0008, gainValue), now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function noiseBurst(audio: AudioContext, now: number, duration: number, gainValue: number, highpass: number) {
  const noise = audio.createBuffer(1, Math.max(1, Math.floor(audio.sampleRate * duration)), audio.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = audio.createBufferSource();
  src.buffer = noise;
  const filter = audio.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = highpass;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0008, gainValue), now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  src.start(now);
}

export type CameraCue = "push" | "snap" | "pull" | "page" | "chapter" | "quote" | "shutter";

export function playCameraCue(kind: CameraCue, enabled: boolean, intensity = 1): void {
  if (!enabled || !unlocked) return;
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  const amp = Math.min(1.4, Math.max(0.35, intensity));

  if (kind === "snap" || kind === "shutter") {
    noiseBurst(audio, now, 0.055, 0.16 * amp, 1900);
    return;
  }
  if (kind === "push") {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.exponentialRampToValueAtTime(148, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03 * amp, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.22);
    return;
  }
  if (kind === "pull") {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.028 * amp, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.24);
    return;
  }
  if (kind === "page") {
    noiseBurst(audio, now, 0.12, 0.09 * amp, 900);
    return;
  }
  if (kind === "chapter") {
    tone(audio, now, 196, 0.16, 0.025 * amp, "sine");
    tone(audio, now + 0.08, 247, 0.18, 0.02 * amp, "sine");
    return;
  }
  if (kind === "quote") {
    tone(audio, now, 110, 0.12, 0.012 * amp, "sine");
  }
}

export function playShutter(enabled: boolean): void {
  playCameraCue("shutter", enabled);
}

export function playWhoosh(enabled: boolean): void {
  playCameraCue("pull", enabled, 0.85);
}
