import { medalForScore, collidesWithWorld, createButterfly, hitbox } from './logic';
import { GAME_HEIGHT, GROUND_HEIGHT, PIPE_GAP } from './config';
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
    const pipes: Pipe[] = [{ x: butterfly.x, gapY: 200 + 15, scored: false }];
    const centered = Object.assign({}, butterfly, { y: pipes[0].gapY - 15 });
    const box = hitbox(centered);
    expect(box.top).toBeGreaterThan(pipes[0].gapY - PIPE_GAP / 2);
    expect(box.bottom).toBeLessThan(pipes[0].gapY + PIPE_GAP / 2);
    expect(collidesWithWorld(centered, pipes)).toBe(false);
  });

  it('detects a hit on the top vine', () => {
    const pipes: Pipe[] = [{ x: butterfly.x, gapY: 320, scored: false }];
    const tooHigh = Object.assign({}, butterfly, { y: 40 });
    expect(collidesWithWorld(tooHigh, pipes)).toBe(true);
  });
});
