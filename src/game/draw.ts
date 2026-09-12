import {
  BUTTERFLY_HEIGHT,
  BUTTERFLY_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_HEIGHT,
  NEAR_MISS_FLASH_FRAMES,
  PIPE_WIDTH,
  CELEBRATION_MEDAL_RADIUS,
} from './config';
import { Butterfly, Cloud, Confetti, FallingMedal, Medal, Particle, Pipe, Raindrop, Star, Weather } from './types';

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

const skyGradients = new WeakMap<CanvasRenderingContext2D, Partial<Record<Weather, CanvasGradient>>>();

export function drawSky(ctx: CanvasRenderingContext2D, weather: Weather = 'sunny') {
  let cache = skyGradients.get(ctx);
  if (!cache) {
    cache = {};
    skyGradients.set(ctx, cache);
  }
  let sky = cache[weather];
  if (!sky) {
    sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    if (weather === 'night') {
      sky.addColorStop(0, '#0b1026');
      sky.addColorStop(0.45, '#1a2040');
      sky.addColorStop(0.78, '#2a2a50');
      sky.addColorStop(1, '#1a1a3a');
    } else if (weather === 'storm') {
      sky.addColorStop(0, '#3a3e47');
      sky.addColorStop(0.45, '#5a5f68');
      sky.addColorStop(0.78, '#6e737b');
      sky.addColorStop(1, '#555a62');
    } else {
      sky.addColorStop(0, '#7ec8e8');
      sky.addColorStop(0.45, '#c5e8f7');
      sky.addColorStop(0.78, '#f7e7c3');
      sky.addColorStop(1, '#d7ef9f');
    }
    cache[weather] = sky;
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

const HILLS_PALETTE: Record<Weather, { far: string; near: string }> = {
  sunny: { far: '#8bc47a', near: '#6faf63' },
  night: { far: '#1a2535', near: '#121a28' },
  storm: { far: '#4a5058', near: '#3a4048' },
};

export function drawHills(ctx: CanvasRenderingContext2D, weather: Weather = 'sunny') {
  const palette = HILLS_PALETTE[weather];

  ctx.fillStyle = palette.far;
  ctx.beginPath();
  ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT - 40);
  ctx.quadraticCurveTo(120, GAME_HEIGHT - GROUND_HEIGHT - 90, 240, GAME_HEIGHT - GROUND_HEIGHT - 36);
  ctx.quadraticCurveTo(360, GAME_HEIGHT - GROUND_HEIGHT - 88, GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT - 30);
  ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
  ctx.lineTo(0, GAME_HEIGHT);
  ctx.fill();

  ctx.fillStyle = palette.near;
  ctx.beginPath();
  ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT - 10);
  ctx.quadraticCurveTo(140, GAME_HEIGHT - GROUND_HEIGHT - 55, 280, GAME_HEIGHT - GROUND_HEIGHT - 8);
  ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
  ctx.lineTo(0, GAME_HEIGHT - GROUND_HEIGHT);
  ctx.fill();
}

export function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud, weather: Weather = 'sunny') {
  if (weather === 'night') {
    ctx.fillStyle = 'rgba(30,40,60,0.75)';
  } else if (weather === 'storm') {
    ctx.fillStyle = 'rgba(55,60,70,0.88)';
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
  }
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
  const gapTop = pipe.gapY - pipe.gap / 2;
  const gapBottom = pipe.gapY + pipe.gap / 2;
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

const GROUND_PALETTE: Record<Weather, { base: string; topStrip: string; spikes: string; pebbles: string; lip: string }> = {
  sunny: { base: '#c9a227', topStrip: '#6a994e', spikes: '#386641', pebbles: '#e9c46a', lip: '#80b918' },
  night: { base: '#1a1a2a', topStrip: '#151520', spikes: '#0e0e18', pebbles: '#1e1e2e', lip: '#121220' },
  storm: { base: '#3a3530', topStrip: '#2e3328', spikes: '#22281e', pebbles: '#444030', lip: '#303828' },
};

export function drawGround(ctx: CanvasRenderingContext2D, offset: number, weather: Weather = 'sunny') {
  const y = GAME_HEIGHT - GROUND_HEIGHT;
  const palette = GROUND_PALETTE[weather];

  ctx.fillStyle = palette.base;
  ctx.fillRect(0, y, GAME_WIDTH, GROUND_HEIGHT);

  ctx.fillStyle = palette.topStrip;
  ctx.fillRect(0, y, GAME_WIDTH, 18);

  ctx.fillStyle = palette.spikes;
  for (let x = -offset % 24; x < GAME_WIDTH; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x + 24, y + 18);
    ctx.fill();
  }

  ctx.fillStyle = palette.pebbles;
  for (let x = -((offset * 0.6) % 16); x < GAME_WIDTH; x += 16) {
    ctx.fillRect(x, y + 28, 8, 6);
  }

  ctx.fillStyle = palette.lip;
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
  ctx.strokeStyle = '#fff';
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
    return '#7ee8fa';
  }
  return '#bbb';
}

