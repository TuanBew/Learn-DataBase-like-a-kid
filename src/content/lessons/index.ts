import type { Lesson } from '../types';

/** Mỗi bài học là một file riêng, chỉ tải khi người học mở bài đó. */
export const lessons: Record<string, () => Promise<Lesson>> = {
  'c1-b1': () => import('./c1-b1').then((m) => m.lesson),
};
