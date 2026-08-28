import {
  BUTTERFLY_HEIGHT,
  BUTTERFLY_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_HEIGHT,
  PIPE_GAP,
  PIPE_WIDTH,
} from './config';
import { Butterfly, Cloud, Medal, Pipe } from './types';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawSky(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  sky.addColorStop(0, '#7ec8e8');
  sky.addColorStop(0.45, '#c5e8f7');
  sky.addColorStop(0.78, '#f7e7c3');
  sky.addColorStop(1, '#d7ef9f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

export function drawHills(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#8bc47a';
  ctx.beginPath();
  ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT - 40);
  ctx.quadraticCurveTo(120, GAME_HEIGHT - GROUND_HEIGHT - 90, 240, GAME_HEIGHT - GROUND_HEIGHT - 36);
  ctx.quadraticCurveTo(360, GAME_HEIGHT - GROUND_HEIGHT - 88, GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT - 30);
  ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
  ctx.lineTo(0, GAME_HEIGHT);
  ctx.fill();

  ctx.fillStyle = '#6faf63';
  ctx.beginPath();
  ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT - 10);
  ctx.quadraticCurveTo(140, GAME_HEIGHT - GROUND_HEIGHT - 55, 280, GAME_HEIGHT - GROUND_HEIGHT - 8);
  ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
  ctx.lineTo(0, GAME_HEIGHT - GROUND_HEIGHT);
  ctx.fill();
}

