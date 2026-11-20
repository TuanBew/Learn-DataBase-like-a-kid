import { useEffect, useRef, useState } from 'react';
import { uiApp } from '../content/ui-app';
import { Icon } from './Icon';
import './scroll-hint.css';

/**
 * Theo dõi một khung cuộn ngang: trả về `true` khi nội dung rộng hơn khung.
 * Dùng để báo cho người học biết table còn column nằm ngoài màn hình.
 */
export function useOverflowX<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [over, setOver] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOver(el.scrollWidth > el.clientWidth + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, []);
  return [ref, over] as const;
}

/** Một dòng nhỏ dưới table rộng: còn column ở bên phải, kéo ngang để xem. */
export function ScrollHint({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="scroll-hint">
      <Icon name="arrow" size={14} />
      {uiApp.scrollHint}
    </p>
  );
}
