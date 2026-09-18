# Project agent memory

## What this is

Flappy Butterfly — a Flappy Bird–style arcade game (butterfly vs. vines) for the web. Canvas game, no engine. Butterfly is fixed at `x = 108` in a `520x640` canvas; gravity pulls down, flap gives upward velocity, vines scroll from right with a random gap.

## Stack

- React + TypeScript + HTML5 Canvas (`react@18.3.1`, `react-dom@18.3.1`, `typescript@~4.9.5`)
- `react-scripts@5.0.1` + `@craco/craco@^7.1.0` (build/test via `craco`)
- `gh-pages@^5.0.0` for GitHub Pages deploy (`homepage` → `https://pankaj-arunsingh.github.io/flappybutterfly/`)
- No game engine; NO multiplayer; NO server backend (static deploy only)

## Where the code lives

| Concern | File |
|---|---|
| Game loop, input, overlays, canvas setup | `src/Game.tsx` |
| Dimensions, physics, speeds, easy-mode params | `src/game/config.ts` |
| Pure game logic: flap, physics step, pipe traversal, collision, difficulty ramp, medals, celebration, high score, weather pick/step, music | `src/game/logic.ts` + `src/game/music.ts` |
| Web Audio SFX + music (flap/score/death/near-miss/thunder/applause, weather-matched loops) | `src/game/audio.ts`, `src/game/music.ts` |
| Canvas rendering (weather-aware sky/hills/clouds/ground, stars, moon, rain, lightning, medal celebrations) | `src/game/draw.ts` |
| Types (Phase, Weather, Butterfly, Pipe, Cloud, Star, Raindrop, GameState, Medal, celebration state) | `src/game/types.ts` |
| App shell | `src/App.tsx` (mounts `<Game />`), `src/App.css`, `src/index.css` |
| Tests | `src/game/logic.test.ts` |

## Project structure

```
public/
  index.html, manifest.json, butterfly.ico / favicon.ico
src/
  App.tsx, Game.tsx, App.css, index.css
  game/
    config.ts, types.ts, logic.ts, logic.test.ts, audio.ts, music.ts, draw.ts
```

## Prerequisites

- Node.js (LTS) + npm (or yarn)

## Available scripts (via CRACO)

- `npm start` / `yarn start` → `craco start` — dev server at `http://localhost:3000`, hot reload
- `npm test` / `yarn test` → `craco test` — Jest watch mode; core suite `src/game/logic.test.ts` covers: `medalForScore` thresholds, ground/ceiling collision, gap fly-through vs top-vine hit, difficulty ramp (`difficultyAt`/`lerp` decoupling), easy-mode params, weather pick/effects. CI single-run: `npm test -- --watchAll=false` (also `CI=true craco test --watchAll=false --passWithNoTests`)
- `npm run build` / `yarn build` → `craco build` — production bundle to `build/` (hashed filenames)
- `npm run deploy` / `yarn deploy` → `predeploy` (`npm run build`) + `gh-pages -d build` — publishes to GitHub Pages
- `npm run eject` — one-way eject of CRACO/Webpack/Babel/ESLint configs (rarely needed)

## Controls

- `Space` / ` ` key — `keydown` in `Game.tsx` (with `event.repeat` guard)
- Mouse click on canvas — `onMouseDown`
- Touch tap — `onTouchStart` with `preventDefault` for mobile
- First flap from `ready` → `playing`; tap after `dead` restarts directly into `playing` with a flap

## Phase model

`ready` → `playing` → `dead`, with `dead` → `playing` single-tap restart (no intermediate `ready`). Overlays:
- `ready`: "Flappy Butterfly — Fly through the gaps between the vines to score a point!" + Best score + pulsing `drawGapGuide` arrow toward first gap. Always renders sunny scene.
- `playing`: big outlined `drawScore` at top.
- `dead`: `Score`, `Best`, "Tap to try again" + falling medal/ribbon + confetti; new best adds extra confetti, applause, random celebratory word; "Close calls" stat if near-misses occurred.

## Scoring & collision contract

- +1 per vine pair fully passed: `stepPipes` marks `scored` once `butterfly.x` passes `pipe.x + PIPE_WIDTH`. Floating `+N` popup + gold particle burst via `drawParticles`.
- Combo: gliding through a gap without flapping grows `combo` (`scoreCombo` via `COMBO x2`, `x3`… top-right). `flappedThroughGap` set by `markGapFlap` when flap overlaps unscored pipe — resets combo. Bonus points = streak length.
- Near-miss: within `NEAR_MISS_THRESHOLD = 30`px of gap edge → `isNearMiss` true, flashes `Close!` (`drawNearMissFlash`), plays distinct chime (`playNearMiss`), counts as "Close call" stat.
- Death on ground hit (`GAME_HEIGHT - GROUND_HEIGHT`) or touching vine outside gap. Ceiling safe (y clamped to 0, no death).
- Best score persisted in `localStorage` under `flappybutterfly-highscore` (`readHighScore`/`writeHighScore`).
- Collision uses per-pipe `gap` (not global) — pipes carry `gap`, `speed`, `gapY` at spawn.
- Medals (`medalForScore`): 0-4 none, 5-9 bronze `#cd7f32`, 10-19 silver `#c0c0c0`, 20-34 gold `#ffd700`, 35+ platinum `#7ee8fa`.

