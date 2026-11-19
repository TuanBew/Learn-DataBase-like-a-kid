// Sinh src/data/teashop-big.ts. Chạy: node scripts/data/gen-teashop-big.mjs
// Seed cố định, chạy lại cho ra đúng cùng một file.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SEED = 20260301;
const N_ORDERS = 200;
const N_ITEMS = 380;
const N_CANCELLED = 16; // 8%
const N_NULL_CUSTOMER = 40; // 20%

let a = SEED >>> 0;
function rnd() {
  a = (a + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function pick(weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rnd() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Dữ liệu gốc lấy từ teashop.ts (đọc bằng cách đọc file, tránh phải biên dịch TS).
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const prices = { 1: 35000, 2: 45000, 3: 25000, 4: 42000, 5: 48000, 6: 30000, 7: 38000, 8: 8000, 9: 10000, 10: 10000, 11: 25000, 12: 65000 };
const staffByStore = { 1: [101, 102, 103], 2: [104, 105], 3: [106, 107, 108], 4: [109, 110] };

// Ngày: mỗi ngày ít nhất 2 đơn, phần còn lại chia theo trọng số (cuối tuần gấp đôi).
// 2026-03-01 là Chủ nhật.
const dayWeight = [];
for (let d = 1; d <= 31; d++) {
  const dow = (d - 1 + 0) % 7; // 0 = Chủ nhật
  dayWeight.push(dow === 0 || dow === 6 ? 2.2 : 1);
}
const dayCount = Array(31).fill(2);
for (let i = 0; i < N_ORDERS - 62; i++) dayCount[pick(dayWeight)]++;

// Giờ: đông vào giờ trưa và chiều tối.
const hourWeight = [];
for (let h = 8; h <= 21; h++) hourWeight.push(h === 11 || h === 12 ? 2.2 : h === 17 || h === 18 || h === 19 ? 2.6 : h === 8 || h === 21 ? 0.8 : 1.2);
function randTime() {
  for (;;) {
    const h = 8 + pick(hourWeight);
    const m = Math.floor(rnd() * 12) * 5;
    if (h === 21 && m > 30) continue;
    return [h, m];
  }
}
const pad = (n) => String(n).padStart(2, '0');
const stamps = [];
for (let d = 1; d <= 31; d++) {
  for (let i = 0; i < dayCount[d - 1]; i++) {
    const [h, m] = randTime();
    stamps.push(`2026-03-${pad(d)} ${pad(h)}:${pad(m)}:00`);
  }
}
stamps.sort();

// Tiệm: 3 đông nhất, 2 vắng nhất.
const storeWeight = [30, 12, 38, 20];
const storeOf = stamps.map(() => pick(storeWeight) + 1);

const cancelIdx = new Set(shuffle([...Array(N_ORDERS).keys()]).slice(0, N_CANCELLED));
const nullIdx = new Set(shuffle([...Array(N_ORDERS).keys()]).slice(0, N_NULL_CUSTOMER));
const payments = ['tiền mặt', 'thẻ', 'ví điện tử'];
const payWeight = [40, 25, 35];

const orders = stamps.map((ts, i) => {
  const store = storeOf[i];
  const staffList = staffByStore[store];
  const customer = nullIdx.has(i) ? null : 1 + Math.floor(rnd() * 12);
  const staff = staffList[Math.floor(rnd() * staffList.length)];
  return [2001 + i, customer, store, staff, ts, cancelIdx.has(i) ? 'cancelled' : 'done', payments[pick(payWeight)]];
});

// Số món mỗi đơn (1 đến 4), chỉnh cho đủ N_ITEMS.
const counts = orders.map(() => 1 + pick([30, 38, 22, 10]));
let sum = counts.reduce((s, c) => s + c, 0);
while (sum !== N_ITEMS) {
  const i = Math.floor(rnd() * N_ORDERS);
  if (sum < N_ITEMS && counts[i] < 4) { counts[i]++; sum++; }
  else if (sum > N_ITEMS && counts[i] > 1) { counts[i]--; sum--; }
}

// Món bán chạy: 1, 3, 8 rất chạy; 5, 12, 6 bán ít; 13, 14 không bán.
const prodWeight = { 1: 22, 2: 12, 3: 20, 4: 10, 5: 2, 6: 3, 7: 6, 8: 18, 9: 6, 10: 7, 11: 8, 12: 1 };
const prodIds = Object.keys(prodWeight).map(Number);
const items = [];
let itemId = 1;
for (let i = 0; i < N_ORDERS; i++) {
  const avail = [...prodIds];
  for (let k = 0; k < counts[i]; k++) {
    const idx = pick(avail.map((p) => prodWeight[p]));
    const p = avail.splice(idx, 1)[0];
    const qty = 1 + pick([60, 25, 10, 5]);
    items.push([itemId++, orders[i][0], p, qty, prices[p]]);
  }
}

const fmt = (rows) => rows.map((r) => `        ${JSON.stringify(r).replace(/,/g, ', ').replace(/^\[/, '[').replace(/"/g, "'")},`).join('\n');
const src = `import type { Database } from '../engine/types';
import { teashop } from './teashop';

/**
 * Bản lớn của database trà sữa: 200 đơn trong tháng 3 năm 2026.
 * File này do scripts/data/gen-teashop-big.mjs sinh ra (seed ${SEED}). Đừng sửa tay.
 */
const byName = (name: string) => {
  const t = teashop.tables.find((x) => x.name === name);
  if (!t) throw new Error('teashop thiếu table ' + name);
  return t;
};

export const teashopBig: Database = {
  name: 'trasua',
  tables: [
    byName('stores'),
    byName('staff'),
    byName('customers'),
    byName('products'),
    {
      ...byName('orders'),
      rows: [
${fmt(orders)}
      ],
    },
    {
      ...byName('order_items'),
      rows: [
${fmt(items)}
      ],
    },
  ],
};
`;
writeFileSync(path.join(root, 'src/data/teashop-big.ts'), src);
console.log('orders', orders.length, 'items', items.length);
