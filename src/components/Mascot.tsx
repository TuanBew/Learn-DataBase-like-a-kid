import type { ReactNode } from 'react';
import './mascot.css';

export type Mood = 'idle' | 'happy' | 'think' | 'wow' | 'panic' | 'cheer';

/** Tên của mascot, dùng cho người đọc màn hình. */
export const MASCOT_NAME = 'Bi';

/**
 * Bi: một chú robot nhỏ, thân là khối trụ database, đầu là màn hình.
 * Bi là người giữ kho, tức là hình ảnh của DBMS trong khóa học.
 */
export function Mascot({ mood = 'idle', size = 96, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const armsUp = mood === 'cheer' || mood === 'panic';
  const smileEyes = mood === 'happy' || mood === 'cheer';
  const wide = mood === 'wow' || mood === 'panic';
  const ink = 'var(--ink)';
  return (
    <svg className={`mascot mascot--${mood} ${className}`} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={MASCOT_NAME}>
      <ellipse cx="60" cy="111" rx="34" ry="6" fill={ink} opacity=".12" />
      {/* tay */}
      <g stroke={ink} strokeWidth="5" strokeLinecap="round" fill="none">
        {armsUp ? (
          <>
            <path d="M33 86 Q20 78 15 62" />
            <path d="M87 86 Q100 78 105 62" />
          </>
        ) : mood === 'think' ? (
          <>
            <path d="M33 88 Q22 92 19 102" />
            <path d="M87 88 Q102 86 88 72" />
          </>
        ) : (
          <>
            <path d="M33 88 Q22 92 19 102" />
            <path d="M87 88 Q98 92 101 102" />
          </>
        )}
      </g>
      {/* thân: khối trụ database */}
      <path d="M32 78 V102 A28 8 0 0 0 88 102 V78 Z" fill="var(--taro)" stroke={ink} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M32 90 A28 8 0 0 0 88 90" fill="none" stroke={ink} strokeWidth="2.5" />
      <ellipse cx="60" cy="78" rx="28" ry="8" fill="#f1eaff" stroke={ink} strokeWidth="3.5" />
      <circle cx="44" cy="101" r="2.8" fill="var(--matcha-deep)" stroke={ink} strokeWidth="1.4" />
      <circle cx="53" cy="103.5" r="2.8" fill="var(--mango)" stroke={ink} strokeWidth="1.4" />
      {/* ăng ten */}
      <path d="M60 22 V11" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
      <circle className="mascot__bulb" cx="60" cy="9" r="5.5" fill={mood === 'panic' ? 'var(--red)' : 'var(--mango)'} stroke={ink} strokeWidth="2.5" />
      {/* tai nghe hai bên */}
      <rect x="17" y="38" width="9" height="16" rx="4" fill="var(--taro-deep)" stroke={ink} strokeWidth="2.5" />
      <rect x="94" y="38" width="9" height="16" rx="4" fill="var(--taro-deep)" stroke={ink} strokeWidth="2.5" />
      {/* đầu: màn hình */}
      <rect x="24" y="20" width="72" height="52" rx="17" fill="#fff" stroke={ink} strokeWidth="3.5" />
      <rect x="31" y="27" width="58" height="38" rx="11" fill="var(--sky)" stroke={ink} strokeWidth="2" />
      {/* má */}
      <circle cx="40" cy="55" r="4.5" fill="var(--peach-deep)" opacity=".6" />
      <circle cx="80" cy="55" r="4.5" fill="var(--peach-deep)" opacity=".6" />
      {/* mắt */}
      {smileEyes ? (
        <g stroke={ink} strokeWidth="3.6" strokeLinecap="round" fill="none">
          <path d="M42 46 Q47.5 38 53 46" />
          <path d="M67 46 Q72.5 38 78 46" />
        </g>
      ) : (
        <g className="mascot__eyes">
          <ellipse cx={mood === 'think' ? 49 : 47.5} cy={mood === 'think' ? 41 : 44} rx={wide ? 6.5 : 5} ry={wide ? 7.5 : 6.5} fill={ink} />
          <ellipse cx={mood === 'think' ? 74 : 72.5} cy={mood === 'think' ? 41 : 44} rx={wide ? 6.5 : 5} ry={wide ? 7.5 : 6.5} fill={ink} />
          <circle cx={mood === 'think' ? 50.5 : 49} cy={mood === 'think' ? 38.5 : 41.5} r="1.8" fill="#fff" />
          <circle cx={mood === 'think' ? 75.5 : 74} cy={mood === 'think' ? 38.5 : 41.5} r="1.8" fill="#fff" />
        </g>
      )}
      {/* miệng */}
      {mood === 'idle' && <path d="M54 54 Q60 59 66 54" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" />}
      {(mood === 'happy' || mood === 'cheer') && <path d="M52 52 Q60 63 68 52 Z" fill={ink} stroke={ink} strokeWidth="2" strokeLinejoin="round" />}
      {mood === 'think' && <path d="M55 56 H65" stroke={ink} strokeWidth="3" strokeLinecap="round" />}
      {mood === 'wow' && <ellipse cx="60" cy="56" rx="3.6" ry="4.6" fill={ink} />}
      {mood === 'panic' && <path d="M50 56 q3.3 -4 6.6 0 t6.6 0 t6.6 0" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" />}
      {mood === 'panic' && (
        <g fill="var(--sky)" stroke={ink} strokeWidth="1.5">
          <path d="M106 24 q5 8 0 11 q-5 -3 0 -11z" />
          <path d="M13 22 q4 7 0 9 q-4 -2 0 -9z" />
        </g>
      )}
      {mood === 'cheer' && (
        <g stroke="var(--mango-deep)" strokeWidth="2.6" strokeLinecap="round">
          <path d="M46 6 l-5 -4 M74 6 l5 -4 M60 -1 v-5" />
        </g>
      )}
    </svg>
  );
}

/** Bi nói một câu trong bong bóng. */
export function Says({ mood = 'idle', size = 64, children, className = '' }: { mood?: Mood; size?: number; children: ReactNode; className?: string }) {
  return (
    <div className={`says ${className}`}>
      <Mascot mood={mood} size={size} />
      <div className="says__bubble" aria-live="polite">
        {children}
      </div>
    </div>
  );
}
