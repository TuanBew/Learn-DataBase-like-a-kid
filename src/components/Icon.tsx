const PATHS = {
  play: <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />,
  pause: (
    <>
      <rect x="6" y="5" width="4.5" height="14" rx="1" fill="currentColor" />
      <rect x="13.5" y="5" width="4.5" height="14" rx="1" fill="currentColor" />
    </>
  ),
  back: (
    <>
      <path d="M17 5.5v13L8 12z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
      <path d="M6 5v14" />
    </>
  ),
  next: (
    <>
      <path d="M7 5.5v13l9-6.5z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
      <path d="M18 5v14" />
    </>
  ),
  replay: (
    <>
      <path d="M5 12a7 7 0 1 0 2.2-5.1" />
      <path d="M4.5 4.5v4.2h4.2" />
    </>
  ),
  skip: (
    <>
      <path d="M4 6l6 6-6 6" />
      <path d="M12 6l6 6-6 6" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5L20 6.5" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  sound: (
    <>
      <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.6 7.6 0 0 1 0 11" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  reset: (
    <>
      <path d="M6 7h12l-1 13H7z" />
      <path d="M4 7h16M9.5 7V4h5v3" />
    </>
  ),
  moon: <path d="M19.5 14.2A8 8 0 0 1 9.8 4.5a8 8 0 1 0 9.7 9.7z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

/** Bộ icon nét vẽ tay, cùng độ dày với viền mực. */
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
