import type { Database } from '../engine/types';

/** Database mẫu, chỉ tải khi một bài cần tới. */
export type DbId = 'teashop' | 'teashop-big' | 'hr';

export const databases: Record<DbId, () => Promise<Database>> = {
  teashop: () => import('./teashop').then((m) => m.teashop),
  // Hai database dưới đây sẽ có file riêng ở Mốc 2.
  'teashop-big': () => import('./teashop').then((m) => m.teashop),
  hr: () => import('./teashop').then((m) => m.teashop),
};
