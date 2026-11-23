/** Làm tròn và định dạng số. Không biết gì về dialect hay lỗi. */

/** Dời dấu phẩy thập phân bằng chữ, để 1.005 làm tròn thành 1.01 đúng như số thập phân thật. */
function shift(n: number, places: number): number {
  const [m, e = '0'] = String(n).split('e');
  return Number(`${m}e${Number(e) + places}`);
}

const clean = (x: number) => (x === 0 ? 0 : x);

/** Làm tròn `p` chữ số sau dấu phẩy (p âm: làm tròn hàng chục, trăm...). Số .5 làm tròn ra xa số 0. */
export function roundHalf(n: number, p: number): number {
  p = Math.trunc(p);
  if (!Number.isFinite(n)) return n;
  const r = shift(Math.round(shift(Math.abs(n), p)), -p);
  return clean(n < 0 ? -r : r);
}

/** Cắt bỏ phần lẻ sau `p` chữ số (p âm: cắt hàng chục, trăm...). */
export function truncTo(n: number, p: number): number {
  p = Math.trunc(p);
  if (!Number.isFinite(n)) return n;
  const r = shift(Math.trunc(shift(Math.abs(n), p)), -p);
  return clean(n < 0 ? -r : r);
}

/**
 * Số thành chữ như Oracle in: không có số 0 đứng trước dấu phẩy (0.5 thành .5), và viết đủ chữ số
 * trong khoảng 1e-40 tới 1e38 (JS viết 1e-10, Oracle XE 21c thật viết .0000000001).
 */
export function oracleNumberText(n: number): string {
  let s = String(n);
  const m = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(s);
  if (m) {
    const exp = Number(m[4]);
    if (exp < -40 || exp > 38) return s;
    const digits = m[2] + (m[3] ?? '');
    s = exp >= 0 ? m[1] + (digits.length > exp + 1 ? `${digits.slice(0, exp + 1)}.${digits.slice(exp + 1)}` : digits.padEnd(exp + 1, '0')) : `${m[1]}0.${'0'.repeat(-exp - 1)}${digits}`;
  }
  return s.replace(/^(-?)0\./, '$1.');
}

const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** MySQL FORMAT(n, d): ngăn nghìn bằng dấu phẩy, d chữ số sau dấu chấm. */
export function mysqlFormatNumber(n: number, places: number): string {
  const p = Math.max(0, Math.min(30, Math.trunc(places)));
  const r = roundHalf(n, p);
  const [i, f = ''] = Math.abs(r).toFixed(p).split('.');
  return `${r < 0 ? '-' : ''}${group(i)}${p > 0 ? `.${f.padEnd(p, '0')}` : ''}`;
}

/** Mẫu số của Oracle không hiểu. */
export class BadNumberFormat extends Error {}

/**
 * TO_CHAR(n, mẫu) của Oracle với các ký hiệu 9, 0, dấu phẩy, G, dấu chấm, D và FM.
 * Số nhiều chữ số hơn mẫu thì ra dấu thăng (#).
 */
export function oracleNumberFormat(n: number, fmt: string): string {
  let rest = fmt.toUpperCase();
  let fm = false;
  if (rest.startsWith('FM')) {
    fm = true;
    rest = rest.slice(2);
  }
  if (!rest || /[^90,G.D]/.test(rest)) throw new BadNumberFormat(fmt);
  const dot = rest.search(/[.D]/);
  if (dot >= 0 && /[.D]/.test(rest.slice(dot + 1))) throw new BadNumberFormat(fmt);
  const intTokens = [...(dot >= 0 ? rest.slice(0, dot) : rest)];
  const fracTokens = dot >= 0 ? [...rest.slice(dot + 1)] : [];
  if (fracTokens.some((t) => t === ',' || t === 'G')) throw new BadNumberFormat(fmt);
  const width = intTokens.length + (dot >= 0 ? 1 + fracTokens.length : 0);
  const places = fracTokens.length;

  const rounded = roundHalf(n, places);
  const neg = rounded < 0;
  const abs = Math.abs(rounded);
  let intStr = String(Math.trunc(abs));
  if (intStr === '0') intStr = '';
  const digitSlots = intTokens.filter((t) => t === '9' || t === '0').length;
  // Đã kiểm trên Oracle XE 21c thật: số tràn mẫu ra (độ rộng mẫu + 1) dấu thăng, có FM hay không đều vậy.
  if (intStr.length > digitSlots) return '#'.repeat(width + 1);
  // Chữ số thập phân.
  const fracDigits = abs.toFixed(places).split('.')[1] ?? '';
  if (places === 0 && intStr === '') intStr = '0';

  // Phần nguyên: đi từ phải sang trái. Chữ số đầu tiên in ra là chữ số có số thật, hoặc ô 0 đầu tiên.
  const firstZero = intTokens.findIndex((t) => t === '0');
  let slot = digitSlots;
  const cells: string[] = [];
  const startAt = intTokens.findIndex((_t, i) => {
    const before = intTokens.slice(0, i).filter((t) => t === '9' || t === '0').length;
    return (intTokens[i] === '9' || intTokens[i] === '0') && (digitSlots - before <= intStr.length || (firstZero >= 0 && i >= firstZero));
  });
  const from = startAt < 0 ? intTokens.length : startAt;
  for (let i = intTokens.length - 1; i >= 0; i--) {
    const t = intTokens[i];
    if (t === '9' || t === '0') {
      slot--;
      const k = slot - (digitSlots - intStr.length);
      cells.unshift(i >= from ? (k >= 0 ? intStr[k] : '0') : ' ');
    } else {
      cells.unshift(i > from ? ',' : ' ');
    }
  }
  let body = cells.join('');
  if (dot >= 0) {
    let frac = fracDigits;
    if (fm) {
      // FM bỏ số 0 thừa ở các ô 9 cuối phần lẻ. Các ô 0 vẫn giữ.
      let keep = frac.length;
      while (keep > 0 && frac[keep - 1] === '0' && fracTokens[keep - 1] === '9') keep--;
      frac = frac.slice(0, keep);
    }
    body += `.${frac}`;
  }
  if (fm) {
    body = body.trim();
    return neg ? `-${body}` : body;
  }
  // Ô dấu: số âm thì dấu trừ nằm sát chữ số đầu, số dương thì để trống.
  const lead = body.length - body.trimStart().length;
  const sign = ' ' + body;
  return neg ? sign.slice(0, lead) + '-' + sign.slice(lead + 1) : sign;
}
