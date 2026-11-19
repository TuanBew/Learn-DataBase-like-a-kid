/**
 * Hiệu ứng âm thanh kiểu game, tạo bằng Web Audio. Không có file âm thanh nào.
 * Chỉ phát tiếng sau lần chạm hoặc gõ phím đầu tiên, đúng luật autoplay của browser.
 */

export type SfxName =
  | 'tap' // bấm nút
  | 'pop' // một thứ hiện ra
  | 'tick' // máy soi chấm một row đạt
  | 'drop' // row rơi
  | 'fly' // row bay vào hộp hoặc vào table
  | 'whoosh' // nhiều thứ đổi chỗ
  | 'gate' // cổng đóng
  | 'ting' // xong một bước
  | 'bonk' // bị bật ra
  | 'ok' // chạy đúng
  | 'bad' // chạy sai
  | 'hint' // mở gợi ý
  | 'lesson' // xong bài
  | 'chapter' // xong chương
  | 'alarm'; // UPDATE quên WHERE

const KEY = 'ldb:muted';
const VOLUME = 0.22;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlocked = false;
let muted = false;
const listeners = new Set<(m: boolean) => void>();

try {
  muted = localStorage.getItem(KEY) === '1';
} catch {
  /* không đọc được localStorage thì coi như đang bật tiếng */
}

function unlock() {
  unlocked = true;
  window.removeEventListener('pointerdown', unlock);
  window.removeEventListener('keydown', unlock);
}
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

function audio(): AudioContext | null {
  if (!unlocked || muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = VOLUME;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem(KEY, m ? '1' : '0');
  } catch {
    /* bỏ qua */
  }
  listeners.forEach((f) => f(m));
}

export function onMuteChange(f: (m: boolean) => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

/* ---------- viên gạch âm thanh ---------- */

interface Tone {
  type?: OscillatorType;
  /** Tần số đầu và cuối (Hz). */
  f: [number, number] | number;
  /** Bắt đầu sau bao nhiêu giây. */
  at?: number;
  /** Dài bao nhiêu giây. */
  dur: number;
  vol?: number;
}

function tone(ac: AudioContext, t: Tone) {
  const t0 = ac.currentTime + (t.at ?? 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = t.type ?? 'sine';
  const [f0, f1] = typeof t.f === 'number' ? [t.f, t.f] : t.f;
  osc.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + t.dur);
  const v = t.vol ?? 1;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + t.dur);
  osc.connect(g).connect(master!);
  osc.start(t0);
  osc.stop(t0 + t.dur + 0.03);
}

let noiseBuf: AudioBuffer | null = null;
function noise(ac: AudioContext, o: { at?: number; dur: number; f: [number, number]; q?: number; vol?: number; type?: BiquadFilterType }) {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = ac.currentTime + (o.at ?? 0);
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const filt = ac.createBiquadFilter();
  filt.type = o.type ?? 'bandpass';
  filt.Q.value = o.q ?? 1.2;
  filt.frequency.setValueAtTime(o.f[0], t0);
  filt.frequency.exponentialRampToValueAtTime(o.f[1], t0 + o.dur);
  const g = ac.createGain();
  const v = o.vol ?? 0.6;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + o.dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  src.connect(filt).connect(g).connect(master!);
  src.start(t0);
  src.stop(t0 + o.dur + 0.03);
}

const NOTE = { C4: 261.6, E4: 329.6, G4: 392, A4: 440, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, C6: 1046.5, E6: 1318.5 };

const RECIPES: Record<SfxName, (ac: AudioContext) => void> = {
  tap: (ac) => tone(ac, { f: [520, 360], dur: 0.06, vol: 0.5 }),
  pop: (ac) => tone(ac, { f: [280, 880], dur: 0.09, vol: 0.7 }),
  tick: (ac) => {
    tone(ac, { type: 'triangle', f: 1320, dur: 0.05, vol: 0.35 });
    tone(ac, { type: 'triangle', f: 1760, at: 0.04, dur: 0.06, vol: 0.3 });
  },
  drop: (ac) => {
    tone(ac, { f: [520, 110], dur: 0.22, vol: 0.7 });
    noise(ac, { at: 0.18, dur: 0.08, f: [300, 120], type: 'lowpass', vol: 0.5 });
  },
  fly: (ac) => tone(ac, { type: 'triangle', f: [380, 820], dur: 0.14, vol: 0.5 }),
  whoosh: (ac) => noise(ac, { dur: 0.3, f: [350, 2400], q: 0.9, vol: 0.7 }),
  gate: (ac) => {
    noise(ac, { dur: 0.16, f: [900, 200], type: 'lowpass', vol: 0.8 });
    tone(ac, { type: 'square', f: [140, 70], dur: 0.16, vol: 0.35 });
    tone(ac, { type: 'square', f: [110, 60], at: 0.17, dur: 0.14, vol: 0.3 });
  },
  ting: (ac) => {
    tone(ac, { type: 'triangle', f: NOTE.E6, dur: 0.45, vol: 0.45 });
    tone(ac, { f: NOTE.E6 * 1.5, dur: 0.3, vol: 0.15 });
  },
  bonk: (ac) => {
    tone(ac, { type: 'square', f: [190, 80], dur: 0.13, vol: 0.4 });
    tone(ac, { f: [240, 90], dur: 0.16, vol: 0.6 });
  },
  ok: (ac) => [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => tone(ac, { type: 'triangle', f, at: i * 0.08, dur: 0.2, vol: 0.5 })),
  bad: (ac) => {
    tone(ac, { f: NOTE.E4, dur: 0.16, vol: 0.5 });
    tone(ac, { f: NOTE.C4, at: 0.15, dur: 0.24, vol: 0.5 });
  },
  hint: (ac) => {
    tone(ac, { type: 'triangle', f: NOTE.A5, dur: 0.1, vol: 0.4 });
    tone(ac, { type: 'triangle', f: NOTE.E6, at: 0.08, dur: 0.2, vol: 0.4 });
  },
  lesson: (ac) =>
    [NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) =>
      tone(ac, { type: 'triangle', f, at: i * 0.09, dur: i === 6 ? 0.5 : 0.16, vol: 0.5 }),
    ),
  chapter: (ac) => {
    [NOTE.C5, NOTE.C5, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5, NOTE.G5].forEach((f, i) => tone(ac, { type: 'triangle', f, at: i * 0.11, dur: 0.18, vol: 0.5 }));
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f) => tone(ac, { type: 'triangle', f, at: 0.8, dur: 0.9, vol: 0.3 }));
  },
  alarm: (ac) => {
    for (let i = 0; i < 6; i++) tone(ac, { type: 'square', f: i % 2 ? 660 : 880, at: i * 0.16, dur: 0.15, vol: 0.3 });
  },
};

/** Phát một hiệu ứng. Không làm gì nếu đang tắt tiếng hoặc người học chưa chạm vào trang. */
export function play(name: SfxName): void {
  const ac = audio();
  if (!ac || !master) return;
  try {
    RECIPES[name](ac);
  } catch {
    /* âm thanh lỗi thì bỏ qua, không làm hỏng trang */
  }
}
