import type { SqlDate } from './types';

/** Phần việc về ngày giờ: tách, cộng, định dạng. Không biết gì về dialect hay lỗi. */

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export interface Parts {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

export function dateParts(v: SqlDate): Parts {
  const [date, time = '00:00:00'] = v.iso.split(' ');
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi, s] = time.split(':').map(Number);
  return { y, mo, d, h, mi, s };
}

export function makeDate(p: Parts, withTime: boolean): SqlDate {
  const date = `${pad(p.y, 4)}-${pad(p.mo)}-${pad(p.d)}`;
  return { kind: 'date', iso: withTime ? `${date} ${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}` : date };
}

export const utc = (p: Parts) => Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);

/** Cộng một số ngày (có thể lẻ) vào một ngày. */
export function addDays(v: SqlDate, days: number): SqlDate {
  const t = new Date(utc(dateParts(v)) + Math.round(days * 86400000));
  const withTime = v.iso.length > 10 || !Number.isInteger(days);
  return makeDate({ y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), s: t.getUTCSeconds() }, withTime);
}

/** Số ngày giữa hai ngày: a trừ b. */
export function diffDays(a: SqlDate, b: SqlDate): number {
  return (utc(dateParts(a)) - utc(dateParts(b))) / 86400000;
}

/** Cộng số giây (có thể âm). Giữ ngày thuần nếu không có giờ và số giây chẵn ngày. */
export function addSeconds(v: SqlDate, sec: number, withTime = true): SqlDate {
  const t = new Date(utc(dateParts(v)) + sec * 1000);
  const p = { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), s: t.getUTCSeconds() };
  return makeDate(p, withTime || v.iso.length > 10);
}

export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Thứ trong tuần: 0 là Chủ nhật. */
export const weekday = (p: Parts) => new Date(utc(p)).getUTCDay();

/** Cộng số tháng. Ngày vượt cuối tháng thì lùi về ngày cuối tháng (MySQL). `keepEnd`: ngày cuối tháng giữ là ngày cuối tháng (Oracle). */
export function addMonths(v: SqlDate, n: number, keepEnd = false): SqlDate {
  const p = dateParts(v);
  const wasLast = p.d === daysInMonth(p.y, p.mo);
  const total = p.y * 12 + (p.mo - 1) + n;
  const y = Math.floor(total / 12);
  const mo = (((total % 12) + 12) % 12) + 1;
  const last = daysInMonth(y, mo);
  const d = keepEnd && wasLast ? last : Math.min(p.d, last);
  return makeDate({ ...p, y, mo, d }, v.iso.length > 10);
}

export function lastDayOf(v: SqlDate): SqlDate {
  const p = dateParts(v);
  return makeDate({ ...p, d: daysInMonth(p.y, p.mo) }, v.iso.length > 10);
}

const validDate = (y: number, mo: number, d: number) => mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);