export function drawConfetti(ctx: CanvasRenderingContext2D, confetti: Confetti[]) {
  confetti.forEach((piece) => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, piece.life / 50);
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);
    ctx.fillStyle = piece.color;
    ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
    ctx.restore();
  });
}

export function drawMedal(ctx: CanvasRenderingContext2D, falling: FallingMedal) {
  const radius = CELEBRATION_MEDAL_RADIUS;
  const color = medalColor(falling.medal);
  ctx.save();
  ctx.translate(falling.x, falling.y);
  ctx.rotate(falling.rotation);
  ctx.fillStyle = '#f15bb5';
  ctx.beginPath();
  ctx.moveTo(-28, -radius + 8);
  ctx.lineTo(-10, -radius - 58);
  ctx.lineTo(0, -radius + 4);
  ctx.lineTo(10, -radius - 58);
  ctx.lineTo(28, -radius + 8);
  ctx.closePath();
  ctx.fill();
  const gradient = ctx.createRadialGradient(-14, -16, 4, 0, 0, radius);
  gradient.addColorStop(0, '#fff3b0');
  gradient.addColorStop(0.35, color);
  gradient.addColorStop(1, '#7b2cbf');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff3b0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fffef6';
  ctx.font = 'bold 30px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(falling.medal === 'platinum' ? '★' : '✦', 0, 2);
  ctx.restore();
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    if (p.kind === 'popup' && p.text) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold ' + p.size + 'px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
      continue;
    }
    ctx.save();
    ctx.globalAlpha = p.kind === 'trail' ? alpha * 0.8 : alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawCombo(ctx: CanvasRenderingContext2D, combo: number) {
  if (combo < 1) {
    return;
  }
  const label = 'COMBO x' + (combo + 1);
  ctx.save();
  ctx.font = 'bold 20px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#5a189a';
  ctx.lineWidth = 4;
  ctx.strokeText(label, GAME_WIDTH - 14, 96);
  ctx.fillStyle = '#ffd166';
  ctx.fillText(label, GAME_WIDTH - 14, 96);
  ctx.restore();
}

export function drawNearMissFlash(ctx: CanvasRenderingContext2D, flash: number) {
  if (flash <= 0) {
    return;
  }
  const alpha = Math.max(0, Math.min(1, flash / NEAR_MISS_FLASH_FRAMES));
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha * 1.5);
  ctx.font = 'bold 30px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 5;
  const y = GAME_HEIGHT / 2 - 140;
  ctx.strokeText('Close!', GAME_WIDTH / 2, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Close!', GAME_WIDTH / 2, y);
  ctx.restore();
}

export function drawGapGuide(ctx: CanvasRenderingContext2D, pipe: Pipe, tick: number) {
  const pulse = (Math.sin(tick * 0.12) + 1) / 2;
  const x = GAME_WIDTH - 34 - pulse * 8;
  const y = pipe.gapY;
  ctx.save();
  ctx.globalAlpha = 0.65 + pulse * 0.35;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 14);
  ctx.lineTo(x + 4, y);
  ctx.lineTo(x - 10, y + 14);
  ctx.stroke();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(x + 4, y, 5 + pulse * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], tick: number, reducedMotion: boolean) {
  for (let i = 0; i < stars.length; i += 1) {
    const s = stars[i];
    const twinkle = reducedMotion ? 0.8 : 0.4 + 0.6 * Math.abs(Math.sin(tick * 0.04 + s.phase));
    ctx.save();
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = '#e8e8f0';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawMoon(ctx: CanvasRenderingContext2D) {
  const cx = GAME_WIDTH - 70;
  const cy = 65;
  ctx.save();
  ctx.fillStyle = '#e8e4d0';
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f1528';
  ctx.beginPath();
  ctx.arc(cx + 14, cy - 4, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawRain(ctx: CanvasRenderingContext2D, drops: Raindrop[]) {
  ctx.save();
  ctx.strokeStyle = 'rgba(180,200,220,0.5)';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < drops.length; i += 1) {
    const d = drops[i];
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - d.speed * 0.35 * 2, d.y + d.speed * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLightningFlash(ctx: CanvasRenderingContext2D, flash: number) {
  if (flash <= 0) return;
  const alpha = Math.min(0.35, flash / 8 * 0.35);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.restore();
}
