import type { ReactNode } from 'react';
import './chau.css';

export type Mood = 'idle' | 'happy' | 'think' | 'wow' | 'panic' | 'cheer';

/** Châu: một hạt trân châu đội mũ người giữ kho. Mascot của site. */
export function Chau({ mood = 'idle', size = 96, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const armsUp = mood === 'cheer' || mood === 'panic';
  const smileEyes = mood === 'happy' || mood === 'cheer';
  const wide = mood === 'wow' || mood === 'panic';
  return (
    <svg className={`chau chau--${mood} ${className}`} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Châu">
      {/* chân */}
      <ellipse cx="46" cy="110" rx="11" ry="5" fill="#2b1f6b" />
      <ellipse cx="76" cy="110" rx="11" ry="5" fill="#2b1f6b" />
      {/* tay */}
      <g stroke="#2b1f6b" strokeWidth="5" strokeLinecap="round" fill="none">
        {armsUp ? (
          <>
            <path d="M22 62 L8 40" />
            <path d="M98 62 L112 40" />
          </>
        ) : mood === 'think' ? (
          <>
            <path d="M22 70 L12 82" />
            <path d="M98 70 Q104 84 80 88" />
          </>
        ) : (
          <>
            <path d="M22 70 L10 80" />
            <path d="M98 70 L110 80" />
          </>
        )}
      </g>
      {/* thân: hạt trân châu */}
      <circle cx="60" cy="68" r="40" fill="#3a2623" stroke="#2b1f6b" strokeWidth="3.5" />
      <ellipse cx="42" cy="50" rx="11" ry="6" fill="#fff" opacity=".28" transform="rotate(-32 42 50)" />
      <circle cx="84" cy="88" r="5" fill="#fff" opacity=".1" />
      {/* má */}
      <circle cx="38" cy="78" r="6" fill="#ee7448" opacity=".55" />
      <circle cx="82" cy="78" r="6" fill="#ee7448" opacity=".55" />
      {/* mắt */}
      {smileEyes ? (
        <g stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M40 68 Q46 60 52 68" />
          <path d="M68 68 Q74 60 80 68" />
        </g>
      ) : (
        <g className="chau__eyes">
          <circle cx="46" cy="67" r={wide ? 9 : 7.5} fill="#fff" />
          <circle cx="74" cy="67" r={wide ? 9 : 7.5} fill="#fff" />
          <circle cx={mood === 'think' ? 49 : 47} cy={mood === 'think' ? 64 : 68} r={mood === 'panic' ? 2.2 : 3.6} fill="#2b1f6b" />
          <circle cx={mood === 'think' ? 77 : 75} cy={mood === 'think' ? 64 : 68} r={mood === 'panic' ? 2.2 : 3.6} fill="#2b1f6b" />
        </g>
      )}
      {/* miệng */}
      {mood === 'idle' && <path d="M52 84 Q60 91 68 84" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" />}
      {(mood === 'happy' || mood === 'cheer') && <path d="M50 82 Q60 98 70 82 Z" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />}
      {mood === 'think' && <path d="M54 87 L66 85" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />}
      {mood === 'wow' && <ellipse cx="60" cy="88" rx="5" ry="6.5" fill="#fff" />}
      {mood === 'panic' && <path d="M48 88 q4 -5 8 0 t8 0 t8 0" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" />}
      {mood === 'panic' && (
        <g fill="#bfe6ec" stroke="#2b1f6b" strokeWidth="1.5">
          <path d="M100 30 q5 8 0 11 q-5 -3 0 -11z" />
          <path d="M16 26 q4 7 0 9 q-4 -2 0 -9z" />
        </g>
      )}
      {/* mũ người giữ kho */}
      <path d="M26 40 Q60 6 94 40 L90 46 Q60 30 30 46 Z" fill="#ffd25e" stroke="#2b1f6b" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M22 46 Q60 28 98 46" stroke="#2b1f6b" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="27" r="4.5" fill="#e0392d" stroke="#2b1f6b" strokeWidth="2" />
    </svg>
  );
}

/** Châu nói một câu trong bong bóng. */
export function Says({ mood = 'idle', size = 64, children, className = '' }: { mood?: Mood; size?: number; children: ReactNode; className?: string }) {
  return (
    <div className={`says ${className}`}>
      <Chau mood={mood} size={size} />
      <div className="says__bubble" aria-live="polite">
        {children}
      </div>
    </div>
  );
}
