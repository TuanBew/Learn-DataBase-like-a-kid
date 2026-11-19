import type { Database } from '../engine/types';

/** Database mẫu, chỉ tải khi một bài cần tới. */
export const databases: Record<'teashop' | 'hr', () => Promise<Database>> = {
  teashop: () => import('./teashop').then((m) => m.teashop),
  hr: () => import('./teashop').then((m) => m.teashop),
};
