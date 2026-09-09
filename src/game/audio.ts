let audioCtx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
    return null;
  }
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue: number = 0.15,
  endFreq?: number
) {
  const ctx = ensureCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (endFreq !== undefined) {
    osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
  }
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playFlap() {
  playTone(440, 0.08, 'sine', 0.1, 280);
}

export function playScore() {
  const ctx = ensureCtx();
  if (!ctx) return;
  playTone(523, 0.12, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 100);
}

export function playDeath() {
  playTone(300, 0.25, 'triangle', 0.18, 100);
}

export function playNearMiss() {
  playTone(880, 0.07, 'square', 0.07);
  setTimeout(() => playTone(1318, 0.1, 'square', 0.07), 70);
}

export function playThunder() {
  const ctx = ensureCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(55, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.6);
  gain.gain.setValueAtTime(0.14, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
}
