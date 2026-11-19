/**
 * Bài tập nào hiện ở cuối bài học nào. Mỗi chương một file trong `exercise-map/`, `export const map`.
 * Thêm file là tự có mặt, không cần sửa file này.
 */
const files = import.meta.glob<{ map: Record<string, string[]> }>('./exercise-map/*.ts', { eager: true });

export const exerciseMap: Record<string, string[]> = Object.assign({}, ...Object.values(files).map((m) => m.map));

/** Mọi bài tập của một chương, theo thứ tự bài học. */
export function exercisesOfChapter(chapter: number): string[] {
  return Object.entries(exerciseMap)
    .filter(([lesson]) => lesson.startsWith(`c${chapter}-`))
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, ids]) => ids);
}
