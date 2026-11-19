import { useEffect, useState } from 'react';

/** Tải một thứ bằng import động. Trả về undefined khi đang tải, null khi không có. */
export function useLoad<T>(loader: (() => Promise<T>) | undefined, key: string): T | null | undefined {
  const [state, setState] = useState<{ key: string; value: T | null } | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    if (!loader) {
      setState({ key, value: null });
      return;
    }
    loader()
      .then((value) => alive && setState({ key, value }))
      .catch(() => alive && setState({ key, value: null }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state?.key === key ? state.value : undefined;
}
