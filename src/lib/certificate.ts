import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Mascot } from '../components/Mascot';
import { chapters } from '../content/course';
import { uiCertificate as T } from '../content/ui-certificate';
import type { Progress } from './progress';

export const CERT_W = 1600;
export const CERT_H = 1130;
export const BOSS_IDS = chapters.map((c) => `c${c.id}-boss`);

export interface CertificateStatus {
  lessonsDone: number;
  lessonsTotal: number;
  bossDone: number;
  bossTotal: number;
  unlocked: boolean;
}

export function certificateStatus(progress: Progress): CertificateStatus {
  const ids = chapters.flatMap((c) => c.lessons.map((l) => l.id));
  const lessonsDone = ids.filter((id) => progress.lessons[id]).length;
  const bossDone = BOSS_IDS.filter((id) => {
    const e = progress.exercises[id];
    return Boolean(e && (e.mysql || e.oracle));
  }).length;
  return {
    lessonsDone,
    lessonsTotal: ids.length,
    bossDone,
    bossTotal: BOSS_IDS.length,
    unlocked: lessonsDone === ids.length && bossDone === BOSS_IDS.length,
  };
}

export function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export interface CertificateOptions {
  name: string;
  date: string;
  chapters: string[];
  preview: boolean;
}

const INK = '#2b1f6b';
const RED = '#e0392d';
const CHIP_COLORS = ['#ffd25e', '#c6e4a9', '#dccdf7', '#bfe6ec', '#ffc9b3'];

const F = {
  site: '800 44px "Baloo 2"',
  heading: '800 110px "Baloo 2"',
  giveTo: '500 34px "Be Vietnam Pro"',
  sentence: '500 36px "Be Vietnam Pro"',
  date: '500 30px "Be Vietnam Pro"',
  score: '400 120px "Patrick Hand"',
  praise: '400 44px "Patrick Hand"',
  previewMark: '800 150px "Baloo 2"',
  nameAt: (px: number) => `800 ${px}px "Baloo 2"`,
  chipAt: (px: number) => `700 ${px}px "JetBrains Mono"`,
};

const tokens = new WeakMap<HTMLCanvasElement, number>();
let mascotCache: HTMLImageElement | null = null;

/** Dựng Bi thành ảnh: lấy svg từ DOM ẩn, thay biến CSS bằng màu thật. Lỗi thì trả null. */
async function loadMascot(): Promise<HTMLImageElement | null> {
  if (mascotCache) return mascotCache;
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden';
  document.body.appendChild(host);
  const root = createRoot(host);
  let url = '';
  try {
    flushSync(() => root.render(createElement(Mascot, { mood: 'cheer', size: 220 })));
    const svg = host.querySelector('svg');
    if (!svg) return null;
    const style = getComputedStyle(document.documentElement);
    let markup = svg.outerHTML.replace(/var\((--[\w-]+)\)/g, (m, name: string) => style.getPropertyValue(name).trim() || m);
    if (!/xmlns=/.test(markup)) markup = markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('mascot'));
      img.src = url;
    });
    mascotCache = img;
    return img;
  } catch {
    return null;
  } finally {
    root.unmount();
    host.remove();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#fbfbf5';
  ctx.fillRect(0, 0, CERT_W, CERT_H);
  ctx.lineWidth = 1;
  for (const [step, color] of [
    [16, 'rgba(46,148,160,0.13)'],
    [80, 'rgba(46,148,160,0.26)'],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let x = 0; x <= CERT_W; x += step) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, CERT_H);
    }
    for (let y = 0; y <= CERT_H; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(CERT_W, y + 0.5);
    }
    ctx.stroke();
  }
}

/** Nét bút đỏ gạch dưới tên, hơi lượn. */
function drawUnderline(ctx: CanvasRenderingContext2D, cx: number, y: number, half: number): void {
  ctx.strokeStyle = RED;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - half, y + 3);
  ctx.bezierCurveTo(cx - half * 0.5, y - 5, cx - half * 0.1, y + 9, cx + half * 0.3, y + 1);
  ctx.bezierCurveTo(cx + half * 0.6, y - 5, cx + half * 0.85, y + 4, cx + half, y - 2);
  ctx.stroke();
}

/** Vòng tròn bút đỏ vẽ tay: hơi méo, hai đầu nét chồng lên nhau. */
function drawPenCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-8 * Math.PI) / 180);
  ctx.strokeStyle = '#b8261c';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = -0.5 + (i / steps) * (Math.PI * 2 + 0.9);
    const wob = 1 + 0.05 * Math.sin(t * 2 + 0.6) + 0.03 * Math.sin(t * 3) + (i / steps) * 0.06;
    const x = Math.cos(t) * r * 1.12 * wob;
    const y = Math.sin(t) * r * 0.94 * wob;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function layoutChips(ctx: CanvasRenderingContext2D, titles: string[]): { px: number; rows: { text: string; w: number }[][] } {
  const maxRow = 1340;
  const gap = 18;
  for (let px = 24; px >= 14; px -= 1) {
    ctx.font = F.chipAt(px);
    const padX = Math.round(px * 0.7);
    const items = titles.map((text) => ({ text, w: ctx.measureText(text).width + padX * 2 }));
    const total = (xs: typeof items) => xs.reduce((n, i) => n + i.w, 0) + gap * Math.max(0, xs.length - 1);
    let best: { k: number; worst: number } | null = null;
    for (let k = 1; k < items.length; k++) {
      const worst = Math.max(total(items.slice(0, k)), total(items.slice(k)));
      if (!best || worst < best.worst) best = { k, worst };
    }
    if (best && best.worst <= maxRow) return { px, rows: [items.slice(0, best.k), items.slice(best.k)] };
  }
  return { px: 14, rows: [titles.map((text) => ({ text, w: 200 }))] };
}

