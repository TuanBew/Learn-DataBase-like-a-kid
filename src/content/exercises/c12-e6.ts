import type { BuildExercise } from '../types';

const setupMysql = `CREATE TABLE customers_new (
  customer_id INT PRIMARY KEY,
  customer_name VARCHAR(100),
  email VARCHAR(100)
);
CREATE TABLE orders_new (
  order_id INT PRIMARY KEY,
  customer_id INT,
  amount INT
);
INSERT INTO customers_new (customer_id, customer_name, email) VALUES
  (1, 'Công ty An Phát', 'anphat@example.vn'),
  (2, 'Cửa hàng Bình Minh', 'binhminh@example.vn'),
  (3, 'Công ty Cường Thịnh', 'cuongthinh@example.vn');
INSERT INTO orders_new (order_id, customer_id, amount) VALUES
  (101, 1, 500000),
  (102, 2, 300000),
  (103, 3, 200000),
  (104, 9, 150000),
  (105, 2, -80000),
  (106, 3, -20000);`;

const setupOracle = `CREATE TABLE customers_new (
  customer_id INT PRIMARY KEY,
  customer_name VARCHAR2(100),
  email VARCHAR2(100)
);
CREATE TABLE orders_new (
  order_id INT PRIMARY KEY,
  customer_id INT,
  amount INT
);
INSERT INTO customers_new (customer_id, customer_name, email) VALUES (1, 'Công ty An Phát', 'anphat@example.vn');
INSERT INTO customers_new (customer_id, customer_name, email) VALUES (2, 'Cửa hàng Bình Minh', 'binhminh@example.vn');
INSERT INTO customers_new (customer_id, customer_name, email) VALUES (3, 'Công ty Cường Thịnh', 'cuongthinh@example.vn');
INSERT INTO orders_new (order_id, customer_id, amount) VALUES (101, 1, 500000);
INSERT INTO orders_new (order_id, customer_id, amount) VALUES (102, 2, 300000);
INSERT INTO orders_new (order_id, customer_id, amount) VALUES (103, 3, 200000);
INSERT INTO orders_new (order_id, customer_id, amount) VALUES (104, 9, 150000);
INSERT INTO orders_new (order_id, customer_id, amount) VALUES (105, 2, -80000);
INSERT INTO orders_new (order_id, customer_id, amount) VALUES (106, 3, -20000);
COMMIT;`;

const fix = `DELETE FROM orders_new
WHERE customer_id NOT IN (SELECT customer_id FROM customers_new);

UPDATE orders_new SET amount = 0 WHERE amount < 0;`;

export const exercise: BuildExercise = {
  id: 'c12-e6',
  chapter: 12,
  kind: 'build',
  title: 'Sửa đơn lỗi trong một transaction',
  prompt:
    'Kế toán gửi hai table nhỏ, `customers_new` và `orders_new`, và báo có đơn lỗi. Đơn 104 trỏ tới khách số 9, nhưng khách này không có thật. Đơn 105 và 106 có số tiền âm. Bạn xóa đơn trỏ tới khách không có, và sửa số tiền âm thành 0. Mình đã chép sẵn lệnh tạo hai table vào editor. Hãy giữ lệnh đó, rồi viết lệnh sửa bên dưới, trong một transaction.',
  asks: [],
  start: 'empty',
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: `${setupMysql}\n\n-- Viết lệnh sửa bên dưới. Mở transaction bằng START TRANSACTION, kết thúc bằng COMMIT.\nSTART TRANSACTION;\n`,
    oracle: `${setupOracle}\n\n-- Viết lệnh sửa bên dưới. Oracle tự mở transaction, nên chỉ cần kết thúc bằng COMMIT.\n`,
  },
  solution: {
    mysql: `${setupMysql}\n\nSTART TRANSACTION;\nSAVEPOINT before_fix;\n${fix}\nCOMMIT;`,
    oracle: `${setupOracle}\n\nSAVEPOINT before_fix;\n${fix}\nCOMMIT;`,
  },
  save: false,
  spec: {
    tables: [
      { name: 'customers_new', allowExtra: true, minRows: 3, columns: [] },
      { name: 'orders_new', allowExtra: true, minRows: 5, columns: [] },
    ],
    probes: [
      {
        id: 'no-orphan',
        label: 'Mọi đơn trỏ tới một khách có thật (thêm được foreign key)',
        sql: {
          mysql: 'ALTER TABLE orders_new ADD CONSTRAINT fk_probe FOREIGN KEY (customer_id) REFERENCES customers_new (customer_id)',
          oracle: 'ALTER TABLE orders_new ADD CONSTRAINT fk_probe FOREIGN KEY (customer_id) REFERENCES customers_new (customer_id)',
        },
        expect: 'ok',
      },
      {
        id: 'no-negative',
        label: 'Không còn số tiền âm (thêm được CHECK số tiền không âm)',
        sql: {
          mysql: 'ALTER TABLE orders_new ADD CONSTRAINT ck_probe CHECK (amount >= 0)',
          oracle: 'ALTER TABLE orders_new ADD CONSTRAINT ck_probe CHECK (amount >= 0)',
        },
        expect: 'ok',
      },
    ],
  },
  why: 'Sau khi sửa, database nhận thêm được foreign key và CHECK. Hai luật này chỉ thêm được khi mọi row hiện có đã đúng. Đơn lỗi đã sạch, và còn đủ năm đơn.',
  hints: {
    light: 'Có hai lỗi, nên cần hai lệnh. Một lệnh xóa đơn trỏ tới khách không có. Một lệnh sửa số tiền âm.',
    specific:
      'Lệnh xóa dùng `NOT IN (SELECT customer_id FROM customers_new)` để tìm đơn lạc. Lệnh sửa là UPDATE đặt `amount` bằng 0 khi `amount < 0`. Giữ hai đơn có số tiền âm, chỉ đổi số tiền.',
    skeleton: {
      mysql: 'START TRANSACTION;\nSAVEPOINT before_fix;\nDELETE FROM ____\nWHERE customer_id NOT IN (SELECT ____ FROM customers_new);\nUPDATE orders_new SET amount = ____ WHERE amount < 0;\nCOMMIT;',
      oracle: 'SAVEPOINT before_fix;\nDELETE FROM ____\nWHERE customer_id NOT IN (SELECT ____ FROM customers_new);\nUPDATE orders_new SET amount = ____ WHERE amount < 0;\nCOMMIT;',
    },
  },
  wrong: [
    {
      failed: 'no-orphan',
      hint: 'Vẫn còn đơn trỏ tới khách không có thật, nên foreign key chưa thêm được. Xóa các đơn mà `customer_id` không nằm trong `customers_new`.',
    },
    {
      failed: 'no-negative',
      hint: 'Vẫn còn số tiền âm, nên CHECK chưa thêm được. Dùng UPDATE đặt `amount` bằng 0 khi `amount < 0`.',
    },
    {
      failed: 'orders_new:rows',
      hint: 'Table orders_new còn ít hơn 5 đơn. Chỉ xóa đúng đơn 104. Hai đơn số tiền âm phải ở lại, với số tiền 0.',
    },
  ],
};
