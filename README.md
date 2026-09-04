# 🦋 Flappy Butterfly

A Flappy Bird-style arcade game built with **React + TypeScript + HTML5 Canvas**, where you guide a butterfly through flowering vines.

Live demo: **https://pankaj-arunsingh.github.io/flappybutterfly/**

## How the game works

You control a purple butterfly stuck at `x = 108` in a `520x640` canvas world. Gravity constantly pulls it down. Each flap gives it an upward velocity. Vines (pipes) scroll in from the right with a random vertical gap — fly through the gap to score.

### Game phases (`src/Game.tsx`, `src/game/types.ts`)

1. **ready** — Butterfly bobs up and down in the center. Overlay shows:
   > "Flappy Butterfly — Tap, click, or press space to flutter through the flowers."
2. **playing** — Physics + collision + scoring are active.
3. **dead** — Butterfly falls to the ground. Overlay shows `Score`, `Best`, medal (if earned), and `Tap to try again`.

### Controls

- **Space / ` ` key** — flap (`keydown` listener in `Game.tsx`)
- **Mouse click** on canvas — flap (`onMouseDown`)
- **Touch tap** — flap (`onTouchStart`, with `preventDefault` for mobile)

First flap from `ready` → `playing`. Tap after `dead` resets to `ready`.

### Rules & scoring

- +1 point each time you fully pass a vine pair (`stepPipes` in `src/game/logic.ts`).
- Game ends if you hit:
  - the ground (`GAME_HEIGHT - GROUND_HEIGHT`)
  - the top or bottom vine outside the gap
- Ceiling is safe — `y` is clamped to `0`, no death.
- Best score persists in `localStorage` under `flappybutterfly-highscore` (`readHighScore` / `writeHighScore`).

### Medals (`medalForScore` in `src/game/logic.ts`)

| Score | Medal |
|-------|-------|
| 0-9   | none |
| 10-19 | bronze `#cd7f32` |
| 20-29 | silver `#c0c0c0` |
| 30-39 | gold `#ffd700` |
| 40+   | platinum `#e5e4e2` |

### Visuals (`src/game/draw.ts`)

All rendering is immediate-mode Canvas 2D at 60fps via `requestAnimationFrame`:

- `drawSky` — vertical gradient sky
- `drawCloud` — 4 drifting clouds (`CLOUD_SPEED = 0.18`)
- `drawHills` — two layers of background hills
- `drawPipe` — green vines with petal flower heads (`pink #ff7eb6` / `yellow #ffd166`) capping each gap edge
- `drawGround` — scrolling grass/dirt strip (`GROUND_SPEED = PIPE_SPEED`)
- `drawButterfly` — animated wings (sine-wave flap), body tilt based on `vy`, dead tilt on game over
- `drawScore` — big outlined score at the top during `playing` / `dead`

### Tuning (`src/game/config.ts`)

- `GRAVITY = 0.42`, `FLAP_VELOCITY = -7.4`, `MAX_FALL_SPEED = 11`
- `PIPE_WIDTH = 64`, `PIPE_GAP = 148`, `PIPE_SPEED = 1.45`, `PIPE_SPACING = 240`
- `BUTTERFLY_WIDTH = 42`, `BUTTERFLY_HEIGHT = 30`, `HITBOX_INSET = 6` (forgiving hitbox)
- 4 pipes alive at once, recycled off-screen

## Tech stack

- `react@16.8.6`, `react-dom@16.8.6`
- `typescript@3.4.5`
- `react-scripts@3.0.0` (Create React App)
- `gh-pages@2.0.1` for GitHub Pages deploy
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
    config.ts      # dimensions, physics, speeds
    types.ts       # Phase, Butterfly, Pipe, Cloud, GameState, Medal
    logic.ts       # flap, stepButterfly, stepPipes, collidesWithWorld, medals, highscore
    logic.test.ts  # unit tests for medals + collisions
    draw.ts        # all canvas drawing
```

## Prerequisites

- Node.js (LTS recommended)
- npm (comes with Node) or yarn

> Note: this project uses `react-scripts@3.0.0`, which requires `NODE_OPTIONS=--openssl-legacy-provider` on Node 17+ (already baked into the scripts in `package.json`).

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
NODE_OPTIONS=--openssl-legacy-provider react-scripts start
```

Starts the dev server at [http://localhost:3000](http://localhost:3000). Hot-reloads on edits, shows lint errors in console.

### `npm test` / `yarn test`

Runs:

```bash
NODE_OPTIONS=--openssl-legacy-provider react-scripts test
```

Launches Jest in watch mode. Relevant test file: `src/game/logic.test.ts` — covers:

- `medalForScore` thresholds
- ground collision
- ceiling safety
- gap fly-through vs. top-vine hit

Run once in CI with:

```bash
npm test -- --watchAll=false
# or
yarn test --watchAll=false
```

### `npm run build` / `yarn build`

Runs:

```bash
NODE_OPTIONS=--openssl-legacy-provider react-scripts build
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
