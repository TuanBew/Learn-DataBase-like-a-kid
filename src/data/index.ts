import type { Database } from '../engine/types';

/** Database mẫu, chỉ tải khi một bài cần tới. */
export type DbId = 'teashop' | 'teashop-big' | 'hr';

export const databases: Record<DbId, () => Promise<Database>> = {
  teashop: () => import('./teashop').then((m) => m.teashop),
  'teashop-big': () => import('./teashop-big').then((m) => m.teashopBig),
  hr: () => import('./hr').then((m) => m.hr),
};
