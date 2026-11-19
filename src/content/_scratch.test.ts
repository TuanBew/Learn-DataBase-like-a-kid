import { it } from 'vitest';
import { readFileSync } from 'node:fs';
import { databases } from '../data';
import { run } from '../engine';
it('scratch', async () => {
  const qs = JSON.parse(readFileSync('/tmp/claude-0/q.json', 'utf8')) as { db: 'teashop' | 'teashop-big'; d: 'mysql' | 'oracle'; sql: string }[];
  const out: string[] = [];
  for (const q of qs) {
    const db = await databases[q.db]();
    const r = run(q.sql, db, q.d);
    out.push('## ' + q.d + ' ' + q.sql.replace(/\n/g, ' '));
    if (!r.ok) out.push('ERR ' + r.error.code + ' ' + r.error.friendly);
    else {
      out.push(r.result.columns.join(' | ') + '  [' + r.result.rows.length + ' rows]');
      for (const row of r.result.rows.slice(0, 12)) out.push('  ' + row.join(' | '));
    }
  }
  console.log(out.join('\n'));
});
