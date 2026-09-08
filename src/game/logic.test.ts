import { injectable, runWithDi } from 'react-magnetic-di';
import { medalForScore, collidesWithWorld, createButterfly, createInitialPipes, hitbox, randomGapY, difficultyAt, lerp, pipeSpeedAt, stepPipes, isNearMiss, scoreCombo, butterflyOverlapsPipe, spawnScoreBurst, spawnScorePopup, spawnTrail, updateParticles } from './logic';
import { EASY_PIPE_GAP, EASY_PIPE_SPEED, GAME_HEIGHT, GROUND_HEIGHT, MAX_PARTICLES, PIPE_GAP, PIPE_SPEED, PIPE_WIDTH, RAMP_PIPES } from './config';
import { Particle, Pipe } from './types';

describe('medalForScore', () => {
  it('awards medals at achievable thresholds', () => {
    expect(medalForScore(0)).toBe('none');
    expect(medalForScore(4)).toBe('none');
    expect(medalForScore(5)).toBe('bronze');
    expect(medalForScore(9)).toBe('bronze');
    expect(medalForScore(10)).toBe('silver');
    expect(medalForScore(19)).toBe('silver');
    expect(medalForScore(20)).toBe('gold');
    expect(medalForScore(34)).toBe('gold');
    expect(medalForScore(35)).toBe('platinum');
  });
});

describe('collidesWithWorld', () => {
  const butterfly = createButterfly(200);

  it('detects ground collision', () => {
    const fallen = Object.assign({}, butterfly, { y: GAME_HEIGHT - GROUND_HEIGHT - 8 });
    expect(collidesWithWorld(fallen, [])).toBe(true);
  });

  it('does not end the flight on the ceiling', () => {
    const high = Object.assign({}, butterfly, { y: 0 });
    expect(collidesWithWorld(high, [])).toBe(false);
  });

  it('allows flight through a pipe gap', () => {
    const pipes: Pipe[] = [{ x: butterfly.x, gapY: 200 + 15, gap: PIPE_GAP, speed: PIPE_SPEED, scored: false }];
    const centered = Object.assign({}, butterfly, { y: pipes[0].gapY - 15 });
    const box = hitbox(centered);
    expect(box.top).toBeGreaterThan(pipes[0].gapY - pipes[0].gap / 2);
    expect(box.bottom).toBeLessThan(pipes[0].gapY + pipes[0].gap / 2);
    expect(collidesWithWorld(centered, pipes)).toBe(false);
  });

  it('detects a hit on the top vine', () => {
    const pipes: Pipe[] = [{ x: butterfly.x, gapY: 320, gap: PIPE_GAP, speed: PIPE_SPEED, scored: false }];
    const tooHigh = Object.assign({}, butterfly, { y: 40 });
    expect(collidesWithWorld(tooHigh, pipes)).toBe(true);
  });
});

describe('magnetic-di mocking (runWithDi)', () => {
  it('mocks randomGapY when creating pipes', async () => {
    const randomGapYMock = jest.fn(() => 250);
    const randomGapYDi = injectable(randomGapY, randomGapYMock);
    const pipes = await runWithDi(() => createInitialPipes(), [randomGapYDi]);
    expect(pipes).toHaveLength(4);
    pipes.forEach((p) => expect(p.gapY).toBe(250));
    expect(randomGapYMock).toHaveBeenCalled();
  });

  it('mocks hitbox inside collidesWithWorld for forced game over', async () => {
    // collidesWithWorld (src) calls hitbox (src) internally,
    // so mocking hitbox affects it via DI.
    const hitboxMock = jest.fn(() => ({ left: 0, right: 10, top: 0, bottom: 10000 }));
    const hitboxDi = injectable(hitbox, hitboxMock);
    const butterfly = createButterfly(200);
    const result = await runWithDi(() => collidesWithWorld(butterfly, []), [hitboxDi]);
    expect(result).toBe(true);
    expect(hitboxMock).toHaveBeenCalled();
  });
});

