import type { Exercise } from '../types';

/**
 * Mỗi bài tập là một file `<id>.ts` trong thư mục này, export `exercise`.
 * Thêm file là bài tự có mặt trên site. Mỗi bài chỉ tải khi người học mở bài đó.
 */
const files = import.meta.glob<{ exercise: Exercise }>('./c*.ts');

export const exercises: Record<string, () => Promise<Exercise>> = Object.fromEntries(
  Object.entries(files).map(([path, load]) => [path.slice(2, -3), () => load().then((m) => m.exercise)]),
);
