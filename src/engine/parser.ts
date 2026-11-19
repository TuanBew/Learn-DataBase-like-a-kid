import type { Dialect } from './types';
import {
  AGGREGATES,
  type BinOp,
  type ClauseKind,
  type ColumnSpec,
  type CompareOp,
  type CreateTableStmt,
  type DeleteStmt,
  type Expr,
  type InsertStmt,
  type OrderItem,
  type SelectItem,
  type SelectStmt,
  type Statement,
  type TableRef,
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
const OUTSIDE = new Set(['WITH', 'DROP', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE', 'MERGE', 'EXPLAIN', 'SHOW', 'DESCRIBE', 'DESC', 'USE', 'SET', 'CALL']);
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
      case 'CREATE':
        if (!this.isW('TABLE', this.peek())) throw unsupported(`CREATE ${this.peek().value}`, span);
        return this.createTable();
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
    if (this.isW('SELECT')) throw unsupported('INSERT lấy dữ liệu từ SELECT', this.at());
    this.needW('VALUES', '00926');
    const rows: InsertStmt['rows'] = [];
    for (;;) {
      const rs = this.tok.s;
      if (!this.eatOp('(')) throw this.fail('00906', 'missing-keyword', { kw: '(' });
      const values: Expr[] = [];
      this.ctx = 'VALUES (';
      for (;;) {
        values.push(this.expr());
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
      sets.push({ name: n.text, span: n.span, e: this.expr() });
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

  /** Lấy nguyên văn một biểu thức trong ngoặc, dùng cho CHECK. */
  private parenText(): string {
    if (!this.eatOp('(')) throw this.fail('00906', 'missing-keyword', { kw: '(' });
    const s = this.tok.s;
    this.ctx = 'CHECK (';
    this.expr();
    const e = this.prev.e;
    if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
    return this.sql.slice(s, e);
  }

  private createTable(): CreateTableStmt {
    const s = this.tok.s;
    this.i += 2; // CREATE TABLE
    if (this.isW('IF')) throw unsupported('IF NOT EXISTS', this.at());
    const n = this.name('TABLE');
    if (!this.eatOp('(')) throw this.fail('00906', 'missing-keyword', { kw: '(' });
    const columns: ColumnSpec[] = [];
    const checks: string[] = [];
    const col = (name: string, span: Span) => {
      const c = columns.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (!c) throw syntaxError(this.d, this.sql, span, '00904', 'unknown-column', { name });
      return c;
    };
    const inParens = () => {
      if (!this.eatOp('(')) throw this.fail('00906', 'missing-keyword', { kw: '(' });
      const names = [this.name('(')];
      while (this.eatOp(',')) names.push(this.name(','));
      if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
      return names;
    };
    const references = () => {
      const t = this.name('REFERENCES');
      const [c] = inParens();
      return { table: t.text, column: c.text };
    };
    for (;;) {
      if (this.eatW('CONSTRAINT')) this.name('CONSTRAINT');
      if (this.eatW('PRIMARY')) {
        this.needW('KEY');
        for (const c of inParens()) col(c.text, c.span).pk = true;
      } else if (this.eatW('FOREIGN')) {
        this.needW('KEY');
        const [c] = inParens();
        this.needW('REFERENCES');
        col(c.text, c.span).fk = references();
      } else if (this.eatW('UNIQUE')) {
        for (const c of inParens()) col(c.text, c.span).unique = true;
      } else if (this.eatW('CHECK')) {
        checks.push(this.parenText());
      } else {
        columns.push(this.columnSpec(references));
      }
      if (!this.eatOp(',')) break;
    }
    if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
    return { t: 'create', name: n.text, nameSpan: n.span, columns, checks, span: { s, e: this.prev.e } };
  }

  private columnSpec(references: () => { table: string; column: string }): ColumnSpec {
    const n = this.name(',');
    const tt = this.tok;
    const info = tt.type === 'word' ? TYPES[tt.value] : undefined;
    if (!info) throw this.fail('00902', tt.type === 'eof' ? 'unexpected-end' : 'unknown-type', { name: this.show(), after: n.text });
    if (info.only && info.only !== this.d) throw this.fail('00902', 'type-other-dialect', { name: tt.value, use: info.use, dialect: this.d === 'mysql' ? 'MySQL' : 'Oracle' });
    this.i++;
    const spec: ColumnSpec = { name: n.text, typeName: tt.value, type: info.type, span: { s: n.span.s, e: tt.e } };
    if (this.eatOp('(')) {
      this.int(`${tt.value}(`);
      if (this.eatOp(',')) this.int(',');
      else if (info.type === 'decimal' && this.prev.type === 'num') spec.type = 'int';
      if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
    } else if (tt.value === 'VARCHAR' || tt.value === 'VARCHAR2') {
      throw this.fail('00906', 'varchar-length', { name: tt.value });
    }
    for (;;) {
      const t = this.tok;
      if (this.eatW('NOT')) {
        this.needW('NULL', '00908');
        spec.notNull = true;
      } else if (this.eatW('NULL')) {
        /* cho phép để trống: mặc định */
      } else if (this.eatW('UNIQUE')) spec.unique = true;
      else if (this.eatW('PRIMARY')) {
        this.needW('KEY');
        spec.pk = true;
      } else if (this.isW('AUTO_INCREMENT')) {
        if (this.d === 'oracle') throw this.fail('00907', 'identity-other-dialect', { name: 'AUTO_INCREMENT', use: 'GENERATED AS IDENTITY', dialect: 'Oracle' });
        this.i++;
        spec.identity = true;
      } else if (this.isW('GENERATED')) {
        if (this.d === 'mysql') throw this.fail('00907', 'identity-other-dialect', { name: 'GENERATED AS IDENTITY', use: 'AUTO_INCREMENT', dialect: 'MySQL' });
        this.i++;
        if (!this.eatW('ALWAYS') && this.eatW('BY')) {
          this.needW('DEFAULT');
          if (this.eatW('ON')) this.needW('NULL', '00908');
        }
        this.needW('AS');
        this.needW('IDENTITY');
        spec.identity = true;
      } else if (this.eatW('DEFAULT')) {
        this.ctx = 'DEFAULT';
        this.add();
      } else if (this.eatW('CHECK')) spec.check = this.parenText();
      else if (this.eatW('REFERENCES')) spec.fk = references();
      else if (t.type === 'word' && t.value === 'CONSTRAINT') {
        this.i++;
        this.name('CONSTRAINT');
      } else break;
    }
    spec.span.e = this.prev.e;
    return spec;
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
