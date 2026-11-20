/** Chữ và dữ liệu của cảnh "Sợi dây giữa đơn và khách" (bài foreign key). */

export const copy = {
  customers: {
    name: 'customers',
    columns: ['customer_id', 'full_name'],
    rows: [
      { id: 1, name: 'Lý Hường' },
      { id: 2, name: 'Vũ Hường' },
      { id: 3, name: 'Lê Nam' },
      { id: 4, name: 'Đỗ Linh' },
    ],
  },
  orders: {
    name: 'orders',
    columns: ['order_id', 'customer_id'],
    rows: [
      { id: 1001, customer: 1 },
      { id: 1002, customer: 2 },
      { id: 1003, customer: 1 },
      { id: 1004, customer: 3 },
      { id: 1005, customer: 2 },
    ],
  },
  fkNote: 'customer_id: foreign key',
  pkNote: 'customer_id: primary key',
  pickLabel: 'Chọn một khách',
  deleteCustomer: 'Xóa khách này',
  deleteOrders: 'Xóa các đơn của khách này',
  reset: 'Làm lại',
  codesLabel: 'Mã lỗi',
  mysql: 'MySQL',
  oracle: 'Oracle',
  codes: { mysql: '1451', oracle: 'ORA-02292' },
  rowsChip: (n: number) => `${n} row`,
  says: {
    start: 'Mỗi đơn ghi `customer_id` của khách đặt đơn. Mỗi sợi dây nối một đơn tới đúng một khách. Chọn một khách.',
    picked: (id: number, n: number) => (n > 0 ? `Khách ${id} có ${n} đơn nối tới. Bấm Xóa khách này xem sao.` : `Khách ${id} chưa có đơn nào nối tới. Bấm Xóa khách này xem sao.`),
    blocked: (id: number, n: number) =>
      `Dây căng và đỏ lên. Còn ${n} đơn đang trỏ tới khách ${id}. Nếu khách này mất, các đơn đó trỏ vào chỗ trống. Database chặn lệnh xóa.`,
    deleted: (id: number) => `Không có sợi dây nào nối tới khách ${id}, nên database xóa row này.`,
    ordersGone: (id: number, n: number) => `Mình xóa ${n} đơn của khách ${id} trước. Giờ không còn sợi dây nào nối tới khách này.`,
    empty: 'Table `customers` không còn row nào. Bấm Làm lại.',
  },
};
