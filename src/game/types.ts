export type Phase = 'ready' | 'playing' | 'dead';

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
  scored: boolean;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
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
}
