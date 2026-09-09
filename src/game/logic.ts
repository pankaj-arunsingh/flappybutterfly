import {
  BUTTERFLY_HEIGHT,
  BUTTERFLY_WIDTH,
  BUTTERFLY_X,
  EASY_PIPE_GAP,
  EASY_PIPE_SPACING,
  EASY_PIPE_SPEED,
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
  MAX_PARTICLES,
  NEAR_MISS_THRESHOLD,
  PIPE_GAP,
  PIPE_SPACING,
  PIPE_SPEED,
  PIPE_WIDTH,
  RAMP_PIPES,
  READY_BOB_AMPLITUDE,
  READY_BOB_SPEED,
} from './config';
import { Butterfly, Medal, Particle, Pipe } from './types';

export function medalForScore(score: number): Medal {
  if (score >= 35) {
    return 'platinum';
  }
  if (score >= 20) {
    return 'gold';
  }
  if (score >= 10) {
    return 'silver';
  }
  if (score >= 5) {
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

export function randomGapY(gap: number = PIPE_GAP): number {
  const min = GAP_MARGIN + gap / 2;
  const max = GAME_HEIGHT - GROUND_HEIGHT - GAP_MARGIN - gap / 2;
  return min + Math.random() * (max - min);
}

export function difficultyAt(pipesScored: number): number {
  return Math.min(1, pipesScored / RAMP_PIPES);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function pipeSpeedAt(pipesScored: number): number {
  return lerp(EASY_PIPE_SPEED, PIPE_SPEED, difficultyAt(pipesScored));
}

export function createInitialPipes(): Pipe[] {
  const pipes: Pipe[] = [];
  for (let i = 0; i < 4; i += 1) {
    pipes.push({
      x: FIRST_PIPE_X + i * EASY_PIPE_SPACING,
      gapY: randomGapY(EASY_PIPE_GAP),
      gap: EASY_PIPE_GAP,
      speed: EASY_PIPE_SPEED,
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

    const gapTop = pipe.gapY - pipe.gap / 2;
    const gapBottom = pipe.gapY + pipe.gap / 2;
    if (box.top < gapTop || box.bottom > gapBottom) {
      return true;
    }
  }

  return false;
}

export function stepPipes(pipes: Pipe[], butterfly: Butterfly, pipesScored: number): { pipes: Pipe[]; scored: number; nearMiss: boolean } {
  let scored = 0;
  let nearMiss = false;
  const next: Pipe[] = [];
  const currentGap = lerp(EASY_PIPE_GAP, PIPE_GAP, difficultyAt(pipesScored));
  const currentSpeed = pipeSpeedAt(pipesScored);
  const currentSpacing = lerp(EASY_PIPE_SPACING, PIPE_SPACING, difficultyAt(pipesScored));

  for (let i = 0; i < pipes.length; i += 1) {
    const pipe = pipes[i];
    const x = pipe.x - pipe.speed;
    let marked = pipe.scored;
    if (!marked && butterfly.x > x + PIPE_WIDTH) {
      marked = true;
      scored += 1;
      if (isNearMiss(butterfly, pipe)) {
        nearMiss = true;
      }
    }
    if (x + PIPE_WIDTH > -20) {
      next.push({ x: x, gapY: pipe.gapY, gap: pipe.gap, speed: pipe.speed, scored: marked });
    }
  }

  let farthest = 0;
  for (let i = 0; i < next.length; i += 1) {
    if (next[i].x > farthest) {
      farthest = next[i].x;
    }
  }
  while (next.length < 4) {
    farthest += currentSpacing;
    next.push({
      x: Math.max(farthest, GAME_WIDTH + PIPE_WIDTH),
      gapY: randomGapY(currentGap),
      gap: currentGap,
      speed: currentSpeed,
      scored: false,
    });
  }

  return { pipes: next, scored: scored, nearMiss: nearMiss };
}

export function isNearMiss(butterfly: Butterfly, pipe: Pipe): boolean {
  const box = hitbox(butterfly);
  const gapTop = pipe.gapY - pipe.gap / 2;
  const gapBottom = pipe.gapY + pipe.gap / 2;
  const distFromEdge = Math.min(box.top - gapTop, gapBottom - box.bottom);
  return distFromEdge < NEAR_MISS_THRESHOLD;
}

export function scoreCombo(combo: number, flappedThroughGap: boolean): { combo: number; bonus: number } {
  if (flappedThroughGap) {
    return { combo: 0, bonus: 0 };
  }
  const next = combo + 1;
  return { combo: next, bonus: next };
}

export function butterflyOverlapsPipe(butterfly: Butterfly, pipe: Pipe): boolean {
  const box = hitbox(butterfly);
  return box.right > pipe.x && box.left < pipe.x + PIPE_WIDTH;
}

function capParticles(particles: Particle[]): Particle[] {
  if (particles.length <= MAX_PARTICLES) {
    return particles;
  }
  return particles.slice(particles.length - MAX_PARTICLES);
}

export function spawnScoreBurst(particles: Particle[], x: number, y: number): Particle[] {
  const burst: Particle[] = [];
  const colors = ['#ffd700', '#fff3b0', '#ff9f1c', '#ffffff'];
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 1 + Math.random() * 2;
    burst.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 30,
      maxLife: 30,
      color: colors[i % colors.length],
      size: 2 + Math.random() * 3,
      kind: 'spark',
    });
  }
  return capParticles(particles.concat(burst));
}

export function spawnScorePopup(particles: Particle[], x: number, y: number, points: number): Particle[] {
  return capParticles(
    particles.concat([
      {
        x: x,
        y: y,
        vx: 0,
        vy: -1.6,
        life: 40,
        maxLife: 40,
        color: '#ffd700',
        size: 22,
        kind: 'popup',
        text: '+' + points,
      },
    ])
  );
}

export function spawnTrail(particles: Particle[], butterfly: Butterfly): Particle[] {
  const trail: Particle[] = [];
  for (let i = 0; i < 3; i += 1) {
    trail.push({
      x: butterfly.x + 6 + Math.random() * 8,
      y: butterfly.y + BUTTERFLY_HEIGHT / 2 + (Math.random() - 0.5) * 12,
      vx: -1 - Math.random(),
      vy: 0.4 + Math.random() * 0.6,
      life: 18,
      maxLife: 18,
      color: i % 2 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,209,102,0.9)',
      size: 2 + Math.random() * 2.5,
      kind: 'trail',
    });
  }
  return capParticles(particles.concat(trail));
}

export function updateParticles(particles: Particle[]): Particle[] {
  const next: Particle[] = [];
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    const life = p.life - 1;
    if (life <= 0) {
      continue;
    }
    next.push(
      Object.assign({}, p, {
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.kind === 'spark' ? p.vy + 0.08 : p.vy,
        life: life,
      })
    );
  }
  return next;
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
