export type Phase = 'ready' | 'playing' | 'dead';

export type Weather = 'sunny' | 'night' | 'storm';

export type Medal = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Butterfly {
  x: number;
  y: number;
  vy: number;
  wing: number;
}

export interface Pipe {
  x: number;
  gapY: number;
  gap: number;
  speed: number;
  scored: boolean;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
}

export interface Raindrop {
  x: number;
  y: number;
  speed: number;
}

export interface GameState {
  phase: Phase;
  butterfly: Butterfly;
  pipes: Pipe[];
  clouds: Cloud[];
  groundOffset: number;
  score: number;
  highScore: number;
  tick: number;
  particles: Particle[];
  combo: number;
  flappedThroughGap: boolean;
  nearMisses: number;
  nearMissFlash: number;
  shake: number;
  pipesScored: number;
  weather: Weather;
  stars: Star[];
  raindrops: Raindrop[];
  lightningTimer: number;
  lightningFlash: number;
}

export type ParticleKind = 'spark' | 'trail' | 'popup';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  kind: ParticleKind;
  text?: string;
}
