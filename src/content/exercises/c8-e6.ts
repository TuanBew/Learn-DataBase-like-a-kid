import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  chapter: 8,
  dialects: [ 'mysql', 'oracle' ],
  check: { orderMatters: false },
  id: 'c8-e6',
  kind: 'write',
  title: 'Sản phẩm chưa từng bán',
  prompt: 'Phòng kinh doanh muốn biết sản phẩm nào chưa có trong đơn nào. Hãy viết bằng NOT EXISTS.',
  asks: [
    'Hiện `product_id` và `product_name`.',
    'Chỉ lấy sản phẩm không có row nào trong `order_items`.',
    'Dùng NOT EXISTS, không dùng NOT IN.'
  ],
  database: 'company',
  tables: [ 'products', 'order_items' ],
  starter: { mysql: '', oracle: '' },
  solution: {
    mysql: 'SELECT p.product_id, p.product_name\n' +
      'FROM products AS p\n' +
      'WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.product_id);',
    oracle: 'SELECT p.product_id, p.product_name\n' +
      'FROM products p\n' +
      'WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.product_id)'
  },
  why: 'NOT EXISTS giữ sản phẩm khi subquery không tìm thấy row nào khớp `product_id`. Subquery chỉ hỏi có hay không, nên NULL không làm hỏng kết quả.',
  hints: {
    light: 'NOT EXISTS hỏi: có row nào khớp không? Không có thì giữ row đó.',
    specific: 'Subquery đọc `order_items` và nối với query ngoài bằng `oi.product_id = p.product_id`.',
    skeleton: {
      mysql: 'SELECT p.product_id, p.product_name\n' +
        'FROM products AS p\n' +
        'WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = ____.product_id)',
      oracle: 'SELECT p.product_id, p.product_name\n' +
        'FROM products p\n' +
        'WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = ____.product_id)'
    }
  },
  wrong: [
    {
      id: 'exists',
      sql: {
        mysql: 'SELECT p.product_id, p.product_name\n' +
          'FROM products AS p\n' +
          'WHERE EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.product_id)',
        oracle: 'SELECT p.product_id, p.product_name\n' +
          'FROM products p\n' +
          'WHERE EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.product_id)'
      },
      hint: 'EXISTS giữ sản phẩm đã từng bán, ngược với đề. Thêm NOT phía trước EXISTS.'
    },
    {
      id: 'no-link',
      sql: {
        mysql: 'SELECT p.product_id, p.product_name\n' +
          'FROM products AS p\n' +
          'WHERE NOT EXISTS (SELECT 1 FROM order_items oi)',
        oracle: 'SELECT p.product_id, p.product_name\n' +
          'FROM products p\n' +
          'WHERE NOT EXISTS (SELECT 1 FROM order_items oi)'
      },
      hint: 'Subquery chưa nối với sản phẩm đang xét. Thêm `WHERE oi.product_id = p.product_id` vào subquery.'
    }
  ]
};
