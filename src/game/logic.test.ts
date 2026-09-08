import { injectable, runWithDi } from 'react-magnetic-di';
import { medalForScore, collidesWithWorld, createButterfly, createInitialPipes, hitbox, randomGapY, difficultyAt, lerp } from './logic';
import { EASY_PIPE_GAP, EASY_PIPE_SPEED, GAME_HEIGHT, GROUND_HEIGHT, PIPE_GAP, PIPE_SPEED, RAMP_PIPES } from './config';
import { Pipe } from './types';

describe('medalForScore', () => {
  it('awards medals at Flappy Bird thresholds', () => {
    expect(medalForScore(0)).toBe('none');
    expect(medalForScore(9)).toBe('none');
    expect(medalForScore(10)).toBe('bronze');
    expect(medalForScore(19)).toBe('bronze');
    expect(medalForScore(20)).toBe('silver');
    expect(medalForScore(30)).toBe('gold');
    expect(medalForScore(40)).toBe('platinum');
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
});
