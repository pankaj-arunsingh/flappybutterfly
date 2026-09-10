# 🦋 Flappy Butterfly

A Flappy Bird-style arcade game built with **React + TypeScript + HTML5 Canvas**, where you guide a butterfly through flowering vines.

Live demo: **https://pankaj-arunsingh.github.io/flappybutterfly/**

## How the game works

You control a purple butterfly stuck at `x = 108` in a `520x640` canvas world. Gravity constantly pulls it down. Each flap gives it an upward velocity. Vines (pipes) scroll in from the right with a random vertical gap — fly through the gap to score.

### Game phases (`src/Game.tsx`, `src/game/types.ts`)

1. **ready** — Butterfly bobs up and down in the center. Overlay shows:
   > "Flappy Butterfly — Fly through the gaps between the vines to score a point!"
   plus the best score and a glowing arrow on the canvas pointing at the first gap.
2. **playing** — Physics + collision + scoring are active.
3. **dead** — Butterfly falls to the ground. Overlay shows `Score`, `Best`, and `Tap to try again`; an earned medal falls onto the canvas as a celebration. A new best also adds confetti, applause, and a random celebratory word. Tapping immediately restarts into `playing` (no intermediate `ready` screen).

### Controls

- **Space / ` ` key** — flap (`keydown` listener in `Game.tsx`)
- **Mouse click** on canvas — flap (`onMouseDown`)
- **Touch tap** — flap (`onTouchStart`, with `preventDefault` for mobile)

First flap from `ready` → `playing`. Tap after `dead` restarts directly into `playing` with a flap.

### Rules & scoring

- +1 point each time you fully pass a vine pair (`stepPipes` in `src/game/logic.ts`), shown as a floating `+N` popup with a gold particle burst.
- **Combo bonus** — glide through a gap without flapping and the combo grows: the next glide scores +2, then +3, and so on (`COMBO x2`, `x3`, … shown top-right). Flapping inside a gap resets the combo.
- **Near-miss** — threading a gap within 30px of a vine edge flashes `Close!`, plays a distinct chime, and counts as a "Close call" stat on the game-over screen.
- Game ends if you hit:
  - the ground (`GAME_HEIGHT - GROUND_HEIGHT`)
  - the top or bottom vine outside the gap
- Ceiling is safe — `y` is clamped to `0`, no death.
- Best score persists in `localStorage` under `flappybutterfly-highscore` (`readHighScore` / `writeHighScore`).

### Medals (`medalForScore` in `src/game/logic.ts`)

| Score | Medal |
|-------|-------|
| 0-4   | none |
| 5-9   | bronze `#cd7f32` |
| 10-19 | silver `#c0c0c0` |
| 20-34 | gold `#ffd700` |
| 35+   | platinum `#7ee8fa` |

### Visuals (`src/game/draw.ts`)

All rendering is immediate-mode Canvas 2D at 60fps via `requestAnimationFrame`:

- `drawSky` — vertical gradient sky
- `drawCloud` — 4 drifting clouds (`CLOUD_SPEED = 0.18`)
- `drawHills` — two layers of background hills
- `drawPipe` — green vines with petal flower heads (`pink #ff7eb6` / `yellow #ffd166`) capping each gap edge
- `drawGround` — scrolling grass/dirt strip (tracks the live pipe speed via `pipeSpeedAt`)
- `drawButterfly` — animated wings (sine-wave flap), body tilt based on `vy`, dead tilt on game over
- Death also triggers a brief canvas screen shake (render-only transform; collision is untouched; skipped under `prefers-reduced-motion`)
- `drawScore` — big outlined score at the top during `playing` / `dead`
- `drawParticles` — score bursts, flap trails, and floating `+N` popups (capped at 30 live particles for mobile)
- `drawCombo` — `COMBO xN` counter while gliding without flapping
- `drawNearMissFlash` — quick `Close!` flash on a tight gap
- `drawGapGuide` — pulsing arrow toward the first gap on the ready screen
- `drawConfetti` / `drawMedal` — colorful celebration particles and the earned medal with ribbon

Runs randomly select one of three visual-only weather conditions when play
starts: sunny, night (stars and moon), or storm (rain and occasional
lightning). The first run allows any condition; later runs avoid immediately
repeating the previous condition. The ready screen always uses the sunny scene.

### Tuning (`src/game/config.ts`)

- `GRAVITY = 0.22`, `FLAP_VELOCITY = -6.2`, `MAX_FALL_SPEED = 6.0`
- `PIPE_WIDTH = 64`, `PIPE_GAP = 200`, `PIPE_SPEED = 1.15`, `PIPE_SPACING = 280`
- `BUTTERFLY_WIDTH = 42`, `BUTTERFLY_HEIGHT = 30`, `HITBOX_INSET = 10` (forgiving hitbox)
- 4 pipes alive at once, recycled off-screen

