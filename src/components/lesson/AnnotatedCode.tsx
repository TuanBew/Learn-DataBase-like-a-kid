import { Rich } from '../Rich';

/** Tạm thời: đoạn code có chú thích. Bản đầy đủ cho bấm vào từng phần. */
export function AnnotatedCode({ title, intro, code }: { title: string; intro?: string; code: string; notes: { find: string; text: string }[] }) {
  return (
    <section>
      <h2>{title}</h2>
      {intro && (
        <p>
          <Rich text={intro} />
        </p>
      )}
      <pre>{code}</pre>
    </section>
  );
}
