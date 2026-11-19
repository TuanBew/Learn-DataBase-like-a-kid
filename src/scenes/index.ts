import { type ComponentType, type LazyExoticComponent, lazy } from 'react';

/**
 * Danh mục cảnh motion của các bài học. Mỗi file `src/scenes/lesson/<id>.tsx` là một cảnh,
 * export default một component không nhận props. Tên file chính là `scene` ghi trong bài.
 * Mỗi cảnh là một chunk riêng, chỉ tải khi bài cần tới.
 */
const files = import.meta.glob<{ default: ComponentType }>('./lesson/*.tsx');

export const scenes: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  Object.entries(files).map(([path, load]) => [path.slice('./lesson/'.length, -'.tsx'.length), lazy(load)]),
);
