import { describe, expect, it } from 'vitest';
import { run } from '../../engine';
import { teashop } from '../../data/teashop';
import { copy } from './dialect-table';

describe('cảnh dialect-table', () => {
  const runnable = copy.topics.filter((t) => t.run);

  it.each(runnable.map((t) => [t.id, t] as const))('%s: câu MySQL chạy ở MySQL', (_id, t) => {
    const r = run(t.mysql, teashop, 'mysql');
    expect(r.ok, r.ok ? '' : `${r.error.code} ${r.error.dbMessage}`).toBe(true);
  });

  it.each(runnable.map((t) => [t.id, t] as const))('%s: câu Oracle chạy ở Oracle', (_id, t) => {
    const r = run(t.oracle, teashop, 'oracle');
    expect(r.ok, r.ok ? '' : `${r.error.code} ${r.error.dbMessage}`).toBe(true);
  });

  it('chủ đề có id riêng và có chữ', () => {
    const ids = copy.topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of copy.topics) expect(t.say.length).toBeGreaterThan(10);
  });
});
