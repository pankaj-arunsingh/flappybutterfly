import {
  BUTTERFLY_HEIGHT,
  BUTTERFLY_WIDTH,
  BUTTERFLY_X,
  FIRST_PIPE_X,
  FLAP_VELOCITY,
  GAME_HEIGHT,
  GAME_WIDTH,
  GAP_MARGIN,
  GRAVITY,
  GROUND_HEIGHT,
  HIGH_SCORE_KEY,
  HITBOX_INSET,
  MAX_FALL_SPEED,
  PIPE_GAP,
  PIPE_SPACING,
  PIPE_SPEED,
  PIPE_WIDTH,
  READY_BOB_AMPLITUDE,
  READY_BOB_SPEED,
} from './config';
import { Butterfly, Medal, Pipe } from './types';

export function medalForScore(score: number): Medal {
  if (score >= 40) {
    return 'platinum';
  }
  if (score >= 30) {
    return 'gold';
  }
  if (score >= 20) {
    return 'silver';
  }
  if (score >= 10) {
    return 'bronze';
  }
  return 'none';
}

export function createButterfly(y: number): Butterfly {
  return {
    x: BUTTERFLY_X,
    y: y,
    vy: 0,
    wing: 0,
  };
}

export function randomGapY(): number {
  const min = GAP_MARGIN + PIPE_GAP / 2;
  const max = GAME_HEIGHT - GROUND_HEIGHT - GAP_MARGIN - PIPE_GAP / 2;
  return min + Math.random() * (max - min);
}

export function createInitialPipes(): Pipe[] {
  const pipes: Pipe[] = [];
  for (let i = 0; i < 4; i += 1) {
    pipes.push({
      x: FIRST_PIPE_X + i * PIPE_SPACING,
      gapY: randomGapY(),
      scored: false,
    });
  }
  return pipes;
}

export function flap(butterfly: Butterfly): Butterfly {
  return Object.assign({}, butterfly, { vy: FLAP_VELOCITY });
}

export function stepButterfly(butterfly: Butterfly, playing: boolean): Butterfly {
  const wing = butterfly.wing + (playing ? 0.45 : 0.18);
  if (!playing) {
    return Object.assign({}, butterfly, {
      wing: wing,
      vy: 0,
      y:
        GAME_HEIGHT / 2 -
        40 +
        Math.sin(wing * READY_BOB_SPEED * 12) * READY_BOB_AMPLITUDE,
    });
  }

  const vy = Math.min(MAX_FALL_SPEED, butterfly.vy + GRAVITY);
  const y = Math.max(0, butterfly.y + vy);
  return Object.assign({}, butterfly, {
    wing: wing,
    vy: y === 0 ? Math.max(vy, 0) : vy,
    y: y,
  });
}

export function hitbox(butterfly: Butterfly) {
  return {
    left: butterfly.x + HITBOX_INSET,
    right: butterfly.x + BUTTERFLY_WIDTH - HITBOX_INSET,
    top: butterfly.y + HITBOX_INSET,
    bottom: butterfly.y + BUTTERFLY_HEIGHT - HITBOX_INSET,
  };
}

export function collidesWithWorld(butterfly: Butterfly, pipes: Pipe[]): boolean {
  const box = hitbox(butterfly);
  const groundY = GAME_HEIGHT - GROUND_HEIGHT;

  if (box.bottom >= groundY) {
    return true;
  }

  for (let i = 0; i < pipes.length; i += 1) {
    const pipe = pipes[i];
    const pipeRight = pipe.x + PIPE_WIDTH;
    if (box.right < pipe.x || box.left > pipeRight) {
      continue;
    }

    const gapTop = pipe.gapY - PIPE_GAP / 2;
    const gapBottom = pipe.gapY + PIPE_GAP / 2;
    if (box.top < gapTop || box.bottom > gapBottom) {
      return true;
    }
  }

  return false;
}

export function stepPipes(pipes: Pipe[], butterfly: Butterfly): { pipes: Pipe[]; scored: number } {
  let scored = 0;
  const next: Pipe[] = [];

  for (let i = 0; i < pipes.length; i += 1) {
    const pipe = pipes[i];
    const x = pipe.x - PIPE_SPEED;
    let marked = pipe.scored;
    if (!marked && butterfly.x > x + PIPE_WIDTH) {
      marked = true;
      scored += 1;
    }
    if (x + PIPE_WIDTH > -20) {
      next.push({ x: x, gapY: pipe.gapY, scored: marked });
    }
  }

  let farthest = 0;
  for (let i = 0; i < next.length; i += 1) {
    if (next[i].x > farthest) {
      farthest = next[i].x;
    }
  }
  while (next.length < 4) {
    farthest += PIPE_SPACING;
    next.push({
      x: Math.max(farthest, GAME_WIDTH + PIPE_WIDTH),
      gapY: randomGapY(),
      scored: false,
    });
  }

  return { pipes: next, scored: scored };
}

export function readHighScore(): number {
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
    if (!raw) {
      return 0;
    }
    const value = parseInt(raw, 10);
    return isNaN(value) ? 0 : value;
  } catch (err) {
    return 0;
  }
}

export function writeHighScore(score: number): void {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch (err) {
    // Ignore private-mode storage failures.
  }
}
