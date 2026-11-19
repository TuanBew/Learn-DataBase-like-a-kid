import './confetti.css';

const COLORS = ['var(--mango)', 'var(--matcha-deep)', 'var(--taro-deep)', 'var(--peach-deep)', 'var(--sky-deep)', 'var(--pearl)'];

/** Một chùm giấy vụn và trân châu bắn lên khi người học làm đúng. Phát một lần. */
export function Confetti({ count = 28 }: { count?: number }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.4;
        const dist = 90 + ((i * 53) % 110);
        return (
          <span
            key={i}
            className={i % 4 === 0 ? 'confetti__pearl' : 'confetti__bit'}
            style={{
              ['--dx' as string]: `${Math.cos(angle) * dist}px`,
              ['--dy' as string]: `${Math.sin(angle) * dist - 60}px`,
              ['--rot' as string]: `${(i * 97) % 720}deg`,
              background: COLORS[i % COLORS.length],
              animationDelay: `${(i % 6) * 18}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
