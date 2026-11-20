/** Chữ của cảnh "Sơ đồ ERD" (bài Đọc ERD và CREATE TABLE). Tên table và column lấy từ `src/data/teashop.ts`. */
export const copy = {
  ariaBoard: 'Sơ đồ quan hệ giữa sáu table của tiệm trà sữa',
  idle: 'Bấm vào một table. Mình sẽ kể table đó nối với table nào.',
  hint: 'Bấm lại table đang chọn để bỏ chọn.',
  selected: (name: string, n: number) => `Table ${name} có ${n} quan hệ.`,
  pkLabel: 'primary key',
  fkLabel: 'foreign key',
  legendPk: 'primary key: column nhận ra từng row',
  legendFk: 'foreign key: column trỏ sang table khác',
  legendOne: 'một',
  legendMany: 'nhiều',
  /**
   * Mỗi quan hệ ứng với một foreign key, khóa theo `<table giữ foreign key>.<column>`.
   * `parent`: Bi nói khi bạn chọn table được trỏ tới. `child`: Bi nói khi bạn chọn table giữ foreign key.
   */
  relations: {
    'staff.store_id': {
      parent: 'Một row của stores có thể có nhiều row ở staff. Một tiệm có nhiều nhân viên.',
      child: 'Một row của staff chỉ trỏ về một row của stores, qua column store_id. Mỗi nhân viên làm ở một tiệm.',
    },
    'orders.customer_id': {
      parent: 'Một row của customers có thể có nhiều row ở orders. Một khách đặt được nhiều đơn.',
      child: 'Một row của orders chỉ trỏ về một row của customers, qua column customer_id. Mỗi đơn thuộc về một khách.',
    },
    'orders.store_id': {
      parent: 'Một row của stores có thể có nhiều row ở orders. Một tiệm bán được nhiều đơn.',
      child: 'Một row của orders chỉ trỏ về một row của stores, qua column store_id. Mỗi đơn bán ở một tiệm.',
    },
    'orders.staff_id': {
      parent: 'Một row của staff có thể có nhiều row ở orders. Một nhân viên bán được nhiều đơn.',
      child: 'Một row của orders chỉ trỏ về một row của staff, qua column staff_id. Mỗi đơn có một người bán.',
    },
    'order_items.order_id': {
      parent: 'Một row của orders có thể có nhiều row ở order_items. Một đơn gồm nhiều món.',
      child: 'Một row của order_items chỉ trỏ về một row của orders, qua column order_id. Mỗi món trong order_items nằm trong một đơn.',
    },
    'order_items.product_id': {
      parent: 'Một row của products có thể có nhiều row ở order_items. Một món được bán trong nhiều đơn.',
      child: 'Một row của order_items chỉ trỏ về một row của products, qua column product_id. Mỗi dòng ghi một món.',
    },
  },
} as const;