describe('difficulty curve', () => {
  it('difficultyAt returns 0 at score 0', () => {
    expect(difficultyAt(0)).toBe(0);
  });

  it('difficultyAt returns 1 at score >= RAMP_PIPES', () => {
    expect(difficultyAt(RAMP_PIPES)).toBe(1);
    expect(difficultyAt(RAMP_PIPES + 5)).toBe(1);
  });

  it('difficultyAt interpolates linearly during ramp', () => {
    const mid = difficultyAt(Math.floor(RAMP_PIPES / 2));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it('lerp interpolates between two values', () => {
    expect(lerp(0, 100, 0)).toBe(0);
    expect(lerp(0, 100, 1)).toBe(100);
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it('createInitialPipes uses easy-mode gap and speed', () => {
    const pipes = createInitialPipes();
    expect(pipes).toHaveLength(4);
    pipes.forEach((p) => {
      expect(p.gap).toBe(EASY_PIPE_GAP);
      expect(p.speed).toBe(EASY_PIPE_SPEED);
    });
  });

  it('easy-mode gap is wider than full-difficulty gap', () => {
    expect(EASY_PIPE_GAP).toBeGreaterThan(PIPE_GAP);
  });

  it('easy-mode speed is slower than full-difficulty speed', () => {
    expect(EASY_PIPE_SPEED).toBeLessThan(PIPE_SPEED);
  });

  it('pipeSpeedAt starts at easy speed and reaches full speed after the ramp', () => {
    expect(pipeSpeedAt(0)).toBe(EASY_PIPE_SPEED);
    expect(pipeSpeedAt(RAMP_PIPES)).toBe(PIPE_SPEED);
    const mid = pipeSpeedAt(Math.floor(RAMP_PIPES / 2));
    expect(mid).toBeGreaterThan(EASY_PIPE_SPEED);
    expect(mid).toBeLessThan(PIPE_SPEED);
  });
});

describe('near-miss detection', () => {
  const butterfly = createButterfly(200);

  function scoringPipe(gapY: number): Pipe[] {
    // Pipe right edge already behind the butterfly so it scores this step.
    return [{ x: butterfly.x - PIPE_WIDTH - 1, gapY: gapY, gap: PIPE_GAP, speed: PIPE_SPEED, scored: false }];
  }

  it('flags a near-miss when threading close to the gap edge', () => {
    // Hitbox top 5px below the gap top: a whisker from the vine.
    const near = Object.assign({}, butterfly, { y: 300 - PIPE_GAP / 2 + 5 - 10 });
    const result = stepPipes(scoringPipe(300), near, 99);
    expect(result.scored).toBe(1);
    expect(result.nearMiss).toBe(true);
  });

  it('does not flag a near-miss through the middle of the gap', () => {
    const centered = Object.assign({}, butterfly, { y: 300 - 15 });
    const result = stepPipes(scoringPipe(300), centered, 99);
    expect(result.scored).toBe(1);
    expect(result.nearMiss).toBe(false);
  });

  it('isNearMiss checks both gap edges', () => {
    const pipe: Pipe = { x: 0, gapY: 300, gap: PIPE_GAP, speed: PIPE_SPEED, scored: false };
    const nearBottom = Object.assign({}, butterfly, { y: 300 + PIPE_GAP / 2 - 20 - 5 });
    expect(isNearMiss(nearBottom, pipe)).toBe(true);
    const centered = Object.assign({}, butterfly, { y: 300 - 15 });
    expect(isNearMiss(centered, pipe)).toBe(false);
  });
});

describe('combo scoring', () => {
  it('awards growing bonus points for consecutive glides', () => {
    const first = scoreCombo(0, false);
    expect(first).toEqual({ combo: 1, bonus: 1 });
    const second = scoreCombo(first.combo, false);
    expect(second).toEqual({ combo: 2, bonus: 2 });
  });

  it('resets the combo when flapping through the gap', () => {
    expect(scoreCombo(2, true)).toEqual({ combo: 0, bonus: 0 });
  });

  it('detects horizontal overlap with a pipe', () => {
    const butterfly = createButterfly(200);
    const overlapping: Pipe = { x: butterfly.x, gapY: 300, gap: PIPE_GAP, speed: PIPE_SPEED, scored: false };
    expect(butterflyOverlapsPipe(butterfly, overlapping)).toBe(true);
    const far: Pipe = { x: butterfly.x + 500, gapY: 300, gap: PIPE_GAP, speed: PIPE_SPEED, scored: false };
    expect(butterflyOverlapsPipe(butterfly, far)).toBe(false);
  });
});

describe('particles', () => {
  const butterfly = createButterfly(200);

  it('spawnScoreBurst, popup, and trail add particles', () => {
    expect(spawnScoreBurst([], 100, 100)).toHaveLength(10);
    const popup = spawnScorePopup([], 100, 100, 2);
    expect(popup).toHaveLength(1);
    expect(popup[0].text).toBe('+2');
    expect(spawnTrail([], butterfly)).toHaveLength(3);
  });

  it('caps live particles for mobile performance', () => {
    let particles: Particle[] = [];
    for (let i = 0; i < 10; i += 1) {
      particles = spawnScoreBurst(particles, 100, 100);
    }
    expect(particles.length).toBeLessThanOrEqual(MAX_PARTICLES);
  });

  it('updateParticles moves particles and removes dead ones', () => {
    const particles = spawnTrail([], butterfly);
    const moved = updateParticles(particles);
    expect(moved).toHaveLength(particles.length);
    expect(moved[0].x).not.toBe(particles[0].x);
    let aged = particles;
    for (let i = 0; i < 30; i += 1) {
      aged = updateParticles(aged);
    }
    expect(aged).toHaveLength(0);
  });
});
