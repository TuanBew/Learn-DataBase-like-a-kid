import type { Dialect } from '../../engine/types';
import type { BuildExercise } from '../types';

const semi = (s: string) => (s.trim().endsWith(';') ? s.trim() : `${s.trim()};`);

/** Nối lời giải của các bài dựng trước thành một đoạn lệnh, dùng làm `base` cho bài sau. */
export function chain(...list: BuildExercise[]): Partial<Record<Dialect, string>> {
  const out: Partial<Record<Dialect, string>> = {};
  for (const d of ['mysql', 'oracle'] as const) out[d] = list.map((e) => semi(e.solution[d] ?? '')).join('\n');
  return out;
}
