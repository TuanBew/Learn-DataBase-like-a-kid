import type { BuildExercise } from '../types';

const mysql = `CREATE TABLE company_cars (
  car_id INT,
  plate VARCHAR(15),
  seats INT
);`;

const oracle = `CREATE TABLE company_cars (
  car_id NUMBER,
  plate VARCHAR2(15),
  seats NUMBER
)`;

export const exercise: BuildExercise = {
  id: 'c3-e2',
  chapter: 3,
  title: 'Sửa câu CREATE TABLE bị lỗi',
  kind: 'build',
  prompt:
    'Anh Quân gửi mình câu CREATE TABLE cho table xe công ty của Sao Mai. Câu này chạy báo lỗi. Có hai chỗ sai: thiếu một dấu phẩy và gõ sai tên một data type. Bạn sửa cho chạy được nhé.',
  asks: [],
  start: 'empty',
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: `CREATE TABLE company_cars (
  car_id INT
  plate VARCHAR(15),
  seats INTEGR
);`,
    oracle: `CREATE TABLE company_cars (
  car_id NUMBER
  plate VARCHAR2(15),
  seats NUMBR
)`,
  },
  solution: { mysql, oracle },
  save: false,
  spec: {
    tables: [
      {
        name: 'company_cars',
        columns: [
          { name: 'car_id', type: ['int', 'decimal'], label: '`car_id`: số nguyên' },
          { name: 'plate', type: 'text', minLength: 15, label: '`plate`: chữ tối đa 15 ký tự' },
          { name: 'seats', type: ['int', 'decimal'], label: '`seats`: số nguyên' },
        ],
      },
    ],
    probes: [
      {
        id: 'insert-car',
        label: 'Thêm một xe có đủ ba thông tin thì table nhận',
        sql: {
          mysql: "INSERT INTO company_cars (car_id, plate, seats) VALUES (1, '51A-123.45', 4)",
          oracle: "INSERT INTO company_cars (car_id, plate, seats) VALUES (1, '51A-123.45', 4)",
        },
        expect: 'ok',
      },
      {
        id: 'seats-number',
        label: 'Số chỗ ngồi là số: ghi chữ vào thì bị từ chối',
        sql: {
          mysql: "INSERT INTO company_cars (car_id, plate, seats) VALUES (2, '51B-678.90', 'bốn')",
          oracle: "INSERT INTO company_cars (car_id, plate, seats) VALUES (2, '51B-678.90', 'bốn')",
        },
        expect: 'error',
      },
    ],
  },
  why: 'Câu lệnh chạy được rồi. Thiếu dấu phẩy thì database không biết column này kết thúc ở đâu. Tên data type sai một chữ thì database không nhận ra. Khi gặp lỗi, bạn đọc thông báo, tìm đúng chỗ, và sửa từng chỗ một.',
  hints: {
    light: 'Bấm Chạy và đọc thông báo lỗi. Thông báo chỉ vị trí gần chỗ sai, và đôi khi nhắc tới dấu ngoặc dù lỗi nằm ở dấu phẩy. Sửa một chỗ rồi Chạy lại.',
    specific: 'Giữa hai column cần một dấu phẩy. Hãy xem column `car_id` và `plate`. Tên data type của `seats` cũng thiếu một chữ.',
    skeleton: {
      mysql: `CREATE TABLE company_cars (
  car_id INT ____
  plate VARCHAR(15),
  seats ____
);`,
      oracle: `CREATE TABLE company_cars (
  car_id NUMBER ____
  plate VARCHAR2(15),
  seats ____
)`,
    },
  },
  wrong: [
    {
      failed: 'table:company_cars',
      hint: 'Mình chưa thấy table company_cars. Kiểm tra tên table trong câu CREATE TABLE nhé.',
    },
    {
      failed: 'company_cars.seats',
      hint: 'Column `seats` đang có data type chưa hợp. Số chỗ ngồi là một con số, nên chọn data type số nguyên.',
    },
    {
      failed: 'company_cars.plate',
      hint: 'Biển số cần đủ chỗ cho 15 ký tự. Bạn kiểm tra lại con số trong ngoặc sau VARCHAR.',
    },
  ],
};
