import type { Dialect } from './types';
import type { BinOp, ClauseKind, CompareOp, Expr, OrderItem, SelectItem, SelectStmt, Statement } from './ast';
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
const AGGREGATES = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']);
const LATER = new Set(['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'COMMIT', 'ROLLBACK']);
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
    if (t.type === 'word' && LATER.has(t.value)) throw unsupported(t.value, this.at(), 'not-yet');
    if (t.type === 'word' && OUTSIDE.has(t.value)) throw unsupported(t.value, this.at());
    throw this.fail('00900', 'unexpected', { tok: this.show() });
  }

  /** Sau khi đọc xong query: chỉ còn được có một dấu ; */
  private end(stmt: SelectStmt): void {
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
      const twice = stmt.clauses.some((c) => c.kind === kind);
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

    const stmt: SelectStmt = { t: 'select', distinct, items, clauses };

    if (!this.isW('FROM')) {
      const t = this.tok;
      const done = t.type === 'eof' || this.isOp(';');
      if (done && this.d === 'mysql') return stmt;
      if (done) throw this.fail('00923', 'no-from-oracle');
      throw this.fail('00923', 'missing-from', { tok: this.show() });
    }

    // FROM
    const fromTok = this.tok;
    this.i++;
    open('FROM', fromTok.s);
    const tt = this.tok;
    if (this.isOp('(')) throw unsupported('subquery trong FROM', this.at(), 'not-yet');
    if (!(tt.type === 'qident' || (tt.type === 'word' && !STOP.has(tt.value)))) {
      throw this.fail('00903', 'no-table', {}, tt);
    }
    this.i++;
    const from: NonNullable<SelectStmt['from']> = {
      table: tt.type === 'word' ? tt.text : tt.value,
      quoted: tt.type === 'qident',
      span: { s: tt.s, e: tt.e },
    };
    if (this.isOp('.')) throw unsupported('tên table có dấu chấm', this.at());
    if (this.isW('AS')) {
      if (this.d === 'oracle') throw this.fail('00933', 'as-table-alias');
      this.i++;
      const a = this.tok;
      if (!(a.type === 'qident' || (a.type === 'word' && !STOP.has(a.value)))) {
        throw this.fail('00933', 'missing-expression', { after: 'AS' });
      }
      this.i++;
      from.alias = a.type === 'word' ? a.text : a.value;
    } else if (this.tok.type === 'qident' || (this.tok.type === 'word' && !STOP.has(this.tok.value))) {
      from.alias = this.tok.type === 'word' ? this.tok.text : this.tok.value;
      this.i++;
    }
    stmt.from = from;
    if (this.isOp(',')) throw unsupported('cách nối nhiều table bằng dấu phẩy', this.at());
    if (this.tok.type === 'word' && JOIN_WORDS.has(this.tok.value)) throw unsupported('JOIN', this.at(), 'not-yet');
    close();

    if (this.isW('WHERE')) {
      const w = this.tok;
      this.i++;
      open('WHERE', w.s);
      this.ctx = 'WHERE';
      stmt.where = this.expr();
      close();
    }
    if (this.isW('GROUP')) throw unsupported('GROUP BY', this.at(), 'not-yet');
    if (this.isW('HAVING')) throw unsupported('HAVING', this.at(), 'not-yet');

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
        if (this.isW('SELECT')) throw unsupported('subquery', this.at(), 'not-yet');
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
      if (this.isW('SELECT')) throw unsupported('subquery', this.at(), 'not-yet');
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
      throw this.fail('00936', 'trailing-comma', { tok: this.show() }, this.prev);
    }
    if (t.type === 'eof' || this.isOp(';')) throw this.fail('00936', 'unexpected-end', { after: this.ctx });
    if (this.isOp(')') || this.isOp(',') || (t.type === 'word' && STOP.has(t.value))) {
      throw this.fail('00936', 'missing-expression', { after: this.ctx });
    }
    throw this.fail('00936', 'unexpected', { tok: this.show() });
  }

  private call(nameTok: Token): Expr {
    const name = nameTok.value;
    this.i++; // (
    if (AGGREGATES.has(name)) throw unsupported(`${name} và các function gom nhóm`, { s: nameTok.s, e: nameTok.e }, 'not-yet');
    const args: Expr[] = [];
    if (!this.eatOp(')')) {
      this.ctx = `${name}(`;
      for (;;) {
        args.push(this.expr());
        this.ctx = ',';
        if (!this.eatOp(',')) break;
      }
      if (!this.eatOp(')')) throw this.fail('00907', 'missing-paren');
    }
    if (this.isW('OVER')) throw unsupported('window function', this.at());
    return { t: 'fn', name, args, span: { s: nameTok.s, e: this.prev.e }, nameSpan: { s: nameTok.s, e: nameTok.e } };
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
