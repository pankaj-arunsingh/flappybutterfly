import { ensureCtx } from './audio';
import { MUSIC_DEFAULT_MUTED, MUSIC_KEY, setMutedState, getMutedState } from './config';
import { Weather } from './types';

export interface MusicTrack {
  id: string;
  weather: Weather;
  notes: number[];
  tempo: number;
  wave: OscillatorType;
}

// We need a way to update the shared state in config.ts. 
// Since we can't assign to a constant import, we'll use a setter or just the local 'muted' variable
// and let the audio.ts use the local state via a function.

// Short, repeating phrases keep the music light and let the synth feel like a
// little soundscape rather than a melody that competes with the game.
export const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'sunny-meadow', weather: 'sunny', notes: [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 329.63], tempo: 92, wave: 'sine' },
  { id: 'ocean-breeze', weather: 'sunny', notes: [220, 277.18, 329.63, 440, 329.63, 277.18, 246.94, 277.18], tempo: 74, wave: 'sine' },
  { id: 'jungle-birds', weather: 'sunny', notes: [392, 440, 523.25, 659.25, 523.25, 440, 392, 329.63], tempo: 104, wave: 'triangle' },
  { id: 'moon-lullaby', weather: 'night', notes: [261.63, 329.63, 392, 329.63, 293.66, 261.63, 220, 261.63], tempo: 58, wave: 'sine' },
  { id: 'night-ocean', weather: 'night', notes: [196, 246.94, 293.66, 392, 293.66, 246.94, 220, 196], tempo: 52, wave: 'sine' },
  { id: 'quiet-canopy', weather: 'night', notes: [174.61, 220, 261.63, 329.63, 261.63, 220, 196, 220], tempo: 64, wave: 'triangle' },
  { id: 'rain-garden', weather: 'storm', notes: [174.61, 220, 261.63, 293.66, 261.63, 220, 196, 220], tempo: 62, wave: 'sine' },
  { id: 'soft-thunder', weather: 'storm', notes: [146.83, 174.61, 220, 261.63, 220, 174.61, 164.81, 174.61], tempo: 48, wave: 'triangle' },
  { id: 'jungle-rain', weather: 'storm', notes: [196, 246.94, 293.66, 349.23, 293.66, 246.94, 220, 246.94], tempo: 70, wave: 'sine' },
];

export function pickTrack(weather: Weather): MusicTrack {
  const choices = MUSIC_TRACKS.filter((track) => track.weather === weather);
  return choices[Math.floor(Math.random() * choices.length)];
}

let activeTrack: MusicTrack | null = null;
let masterGain: GainNode | null = null;
let loopTimer: number | null = null;
let muted = MUSIC_DEFAULT_MUTED;
let gameOver = false;

function schedulePhrase(ctx: AudioContext, track: MusicTrack, gain: GainNode): void {
  const noteLength = 60 / track.tempo;
  const start = ctx.currentTime + 0.05;
  track.notes.forEach((frequency, index) => {
    const when = start + index * noteLength;
    const oscillator = ctx.createOscillator();
    const noteGain = ctx.createGain();
    oscillator.type = track.wave;
    oscillator.frequency.setValueAtTime(frequency, when);
    noteGain.gain.setValueAtTime(0.0001, when);
    noteGain.gain.linearRampToValueAtTime(0.032, when + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, when + noteLength * 0.9);
    oscillator.connect(noteGain);
    noteGain.connect(gain);
    oscillator.start(when);
    oscillator.stop(when + noteLength);
  });
  loopTimer = window.setTimeout(() => {
    if (activeTrack === track && masterGain) schedulePhrase(ctx, track, masterGain);
  }, track.notes.length * noteLength * 1000 - 80);
}

function fadeGain(gain: GainNode, value: number, duration: number): void {
  const ctx = gain.context;
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(value, ctx.currentTime + duration);
}

export function isMusicMuted(): boolean {
  try {
    return window.localStorage.getItem(MUSIC_KEY) === 'true';
  } catch (err) {
    return getMutedState();
  }
}

export function setMusicMuted(value: boolean): void {
  muted = value;
  setMutedState(value);
  if (masterGain) {
    if (value) {
      stopMusic(0.25);
    } else {
      fadeGain(masterGain, gameOver ? 0.05 : 0.12, 0.25);
    }
  }
  try {
    window.localStorage.setItem(MUSIC_KEY, String(value));
  } catch (err) {
    // Ignore private-mode storage failures.
  }
}

export function startMusic(weather: Weather): void {
  const ctx = ensureCtx();
  if (!ctx) return;
  ctx.resume();
  stopMusic(0.3);
  gameOver = false;
  activeTrack = pickTrack(weather);
  if (masterGain) {
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterGain.connect(ctx.destination);
    fadeGain(masterGain, isMusicMuted() ? 0 : 0.12, 0.8);
    schedulePhrase(ctx, activeTrack, masterGain);
  }
}

export function setMusicGameOver(): void {
  gameOver = true;
  if (masterGain) fadeGain(masterGain, muted || isMusicMuted() ? 0 : 0.05, 0.8);
}

export function stopMusic(duration: number = 0.5): void {
  if (loopTimer !== null) window.clearTimeout(loopTimer);
  loopTimer = null;
  if (masterGain) {
    fadeGain(masterGain, 0, duration);
    const oldGain = masterGain;
    window.setTimeout(() => oldGain.disconnect(), duration * 1000 + 50);
  }
  masterGain = null;
  activeTrack = null;
}
