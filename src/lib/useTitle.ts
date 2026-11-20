import { useEffect } from 'react';

const SITE = 'Learn Database';

/** Đặt tiêu đề của tab theo trang đang mở, để lịch sử và dấu trang dễ nhận ra. */
export function useTitle(title?: string | null): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
  }, [title]);
}
