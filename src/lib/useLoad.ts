import { useEffect, useState } from 'react';

/** Những thứ đã tải xong, theo hàm tải. Nhờ vậy lần vẽ đầu có ngay dữ liệu, không phải vẽ khung trống trước. */
const loaded = new WeakMap<() => Promise<unknown>, unknown>();

/** Tải trước một thứ và nhớ lại, để `useLoad` trả về ngay ở lần vẽ đầu. */
export function preload<T>(loader: (() => Promise<T>) | undefined): Promise<T | undefined> {
  if (!loader) return Promise.resolve(undefined);
  return loader().then((value) => {
    loaded.set(loader, value);
    return value;
  });
}

/** Tải một thứ bằng import động. Trả về undefined khi đang tải, null khi không có. */
export function useLoad<T>(loader: (() => Promise<T>) | undefined, key: string): T | null | undefined {
  const [state, setState] = useState<{ key: string; value: T | null } | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    if (!loader) {
      setState({ key, value: null });
      return;
    }
    if (loaded.has(loader)) return;
    preload(loader)
      .then((value) => alive && setState({ key, value: value ?? null }))
      .catch(() => alive && setState({ key, value: null }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (loader && loaded.has(loader)) return loaded.get(loader) as T;
  return state?.key === key ? state.value : undefined;
}
