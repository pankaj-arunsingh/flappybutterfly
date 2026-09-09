# Project agent memory

## What this is

Flappy Butterfly — a Flappy Bird–style arcade game (butterfly vs. vines) for the web. Canvas game, no engine.

## Stack

- React + TypeScript + HTML5 Canvas (react@18.3.1, react-scripts@5.0.1 via CRACO)
- No game engine; NO real-time multiplayer; NO server backend (static deploy via GitHub Pages / Netlify / Vercel)

## Where the code lives

| Concern | File |
|---|---|
| Game loop, input, overlays, canvas setup | `src/Game.tsx` |
| Dimensions, physics, speeds, easy-mode params | `src/game/config.ts` |
| Pure game logic: flap, physics step, pipe traversal, collision, difficulty ramp, medals, high score | `src/game/logic.ts` |
| Web Audio SFX (flap/score/death/near-miss) | `src/game/audio.ts` |
| Canvas rendering | `src/game/draw.ts` |
| Types (Phase, Butterfly, Pipe, Cloud, GameState, Medal) | `src/game/types.ts` |

## Phase model

`ready` → `playing` → `dead`, with tap-to-restart jumping `dead` → `playing` directly (single-tap restart). The `ready` overlay only appears on first load.

## Scoring & collision contract

- +1 per vine pair fully passed: `stepPipes` marks a pipe `scored` once `butterfly.x` passes `pipe.x + PIPE_WIDTH`. It also returns `nearMiss` (true when the pass was within `NEAR_MISS_THRESHOLD = 30`px of a gap edge via `isNearMiss`).
- Combo: gliding through a gap without flapping grows `combo` (`scoreCombo`); bonus points equal the streak length. `flappedThroughGap` is set by `markGapFlap` in `Game.tsx` when a flap happens while overlapping an unscored pipe.
- Death on ground hit (`GAME_HEIGHT - GROUND_HEIGHT`) or touching a vine outside its gap. Ceiling is safe (y clamped to 0).
- Best score persisted in `localStorage` under `flappybutterfly-highscore`.
- Collision uses per-pipe `gap` (not the global constant) — pipes carry their own `gap`, `speed`, `gapY` at spawn.
- Medals: bronze 5 / silver 10 / gold 20 / platinum 35 (`medalForScore`; platinum `#7ee8fa` to stand apart from silver).

## Juice & onboarding

- Particles live in `GameState.particles` (`Particle` in `types.ts`, helpers in `logic.ts`, `drawParticles` in `draw.ts`); score popups are a particle kind. Cap: `MAX_PARTICLES = 30`.
- Death screen shake is render-only in `Game.tsx` (canvas translate, `SHAKE_FRAMES = 18`); never touches collision; skipped under `prefers-reduced-motion`.
- Ready overlay explains the goal, shows Best, and `drawGapGuide` points at the first gap.

## Difficulty curve

New pipes interpolate gap/speed/spacing from easy-mode to full difficulty over the first `RAMP_PIPES = 7` scored pipes via `difficultyAt(pipesScored)` and `lerp`. The ramp reads the `pipesScored` pipe count, decoupled from `score` so combo bonus points never compress the ramp. Each pipe locks its `gap`/`speed` at spawn. Keep `randomGapY(gap)` consistent with the per-pipe gap so collision and drawing stay aligned.

## Testing

`craco test -- --watchAll=false` runs Jest. Core tests: `src/game/logic.test.ts`.

> Note: a few pre-existing suites fail (magnetic-di mocking + the `@vercel/analytics/react` module resolution). The difficulty-curve tests and other pure-logic tests are green — don't assume a failure is caused by your change until you check against a clean checkout.

## Maintaining this file