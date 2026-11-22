import type { Dialect } from './types';
import {
  AGGREGATES,
  type AlterAction,
  type AlterTableStmt,
  type BinOp,
  type ClauseKind,
  type ColumnSpec,
  type CompareOp,
  type ConstraintSpec,
  type CreateSequenceStmt,
  type CreateTableStmt,
  type DeleteStmt,
  type DropSequenceStmt,
  type DropTableStmt,
  type Expr,
  type InsertStmt,
  type OrderItem,
  type SelectItem,
  type SelectStmt,
  type Statement,
  type TableRef,
  type TruncateStmt,
  type UpdateStmt,
} from './ast';
import type { ColumnType } from './types';
import { type OraCode, type Span, SqlError, syntaxError, unsupported } from './errors';
import { friendly } from './messages.vi';
import { type Token, tokenize } from './tokenizer';

/** Các chữ không được làm alias khi viết trần. */
const STOP = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET', 'FETCH', 'UNION', 'INTERSECT', 'MINUS',
  'EXCEPT', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'NATURAL', 'ON', 'USING', 'AND', 'OR', 'NOT', 'AS',
  'IN', 'IS', 'LIKE', 'BETWEEN', 'ASC', 'DESC', 'NULLS', 'BY', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'DISTINCT',
  'NULL', 'FOR', 'WITH', 'DIV', 'MOD',
]);