### Difficulty curve (`difficultyAt` / `lerp` in `src/game/logic.ts`)

The opening pipes use **easy-mode** parameters for a near-guaranteed first pass:

| Parameter | Easy (start) | Full (after ramp) |
|-----------|-------------|-------------------|
| `PIPE_GAP` | 240px | 200px |
| `PIPE_SPEED` | 0.9 | 1.15 |
| `PIPE_SPACING` | 350px | 280px |

The ramp is driven by the `pipesScored` pipe count (decoupled from the combined score, so combo bonus points don't compress it) and interpolates linearly over the first `RAMP_PIPES = 7` scored pipes. Each pipe locks in the gap/speed values at spawn time, so the transition is smooth and consistent.

### Audio (`src/game/audio.ts`)

Oscillator-based SFX via the Web Audio API (no asset files):

- **Flap** — quick frequency sweep (whoosh)
- **Score** — ascending two-tone chime
- **Death** — soft descending tone (bonk)
- **Near-miss** — bright two-blip chime (`playNearMiss`)
- **Thunder** — low rumble when storm lightning strikes (`playThunder`)
- **Applause** — noise bursts and an ascending fanfare for a new best (`playApplause`)

AudioContext is created and resumed on the first user gesture to satisfy iOS/Safari autoplay policy.

### Haptics (`navigator.vibrate` in `src/Game.tsx`)

On supported mobile browsers:

- **Score** — 10ms vibration
- **Death** — 20ms vibration

No haptic on flap. Guarded so desktop browsers are unaffected.

## Tech stack

- `react@18.3.1`, `react-dom@18.3.1`
- `typescript@~4.9.5`
- `react-scripts@5.0.1` + `@craco/craco@^7.1.0`
- `gh-pages@^5.0.0` for GitHub Pages deploy
- No game engine — custom loop in `Game.tsx` + pure logic in `src/game/logic.ts`

## Project structure

```text
public/
  index.html
  butterfly.ico / favicon.ico
  manifest.json
src/
  App.tsx          # mounts <Game />
  Game.tsx         # game loop, input, overlays, canvas setup
  App.css / index.css
  game/
    config.ts      # dimensions, physics, speeds, easy-mode params
    types.ts       # Phase, Weather, Butterfly, Pipe, Cloud, Star, Raindrop, GameState, Medal, celebration state
    logic.ts       # flap, stepButterfly, stepPipes, weather, difficulty ramp, collidesWithWorld, medals, celebration, highscore
    logic.test.ts  # unit tests for medals, collisions, difficulty curve
    audio.ts       # Web Audio SFX (flap/score/death/near-miss/thunder/applause)
    draw.ts        # weather-aware canvas and medal celebration drawing
```

## Prerequisites

- Node.js (LTS recommended)
- npm (comes with Node) or yarn

## Getting started

```bash
# 1. Clone
git clone https://github.com/pankaj-arunsingh/flappybutterfly.git
cd flappybutterfly

# 2. Install
npm install
# or
yarn install

# 3. Run dev server
npm start
# or
yarn start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

In the project directory, you can run:

### `npm start` / `yarn start`

Runs:

```bash
craco start
```

Starts the dev server at [http://localhost:3000](http://localhost:3000). Hot-reloads on edits, shows lint errors in console.

### `npm test` / `yarn test`

Runs:

```bash
craco test
```

Launches Jest in watch mode. Relevant test file: `src/game/logic.test.ts` — covers:

- `medalForScore` thresholds
- ground collision
- ceiling safety
- gap fly-through vs. top-vine hit
- difficulty-curve ramp (`difficultyAt`, `lerp`, pipes-scored decoupling)
- easy-mode pipe parameters on initial pipes
- weather selection and weather effects

Run once in CI with:

```bash
npm test -- --watchAll=false
# or
yarn test --watchAll=false
```

### `npm run build` / `yarn build`

Runs:

```bash
craco build
```

Bundles React in production mode to `build/`, minified with hashed filenames. Ready to deploy.

### `npm run deploy` / `yarn deploy`

Runs:

```bash
npm run build  # via predeploy
gh-pages -d build
```

Publishes `build/` to GitHub Pages. Configured via:

```json
"homepage": "https://pankaj-arunsingh.github.io/flappybutterfly/"
```

### `npm run eject` / `yarn eject`

**One-way operation.** Copies Webpack/Babel/ESLint config into the project for full control. You don't need this for normal play/dev.

## Deployment

The app is statically hosted. After `npm run deploy`, updates go live at `https://pankaj-arunsingh.github.io/flappybutterfly/`.

## Learn More

- [Create React App docs](https://facebook.github.io/create-react-app/docs/getting-started)
- [React docs](https://reactjs.org/)
