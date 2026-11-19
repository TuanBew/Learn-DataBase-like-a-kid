import type { Database } from '../engine/types';

/** Table nhỏ cho cảnh ở trang chủ. Lấy từ table products của tiệm trà sữa. */
export const heroDb: Database = {
  name: 'trasua',
  tables: [
    {
      name: 'products',
      columns: [
        { name: 'product_id', type: 'int', pk: true },
        { name: 'name', type: 'text' },
        { name: 'category', type: 'text' },
        { name: 'price', type: 'int', label: 'giá' },
      ],
      rows: [
        [1, 'Trà sữa trân châu', 'Trà sữa', 35000],
        [2, 'Trà đào cam sả', 'Trà trái cây', 45000],
        [3, 'Cà phê sữa đá', 'Cà phê', 25000],
        [4, 'Trà sữa matcha', 'Trà sữa', 42000],
        [5, 'Cà phê muối', 'Cà phê', 30000],
        [6, 'Trà vải hoa hồng', 'Trà trái cây', 48000],
      ],
    },
  ],
};

/** Phần query luôn có, và ba mẩu giấy người học bật tắt được. */
export const heroQuery = {
  base: 'SELECT * FROM products',
  pieces: [
    { id: 'where', sql: 'WHERE price > 30000', tone: 'mango', sfx: 'drop' },
    { id: 'order', sql: 'ORDER BY price', tone: 'matcha', sfx: 'whoosh' },
    { id: 'limit', sql: 'LIMIT 3', tone: 'peach', sfx: 'gate' },
  ],
} as const;