const CLAUSE_WORDS = new Set(['SELECT', 'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET', 'FETCH']);
const JOIN_WORDS = new Set(['JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'NATURAL']);
/** Chữ dùng được như một giá trị mà không cần ngoặc. */
const BARE = new Set(['SYSDATE', 'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'ROWNUM']);

/** Data type trong CREATE TABLE: tên, loại của engine, và dialect nào có. */
const TYPES: Record<string, { type: ColumnType; only?: Dialect; use?: string }> = {
  INT: { type: 'int' },
  INTEGER: { type: 'int' },
  SMALLINT: { type: 'int' },
  BIGINT: { type: 'int', only: 'mysql', use: 'NUMBER' },
  TINYINT: { type: 'int', only: 'mysql', use: 'NUMBER' },
  BOOLEAN: { type: 'int', only: 'mysql', use: 'NUMBER(1)' },
  DECIMAL: { type: 'decimal' },
  NUMERIC: { type: 'decimal' },
  FLOAT: { type: 'decimal' },
  DOUBLE: { type: 'decimal', only: 'mysql', use: 'NUMBER' },
  NUMBER: { type: 'decimal', only: 'oracle', use: 'INT hoặc DECIMAL' },
  CHAR: { type: 'text' },
  VARCHAR: { type: 'text' },
  TEXT: { type: 'text', only: 'mysql', use: 'VARCHAR2 hoặc CLOB' },
  VARCHAR2: { type: 'text', only: 'oracle', use: 'VARCHAR' },
  NVARCHAR2: { type: 'text', only: 'oracle', use: 'VARCHAR' },
  CLOB: { type: 'text', only: 'oracle', use: 'TEXT' },
  DATE: { type: 'date' },
  DATETIME: { type: 'datetime', only: 'mysql', use: 'DATE hoặc TIMESTAMP' },
  TIMESTAMP: { type: 'datetime' },
};
const OUTSIDE = new Set(['WITH', 'GRANT', 'REVOKE', 'MERGE', 'EXPLAIN', 'SHOW', 'DESCRIBE', 'DESC', 'USE', 'SET', 'CALL']);
const COMPARE = new Set(['=', '<>', '<', '<=', '>', '>=']);

export function parse(sql: string, dialect: Dialect): Statement {
  return new Parser(sql, dialect).statement();
}

class Parser {
  private toks: Token[];
  private i = 0;
  private sql: string;
  private d: Dialect;

  constructor(sql: string, dialect: Dialect) {
    this.sql = sql;
    this.d = dialect;
    this.toks = tokenize(sql, dialect);
  }

  /* ---------- tiện ích ---------- */

  private get tok(): Token {
    return this.toks[this.i];
  }
  private get prev(): Token {
    return this.toks[Math.max(0, this.i - 1)];
  }
  private peek(n = 1): Token {
    return this.toks[Math.min(this.i + n, this.toks.length - 1)];
  }
  private isW(w: string, t: Token = this.tok): boolean {
    return t.type === 'word' && t.value === w;
  }
  private isOp(o: string, t: Token = this.tok): boolean {
    return t.type === 'op' && t.value === o;
  }
  private eatW(w: string): boolean {
    if (this.isW(w)) {
      this.i++;
      return true;
    }
    return false;
  }
  private eatOp(o: string): boolean {
    if (this.isOp(o)) {
      this.i++;
      return true;
    }
    return false;
  }
  private show(t: Token = this.tok): string {
    return t.type === 'eof' ? 'chỗ kết thúc' : t.text;
  }
  /** Chỗ gạch chân: token hiện tại, hoặc token trước nếu đã hết câu. */
  private at(t: Token = this.tok): Span {
    if (t.type === 'eof') {
      const p = this.prev;
      return { s: p.s, e: p.e };
    }
    return { s: t.s, e: t.e };
  }
  private fail(ora: OraCode, hint: string, p: Record<string, string | number | undefined> = {}, t: Token = this.tok): SqlError {
    const span = this.at(t);
    // MySQL trích phần query từ đúng token lỗi, kể cả khi đã hết câu.
    if (this.d === 'mysql' && t.type === 'eof') {
      const err = syntaxError(this.d, this.sql, { s: this.sql.length, e: this.sql.length }, ora, hint, p);
      err.span = span;
      return err;
    }
    return syntaxError(this.d, this.sql, span, ora, hint, p);
  }
  private needW(w: string, ora: OraCode = '00905'): void {
    if (!this.eatW(w)) throw this.fail(ora, 'missing-keyword', { kw: w });
  }

  /* ---------- statement ---------- */

  statement(): Statement {
    const t = this.tok;
    if (t.type === 'eof') {
      throw new SqlError('syntax', this.d === 'mysql' ? '1065' : 'ORA-00900', this.d === 'mysql' ? 'ERROR 1065 (42000): Query was empty' : 'ORA-00900: invalid SQL statement', 'empty', friendly.empty({}), { s: 0, e: 0 });
    }
    // MySQL coi một dấu ; đứng một mình là query rỗng (đã kiểm trên MySQL 8.0.46).
    if (this.d === 'mysql' && this.sql.trim() === ';') {
      throw new SqlError('syntax', '1065', 'ERROR 1065 (42000): Query was empty', 'only-semicolon', friendly['only-semicolon']({}), this.at());
    }
    if (this.isW('SELECT')) {
      const stmt = this.select();
      this.end(stmt);
      return stmt;
    }
    const other = this.other();
    if (other) {
      this.end();
      return other;
    }
    if (t.type === 'word' && OUTSIDE.has(t.value)) throw unsupported(t.value, this.at());
    throw this.fail('00900', 'unexpected', { tok: this.show() });
  }

  /** Sau khi đọc xong query: chỉ còn được có một dấu ; */
  private end(stmt?: SelectStmt): void {
    if (this.eatOp(';')) {
      if (this.tok.type !== 'eof') throw this.fail('00933', 'multi-statement');
      return;
    }
    const t = this.tok;
    if (t.type === 'eof') return;
    if (this.isW('LIMIT') && this.d === 'oracle') throw this.fail('00933', 'limit-in-oracle');
    if ((this.isW('FETCH') || this.isW('OFFSET')) && this.d === 'mysql') throw this.fail('00933', 'fetch-in-mysql');
    if (t.type === 'word' && CLAUSE_WORDS.has(t.value)) {
      const kind = (t.value === 'GROUP' ? 'GROUP BY' : t.value === 'ORDER' ? 'ORDER BY' : t.value === 'OFFSET' ? 'FETCH' : t.value) as ClauseKind;
      const twice = stmt?.clauses.some((c) => c.kind === kind) ?? false;
      const last = this.d === 'mysql' ? 'LIMIT' : 'FETCH FIRST';
      throw this.fail('00933', twice ? 'clause-twice' : 'clause-order', { tok: t.value === 'GROUP' || t.value === 'ORDER' ? `${t.value} BY` : t.value, last });
    }
    if (t.type === 'word' && (t.value === 'UNION' || t.value === 'INTERSECT' || t.value === 'MINUS' || t.value === 'EXCEPT')) {
      throw unsupported(t.value, this.at());
    }
    throw this.fail('00933', 'unexpected', { tok: this.show() });
  }

  private select(): SelectStmt {
    const clauses: SelectStmt['clauses'] = [];
    const open = (kind: ClauseKind, s: number) => clauses.push({ kind, span: { s, e: s } });
    const close = () => {
      clauses[clauses.length - 1].span.e = this.prev.e;
    };

    const selTok = this.tok;
    this.i++;
    open('SELECT', selTok.s);
    let distinct = false;
    if (this.eatW('DISTINCT')) distinct = true;
    else this.eatW('ALL');

    const items: SelectItem[] = [];
    for (;;) {
      items.push(this.selectItem(items.length === 0 ? (distinct ? 'DISTINCT' : 'SELECT') : ','));
      if (!this.eatOp(',')) break;
    }
    close();

    const stmt: SelectStmt = { t: 'select', distinct, items, joins: [], clauses, span: { s: selTok.s, e: this.prev.e } };

    if (!this.isW('FROM')) {
      const t = this.tok;
      const done = t.type === 'eof' || this.isOp(';');
      if (done && this.d === 'mysql') return stmt;
      if (this.isOp(')') && this.d === 'mysql') return stmt;
      if (done) throw this.fail('00923', 'no-from-oracle');
      throw this.fail('00923', 'missing-from', { tok: this.show() });
    }

    // FROM
    const fromTok = this.tok;
    this.i++;
    open('FROM', fromTok.s);
    if (this.isOp('(')) throw unsupported('subquery trong FROM', this.at());
    stmt.from = this.tableRef();
    for (;;) {
      const jt = this.tok;
      if (this.eatOp(',')) {
        const ref = this.tableRef();
        stmt.joins.push({ kind: 'cross', ref, span: { s: jt.s, e: this.prev.e } });
        continue;
      }
      if (jt.type !== 'word' || !JOIN_WORDS.has(jt.value)) break;
      let kind: 'inner' | 'left' = 'inner';
      if (this.eatW('LEFT')) {
        kind = 'left';
        this.eatW('OUTER');
      } else if (!this.eatW('INNER') && !this.isW('JOIN')) {
        throw unsupported(`${jt.value} JOIN`, this.at());
      }
      if (!this.eatW('JOIN')) throw this.fail('00905', 'missing-keyword', { kw: 'JOIN' });
      const ref = this.tableRef();
      if (this.eatW('ON')) {
        this.ctx = 'ON';
        stmt.joins.push({ kind, ref, on: this.expr(), span: { s: jt.s, e: this.prev.e } });
      } else if (this.isW('USING')) {
        throw unsupported('USING', this.at());
      } else {
        // MySQL coi JOIN không có ON là ghép mọi row với mọi row. Oracle và LEFT JOIN thì bắt buộc có ON.
        if (this.d === 'oracle' || kind === 'left') throw this.fail('00905', 'join-needs-on', {}, this.tok);
        stmt.joins.push({ kind: 'cross', ref, span: { s: jt.s, e: this.prev.e } });
      }
    }
    close();

    if (this.isW('WHERE')) {
      const w = this.tok;
      this.i++;
      open('WHERE', w.s);
      this.ctx = 'WHERE';
      stmt.where = this.expr();
      close();
    }
    if (this.isW('GROUP')) {
      const g = this.tok;
      this.i++;
      if (!this.eatW('BY')) throw this.fail('00924', 'missing-by', { kw: 'GROUP' });
      open('GROUP BY', g.s);
      this.ctx = 'GROUP BY';
      const list: Expr[] = [];
      for (;;) {
        list.push(this.expr());
        this.ctx = ',';
        if (!this.eatOp(',')) break;
      }
      stmt.groupBy = list;
      close();
    }
    if (this.isW('HAVING')) {
      const h = this.tok;
      this.i++;
      open('HAVING', h.s);
      this.ctx = 'HAVING';
      stmt.having = this.expr();
      close();
    }

    if (this.isW('ORDER')) {
      const o = this.tok;
      this.i++;
      if (!this.eatW('BY')) throw this.fail('00924', 'missing-by', { kw: 'ORDER' });
      open('ORDER BY', o.s);
      this.ctx = 'ORDER BY';
      const list: OrderItem[] = [];
      for (;;) {
        const s = this.tok.s;
        if (list.length > 0) this.ctx = ',';
        const e = this.expr();
        let desc = false;
        if (this.eatW('DESC')) desc = true;
        else this.eatW('ASC');
        let nulls: OrderItem['nulls'];
        if (this.isW('NULLS')) {
          if (this.d === 'mysql') throw this.fail('00933', 'nulls-in-mysql');
          this.i++;
          if (this.eatW('FIRST')) nulls = 'FIRST';
          else if (this.eatW('LAST')) nulls = 'LAST';
          else throw this.fail('00905', 'missing-keyword', { kw: 'FIRST hoặc LAST' });
        }
        list.push({ e, desc, nulls, span: { s, e: this.prev.e } });
        if (!this.eatOp(',')) break;
      }
      stmt.orderBy = list;
      close();
    }

    if (this.isW('LIMIT') && this.d === 'mysql') {
      const l = this.tok;
      this.i++;
      open('LIMIT', l.s);
      const a = this.int('LIMIT');
      let count = a;
      let offset = 0;
      if (this.eatOp(',')) {
        offset = a;
        count = this.int(',');
      } else if (this.eatW('OFFSET')) {
        offset = this.int('OFFSET');
      }
      stmt.limit = { style: 'limit', count, offset, span: { s: l.s, e: this.prev.e } };
      close();
    } else if ((this.isW('OFFSET') || this.isW('FETCH')) && this.d === 'oracle') {
      const f = this.tok;
      open('FETCH', f.s);
      let offset = 0;
      let count: number | null = null;
      if (this.eatW('OFFSET')) {
        offset = this.int('OFFSET');
        if (!this.eatW('ROWS') && !this.eatW('ROW')) throw this.fail('00905', 'missing-keyword', { kw: 'ROWS' });
      }
      if (this.eatW('FETCH')) {
        if (!this.eatW('FIRST') && !this.eatW('NEXT')) throw this.fail('00905', 'missing-keyword', { kw: 'FIRST' });
        count = this.tok.type === 'num' ? this.int('FETCH FIRST') : 1;
        if (this.isW('PERCENT')) throw unsupported('FETCH FIRST theo PERCENT', this.at());
        if (!this.eatW('ROWS') && !this.eatW('ROW')) throw this.fail('00905', 'missing-keyword', { kw: 'ROWS' });
        if (this.isW('WITH')) throw unsupported('WITH TIES', this.at());
        this.needW('ONLY');
      }
      stmt.limit = { style: 'fetch', count, offset, span: { s: f.s, e: this.prev.e } };
      close();
    }
    stmt.span.e = this.prev.e;
    return stmt;
  }

  private int(after: string): number {
    const t = this.tok;
    if (t.type !== 'num' || !/^\d+$/.test(t.text)) {
      if (this.isOp('-')) throw this.fail('00933', 'negative-limit');
      throw this.fail('00936', t.type === 'eof' ? 'unexpected-end' : 'missing-expression', { after });
    }
    this.i++;
    return Number(t.text);
  }

  private selectItem(after: string): SelectItem {
    const s = this.tok.s;
    if (this.isOp('*')) {
      this.i++;
      return { e: null, span: { s, e: this.prev.e } };
    }
    if ((this.tok.type === 'word' || this.tok.type === 'qident') && this.isOp('.', this.peek()) && this.isOp('*', this.peek(2))) {
      const t = this.tok;
      this.i += 3;
      return { e: null, starTable: t.type === 'word' ? t.text : t.value, span: { s, e: this.prev.e } };
    }
    this.ctx = after;
    const e = this.expr();
    const item: SelectItem = { e, span: { s, e: this.prev.e } };
    const hadAs = this.eatW('AS');
    const a = this.tok;
    if (a.type === 'qident' || (a.type === 'word' && !STOP.has(a.value))) {
      this.i++;
      item.alias = a.type === 'word' ? a.text : a.value;
      item.aliasQuoted = a.type === 'qident';
    } else if (a.type === 'str') {
      if (this.d === 'oracle') throw this.fail('00923', 'alias-quote-oracle', { text: a.value });
      this.i++;
      item.alias = a.value;
      item.aliasQuoted = true;
    } else if (hadAs) {
      throw this.fail('00923', a.type === 'eof' ? 'unexpected-end' : 'missing-expression', { after: 'AS' });
    }
    item.span.e = this.prev.e;
    return item;
  }

  /* ---------- biểu thức ---------- */

  /** Chữ đứng ngay trước biểu thức đang đọc, để nói "Sau ... đang thiếu". */
  private ctx = 'SELECT';

  private expr(): Expr {
    return this.or();
  }

  private bin(op: BinOp, l: Expr, r: Expr, opTok: Token): Expr {
    return { t: 'bin', op, l, r, span: { s: l.span.s, e: r.span.e }, opSpan: { s: opTok.s, e: opTok.e } };
  }

  private or(): Expr {
    let l = this.and();
    for (;;) {
      const t = this.tok;
      if (this.isW('OR') || (this.d === 'mysql' && this.isOp('||'))) {
        this.i++;
        this.ctx = t.text.toUpperCase();
        l = this.bin('OR', l, this.and(), t);
      } else return l;
    }
  }

  private and(): Expr {
    let l = this.not();
    for (;;) {
      const t = this.tok;
      if (this.isW('AND') || (this.d === 'mysql' && this.isOp('&&'))) {
        this.i++;
        this.ctx = t.text.toUpperCase();
        l = this.bin('AND', l, this.not(), t);
      } else return l;
    }
  }

  private not(): Expr {
    if (this.isW('NOT')) {
      const t = this.tok;
      this.i++;
      this.ctx = 'NOT';
      const e = this.not();
      return { t: 'unary', op: 'NOT', e, span: { s: t.s, e: e.span.e } };
    }
    return this.predicate();
  }

  private predicate(): Expr {
    let l = this.add();
    for (;;) {
      const t = this.tok;
      if (t.type === 'op' && COMPARE.has(t.value)) {
        this.i++;
        this.ctx = t.text;
        l = this.bin(t.value as CompareOp, l, this.add(), t);
        continue;
      }
      if (this.isOp('<=>')) throw unsupported('phép so sánh <=>', this.at());
      if (this.isW('IS')) {
        this.i++;
        const not = this.eatW('NOT');
        if (!this.eatW('NULL')) throw this.fail('00908', 'missing-keyword', { kw: 'NULL' });
        l = { t: 'isnull', e: l, not, span: { s: l.span.s, e: this.prev.e } };
        continue;
      }
      let not = false;
      const save = this.i;
      if (this.isW('NOT') && ['IN', 'BETWEEN', 'LIKE'].includes(this.peek().value)) {
        this.i++;
        not = true;
      }
      if (this.eatW('IN')) {
        if (!this.eatOp('(')) throw this.fail('00906', 'missing-keyword', { kw: '(' });
        if (this.isW('SELECT')) {
          const q = this.select();
          if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
          l = { t: 'insub', e: l, q, not, span: { s: l.span.s, e: this.prev.e } };
          continue;
        }
        const list: Expr[] = [];
        this.ctx = 'IN (';
        for (;;) {
          list.push(this.add());
          this.ctx = ',';
          if (!this.eatOp(',')) break;
        }
        if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
        l = { t: 'in', e: l, list, not, span: { s: l.span.s, e: this.prev.e } };
        continue;
      }
      if (this.eatW('BETWEEN')) {
        this.ctx = 'BETWEEN';
        const lo = this.add();
        if (!this.eatW('AND')) throw this.fail('00905', 'missing-keyword', { kw: 'AND' });
        this.ctx = 'AND';
        const hi = this.add();
        l = { t: 'between', e: l, lo, hi, not, span: { s: l.span.s, e: hi.span.e } };
        continue;
      }
      if (this.eatW('LIKE')) {
        this.ctx = 'LIKE';
        const pat = this.add();
        if (this.isW('ESCAPE')) throw unsupported('ESCAPE trong LIKE', this.at());
        l = { t: 'like', e: l, pat, not, span: { s: l.span.s, e: pat.span.e } };
        continue;
      }
      this.i = save;
      return l;
    }
  }

  private add(): Expr {
    let l = this.mul();
    for (;;) {
      const t = this.tok;
      if (this.isOp('+') || this.isOp('-') || (this.d === 'oracle' && this.isOp('||'))) {
        this.i++;
        this.ctx = t.text;
        l = this.bin(t.value as BinOp, l, this.mul(), t);
      } else return l;
    }
  }

  private mul(): Expr {
    let l = this.unary();
    for (;;) {
      const t = this.tok;
      if (this.isOp('*') || this.isOp('/') || this.isOp('%')) {
        this.i++;
        this.ctx = t.text;
        l = this.bin(t.value as BinOp, l, this.unary(), t);
      } else if (this.d === 'mysql' && (this.isW('DIV') || this.isW('MOD'))) {
        if (this.isW('DIV')) throw unsupported('phép DIV', this.at());
        this.i++;
        this.ctx = 'MOD';
        l = this.bin('%', l, this.unary(), t);
      } else return l;
    }
  }

  private unary(): Expr {
    const t = this.tok;
    if (this.isOp('-') || this.isOp('+')) {
      this.i++;
      this.ctx = t.text;
      const e = this.unary();
      return { t: 'unary', op: t.value as '-' | '+', e, span: { s: t.s, e: e.span.e } };
    }
    if (this.isOp('!')) throw unsupported('dấu ! thay cho NOT', this.at());
    return this.primary();
  }

  private primary(): Expr {
    const t = this.tok;
    const span = { s: t.s, e: t.e };
    if (t.type === 'num') {
      this.i++;
      return { t: 'num', v: Number(t.text), span };
    }
    if (t.type === 'str') {
      this.i++;
      return { t: 'str', v: t.value, span };
    }
    if (t.type === 'qident') {
      this.i++;
      if (this.isOp('.')) {
        this.i++;
        const c = this.tok;
        if (c.type !== 'word' && c.type !== 'qident') throw this.fail('00936', 'missing-expression', { after: '.' });
        this.i++;
        return { t: 'col', table: t.value, name: c.type === 'word' ? c.text : c.value, quoted: c.type === 'qident', span: { s: t.s, e: c.e } };
      }
      return { t: 'col', name: t.value, quoted: true, span };
    }
    if (this.isOp('(')) {
      this.i++;
      if (this.isW('SELECT')) {
        const q = this.select();
        if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
        return { t: 'sub', q, span: { s: t.s, e: this.prev.e } };
      }
      this.ctx = '(';
      const e = this.expr();
      if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
      return { ...e, span: { s: t.s, e: this.prev.e } };
    }
    if (t.type === 'word') {
      const w = t.value;
      if (w === 'NULL') {
        this.i++;
        return { t: 'null', span };
      }
      if ((w === 'TRUE' || w === 'FALSE') && this.d === 'mysql') {
        this.i++;
        return { t: 'bool', v: w === 'TRUE', span };
      }
      if (w === 'DATE' && this.peek().type === 'str') {
        this.i += 2;
        return { t: 'date', v: this.prev.value, span: { s: t.s, e: this.prev.e } };
      }
      if (w === 'CASE') return this.caseExpr();
      if (w === 'EXISTS') throw unsupported('EXISTS', this.at());
      if (!STOP.has(w) || ((w === 'LEFT' || w === 'RIGHT' || w === 'MOD') && this.isOp('(', this.peek()))) {
        this.i++;
        if (this.isOp('(')) return this.call(t);
        if (BARE.has(w) && !this.isOp('.')) return { t: 'fn', name: w, args: [], bare: true, span, nameSpan: span };
        if (this.isOp('.')) {
          this.i++;
          const c = this.tok;
          if (c.type !== 'word' && c.type !== 'qident') throw this.fail('00936', 'missing-expression', { after: '.' });
          this.i++;
          // seq.NEXTVAL và seq.CURRVAL chỉ có ở Oracle. Ở MySQL, đây là column của một table tên seq.
          if (this.d === 'oracle' && c.type === 'word' && (c.value === 'NEXTVAL' || c.value === 'CURRVAL')) {
            return { t: 'seq', seq: t.text, which: c.value, span: { s: t.s, e: c.e }, seqSpan: span };
          }
          return { t: 'col', table: t.text, name: c.type === 'word' ? c.text : c.value, quoted: c.type === 'qident', span: { s: t.s, e: c.e } };
        }
        return { t: 'col', name: t.text, span };
      }
    }
    // Không có gì để đọc ở chỗ cần một giá trị.
    if (this.prev.type === 'op' && this.prev.value === ',' && (this.isW('FROM') || t.type === 'eof')) {
      // DBMS thật báo lỗi ở chữ đứng sau dấu phẩy. Site gạch chân dấu phẩy thừa cho dễ sửa.
      const err = this.fail('00936', 'trailing-comma', { tok: this.show() });
      err.span = { s: this.prev.s, e: this.prev.e };
      throw err;
    }
    if (t.type === 'eof' || this.isOp(';')) throw this.fail('00936', 'unexpected-end', { after: this.ctx });
    if (this.isOp(')') || this.isOp(',') || (t.type === 'word' && STOP.has(t.value))) {
      throw this.fail('00936', 'missing-expression', { after: this.ctx });
    }
    throw this.fail('00936', 'unexpected', { tok: this.show() });
  }

  private call(nameTok: Token): Expr {
    const name = nameTok.value;
    const nameSpan = { s: nameTok.s, e: nameTok.e };
    this.i++; // (
    if (name === 'EXTRACT') {
      const u = this.tok;
      if (u.type !== 'word') throw this.fail('00936', 'missing-expression', { after: 'EXTRACT(' });
      this.i++;
      this.needW('FROM');
      this.ctx = 'FROM';
      const arg = this.expr();
      if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
      return { t: 'fn', name, args: [arg], unit: u.value, span: { s: nameTok.s, e: this.prev.e }, nameSpan };
    }
    if (name === 'CAST' || name === 'CONVERT') throw unsupported(name, nameSpan);
    const args: Expr[] = [];
    let star = false;
    let distinct = false;
    if (AGGREGATES.has(name) && this.isOp('*')) {
      this.i++;
      star = true;
      if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
    } else if (!this.eatOp(')')) {
      if (AGGREGATES.has(name) && this.eatW('DISTINCT')) distinct = true;
      this.ctx = `${name}(`;
      for (;;) {
        args.push(this.expr());
        this.ctx = ',';
        if (!this.eatOp(',')) break;
      }
      if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
    }
    if (this.isW('OVER')) throw unsupported('window function', this.at());
    return { t: 'fn', name, args, star: star || undefined, distinct: distinct || undefined, span: { s: nameTok.s, e: this.prev.e }, nameSpan };
  }

  /* ---------- table và các lệnh sửa dữ liệu ---------- */

  private name(after: string): { text: string; quoted: boolean; span: Span } {
    const t = this.tok;
    if (!(t.type === 'qident' || (t.type === 'word' && !STOP.has(t.value)))) {
      throw this.fail('00903', t.type === 'eof' ? 'unexpected-end' : 'missing-expression', { after }, t);
    }
    this.i++;
    return { text: t.type === 'word' ? t.text : t.value, quoted: t.type === 'qident', span: { s: t.s, e: t.e } };
  }

  /** Tên table, có thể kèm alias. Oracle không cho viết AS trước alias. */
  private tableRef(alias = true): TableRef {
    const tt = this.tok;
    if (this.isOp('(')) throw unsupported('subquery trong FROM', this.at());
    if (!(tt.type === 'qident' || (tt.type === 'word' && !STOP.has(tt.value)))) throw this.fail('00903', 'no-table', {}, tt);
    this.i++;
    const ref: TableRef = { table: tt.type === 'word' ? tt.text : tt.value, quoted: tt.type === 'qident', span: { s: tt.s, e: tt.e } };
    if (this.isOp('.')) throw unsupported('tên table có dấu chấm', this.at());
    if (!alias) return ref;
    if (this.isW('AS')) {
      if (this.d === 'oracle') throw this.fail('00933', 'as-table-alias');
      this.i++;
      ref.alias = this.name('AS').text;
    } else if (this.tok.type === 'qident' || (this.tok.type === 'word' && !STOP.has(this.tok.value) && this.tok.value !== 'SET')) {
      ref.alias = this.tok.type === 'word' ? this.tok.text : this.tok.value;
      this.i++;
    }
    return ref;
  }

  private other(): Statement | null {
    const t = this.tok;
    if (t.type !== 'word') return null;
    const span = { s: t.s, e: t.e };
    switch (t.value) {
      case 'INSERT':
        return this.insert();
      case 'UPDATE':
        return this.update();
      case 'DELETE':
        return this.del();
      case 'CREATE': {
        const next = this.peek();
        if (this.isW('TABLE', next)) return this.createTable();
        // Sequence chỉ có ở Oracle. MySQL đọc tới chữ SEQUENCE thì báo lỗi cú pháp.
        if (this.isW('SEQUENCE', next) && this.d === 'oracle') return this.createSequence();
        if (this.isW('SEQUENCE', next)) {
          this.i++;
          throw this.fail('00900', 'sequence-mysql');
        }
        throw unsupported(`CREATE ${next.value}`, span);
      }
      case 'ALTER':
        if (!this.isW('TABLE', this.peek())) throw unsupported(`ALTER ${this.peek().value}`, span);
        return this.alterTable();
      case 'DROP': {
        const next = this.peek();
        if (this.isW('TABLE', next)) return this.dropTable();
        if (this.isW('SEQUENCE', next) && this.d === 'oracle') return this.dropSequence();
        if (this.isW('SEQUENCE', next)) {
          this.i++;
          throw this.fail('00900', 'sequence-mysql');
        }
        throw unsupported(`DROP ${next.value}`, span);
      }
      case 'TRUNCATE':
        return this.truncate();
      case 'COMMIT':
      case 'ROLLBACK':
        this.i++;
        this.eatW('WORK');
        return { t: t.value === 'COMMIT' ? 'commit' : 'rollback', span };
      case 'BEGIN':
      case 'START':
        if (this.d === 'oracle') return null;
        this.i++;
        if (t.value === 'START') this.needW('TRANSACTION');
        return { t: 'begin', span };
      default:
        return null;
    }
  }

  private insert(): InsertStmt {
    const s = this.tok.s;
    this.i++;
    this.needW('INTO', '00925');
    const table = this.tableRef(false);
    let columns: InsertStmt['columns'];
    if (this.eatOp('(')) {
      columns = [];
      for (;;) {
        const n = this.name('(');
        columns.push({ name: n.text, span: n.span });
        if (!this.eatOp(',')) break;
      }
      if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
    }
    if (this.isW('SELECT')) {
      const select = this.select();
      return { t: 'insert', table, columns, rows: [], select, span: { s, e: this.prev.e } };
    }
    this.needW('VALUES', '00926');
    const rows: InsertStmt['rows'] = [];
    for (;;) {
      const rs = this.tok.s;
      if (!this.eatOp('(')) throw this.fail('00906', 'missing-keyword', { kw: '(' });
      const values: Expr[] = [];
      this.ctx = 'VALUES (';
      for (;;) {
        values.push(this.valueOrDefault());
        this.ctx = ',';
        if (!this.eatOp(',')) break;
      }
      if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
      rows.push({ values, span: { s: rs, e: this.prev.e } });
      if (!this.isOp(',')) break;
      // Oracle 19c chỉ nhận một row cho mỗi câu INSERT ... VALUES.
      if (this.d === 'oracle') throw this.fail('00933', 'insert-multi-oracle');
      this.i++;
    }
    return { t: 'insert', table, columns, rows, span: { s, e: this.prev.e } };
  }

  /** Một giá trị trong VALUES hoặc SET. Từ khóa DEFAULT đứng một mình nghĩa là lấy giá trị mặc định của column. */
  private valueOrDefault(): Expr {
    const t = this.tok;
    if (this.isW('DEFAULT') && (this.isOp(',', this.peek()) || this.isOp(')', this.peek()) || this.peek().type === 'eof' || this.isOp(';', this.peek()) || this.isW('WHERE', this.peek()))) {
      this.i++;
      return { t: 'default', span: { s: t.s, e: t.e } };
    }
    return this.expr();
  }

  private update(): UpdateStmt {
    const s = this.tok.s;
    this.i++;
    const table = this.tableRef();
    if (!this.eatW('SET')) throw this.fail('00971', 'missing-keyword', { kw: 'SET' });
    const sets: UpdateStmt['sets'] = [];
    for (;;) {
      const n = this.name(sets.length === 0 ? 'SET' : ',');
      if (this.isOp('.')) {
        this.i++;
        const c = this.name('.');
        n.text = c.text;
        n.span = { s: n.span.s, e: c.span.e };
      }
      if (!this.eatOp('=')) throw this.fail('00927', 'missing-keyword', { kw: '=' });
      this.ctx = '=';
      sets.push({ name: n.text, span: n.span, e: this.valueOrDefault() });
      if (!this.eatOp(',')) break;
    }
    const stmt: UpdateStmt = { t: 'update', table, sets, span: { s, e: this.prev.e } };
    if (this.eatW('WHERE')) {
      this.ctx = 'WHERE';
      stmt.where = this.expr();
    }
    stmt.span.e = this.prev.e;
    return stmt;
  }

  private del(): DeleteStmt {
    const s = this.tok.s;
    this.i++;
    // Oracle cho bỏ chữ FROM, MySQL thì không.
    if (!this.eatW('FROM') && this.d === 'mysql') throw this.fail('00933', 'missing-keyword', { kw: 'FROM' });
    const table = this.tableRef();
    const stmt: DeleteStmt = { t: 'delete', table, span: { s, e: this.prev.e } };
    if (this.eatW('WHERE')) {
      this.ctx = 'WHERE';
      stmt.where = this.expr();
    }
    stmt.span.e = this.prev.e;
    return stmt;
  }

  /* ---------- DDL ---------- */

  /** Lấy nguyên văn một biểu thức trong ngoặc, dùng cho CHECK. */
  private parenText(): { text: string; span: Span } {
    if (!this.eatOp('(')) throw this.fail('00906', 'missing-keyword', { kw: '(' });
    const s = this.tok.s;
    this.ctx = 'CHECK (';
    this.expr();
    const e = this.prev.e;
    if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
    return { text: this.sql.slice(s, e), span: { s, e } };
  }

  /** Danh sách tên column trong ngoặc. */
  private columnList(): { name: string; span: Span }[] {
    if (!this.eatOp('(')) throw this.fail('00906', 'missing-keyword', { kw: '(' });
    const names = [this.name('(')];
    while (this.eatOp(',')) names.push(this.name(','));
    if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
    return names.map((n) => ({ name: n.text, span: n.span }));
  }

  /** `REFERENCES t (c)` rồi tới ON DELETE. Oracle cho bỏ phần (c): khi đó lấy primary key của table kia. */
  private references(columns: { name: string; span: Span }[], inline: boolean, name: { text: string; span: Span } | undefined, s: number): ConstraintSpec {
    const t = this.name('REFERENCES');
    const refCols = this.isOp('(') ? this.columnList() : [];
    if (refCols.length === 0 && this.d === 'mysql') throw this.fail('00906', 'missing-keyword', { kw: '(' });
    const ref: NonNullable<ConstraintSpec['ref']> = { table: t.text, tableSpan: t.span, columns: refCols };
    while (this.isW('ON')) {
      this.i++;
      if (this.eatW('DELETE')) {
        if (this.eatW('CASCADE')) ref.onDelete = 'cascade';
        else if (this.eatW('SET')) {
          this.needW('NULL', '00908');
          ref.onDelete = 'set null';
        } else if (this.d === 'mysql' && this.eatW('RESTRICT')) ref.onDelete = undefined;
        else if (this.d === 'mysql' && this.eatW('NO')) this.needW('ACTION');
        else throw this.fail('00905', 'missing-keyword', { kw: 'CASCADE hoặc SET NULL' });
      } else if (this.d === 'mysql' && this.isW('UPDATE')) {
        this.i++;
        if (this.eatW('RESTRICT')) continue;
        if (this.eatW('NO')) {
          this.needW('ACTION');
          continue;
        }
        throw unsupported('ON UPDATE CASCADE và ON UPDATE SET NULL', this.at());
      } else throw this.fail('00905', 'missing-keyword', { kw: 'DELETE' });
    }
    return { kind: 'fk', name: name?.text, nameSpan: name?.span, columns, ref, inline, span: { s, e: this.prev.e } };
  }

  /**
   * Một luật viết ở cấp table hoặc trong ALTER TABLE ADD: `[CONSTRAINT tên] PRIMARY KEY (...)`, UNIQUE, FOREIGN KEY, CHECK.
   * Trả về null với KEY và INDEX của MySQL: engine không có index riêng, nên đọc rồi bỏ qua.
   */
  private tableConstraint(): ConstraintSpec | null {
    const s = this.tok.s;
    let name: { text: string; span: Span } | undefined;
    if (this.eatW('CONSTRAINT')) {
      // MySQL cho bỏ tên sau chữ CONSTRAINT.
      if (!(this.d === 'mysql' && (this.isW('PRIMARY') || this.isW('UNIQUE') || this.isW('FOREIGN') || this.isW('CHECK')))) name = this.name('CONSTRAINT');
    }
    if (this.eatW('PRIMARY')) {
      this.needW('KEY');
      return { kind: 'pk', name: name?.text, nameSpan: name?.span, columns: this.columnList(), inline: false, span: { s, e: this.prev.e } };
    }
    if (this.eatW('UNIQUE')) {
      if (this.d === 'mysql') {
        if (!this.eatW('KEY')) this.eatW('INDEX');
        // Tên đặt sau UNIQUE KEY là tên của key, thắng tên đặt sau CONSTRAINT.
        if ((this.tok.type === 'word' || this.tok.type === 'qident') && !this.isOp('(')) name = this.name('UNIQUE');
      }
      return { kind: 'unique', name: name?.text, nameSpan: name?.span, columns: this.columnList(), inline: false, span: { s, e: this.prev.e } };
    }
    if (this.eatW('FOREIGN')) {
      this.needW('KEY');
      if (this.d === 'mysql' && (this.tok.type === 'word' || this.tok.type === 'qident') && !this.isOp('(')) name = this.name('KEY');
      const cols = this.columnList();
      this.needW('REFERENCES');
      return this.references(cols, false, name, s);
    }
    if (this.eatW('CHECK')) {
      const { text, span } = this.parenText();
      if (this.d === 'mysql') this.eatW('ENFORCED');
      return { kind: 'check', name: name?.text, nameSpan: name?.span, columns: [], expr: text, exprSpan: span, inline: false, span: { s, e: this.prev.e } };
    }
    if (this.d === 'mysql' && !name && (this.isW('KEY') || this.isW('INDEX'))) {
      this.i++;
      if (this.tok.type === 'word' || this.tok.type === 'qident') this.i++;
      this.columnList();
      return null;
    }
    throw this.fail('00900', 'unexpected', { tok: this.show() });
  }

  /** Tên table cho CREATE, ALTER, DROP: dùng lại `tableRef` nhưng không nhận alias. */
  private createTable(): CreateTableStmt {
    const s = this.tok.s;
    this.i += 2; // CREATE TABLE
    let ifNotExists = false;
    if (this.isW('IF') && this.isW('NOT', this.peek())) {
      // Oracle 19c không có IF NOT EXISTS: nó đọc IF thành tên table rồi lạc ở chữ NOT.
      if (this.d === 'oracle') {
        this.i++;
        throw this.fail('00906', 'if-exists-oracle', { stmt: 'CREATE TABLE' });
      }
      this.i += 2;
      this.needW('EXISTS');
      ifNotExists = true;
    }
    const n = this.name('TABLE');
    if (!this.eatOp('(')) throw this.fail('00906', 'missing-keyword', { kw: '(' });
    const columns: ColumnSpec[] = [];
    const constraints: ConstraintSpec[] = [];
    for (;;) {
      const t = this.tok;
      const isKey = t.type === 'word' && (t.value === 'CONSTRAINT' || t.value === 'PRIMARY' || t.value === 'UNIQUE' || t.value === 'FOREIGN' || t.value === 'CHECK');
      const isIndex = this.d === 'mysql' && t.type === 'word' && (t.value === 'KEY' || t.value === 'INDEX') && (this.isOp('(', this.peek()) || ((this.peek().type === 'word' || this.peek().type === 'qident') && this.isOp('(', this.peek(2))));
      if (isKey || isIndex) {
        const c = this.tableConstraint();
        if (c) constraints.push(c);
      } else columns.push(this.columnSpec('create'));
      if (!this.eatOp(',')) break;
    }
    if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
    const stmt: CreateTableStmt = { t: 'create', name: n.text, nameSpan: n.span, ifNotExists, columns, constraints, span: { s, e: this.prev.e } };
    if (this.d === 'mysql') this.tableOptions(stmt);
    return stmt;
  }

  /** MySQL: ENGINE=InnoDB, AUTO_INCREMENT=5, DEFAULT CHARSET=utf8mb4... Đọc rồi bỏ qua, trừ AUTO_INCREMENT. */
  private tableOptions(stmt: CreateTableStmt): void {
    const WORDS = new Set(['ENGINE', 'AUTO_INCREMENT', 'DEFAULT', 'CHARSET', 'CHARACTER', 'COLLATE', 'COMMENT', 'ROW_FORMAT']);
    while (this.tok.type === 'word' && WORDS.has(this.tok.value)) {
      const w = this.tok.value;
      this.i++;
      if (w === 'DEFAULT') continue;
      if (w === 'CHARACTER') this.needW('SET');
      this.eatOp('=');
      const v = this.tok;
      if (v.type !== 'word' && v.type !== 'str' && v.type !== 'num') throw this.fail('00900', 'unexpected', { tok: this.show() });
      this.i++;
      if (w === 'AUTO_INCREMENT' && v.type === 'num') stmt.autoInc = Number(v.text);
      this.eatOp(',');
    }
  }

  private columnSpec(mode: 'create' | 'modify'): ColumnSpec {
    const n = this.name(',');
    const tt = this.tok;
    const spec: ColumnSpec = { name: n.text, typeName: '', type: 'text', constraints: [], span: { s: n.span.s, e: n.span.e } };
    // Oracle MODIFY được bỏ data type: MODIFY (price NOT NULL).
    const noType = mode === 'modify' && this.d === 'oracle' && !(tt.type === 'word' && TYPES[tt.value]);
    if (!noType) {
      const info = tt.type === 'word' ? TYPES[tt.value] : undefined;
      if (!info) throw this.fail('00902', tt.type === 'eof' ? 'unexpected-end' : 'unknown-type', { name: this.show(), after: n.text });
      if (info.only && info.only !== this.d) throw this.fail('00902', 'type-other-dialect', { name: tt.value, use: info.use, dialect: this.d === 'mysql' ? 'MySQL' : 'Oracle' });
      this.i++;
      spec.typeName = tt.value;
      spec.type = info.type;
      spec.span.e = tt.e;
      const word = tt.value;
      const textual = info.type === 'text' && word !== 'TEXT' && word !== 'CLOB';
      // Chỉ DECIMAL, NUMERIC, NUMBER có độ chính xác. FLOAT(7,3) đọc rồi bỏ qua.
      const numeric = word === 'DECIMAL' || word === 'NUMERIC' || word === 'NUMBER';
      if (this.eatOp('(')) {
        const negative = numeric && this.d === 'oracle';
        const a = this.int(`${word}(`);
        if (textual) {
          spec.length = a;
          if (this.d === 'oracle' && (this.isW('CHAR') || this.isW('BYTE'))) {
            spec.charLength = this.tok.value === 'CHAR';
            this.i++;
          }
        } else if (numeric) {
          spec.precision = a;
          spec.scale = 0;
          if (this.eatOp(',')) {
            const neg = negative && this.eatOp('-');
            spec.scale = neg ? -this.int(',') : this.int(',');
          }
          if (spec.scale === 0 && (this.d === 'oracle' || word === 'DECIMAL' || word === 'NUMERIC')) spec.type = 'int';
        } else if (this.eatOp(',')) this.int(',');
        if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
      } else if (word === 'VARCHAR' || word === 'VARCHAR2') {
        throw this.fail('00906', 'varchar-length', { name: word });
      } else if (textual) spec.length = 1;
      else if (this.d === 'mysql' && (word === 'DECIMAL' || word === 'NUMERIC')) {
        spec.precision = 10;
        spec.scale = 0;
      }
    }
    // Oracle: DEFAULT phải đứng trước NOT NULL và các luật khác.
    let afterRule = false;
    for (;;) {
      const t = this.tok;
      const s = t.s;
      let cname: { text: string; span: Span } | undefined;
      if (this.isW('CONSTRAINT')) {
        this.i++;
        cname = this.name('CONSTRAINT');
      }
      const rule = (c: Omit<ConstraintSpec, 'name' | 'nameSpan' | 'inline' | 'span'>) => {
        spec.constraints.push({ ...c, name: cname?.text, nameSpan: cname?.span, inline: true, span: { s, e: this.prev.e } });
        afterRule = true;
      };
      if (this.eatW('NOT')) {
        this.needW('NULL', '00908');
        spec.nullSpec = 'not null';
        afterRule = true;
      } else if (this.eatW('NULL')) {
        spec.nullSpec = 'null';
        afterRule = true;
      } else if (this.eatW('UNIQUE')) {
        if (this.d === 'mysql') this.eatW('KEY');
        rule({ kind: 'unique', columns: [{ name: n.text, span: n.span }] });
      } else if (this.eatW('PRIMARY')) {
        this.needW('KEY');
        rule({ kind: 'pk', columns: [{ name: n.text, span: n.span }] });
      } else if (this.isW('AUTO_INCREMENT')) {
        if (this.d === 'oracle') throw this.fail('00907', 'identity-other-dialect', { name: 'AUTO_INCREMENT', use: 'GENERATED AS IDENTITY', dialect: 'Oracle' });
        this.i++;
        spec.identity = true;
      } else if (this.isW('GENERATED')) {
        if (this.d === 'mysql') throw this.fail('00907', 'identity-other-dialect', { name: 'GENERATED AS IDENTITY', use: 'AUTO_INCREMENT', dialect: 'MySQL' });
        this.i++;
        let mode: 'always' | 'default' | 'on-null' = 'always';
        if (!this.eatW('ALWAYS') && this.eatW('BY')) {
          this.needW('DEFAULT');
          mode = 'default';
          if (this.eatW('ON')) {
            this.needW('NULL', '00908');
            mode = 'on-null';
          }
        }
        spec.identityMode = mode;
        this.needW('AS');
        this.needW('IDENTITY');
        spec.identity = true;
        afterRule = true;
      } else if (this.isW('DEFAULT')) {
        if (this.d === 'oracle' && afterRule) throw this.fail('00907', 'default-order-oracle');
        this.i++;
        this.ctx = 'DEFAULT';
        const ds = this.tok.s;
        // MySQL chỉ nhận một giá trị, hoặc biểu thức đặt trong ngoặc: DEFAULT (1 + 2).
        if (this.d === 'mysql') this.unary();
        else this.add();
        spec.default = { text: this.sql.slice(ds, this.prev.e), span: { s: ds, e: this.prev.e } };
      } else if (this.eatW('CHECK')) {
        const { text, span } = this.parenText();
        if (this.d === 'mysql') this.eatW('ENFORCED');
        rule({ kind: 'check', columns: [{ name: n.text, span: n.span }], expr: text, exprSpan: span });
      } else if (this.eatW('REFERENCES')) {
        const c = this.references([{ name: n.text, span: n.span }], true, cname, s);
        spec.constraints.push(c);
        afterRule = true;
      } else if (this.d === 'mysql' && this.isW('COMMENT') && this.peek().type === 'str') {
        this.i += 2;
      } else if (cname) {
        throw this.fail('00900', 'unexpected', { tok: this.show() });
      } else break;
    }
    spec.span.e = this.prev.e;
    return spec;
  }

  /** Cặp ngoặc chứa nhiều column (hoặc luật) của ADD và MODIFY ở Oracle, và ADD ở MySQL. */
  private columnItems(mode: 'create' | 'modify'): { cols: ColumnSpec[]; cons: ConstraintSpec[] } {
    const cols: ColumnSpec[] = [];
    const cons: ConstraintSpec[] = [];
    if (this.eatOp('(')) {
      for (;;) {
        if (mode === 'create' && this.isConstraintStart()) {
          const c = this.tableConstraint();
          if (c) cons.push(c);
        } else cols.push(this.columnSpec(mode));
        if (!this.eatOp(',')) break;
      }
      if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
    } else cols.push(this.columnSpec(mode));
    return { cols, cons };
  }

  private isConstraintStart(): boolean {
    const t = this.tok;
    return t.type === 'word' && (t.value === 'CONSTRAINT' || t.value === 'PRIMARY' || t.value === 'UNIQUE' || t.value === 'FOREIGN' || t.value === 'CHECK');
  }

  /** Oracle: COLUMN là từ dành riêng, nên ADD COLUMN và MODIFY COLUMN đều lỗi. */
  private noColumnWordInOracle(): void {
    if (this.d === 'oracle' && this.isW('COLUMN') && !this.isOp('(', this.peek())) {
      const t = this.tok;
      throw new SqlError('syntax', 'ORA-00904', 'ORA-00904: : invalid identifier', 'column-word-oracle', friendly['column-word-oracle']({}), { s: t.s, e: t.e });
    }
  }

  private alterTable(): AlterTableStmt {
    const s = this.tok.s;
    this.i += 2; // ALTER TABLE
    const table = this.tableRef(false);
    const actions: AlterAction[] = [];
    for (;;) {
      actions.push(...this.alterAction());
      if (!this.isOp(',')) break;
      // Oracle không cho nối nhiều việc bằng dấu phẩy: viết ADD (a ..., b ...) hoặc chạy từng lệnh.
      if (this.d === 'oracle') throw this.fail('00933', 'alter-comma-oracle');
      this.i++;
    }
    return { t: 'alter', table, actions, span: { s, e: this.prev.e } };
  }

  private alterAction(): AlterAction[] {
    const t = this.tok;
    const s = t.s;
    const done = (): { s: number; e: number } => ({ s, e: this.prev.e });
    if (t.type === 'word') {
      switch (t.value) {
        case 'ADD': {
          this.i++;
          if (this.d === 'mysql') this.eatW('COLUMN');
          else this.noColumnWordInOracle();
          if (this.isConstraintStart()) {
            const c = this.tableConstraint();
            if (!c) throw unsupported('ADD KEY và ADD INDEX', this.at());
            return [{ a: 'add-constraint', c, span: done() }];
          }
          if (this.d === 'mysql' && (this.isW('KEY') || this.isW('INDEX'))) throw unsupported('ADD KEY và ADD INDEX', this.at());
          const { cols, cons } = this.columnItems('create');
          if (this.isW('FIRST') || this.isW('AFTER')) throw unsupported('FIRST và AFTER trong ALTER TABLE', this.at());
          return [{ a: 'add-column', cols, span: done() }, ...cons.map((c) => ({ a: 'add-constraint' as const, c, span: c.span }))];
        }
        case 'MODIFY': {
          this.i++;
          if (this.d === 'mysql') {
            this.eatW('COLUMN');
            // MySQL không nhận MODIFY (a ..., b ...) trong ngoặc, chỉ Oracle nhận.
            if (this.isOp('(')) throw this.fail('00900', 'unexpected', { tok: '(' });
          } else this.noColumnWordInOracle();
          const { cols } = this.columnItems('modify');
          if (this.isW('FIRST') || this.isW('AFTER')) throw unsupported('FIRST và AFTER trong ALTER TABLE', this.at());
          return [{ a: 'modify', cols, span: done() }];
        }
        case 'DROP': {
          this.i++;
          if (this.eatW('PRIMARY')) {
            this.needW('KEY');
            return [{ a: 'drop-constraint', via: 'primary', span: done() }];
          }
          if (this.eatW('CONSTRAINT')) {
            const n = this.name('CONSTRAINT');
            return [{ a: 'drop-constraint', via: 'constraint', name: n.text, span: done() }];
          }
          if (this.isW('FOREIGN') || this.isW('CHECK')) {
            if (this.d === 'oracle') throw this.fail('00905', 'missing-keyword', { kw: 'CONSTRAINT' });
            const via = this.tok.value === 'FOREIGN' ? 'foreign' : 'check';
            this.i++;
            if (via === 'foreign') this.needW('KEY');
            const n = this.name(via === 'foreign' ? 'KEY' : 'CHECK');
            return [{ a: 'drop-constraint', via, name: n.text, span: done() }];
          }
          if (this.isW('INDEX') || this.isW('KEY') || this.isW('UNIQUE')) throw unsupported('DROP INDEX', this.at());
          const hadColumn = this.eatW('COLUMN');
          if (this.d === 'oracle' && !hadColumn && !this.isOp('(')) throw this.fail('00905', 'missing-keyword', { kw: 'COLUMN' });
          let names: { name: string; span: Span }[];
          if (this.d === 'oracle' && this.isOp('(')) names = this.columnList();
          else {
            const n = this.name('DROP');
            names = [{ name: n.text, span: n.span }];
          }
          return [{ a: 'drop-column', names, span: done() }];
        }
        case 'RENAME': {
          this.i++;
          if (this.eatW('COLUMN')) {
            const from = this.name('COLUMN');
            this.needW('TO');
            const to = this.name('TO');
            return [{ a: 'rename-column', from: { name: from.text, span: from.span }, to: { name: to.text, span: to.span }, span: done() }];
          }
          if (this.isW('INDEX') || this.isW('KEY') || this.isW('CONSTRAINT')) throw unsupported(`RENAME ${this.tok.value}`, this.at());
          if (!this.eatW('TO')) {
            if (this.d === 'oracle') throw this.fail('00905', 'missing-keyword', { kw: 'TO' });
            this.eatW('AS');
          }
          const to = this.name('TO');
          return [{ a: 'rename-to', to: { name: to.text, span: to.span }, span: done() }];
        }
        case 'CHANGE':
          if (this.d === 'mysql') throw unsupported('ALTER TABLE ... CHANGE', this.at());
          break;
        default:
          break;
      }
    }
    throw this.fail('01735', t.type === 'eof' ? 'unexpected-end' : 'alter-option', { after: 'tên table', tok: this.show() });
  }

  private dropTable(): DropTableStmt {
    const s = this.tok.s;
    this.i += 2; // DROP TABLE
    let ifExists = false;
    if (this.isW('IF') && this.isW('EXISTS', this.peek())) {
      // Oracle 19c đọc IF thành tên table rồi lạc ở chữ EXISTS.
      if (this.d === 'oracle') {
        this.i++;
        throw this.fail('00933', 'if-exists-oracle', { stmt: 'DROP TABLE' });
      }
      this.i += 2;
      ifExists = true;
    }
    const table = this.tableRef(false);
    let cascade = false;
    if (this.d === 'mysql' && this.isOp(',')) throw unsupported('DROP TABLE nhiều table một lần', this.at());
    if (this.eatW('CASCADE')) {
      if (this.d === 'oracle') {
        this.needW('CONSTRAINTS');
        cascade = true;
      }
    } else if (this.d === 'mysql') this.eatW('RESTRICT');
    else this.eatW('PURGE');
    return { t: 'drop', table, ifExists, cascade, span: { s, e: this.prev.e } };
  }

  private truncate(): TruncateStmt {
    const s = this.tok.s;
    this.i++;
    // Oracle bắt buộc có chữ TABLE. MySQL cho bỏ.
    if (!this.eatW('TABLE') && this.d === 'oracle') throw this.fail('03290', 'truncate-table-oracle');
    const table = this.tableRef(false);
    return { t: 'truncate', table, span: { s, e: this.prev.e } };
  }

  private signedInt(after: string): { v: number; span: Span } {
    const s = this.tok.s;
    const neg = this.eatOp('-');
    if (!neg) this.eatOp('+');
    const v = this.int(after);
    return { v: neg ? -v : v, span: { s, e: this.prev.e } };
  }

  private createSequence(): CreateSequenceStmt {
    const s = this.tok.s;
    this.i += 2; // CREATE SEQUENCE
    const n = this.name('SEQUENCE');
    const stmt: CreateSequenceStmt = { t: 'createseq', name: n.text, nameSpan: n.span, span: { s, e: this.prev.e } };
    for (;;) {
      if (this.eatW('START')) {
        this.needW('WITH');
        stmt.start = this.signedInt('START WITH').v;
      } else if (this.eatW('INCREMENT')) {
        this.needW('BY');
        const inc = this.signedInt('INCREMENT BY');
        stmt.increment = inc.v;
        stmt.incrementSpan = inc.span;
      } else if (this.eatW('CACHE')) {
        this.int('CACHE');
      } else if (this.eatW('NOCACHE') || this.eatW('NOCYCLE') || this.eatW('ORDER') || this.eatW('NOORDER')) {
        /* không ảnh hưởng gì với engine */
      } else if (this.isW('MINVALUE') || this.isW('MAXVALUE') || this.isW('NOMINVALUE') || this.isW('NOMAXVALUE') || this.isW('CYCLE')) {
        throw unsupported(`${this.tok.value} của sequence`, this.at());
      } else break;
    }
    stmt.span.e = this.prev.e;
    return stmt;
  }

  private dropSequence(): DropSequenceStmt {
    const s = this.tok.s;
    this.i += 2;
    const n = this.name('SEQUENCE');
    return { t: 'dropseq', name: n.text, nameSpan: n.span, span: { s, e: this.prev.e } };
  }

  private caseExpr(): Expr {
    const c = this.tok;
    this.i++;
    let operand: Expr | undefined;
    if (!this.isW('WHEN')) {
      this.ctx = 'CASE';
      operand = this.expr();
    }
    const whens: { when: Expr; then: Expr }[] = [];
    while (this.eatW('WHEN')) {
      this.ctx = 'WHEN';
      const when = this.expr();
      this.needW('THEN');
      this.ctx = 'THEN';
      const then = this.expr();
      whens.push({ when, then });
    }
    if (whens.length === 0) throw this.fail('00905', 'missing-keyword', { kw: 'WHEN' });
    let els: Expr | undefined;
    if (this.eatW('ELSE')) {
      this.ctx = 'ELSE';
      els = this.expr();
    }
    this.needW('END');
    return { t: 'case', operand, whens, else: els, span: { s: c.s, e: this.prev.e } };
  }
}
