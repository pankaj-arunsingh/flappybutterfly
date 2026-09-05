import { act, fireEvent, screen } from '@testing-library/react';
import { DiProvider, injectable } from 'react-magnetic-di';
import Game from './Game';
import { render } from './test-utils';
import * as drawModule from './game/draw';
import * as logicModule from './game/logic';

function createFakeCtx() {
  return {
    setTransform: jest.fn(),
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    arcTo: jest.fn(),
    ellipse: jest.fn(),
    quadraticCurveTo: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    canvas: {},
  };
}

describe('Game (react-testing-library)', () => {
  let rafCallbacks: FrameRequestCallback[];
  let fakeCtx: ReturnType<typeof createFakeCtx>;

  beforeEach(() => {
    rafCallbacks = [];
    fakeCtx = createFakeCtx();
    HTMLCanvasElement.prototype.getContext = jest.fn(() => fakeCtx) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function stepFrames(n: number) {
    for (let i = 0; i < n; i += 1) {
      const cbs = rafCallbacks;
      rafCallbacks = [];
      act(() => {
        cbs.forEach((cb) => cb(16 * (i + 1)));
      });
    }
  }

  it('shows ready overlay on start', () => {
    render(<Game />);
    expect(screen.getByText('Flappy Butterfly')).toBeInTheDocument();
    expect(screen.getByText(/Tap to fly/i)).toBeInTheDocument();
  });

  it('starts playing when canvas is clicked (overlay disappears)', () => {
    const { container } = render(<Game />);
    stepFrames(2);
    const canvas = container.querySelector('canvas.game-canvas') as HTMLCanvasElement;
    fireEvent.mouseDown(canvas);
    stepFrames(1);
    expect(screen.queryByText(/Tap to fly/i)).not.toBeInTheDocument();
  });

  it('starts playing on Space key', () => {
    render(<Game />);
    stepFrames(2);
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    stepFrames(1);
    expect(screen.queryByText(/Tap to fly/i)).not.toBeInTheDocument();
  });

  it('ignores key repeat events after game over so holding space does not restart', () => {
    const readHighScoreDi = injectable(logicModule.readHighScore, () => 5);
    const collidesDi = injectable(logicModule.collidesWithWorld, () => true);
    const writeHighScoreDi = injectable(logicModule.writeHighScore, jest.fn());

    const { container } = render(
      <DiProvider use={[readHighScoreDi, collidesDi, writeHighScoreDi]}>
        <Game />
      </DiProvider>
    );
    stepFrames(2);

    // ready -> playing
    const canvas = container.querySelector('canvas.game-canvas') as HTMLCanvasElement;
    fireEvent.mouseDown(canvas);
    // next frames run with collidesWithWorld mocked to true -> dead
    stepFrames(3);

    expect(screen.getByText(/Game over/i)).toBeInTheDocument();

    // A repeated keydown (as OS key auto-repeat produces while a key is held)
    // must not flap and must not restart a new run from the game-over screen.
    fireEvent.keyDown(window, { code: 'Space', key: ' ', repeat: true });
    stepFrames(1);
    expect(screen.getByText(/Game over/i)).toBeInTheDocument();
    expect(screen.queryByText(/Tap to fly/i)).not.toBeInTheDocument();
  });

  it('uses magnetic-di to force game over with mocked high score', () => {
    const readHighScoreDi = injectable(logicModule.readHighScore, () => 5);
    const collidesDi = injectable(logicModule.collidesWithWorld, () => true);
    const writeHighScoreDi = injectable(logicModule.writeHighScore, jest.fn());

    const { container } = render(
      <DiProvider use={[readHighScoreDi, collidesDi, writeHighScoreDi]}>
        <Game />
      </DiProvider>
    );
    stepFrames(2);

    // ready -> playing
    const canvas = container.querySelector('canvas.game-canvas') as HTMLCanvasElement;
    fireEvent.mouseDown(canvas);
    // next frames run with collidesWithWorld mocked to true -> dead
    stepFrames(3);

    expect(screen.getByText(/Game over/i)).toBeInTheDocument();
    // Best comes from mocked readHighScore (5), score is 0 so it stays 5
    expect(screen.getByText('Best')).toBeInTheDocument();
    expect(writeHighScoreDi).not.toHaveBeenCalled();
  });

  it('uses magnetic-di to mock drawing (canvas still runs)', () => {
    const drawSkyDi = injectable(drawModule.drawSky, jest.fn());
    render(
      <DiProvider use={[drawSkyDi]}>
        <Game />
      </DiProvider>
    );
    stepFrames(2);
    expect(drawSkyDi).toHaveBeenCalled();
  });
});
