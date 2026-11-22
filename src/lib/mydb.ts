import type { Database } from '../engine/types';

/**
 * "Database của bạn": database người học dựng qua các bài tập dựng table, lưu ở localStorage.
 * Đổi cấu trúc dữ liệu lưu thì tăng `MYDB_VERSION`. Dữ liệu hỏng hoặc khác phiên bản coi như chưa có.
 */
export const MYDB_KEY = 'ldb:mydb';
export const MYDB_VERSION = 1;

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Đọc database đã lưu. Trả null khi chưa có, hỏng, hoặc không đọc được localStorage. */
export function loadMyDb(): Database | null {
  try {
    const raw = localStorage.getItem(MYDB_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.v !== MYDB_VERSION || !isRecord(data.db)) return null;
    const db = data.db;
    if (typeof db.name !== 'string' || !Array.isArray(db.tables)) return null;
    for (const t of db.tables) if (!isRecord(t) || typeof t.name !== 'string' || !Array.isArray(t.columns) || !Array.isArray(t.rows)) return null;
    return db as unknown as Database;
  } catch {
    return null;
  }
}

/** Lưu database. Trả false khi không ghi được. */
export function saveMyDb(db: Database): boolean {
  try {
    localStorage.setItem(MYDB_KEY, JSON.stringify({ v: MYDB_VERSION, db }));
    return true;
  } catch {
    return false;
  }
}

export function clearMyDb(): void {
  try {
    localStorage.removeItem(MYDB_KEY);
  } catch {
    /* không xóa được thì thôi */
  }
}

/** Database trống của công ty Sao Mai: chỗ bắt đầu của mọi bài dựng table. */
export const emptyDb = (): Database => ({ name: 'saomai', tables: [] });
