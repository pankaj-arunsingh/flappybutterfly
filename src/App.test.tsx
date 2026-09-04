import { render, screen } from '@testing-library/react';
import App from './App';

function mockCanvasAndLoop() {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  const raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  const caf = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  return { raf, caf };
}

describe('App', () => {
  beforeEach(() => {
    mockCanvasAndLoop();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders Flappy Butterfly ready screen', () => {
    render(<App />);
    expect(screen.getByText(/Flappy Butterfly/i)).toBeInTheDocument();
    expect(screen.getByText(/Tap to fly/i)).toBeInTheDocument();
  });

  it('renders the game canvas', () => {
    const { container } = render(<App />);
    expect(container.querySelector('canvas.game-canvas')).toBeInTheDocument();
  });
});
