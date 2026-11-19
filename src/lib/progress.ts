import { useSyncExternalStore } from 'react';
import type { Dialect } from '../engine/types';

/**
 * Tiến trình học, lưu ở localStorage. Mọi số là mốc thời gian (ms) lúc xong.
 * Đổi cấu trúc thì tăng `CURRENT_VERSION` và thêm một nhánh trong `migrate`.
 */
export const STORAGE_KEY = 'ldb:progress';
export const CURRENT_VERSION = 1;
const CODE_PREFIX = 'LDB1-';

export interface ExerciseDone {
  mysql?: number;
  oracle?: number;
}

export interface Progress {
  v: 1;
  lessons: Record<string, number>;
  exercises: Record<string, ExerciseDone>;
  name?: string;
}

const DIALECTS: Dialect[] = ['mysql', 'oracle'];

const emptyProgress = (): Progress => ({ v: 1, lessons: {}, exercises: {} });
const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStamp = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/** Đưa dữ liệu của mọi phiên bản về phiên bản hiện tại. Dữ liệu không hiểu được thì trả về trạng thái trống. */
export function migrate(raw: unknown): Progress {
  const out = emptyProgress();
  if (!isRecord(raw)) return out;
  // Bản trước khi có trường `v` (v0) đã dùng cùng hình dạng với v1. Các bản sau đặt nhánh riêng ở đây.
  const lessons = isRecord(raw.lessons) ? raw.lessons : {};
  for (const [id, t] of Object.entries(lessons)) if (isStamp(t)) out.lessons[id] = t;
  const exercises = isRecord(raw.exercises) ? raw.exercises : {};
  for (const [id, e] of Object.entries(exercises)) {
    if (!isRecord(e)) continue;
    const done: ExerciseDone = {};
    for (const d of DIALECTS) if (isStamp(e[d])) done[d] = e[d];
    if (Object.keys(done).length > 0) out.exercises[id] = done;
  }
  if (typeof raw.name === 'string' && raw.name.trim()) out.name = raw.name.trim().slice(0, 60);
  return out;
}

/* ---------- Kho dữ liệu ---------- */

let cache: Progress = emptyProgress();
let lastRaw: string | null | undefined;
/** true khi ghi localStorage thất bại: giữ tiến trình trong bộ nhớ cho tới khi tải lại trang. */
let memoryOnly = false;
const listeners = new Set<() => void>();

function readRaw(): string | null | undefined {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return undefined;
  }
}

/** Snapshot giữ nguyên tham chiếu khi dữ liệu trong localStorage không đổi. */
export function getProgress(): Progress {
  if (memoryOnly) return cache;
  const raw = readRaw();
  if (raw === undefined) return cache; // không đọc được: giữ bản đang có
  if (raw === lastRaw) return cache;
  lastRaw = raw;
  if (raw === null) {
    cache = emptyProgress();
    return cache;
  }
  try {
    cache = migrate(JSON.parse(raw));
  } catch {
    cache = emptyProgress();
  }
  return cache;
}

function save(next: Progress): void {
  cache = next;
  const raw = JSON.stringify(next);
  try {
    localStorage.setItem(STORAGE_KEY, raw);
    lastRaw = raw;
    memoryOnly = false;
  } catch {
    memoryOnly = true;
  }
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) fn();
  };
  const hasWindow = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
  if (hasWindow) window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    if (hasWindow) window.removeEventListener('storage', onStorage);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress, getProgress);
}

/* ---------- Ghi và hỏi ---------- */

export function markLesson(id: string): void {
  const cur = getProgress();
  if (cur.lessons[id]) return;
  save({ ...cur, lessons: { ...cur.lessons, [id]: Date.now() } });
}

export function markExercise(id: string, dialect: Dialect): void {
  const cur = getProgress();
  if (cur.exercises[id]?.[dialect]) return;
  save({ ...cur, exercises: { ...cur.exercises, [id]: { ...cur.exercises[id], [dialect]: Date.now() } } });
}

export function isLessonDone(id: string): boolean {
  return Boolean(getProgress().lessons[id]);
}

/** Không truyền dialect: xong ở dialect nào cũng tính. */
export function isExerciseDone(id: string, dialect?: Dialect): boolean {
  const e = getProgress().exercises[id];
  if (!e) return false;
  return dialect ? Boolean(e[dialect]) : Boolean(e.mysql || e.oracle);
}

export function resetProgress(): void {
  save(emptyProgress());
}

/* ---------- Mã chuyển tiến trình giữa các máy ---------- */

interface Packed {
  v: 1;
  l?: Record<string, number>;
  e?: Record<string, [number, number]>; // [mysql, oracle], 0 là chưa xong
  n?: string;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function exportCode(): string {
  const p = getProgress();
  const packed: Packed = { v: 1 };
  if (Object.keys(p.lessons).length > 0) packed.l = p.lessons;
  const ex = Object.entries(p.exercises);
  if (ex.length > 0) packed.e = Object.fromEntries(ex.map(([id, d]) => [id, [d.mysql ?? 0, d.oracle ?? 0] as [number, number]]));
  if (p.name) packed.n = p.name;
  return CODE_PREFIX + toBase64Url(JSON.stringify(packed));
}

export type ImportResult = { ok: true; added: number } | { ok: false; reason: 'format' | 'version' };

/** Gộp mã vào tiến trình đang có. Giữ mốc sớm hơn, không xóa gì. Mã sai thì không đổi gì. */
export function importCode(code: string): ImportResult {
  const text = code.trim();
  if (!text.startsWith(CODE_PREFIX)) {
    return /^LDB\d+-/i.test(text) ? { ok: false, reason: 'version' } : { ok: false, reason: 'format' };
  }
  let incoming: Progress;
  try {
    const data: unknown = JSON.parse(fromBase64Url(text.slice(CODE_PREFIX.length)));
    if (!isRecord(data)) return { ok: false, reason: 'format' };
    if (typeof data.v === 'number' && data.v > CURRENT_VERSION) return { ok: false, reason: 'version' };
    if (data.v !== 1) return { ok: false, reason: 'format' };
    const exercises: Record<string, unknown> = {};
    if (data.e !== undefined) {
      if (!isRecord(data.e)) return { ok: false, reason: 'format' };
      for (const [id, pair] of Object.entries(data.e)) {
        if (!Array.isArray(pair)) return { ok: false, reason: 'format' };
        exercises[id] = { mysql: pair[0], oracle: pair[1] };
      }
    }
    if (data.l !== undefined && !isRecord(data.l)) return { ok: false, reason: 'format' };
    incoming = migrate({ lessons: data.l, exercises, name: data.n });
  } catch {
    return { ok: false, reason: 'format' };
  }

  const cur = getProgress();
  const next: Progress = { ...cur, lessons: { ...cur.lessons }, exercises: { ...cur.exercises } };
  let added = 0;
  const earlier = (a: number | undefined, b: number) => (a === undefined ? b : Math.min(a, b));
  for (const [id, t] of Object.entries(incoming.lessons)) {
    if (!next.lessons[id]) added++;
    next.lessons[id] = earlier(next.lessons[id], t);
  }
  for (const [id, done] of Object.entries(incoming.exercises)) {
    const merged: ExerciseDone = { ...next.exercises[id] };
    for (const d of DIALECTS) {
      const t = done[d];
      if (t === undefined) continue;
      if (!merged[d]) added++;
      merged[d] = earlier(merged[d], t);
    }
    next.exercises[id] = merged;
  }
  if (!next.name && incoming.name) next.name = incoming.name;
  if (JSON.stringify(next) !== JSON.stringify(cur)) save(next);
  return { ok: true, added };
}