## Tuning (`src/game/config.ts`)

- `GRAVITY = 0.22`, `FLAP_VELOCITY = -6.2`, `MAX_FALL_SPEED = 6.0`
- `PIPE_WIDTH = 64`, `PIPE_GAP = 200`, `PIPE_SPEED = 1.15`, `PIPE_SPACING = 280`
- `BUTTERFLY_WIDTH = 42`, `BUTTERFLY_HEIGHT = 30`, `HITBOX_INSET = 10` (forgiving hitbox — ~33% inset)
- 4 pipes alive, recycled off-screen; `PIPE_COUNT` etc. control spawn
- Easy-mode ramp start: `EASY_PIPE_GAP = 240`, `EASY_PIPE_SPEED = 0.9`, `EASY_PIPE_SPACING = 350`, `RAMP_PIPES = 7`

## Difficulty curve

Interpolates gap/speed/spacing from easy-mode to full via `difficultyAt(pipesScored)` + `lerp` over first `RAMP_PIPES = 7` scored pipes. Ramp reads `pipesScored` pipe count (decoupled from combined `score` so combo bonuses don't compress it). Each pipe locks `gap`/`speed`/`gapY` at spawn. `randomGapY(gap)` must stay consistent with per-pipe gap so collision/draw align. Ground scroll speed tracks live pipe speed via `pipeSpeedAt`.

## Visuals (`src/game/draw.ts`, 60fps `requestAnimationFrame`)

- `drawSky` — vertical gradient (weather-aware, cached per-ctx per-weather via `WeakMap`)
- `drawCloud` — 4 drifting clouds (`CLOUD_SPEED = 0.18`)
- `drawHills` — two layers background hills (night = dark silhouette)
- `drawPipe` — green vines with petal flower heads (`pink #ff7eb6` / `yellow #ffd166`) capping gap edges; per-pipe gap variant
- `drawGround` — scrolling grass/dirt strip, speed synced to `pipeSpeedAt`
- `drawButterfly` — sine-wave wing flap, tilt from `vy`, dead tilt on game over
- `drawScore` — big outlined score
- `drawParticles` — score bursts, flap trails, `+N` popups (cap `MAX_PARTICLES = 30` for mobile)
- `drawCombo` — `COMBO xN` while gliding
- `drawNearMissFlash` — `Close!` flash
- `drawGapGuide` — pulsing arrow to first gap on ready
- `drawConfetti` / `drawMedal` — celebration particles + medal with ribbon
- Screen shake on death: render-only canvas translate (`SHAKE_FRAMES = 18` in `Game.tsx`), never touches collision; skipped under `prefers-reduced-motion`

## Weather system

- `Weather = 'sunny' | 'night' | 'storm'` on `GameState` (+ `stars`, `raindrops`, `lightningTimer`, `lightningFlash`)
- Purely visual: never affects gameplay/difficulty/scoring/collision
- Random pick at run start (`pickWeather` in `Game.tsx`) for `ready→playing` and `dead→playing`; first run allows any, later runs avoid immediate repeat of previous weather. Ready overlay always sunny; weather applies at tap-to-play.
- Night: `drawStars` (per-star twinkle `tick`-driven, disabled under reduced motion) + `drawMoon` + dark silhouette hills/clouds/ground
- Storm: `stepRain` wander/bounce drops; `stepLightning` counts `lightningTimer`, fires brief flash (shorter under reduced motion), `playThunder` (low sawtooth rumble) on strike
- Sky gradients cached per-ctx per-weather (`WeakMap`) so same ctx can render ready sunny → run night/storm

## Audio (`src/game/audio.ts`, `src/game/music.ts`)

- Oscillator-based SFX via Web Audio API (no asset files); `AudioContext` created/resumed on first user gesture (iOS/Safari autoplay policy)
- SFX: **Flap** (freq sweep whoosh), **Score** (ascending two-tone chime), **Death** (descending bonk), **Near-miss** (bright two-blip `playNearMiss`), **Thunder** (low rumble on lightning `playThunder`), **Applause** (noise bursts + fanfare for new best `playApplause`)
- Music: weather-matched generative WebAudio loops keyed by run weather, crossfade + mute toggle persisted; rested at reduced gain on game over
- Global mute toggle (accessibility) — mutes both SFX and music; persisted

## Haptics (`navigator.vibrate` in `src/Game.tsx`)

- Score — 10ms vibration; Death — 20ms; no haptic on flap. Guarded for unsupported browsers (desktop unaffected).

## Deployment

- Static host via `gh-pages -d build` to `https://pankaj-arunsingh.github.io/flappybutterfly/` (configured via `homepage` in `package.json`). After `npm run deploy`, updates go live at that URL.

## Testing

- `craco test -- --watchAll=false` runs Jest; core suite `src/game/logic.test.ts`
- Note: in this workspace Jest can fail to parse suites due to `react-magnetic-di` babel plugin transform on TS/TSX type annotations — even on clean checkout `craco test` reports 0 tests. Use `npx tsc --noEmit` and `npm run build` (or `npx react-scripts build`) to validate changes instead; don't assume failure is yours until checked on clean checkout.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
