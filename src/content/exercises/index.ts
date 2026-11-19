import type { Exercise } from '../types';

/** Mỗi bài tập là một file riêng, chỉ tải khi người học mở bài đó. */
export const exercises: Record<string, () => Promise<Exercise>> = {
  'c3-e6': () => import('./c3-e6').then((m) => m.exercise),
};
