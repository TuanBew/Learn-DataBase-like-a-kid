/** Chữ và dữ liệu của cảnh "Cổng constraint" (bài constraint). */

export type RuleId = 'pk' | 'nn' | 'uq' | 'ck';

export interface GateCard {
  id: string;
  row: { id: number; name: string | null; price: number };
  /** Biển luật mà row này phạm. `null` nghĩa là row hợp lệ. */
  breaks: RuleId | null;
  codes?: { mysql: string; oracle: string };
  say: string;
}

export const copy = {
  tableName: 'products',
  columns: ['product_id', 'name', 'price'],
  rows: [
    { id: 1, name: 'Trà đào cam sả', price: 45000 },
    { id: 2, name: 'Cà phê sữa đá', price: 25000 },
    { id: 3, name: 'Trà sữa matcha', price: 42000 },
  ],
  rules: [
    { id: 'pk', column: 'product_id', text: 'PRIMARY KEY' },
    { id: 'nn', column: 'name', text: 'NOT NULL' },
    { id: 'uq', column: 'name', text: 'UNIQUE' },
    { id: 'ck', column: 'price', text: 'CHECK (price > 0)' },
  ],
  cards: [
    {
      id: 'a',
      row: { id: 4, name: 'Bánh flan', price: 30000 },
      breaks: null,
      say: 'Row qua đủ bốn biển luật, nên table `products` nhận row này.',
    },
    {
      id: 'b',
      row: { id: 5, name: null, price: 30000 },
      breaks: 'nn',
      codes: { mysql: '1048', oracle: 'ORA-01400' },
      say: 'Biển `name NOT NULL` đỏ. Luật này bắt mỗi món có tên, mà row này để `name` là NULL, tức là trống. Database không nhận.',
    },
    {
      id: 'c',
      row: { id: 6, name: 'Cà phê sữa đá', price: 28000 },
      breaks: 'uq',
      codes: { mysql: '1062', oracle: 'ORA-00001' },
      say: 'Biển `name UNIQUE` đỏ. Table đã có món Cà phê sữa đá, và luật này không cho hai món trùng `name`. Database không nhận.',
    },
    {
      id: 'd',
      row: { id: 7, name: 'Sinh tố bơ', price: -5000 },
      breaks: 'ck',
      codes: { mysql: '3819', oracle: 'ORA-02290' },
      say: 'Biển `price CHECK (price > 0)` đỏ. Luật này chỉ nhận `price` lớn hơn 0, mà row này có `price` là -5000. Database không nhận.',
    },
    {
      id: 'e',
      row: { id: 2, name: 'Bánh mì que', price: 15000 },
      breaks: 'pk',
      codes: { mysql: '1062', oracle: 'ORA-00001' },
      say: 'Biển `product_id PRIMARY KEY` đỏ. Table đã có row mang `product_id` 2, và mỗi row cần một `product_id` riêng. Database không nhận.',
    },
  ],
  nullText: 'NULL',
  button: 'Đưa qua cổng',
  reset: 'Làm lại',
  queueLabel: 'Row đang chờ',
  slotRunning: 'Đang qua cổng',
  slotIn: 'Đã vào table',
  signOk: 'Đạt',
  signBad: 'Vi phạm',
  codesLabel: 'Mã lỗi',
  mysql: 'MySQL',
  oracle: 'Oracle',
  chipIn: 'row đã vào',
  chipBlocked: 'row bị chặn',
  says: {
    start: 'Table `products` có 3 row. Cổng treo bốn biển luật. Chọn một thẻ row, rồi bấm Đưa qua cổng.',
    picked: 'Mình sẽ cho row này đi qua cổng. Bấm Đưa qua cổng.',
    running: 'Row đang qua cổng. Từng biển luật kiểm tra row một lần.',
    done: 'Bạn thử đủ năm row. Row nào phạm luật của table thì database không nhận.',
  },
} as const;