/** MySQL đọc chuỗi thành ngày một cách dễ tính: `2026-3-9`, `2026/03/09`, `20260309`, có hay không có giờ. Ngày không có thật (30 tháng 2) cho null. */
export function parseLooseDate(text: string): { date: SqlDate; clean: boolean } | null {
  const t = text.trim();
  let m = /^(\d{2,4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/.exec(t);
  let y: number;
  let mo: number;
  let d: number;
  let h = 0;
  let mi = 0;
  let s = 0;
  let timed = false;
  let used: number;
  if (m) {
    y = Number(m[1]);
    if (m[1].length <= 2) y += y < 70 ? 2000 : 1900;
    [mo, d] = [Number(m[2]), Number(m[3])];
    if (m[4] !== undefined) {
      [h, mi, s, timed] = [Number(m[4]), Number(m[5]), Number(m[6] ?? 0), true];
    }
    used = m[0].length;
  } else {
    m = /^(\d{4})(\d{2})(\d{2})(?:(\d{2})(\d{2})(\d{2}))?(?!\d)/.exec(t);
    if (!m) return null;
    [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (m[4] !== undefined) [h, mi, s, timed] = [Number(m[4]), Number(m[5]), Number(m[6]), true];
    used = m[0].length;
  }
  if (!validDate(y, mo, d) || h > 23 || mi > 59 || s > 59) return null;
  return { date: makeDate({ y, mo, d, h, mi, s }, timed), clean: used === t.length };
}

/** Định dạng ngày theo mẫu của MySQL: %Y, %m, %d... */
export function mysqlFormat(v: SqlDate, fmt: string): string {
  const p = dateParts(v);
  const dow = weekday(p);
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  const ampm = p.h < 12 ? 'AM' : 'PM';
  const ord = p.d % 10 === 1 && p.d !== 11 ? 'st' : p.d % 10 === 2 && p.d !== 12 ? 'nd' : p.d % 10 === 3 && p.d !== 13 ? 'rd' : 'th';
  const yday = Math.round((Date.UTC(p.y, p.mo - 1, p.d) - Date.UTC(p.y, 0, 1)) / 86400000) + 1;
  const map: Record<string, string> = {
    Y: pad(p.y, 4),
    y: pad(p.y % 100),
    m: pad(p.mo),
    c: String(p.mo),
    d: pad(p.d),
    e: String(p.d),
    D: `${p.d}${ord}`,
    j: pad(yday, 3),
    w: String(dow),
    H: pad(p.h),
    k: String(p.h),
    h: pad(h12),
    I: pad(h12),
    l: String(h12),
    i: pad(p.mi),
    s: pad(p.s),
    S: pad(p.s),
    f: '000000',
    p: ampm,
    M: MONTHS[p.mo - 1],
    b: MONTHS[p.mo - 1].slice(0, 3),
    W: DAYS[dow],
    a: DAYS[dow].slice(0, 3),
    T: `${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}`,
    r: `${pad(h12)}:${pad(p.mi)}:${pad(p.s)} ${ampm}`,
    '%': '%',
  };
  return fmt.replace(/%(.)/g, (_m, c: string) => map[c] ?? c);
}

const ORACLE_TOKENS = ['YYYY', 'RRRR', 'HH24', 'HH12', 'MONTH', 'MON', 'DAY', 'DDD', 'A.M.', 'P.M.', 'MM', 'DD', 'DY', 'YY', 'RR', 'HH', 'MI', 'SS', 'AM', 'PM', 'FM', 'Q'];

/** Định dạng ngày theo mẫu của Oracle: YYYY, MM, DD, HH24, MI, SS... Tên tháng và tên thứ đệm cho đủ 9 chữ, trừ khi có FM. */
export function oracleFormat(v: SqlDate, fmt: string): string {
  const p = dateParts(v);
  const dow = weekday(p);
  const yday = Math.round((Date.UTC(p.y, p.mo - 1, p.d) - Date.UTC(p.y, 0, 1)) / 86400000) + 1;
  let fm = false;
  let out = '';
  let i = 0;
  while (i < fmt.length) {
    if (fmt[i] === '"') {
      const j = fmt.indexOf('"', i + 1);
      out += fmt.slice(i + 1, j < 0 ? fmt.length : j);
      i = j < 0 ? fmt.length : j + 1;
      continue;
    }
    const tok = ORACLE_TOKENS.find((t) => fmt.slice(i, i + t.length).toUpperCase() === t);
    if (!tok) {
      out += fmt[i++];
      continue;
    }
    const raw = fmt.slice(i, i + tok.length);
    const cased = (s: string) => (raw === raw.toUpperCase() ? s.toUpperCase() : raw[0] === raw[0].toUpperCase() ? s : s.toLowerCase());
    const num = (n: number, w: number) => (fm ? String(n) : pad(n, w));
    const name = (s: string) => cased(fm ? s : s.padEnd(9, ' '));
    const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
    switch (tok) {
      case 'FM':
        fm = !fm;
        break;
      case 'YYYY':
      case 'RRRR':
        out += pad(p.y, 4);
        break;
      case 'YY':
      case 'RR':
        out += pad(p.y % 100);
        break;
      case 'MM':
        out += num(p.mo, 2);
        break;
      case 'DD':
        out += num(p.d, 2);
        break;
      case 'DDD':
        out += num(yday, 3);
        break;
      case 'Q':
        out += Math.ceil(p.mo / 3);
        break;
      case 'HH24':
        out += num(p.h, 2);
        break;
      case 'HH':
      case 'HH12':
        out += num(h12, 2);
        break;
      case 'MI':
        out += num(p.mi, 2);
        break;
      case 'SS':
        out += num(p.s, 2);
        break;
      case 'AM':
      case 'PM':
        out += cased(p.h < 12 ? 'AM' : 'PM');
        break;
      case 'A.M.':
      case 'P.M.':
        out += cased(p.h < 12 ? 'A.M.' : 'P.M.');
        break;
      case 'MONTH':
        out += name(MONTHS[p.mo - 1]);
        break;
      case 'MON':
        out += cased(MONTHS[p.mo - 1].slice(0, 3));
        break;
      case 'DAY':
        out += name(DAYS[dow]);
        break;
      case 'DY':
        out += cased(DAYS[dow].slice(0, 3));
        break;
    }
    i += tok.length;
  }
  return out;
}