export function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud) {
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  const x = cloud.x;
  const y = cloud.y;
  const s = cloud.scale;
  ctx.beginPath();
  ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
  ctx.arc(x + 18 * s, y - 8 * s, 20 * s, 0, Math.PI * 2);
  ctx.arc(x + 38 * s, y, 16 * s, 0, Math.PI * 2);
  ctx.arc(x + 18 * s, y + 6 * s, 14 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlowerHead(ctx: CanvasRenderingContext2D, x: number, y: number, facing: 1 | -1) {
  const petals = 7;
  for (let i = 0; i < petals; i += 1) {
    const angle = (i / petals) * Math.PI * 2;
    ctx.fillStyle = i % 2 === 0 ? '#ff7eb6' : '#ffd166';
    ctx.beginPath();
    ctx.ellipse(
      x + Math.cos(angle) * 14,
      y + facing * 4 + Math.sin(angle) * 10,
      8,
      12,
      angle,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(x, y + facing * 2, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4a261';
  ctx.beginPath();
  ctx.arc(x, y + facing * 2, 4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPipe(ctx: CanvasRenderingContext2D, pipe: Pipe) {
  const gapTop = pipe.gapY - PIPE_GAP / 2;
  const gapBottom = pipe.gapY + PIPE_GAP / 2;
  const groundY = GAME_HEIGHT - GROUND_HEIGHT;

  const vine = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
  vine.addColorStop(0, '#2d6a4f');
  vine.addColorStop(0.35, '#52b788');
  vine.addColorStop(1, '#1b4332');

  ctx.fillStyle = vine;
  ctx.fillRect(pipe.x + 10, 0, PIPE_WIDTH - 20, gapTop - 18);
  ctx.fillRect(pipe.x + 10, gapBottom + 18, PIPE_WIDTH - 20, groundY - gapBottom - 18);

  ctx.fillStyle = '#40916c';
  roundRect(ctx, pipe.x, gapTop - 28, PIPE_WIDTH, 28, 8);
  ctx.fill();
  roundRect(ctx, pipe.x, gapBottom, PIPE_WIDTH, 28, 8);
  ctx.fill();

  ctx.strokeStyle = 'rgba(27, 67, 50, 0.35)';
  ctx.lineWidth = 2;
  for (let y = 18; y < gapTop - 28; y += 18) {
    ctx.beginPath();
    ctx.moveTo(pipe.x + 14, y);
    ctx.quadraticCurveTo(pipe.x + PIPE_WIDTH / 2, y + 8, pipe.x + PIPE_WIDTH - 14, y);
    ctx.stroke();
  }
  for (let y = gapBottom + 36; y < groundY - 8; y += 18) {
    ctx.beginPath();
    ctx.moveTo(pipe.x + 14, y);
    ctx.quadraticCurveTo(pipe.x + PIPE_WIDTH / 2, y + 8, pipe.x + PIPE_WIDTH - 14, y);
    ctx.stroke();
  }

  drawFlowerHead(ctx, pipe.x + PIPE_WIDTH / 2, gapTop - 8, -1);
  drawFlowerHead(ctx, pipe.x + PIPE_WIDTH / 2, gapBottom + 8, 1);
}

export function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
  const y = GAME_HEIGHT - GROUND_HEIGHT;
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, y, GAME_WIDTH, GROUND_HEIGHT);

  ctx.fillStyle = '#6a994e';
  ctx.fillRect(0, y, GAME_WIDTH, 18);

  ctx.fillStyle = '#386641';
  for (let x = -offset % 24; x < GAME_WIDTH; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x + 24, y + 18);
    ctx.fill();
  }

  ctx.fillStyle = '#e9c46a';
  for (let x = -((offset * 0.6) % 16); x < GAME_WIDTH; x += 16) {
    ctx.fillRect(x, y + 28, 8, 6);
  }

  ctx.fillStyle = '#80b918';
  ctx.fillRect(0, y + 18, GAME_WIDTH, 8);
}

export function drawButterfly(ctx: CanvasRenderingContext2D, butterfly: Butterfly, dead: boolean) {
  const flap = (Math.sin(butterfly.wing) + 1) / 2;
  const wingOpen = 0.35 + flap * 0.75;
  const rotation = dead ? Math.min(1.1, butterfly.vy / 10 + 0.4) : Math.max(-0.5, Math.min(0.7, butterfly.vy / 12));

  ctx.save();
  ctx.translate(butterfly.x + BUTTERFLY_WIDTH / 2, butterfly.y + BUTTERFLY_HEIGHT / 2);
  ctx.rotate(rotation);

  const drawWing = (side: number, color: string, spots: string) => {
    ctx.save();
    ctx.scale(side, wingOpen);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(-4, -8, 16, 18, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-2, 10, 12, 14, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spots;
    ctx.beginPath();
    ctx.arc(-8, -10, 4, 0, Math.PI * 2);
    ctx.arc(-6, 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawWing(-1, '#7b2cbf', '#ffd166');
  drawWing(1, '#9b5de5', '#f15bb5');

  ctx.fillStyle = '#2d1b4e';
  ctx.beginPath();
  ctx.ellipse(2, 0, 7, 13, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2d1b4e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(4, -12);
  ctx.quadraticCurveTo(10, -22, 16, -24);
  ctx.moveTo(4, -12);
  ctx.quadraticCurveTo(2, -22, -4, -26);
  ctx.stroke();
  ctx.fillStyle = '#f15bb5';
  ctx.beginPath();
  ctx.arc(16, -24, 2, 0, Math.PI * 2);
  ctx.arc(-4, -26, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(6, -4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(6.6, -4, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawScore(ctx: CanvasRenderingContext2D, score: number) {
  ctx.font = 'bold 42px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1b4332';
  ctx.lineWidth = 6;
  ctx.strokeText(String(score), GAME_WIDTH / 2, 64);
  ctx.fillStyle = '#fffef6';
  ctx.fillText(String(score), GAME_WIDTH / 2, 64);
}

export function medalColor(medal: Medal): string {
  if (medal === 'bronze') {
    return '#cd7f32';
  }
  if (medal === 'silver') {
    return '#c0c0c0';
  }
  if (medal === 'gold') {
    return '#ffd700';
  }
  if (medal === 'platinum') {
    return '#e5e4e2';
  }
  return '#bbb';
}
