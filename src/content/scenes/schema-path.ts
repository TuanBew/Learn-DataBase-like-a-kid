/** Chữ của cảnh "Tìm đường nối" (bài c7-b1). Tên table lấy từ `src/data/company.ts`. */
export const copy = {
  ariaScene: 'Sơ đồ 11 table của database công ty, kèm ba nhiệm vụ tìm đường nối',
  missions: [
    { from: 'order_items', to: 'customers' },
    { from: 'employees', to: 'regions' },
    { from: 'order_items', to: 'regions' },
  ],
  mission: (n: number, total: number, from: string, to: string) => `Nhiệm vụ ${n} trên ${total}: tìm đường từ ${from} tới ${to}. Bấm hai table này trên sơ đồ.`,
  wrong: (from: string, to: string) => `Nhiệm vụ này cần ${from} và ${to}. Bấm lại để chọn hai table đó.`,
  waitSecond: (t: string) => `Bạn đã chọn ${t}. Bấm table còn lại của nhiệm vụ.`,
  found: (tables: number, joins: number) => `Đúng rồi. Đường này đi qua ${tables} table, nên cần ${joins} điều kiện nối.`,
  readLead: 'Điều kiện nối, theo thứ tự:',
  next: 'Nhiệm vụ tiếp',
  allDone: 'Xong cả ba nhiệm vụ. Muốn nối hai table xa nhau, bạn đi từng bước qua các foreign key.',
  reset: 'Làm lại',
} as const;
