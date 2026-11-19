import type { PlaygroundBlock } from '../content/types';

/** Tạm thời: phần "Thử tay ngay". Bản đầy đủ có editor và Query Theater. */
export default function Playground({ block }: { block: PlaygroundBlock }) {
  return <pre className="ex-editor__wait">{block.sql.mysql ?? block.sql.oracle}</pre>;
}
