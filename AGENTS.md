# Project agent memory

## What this is

Flappy Butterfly — a Flappy Bird–style arcade game (butterfly vs. vines) for the web. Canvas game, no engine.

## Stack

- React + TypeScript + HTML5 Canvas (Create React App `react-scripts@3`)
- Node 17+ needs `NODE_OPTIONS=--openssl-legacy-provider` for `start`/`test`/`build` (baked into `package.json` scripts)
- No game engine; NO real-time multiplayer; NO server backend (static deploy via GitHub Pages / Netlify / Vercel)

## Where the code lives

| Concern | File |
|---|---|
| Game loop, input, overlays, canvas setup | `src/Game.tsx` |
| Dimensions, physics, speeds, easy-mode params | `src/game/config.ts` |
| Pure game logic: flap, physics step, pipe traversal, collision, difficulty ramp, medals, high score | `src/game/logic.ts` |
| Web Audio SFX (flap/score/death) | `src/game/audio.ts` |
| Canvas rendering | `src/game/draw.ts` |
| Types (Phase, Butterfly, Pipe, Cloud, GameState, Medal) | `src/game/types.ts` |

## Phase model

`ready` → `playing` → `dead`, with tap-to-restart jumping `dead` → `playing` directly (single-tap restart). The `ready` overlay only appears on first load.

## Scoring & collision contract

- +1 per vine pair fully passed: `stepPipes` marks a pipe `scored` once `butterfly.x` passes `pipe.x + PIPE_WIDTH`.
- Death on ground hit (`GAME_HEIGHT - GROUND_HEIGHT`) or touching a vine outside its gap. Ceiling is safe (y clamped to 0).
- Best score persisted in `localStorage` under `flappybutterfly-highscore`.
- Collision uses per-pipe `gap` (not the global constant) — pipes carry their own `gap`, `speed`, `gapY` at spawn.

## Difficulty curve

New pipes interpolate gap/speed/spacing from easy-mode to full difficulty over the first `RAMP_PIPES = 7` scored pipes via `difficultyAt(score)` and `lerp`. Each pipe locks its `gap`/`speed` at spawn. Keep `randomGapY(gap)` consistent with the per-pipe gap so collision and drawing stay aligned.

## Testing

`NODE_OPTIONS=--openssl-legacy-provider npm test -- --watchAll=false` runs Jest. Core tests: `src/game/logic.test.ts`.

> Note: a few pre-existing suites fail (magnetic-di mocking + the `@vercel/analytics/react` module resolution). The difficulty-curve tests and other pure-logic tests are green — don't assume a failure is caused by your change until you check against a clean checkout.

## Maintaining this file