export async function drawCertificate(canvas: HTMLCanvasElement, opts: CertificateOptions): Promise<void> {
  const token = (tokens.get(canvas) ?? 0) + 1;
  tokens.set(canvas, token);
  const P = T.paper;
  const name = opts.preview ? P.previewName : opts.name.trim();
  const dateText = `${P.datePrefix} ${opts.date}`;
  const allText = [P.site, P.heading, P.giveTo, name, P.sentence, dateText, P.score, P.praise, P.preview, ...opts.chapters].join(' ');

  const loads = [F.site, F.heading, F.giveTo, F.nameAt(96), F.sentence, F.date, F.score, F.praise, F.chipAt(24), F.previewMark];
  try {
    await Promise.all(loads.map((f) => document.fonts.load(f, allText)));
  } catch {
    // font lỗi thì vẽ bằng font dự phòng
  }
  const mascot = await loadMascot();
  if (tokens.get(canvas) !== token) return;

  canvas.width = CERT_W;
  canvas.height = CERT_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  drawGrid(ctx);

  // khung: mặt bên cứng rồi khung chính
  const fx = 40;
  const fw = CERT_W - 80;
  const fh = CERT_H - 80 - 14;
  ctx.fillStyle = '#b7aee8';
  roundRect(ctx, fx, fx + 12, fw, fh, 28);
  ctx.fill();
  ctx.save();
  roundRect(ctx, fx, fx, fw, fh, 28);
  ctx.clip();
  drawGrid(ctx);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  roundRect(ctx, fx, fx, fw, fh, 28);
  ctx.stroke();

  const cx = CERT_W / 2;
  ctx.fillStyle = INK;
  ctx.font = F.site;
  ctx.fillText(P.site, cx, 150);
  ctx.font = F.heading;
  ctx.fillText(P.heading, cx, 270);

  ctx.fillStyle = '#4b4192';
  ctx.font = F.giveTo;
  ctx.fillText(P.giveTo, cx, 360);

  let px = 96;
  ctx.font = F.nameAt(px);
  while (px > 40 && ctx.measureText(name).width > 1200) {
    px -= 2;
    ctx.font = F.nameAt(px);
  }
  ctx.fillStyle = INK;
  ctx.fillText(name, cx, 470);
  const half = Math.max(150, Math.min(ctx.measureText(name).width, 1200) / 2 + 30);
  drawUnderline(ctx, cx, 495, half);

  ctx.fillStyle = INK;
  ctx.font = F.sentence;
  ctx.fillText(P.sentence, cx, 600);

  // chip chương
  const chips = layoutChips(ctx, opts.chapters);
  const chipH = Math.round(chips.px * 2.1);
  const gap = 18;
  let ci = 0;
  chips.rows.forEach((row, ri) => {
    const rowW = row.reduce((n, i) => n + i.w, 0) + gap * (row.length - 1);
    let x = cx - rowW / 2;
    const y = 672 + ri * (chipH + 22);
    for (const item of row) {
      ctx.fillStyle = CHIP_COLORS[ci % CHIP_COLORS.length] ?? '#ffd25e';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      roundRect(ctx, x, y, item.w, chipH, chipH / 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = F.chipAt(chips.px);
      ctx.textBaseline = 'middle';
      ctx.fillText(item.text, x + item.w / 2, y + chipH / 2 + 1);
      ctx.textBaseline = 'alphabetic';
      x += item.w + gap;
      ci++;
    }
  });

  // dưới trái: ngày
  ctx.fillStyle = INK;
  ctx.font = F.date;
  ctx.textAlign = 'left';
  ctx.fillText(dateText, 110, 1010);
  ctx.textAlign = 'center';

  // dưới phải: lời phê của cô giáo
  const circleX = 1390;
  const circleY = 905;
  drawPenCircle(ctx, circleX, circleY, 92);
  ctx.fillStyle = '#b8261c';
  ctx.font = F.score;
  ctx.textBaseline = 'middle';
  ctx.fillText(P.score, circleX, circleY + 6);
  ctx.textBaseline = 'alphabetic';
  ctx.font = F.praise;
  ctx.fillText(P.praise, circleX, circleY + 150);

  if (mascot) ctx.drawImage(mascot, 1110, 810, 220, 220);

  if (opts.preview) {
    ctx.save();
    ctx.translate(cx, CERT_H / 2 + 30);
    ctx.rotate((-18 * Math.PI) / 180);
    ctx.fillStyle = 'rgba(224,57,45,0.35)';
    ctx.font = F.previewMark;
    ctx.fillText(P.preview, 0, 0);
    ctx.restore();
  }
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
