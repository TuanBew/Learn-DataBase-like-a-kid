import type { Dialect, RunResult } from '../engine';
import type { RefGroup } from '../content/reference';

/**
 * Chạy ví dụ của một mục tra cứu. Mỗi lần chạy dựng một session mới, nên bấm Chạy nhiều lần vẫn ra cùng kết quả.
 * Nhóm tạo và sửa table chạy trên database trống. Các nhóm khác chạy trên database tiệm trà sữa.
 * Trả về kết quả của lệnh cuối, hoặc lỗi của lệnh đầu tiên bị lỗi.
 */
export async function runExample(group: RefGroup, sql: string, dialect: Dialect): Promise<RunResult> {
  const [engine, data] = await Promise.all([import('../engine'), group === 'create' ? null : import('../data/teashop')]);
  const db = data ? data.teashop : { name: 'hoc', tables: [] };
  const { results, failedAt } = engine.createSession(db, dialect).runScript(sql);
  const last = failedAt !== undefined ? results[failedAt] : results[results.length - 1];
  return last;
}
