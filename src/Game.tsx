import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CLOUD_SPEED,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_SPEED,
} from './game/config';
import {
  drawButterfly,
  drawCloud,
  drawGround,
  drawHills,
  drawPipe,
  drawScore,
  drawSky,
  medalColor,
} from './game/draw';
import {
  collidesWithWorld,
  createButterfly,
  createInitialPipes,
  flap,
  medalForScore,
  readHighScore,
  stepButterfly,
  stepPipes,
  writeHighScore,
} from './game/logic';
import { Cloud, GameState, Phase } from './game/types';

function createClouds(): Cloud[] {
  return [
    { x: 40, y: 70, scale: 1 },
    { x: 210, y: 120, scale: 0.75 },
    { x: 360, y: 55, scale: 1.15 },
    { x: 470, y: 100, scale: 0.85 },
  ];
}

function createState(phase: Phase, highScore: number): GameState {
  return {
    phase: phase,
    butterfly: createButterfly(GAME_HEIGHT / 2 - 40),
    pipes: createInitialPipes(),
    clouds: createClouds(),
    groundOffset: 0,
    score: 0,
    highScore: highScore,
    tick: 0,
  };
}

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState('ready', 0));
  const [ui, setUi] = useState({
    phase: 'ready' as Phase,
    score: 0,
    highScore: 0,
  });

  const syncUi = useCallback((state: GameState) => {
    setUi({
      phase: state.phase,
      score: state.score,
      highScore: state.highScore,
    });
  }, []);

  useEffect(() => {
    const high = readHighScore();
    stateRef.current = createState('ready', high);
    syncUi(stateRef.current);

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Cap backing-store resolution: phones report DPR 3+, which makes
    // every full-canvas fill ~9x the work for no visible gain at 520x640.
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = GAME_WIDTH * ratio;
    canvas.height = GAME_HEIGHT * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Fixed-timestep simulation: advance physics in 60Hz steps based on
    // elapsed wall time, so game speed is identical at 30/60/120fps.
    // (Previously one physics step ran per rAF frame, so low-fps phones
    // ran the whole game in slow motion.)
    const STEP = 1000 / 60;
    let last = performance.now();
    let acc = 0;

    const update = () => {
      const state = stateRef.current;
      state.tick += 1;

      state.clouds = state.clouds.map(function (cloud) {
        let x = cloud.x - CLOUD_SPEED;
        if (x < -80) {
          x = GAME_WIDTH + 40;
        }
        return { x: x, y: cloud.y, scale: cloud.scale };
      });
      state.groundOffset = (state.groundOffset + GROUND_SPEED) % 48;

      if (state.phase === 'playing') {
        state.butterfly = stepButterfly(state.butterfly, true);
        const moved = stepPipes(state.pipes, state.butterfly);
        state.pipes = moved.pipes;
        if (moved.scored > 0) {
          state.score += moved.scored;
        }
        if (collidesWithWorld(state.butterfly, state.pipes)) {
          state.phase = 'dead';
          if (state.score > state.highScore) {
            state.highScore = state.score;
            writeHighScore(state.highScore);
          }
          syncUi(state);
        }
      } else if (state.phase === 'ready') {
        state.butterfly = stepButterfly(state.butterfly, false);
      } else {
        state.butterfly = Object.assign({}, state.butterfly, {
          vy: Math.min(12, state.butterfly.vy + 0.55),
          y: Math.min(
            GAME_HEIGHT - 110,
            state.butterfly.y + Math.min(12, state.butterfly.vy + 0.55)
          ),
          wing: state.butterfly.wing + 0.08,
        });
      }
    };

    const render = () => {
      const state = stateRef.current;
      drawSky(ctx);
      state.clouds.forEach(function (cloud) {
        drawCloud(ctx, cloud);
      });
      drawHills(ctx);
      state.pipes.forEach(function (pipe) {
        drawPipe(ctx, pipe);
      });
      drawGround(ctx, state.groundOffset);
      drawButterfly(ctx, state.butterfly, state.phase === 'dead');
      if (state.phase === 'playing' || state.phase === 'dead') {
        drawScore(ctx, state.score);
      }
    };

    let frame = 0;
    const loop = (now: number) => {
      frame = window.requestAnimationFrame(loop);
      let dt = now - last;
      last = now;
      if (dt < 0) {
        dt = 0;
      }
      if (dt > 100) {
        // Tab was hidden / hitch: don't spiral, just resume.
        dt = 100;
      }
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 5) {
        update();
        acc -= STEP;
        steps += 1;
      }
      if (steps === 5) {
        acc = 0;
      }
      render();
    };

    frame = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [syncUi]);

  const onFlap = useCallback(() => {
    const state = stateRef.current;
    if (state.phase === 'ready') {
      state.phase = 'playing';
      state.butterfly = flap(state.butterfly);
      syncUi(state);
      return;
    }
    if (state.phase === 'playing') {
      state.butterfly = flap(state.butterfly);
      return;
    }
    stateRef.current = createState('ready', state.highScore);
    syncUi(stateRef.current);
  }, [syncUi]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        onFlap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onFlap]);

  const medal = medalForScore(ui.score);
  const showMedal = ui.phase === 'dead' && medal !== 'none';

  return (
    <div className="game-shell">
      <div className="game-frame">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onMouseDown={onFlap}
          onTouchStart={(event) => {
            event.preventDefault();
            onFlap();
          }}
        />
        {ui.phase === 'ready' && (
          <div className="game-overlay">
            <h1>Flappy Butterfly</h1>
            <p>Tap, click, or press space to flutter through the flowers.</p>
            <span className="cta">Tap to fly</span>
          </div>
        )}
        {ui.phase === 'dead' && (
          <div className="game-overlay game-overlay-over">
            <h2>Game over</h2>
            <div className="scoreboard">
              <div>
                <span className="label">Score</span>
                <strong>{ui.score}</strong>
              </div>
              <div>
                <span className="label">Best</span>
                <strong>{ui.highScore}</strong>
              </div>
            </div>
            {showMedal && (
              <div className="medal" style={{ borderColor: medalColor(medal) }}>
                <span className="medal-disc" style={{ background: medalColor(medal) }} />
                <span>{medal} medal</span>
              </div>
            )}
            <p className="hint">Hit a vine or the ground and the flight ends.</p>
            <span className="cta">Tap to try again</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
