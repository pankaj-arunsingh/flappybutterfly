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
| Pure game logic: flap, physics step, pipe traversal, collision, difficulty ramp, medals, celebration, high score, weather pick/step | `src/game/logic.ts` |
| Web Audio SFX (flap/score/death/near-miss/thunder/applause) | `src/game/audio.ts` |
| Canvas rendering (weather-aware sky/hills/clouds/ground, stars, moon, rain, lightning, medal celebrations) | `src/game/draw.ts` |
| Types (Phase, Weather, Butterfly, Pipe, Cloud, Star, Raindrop, GameState, Medal, celebration state) | `src/game/types.ts` |

## Weather system

- `Weather = 'sunny' | 'night' | 'storm'` lives on `GameState` along with `stars`, `raindrops`, `lightningTimer`, `lightningFlash`.
- Purely visual: never affects gameplay, difficulty, scoring, or collision.
- Random pick at run start (ready→playing and dead→playing in `Game.tsx` via `pickWeather`; the first run allows all three weathers, then later runs avoid the immediately previous weather).
- `ready` overlay always shows the sunny scene; weather applies at tap-to-play.
- Night: `drawStars` (per-star twinkle `tick`-driven, disabled under reduced motion) + `drawMoon` + dark silhouette hills/clouds/ground.
- Storm: `stepRain` wanders/bangs drops; `stepLightning` counts a `lightningTimer`, fires a brief flash (shorter under reduced motion), and `playThunder` (low sawtooth rumble, no music) plays when a strike starts.
- Sky gradients are cached per-context per-weather (`WeakMap`), so the same ctx can render different weathers (ready sunny → run night/storm).

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
- Earned medals fall onto the canvas with ribbon and confetti; a new best adds extra confetti, applause, and a random celebratory word.

## Difficulty curve

New pipes interpolate gap/speed/spacing from easy-mode to full difficulty over the first `RAMP_PIPES = 7` scored pipes via `difficultyAt(pipesScored)` and `lerp`. The ramp reads the `pipesScored` pipe count, decoupled from `score` so combo bonus points never compress the ramp. Each pipe locks its `gap`/`speed` at spawn. Keep `randomGapY(gap)` consistent with the per-pipe gap so collision and drawing stay aligned.

## Testing

`craco test -- --watchAll=false` runs Jest. Core tests: `src/game/logic.test.ts`.

> Note: in this workspace the Jest run can't parse any suite (the `react-magnetic-di` babel plugin transform fails on TS/TSX type annotations — even on a clean checkout), so `craco test` reports 0 tests. Use `npx tsc --noEmit` and `npx react-scripts build` to validate changes instead; don't assume a suite failure is caused by your change until you check against a clean checkout.

## Maintaining this file
