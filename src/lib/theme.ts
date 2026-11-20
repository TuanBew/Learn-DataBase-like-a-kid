/** Giao diện sáng (vở ô ly) hoặc tối (bảng đen). Lựa chọn lưu trên máy, mặc định là sáng. */
export type Theme = 'light' | 'dark';

const KEY = 'ldb:theme';
const META: Record<Theme, string> = { light: '#fdfcf7', dark: '#1c2824' };
const listeners = new Set<(t: Theme) => void>();

function read(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

let theme: Theme = typeof window === 'undefined' ? 'light' : read();

function apply(t: Theme): void {
  if (typeof document === 'undefined') return;
  if (t === 'dark') document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[t]);
}
apply(theme);

export function getTheme(): Theme {
  return theme;
}

export function setTheme(t: Theme): void {
  theme = t;
  apply(t);
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* không ghi được thì lựa chọn chỉ giữ tới khi đóng trang */
  }
  listeners.forEach((f) => f(t));
}

export function onThemeChange(f: (t: Theme) => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}
