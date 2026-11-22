import type { Database } from '../engine/types';

/** Một foreign key: column `column` của table `child` trỏ tới `refColumn` của table `parent`. */
export interface SchemaEdge {
  key: string;
  child: string;
  column: string;
  parent: string;
  refColumn: string;
  /** Foreign key trỏ về chính table đó, ví dụ employees.manager_id. */
  self: boolean;
}

/** Điều kiện nối, ví dụ `orders.customer_id = customers.customer_id`. */
export const conditionOf = (e: SchemaEdge) => `${e.child}.${e.column} = ${e.parent}.${e.refColumn}`;

/** Lấy mọi foreign key của database. Foreign key có tên column giống nhau hai phía (department_id = department_id) đứng trước. */
export function edgesOf(db: Database): SchemaEdge[] {
  const all = db.tables.flatMap((t) =>
    t.columns
      .filter((c) => c.fk)
      .map((c) => ({ key: `${t.name}.${c.name}`, child: t.name, column: c.name, parent: c.fk!.table, refColumn: c.fk!.column, self: c.fk!.table === t.name })),
  );
  return all.sort((a, b) => Number(b.column === b.refColumn) - Number(a.column === a.refColumn));
}

export interface SchemaPath {
  /** Các table trên đường đi, từ table đầu tới table cuối. */
  tables: string[];
  /** Foreign key nối từng cặp table kề nhau. */
  edges: SchemaEdge[];
}

/** Tìm đường ngắn nhất theo chiều rộng. Foreign key đi được cả hai chiều. Trả null nếu không có đường. */
export function findPath(edges: SchemaEdge[], from: string, to: string): SchemaPath | null {
  if (from === to) return { tables: [from], edges: [] };
  const prev = new Map<string, { table: string; edge: SchemaEdge }>();
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of edges) {
      if (e.self) continue;
      const next = e.child === cur ? e.parent : e.parent === cur ? e.child : null;
      if (!next || seen.has(next)) continue;
      seen.add(next);
      prev.set(next, { table: cur, edge: e });
      if (next === to) {
        const tables = [to];
        const used: SchemaEdge[] = [];
        for (let t = to; t !== from; ) {
          const p = prev.get(t)!;
          used.unshift(p.edge);
          tables.unshift(p.table);
          t = p.table;
        }
        return { tables, edges: used };
      }
      queue.push(next);
    }
  }
  return null;
}
