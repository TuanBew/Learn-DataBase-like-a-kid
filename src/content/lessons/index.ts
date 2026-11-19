import type { Lesson } from '../types';

/**
 * Mỗi bài học là một file `<id>.ts` trong thư mục này, export `lesson`.
 * Thêm file là bài tự có mặt trên site, không cần khai báo ở đâu khác.
 * Mỗi bài chỉ tải khi người học mở bài đó.
 */
const files = import.meta.glob<{ lesson: Lesson }>('./c*.ts');

export const lessons: Record<string, () => Promise<Lesson>> = Object.fromEntries(
  Object.entries(files).map(([path, load]) => [path.slice(2, -3), () => load().then((m) => m.lesson)]),
);
