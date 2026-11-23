import type { Database, Dialect } from './types';
import { constraintsOf, pkOf, sameName } from './catalog';
import { dialectType } from './describe';

/** Cấu trúc database cho giao diện vẽ khung. Toàn JSON thuần. */

export interface SchemaColumn {
  name: string;
  /** Tên data type theo dialect đang dùng: `VARCHAR(50)`, `VARCHAR2(50)`, `DECIMAL(12,2)`. */
  type: string;
  nullable: boolean;
  /** Column nằm trong primary key (kể cả primary key ghép). */
  pk: boolean;
  /** Column có UNIQUE riêng cho một mình nó. */
  unique: boolean;
  identity: boolean;
  /** Giá trị DEFAULT viết như trong SQL: `'x'`, `0`, `CURRENT_TIMESTAMP`. */
  default?: string;
  fk?: { table: string; column: string; onDelete?: 'cascade' | 'set null' };
}

export interface SchemaTable {
  name: string;
  /** Số row hiện có. */
  rows: number;
  columns: SchemaColumn[];
  checks: { name?: string; expr: string }[];
  /** Chỉ có khi primary key gồm từ hai column. */
  primaryKey?: string[];
}

export interface SchemaSequence {
  name: string;
  start: number;
  increment: number;
  /** Số NEXTVAL vừa cấp. Chưa gọi lần nào thì không có. */
  last?: number;
}

export interface SchemaViewDef {
  name: string;
  /** Câu SELECT sau chữ AS, nguyên văn. */
  sql: string;
}

export interface SchemaView {
  dialect: Dialect;
  tables: SchemaTable[];
  sequences: SchemaSequence[];
  views: SchemaViewDef[];
}

export function schemaView(db: Database, d: Dialect): SchemaView {
  return {
    dialect: d,
    tables: db.tables.map((t) => {
      const cons = constraintsOf(t);
      const pk = pkOf(t);
      const columns = t.columns.map((c): SchemaColumn => {
        const inPk = !!pk?.columns.some((n) => sameName(n, c.name));
        const out: SchemaColumn = {
          name: c.name,
          type: dialectType(c, d).replace(/^[a-z]+/, (m) => (d === 'mysql' ? m.toUpperCase() : m)),
          nullable: !c.notNull && !inPk,
          pk: inPk,
          unique: cons.some((k) => k.kind === 'unique' && k.columns.length === 1 && sameName(k.columns[0], c.name)),
          identity: !!c.identity,
        };
        if (c.default !== undefined) out.default = c.default;
        for (const k of cons) {
          if (k.kind !== 'fk') continue;
          const i = k.columns.findIndex((n) => sameName(n, c.name));
          if (i >= 0) out.fk = { table: k.refTable, column: k.refColumns[i], ...(k.onDelete ? { onDelete: k.onDelete } : {}) };
        }
        return out;
      });
      const checks = cons.flatMap((k) => (k.kind === 'check' ? [{ name: k.name, expr: k.expr }] : []));
      return { name: t.name, rows: t.rows.length, columns, checks, ...(pk && pk.columns.length > 1 ? { primaryKey: [...pk.columns] } : {}) };
    }),
    sequences: (db.sequences ?? []).map((s) => ({ name: s.name, start: s.start, increment: s.increment, ...(s.last !== undefined ? { last: s.last } : {}) })),
    views: (db.views ?? []).map((v) => ({ name: v.name, sql: v.sql })),
  };
}
