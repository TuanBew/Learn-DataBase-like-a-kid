import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  chapter: 8,
  dialects: [ 'mysql', 'oracle' ],
  check: { orderMatters: false },
  id: 'c8-e9',
  kind: 'write',
  title: 'Quốc gia có khách nhưng chưa có văn phòng',
  prompt: 'Giám đốc kinh doanh hỏi: nước nào đã có khách mà công ty chưa mở văn phòng? Hãy lấy `country_id` của `customers` rồi trừ đi `country_id` của `locations`. Oracle dùng MINUS, MySQL dùng EXCEPT.',
  asks: [
    'Chỉ hiện `country_id`.',
    'Chỉ giữ mã quốc gia có trong `customers` mà không có trong `locations`.',
    'Mỗi mã quốc gia hiện một lần.'
  ],
  database: 'company',
  tables: [ 'customers', 'locations' ],
  starter: { mysql: '', oracle: '' },
  solution: {
    mysql: 'SELECT country_id FROM customers\nEXCEPT\nSELECT country_id FROM locations;',
    oracle: 'SELECT country_id FROM customers\nMINUS\nSELECT country_id FROM locations'
  },
  why: 'MINUS (MySQL là EXCEPT) lấy kết quả của query đầu rồi bỏ đi những row có ở query sau. Phần còn lại là các nước có khách và chưa có văn phòng.',
  hints: {
    light: 'Phép trừ giữ phần chỉ có ở query đầu. Thứ tự hai query quyết định kết quả.',
    specific: 'Query đầu đọc `country_id` từ `customers`. Query sau đọc `country_id` từ `locations`. Giữa hai query là MINUS ở Oracle, EXCEPT ở MySQL.',
    skeleton: {
      mysql: 'SELECT country_id FROM customers\n____\nSELECT country_id FROM locations',
      oracle: 'SELECT country_id FROM customers\n____\nSELECT country_id FROM locations'
    }
  },
  wrong: [
    {
      id: 'reverse',
      sql: {
        mysql: 'SELECT country_id FROM locations\nEXCEPT\nSELECT country_id FROM customers',
        oracle: 'SELECT country_id FROM locations\nMINUS\nSELECT country_id FROM customers'
      },
      hint: 'Hai query đang đứng ngược chỗ: đây là nước có văn phòng mà chưa có khách. Đổi chỗ để `customers` đứng trước.'
    },
    {
      id: 'intersect',
      sql: {
        mysql: 'SELECT country_id FROM customers\nINTERSECT\nSELECT country_id FROM locations',
        oracle: 'SELECT country_id FROM customers\nINTERSECT\nSELECT country_id FROM locations'
      },
      hint: 'INTERSECT giữ nước có ở cả hai bên, ngược với đề. Đổi thành MINUS (Oracle) hoặc EXCEPT (MySQL).'
    },
    {
      id: 'union',
      sql: {
        mysql: 'SELECT country_id FROM customers\nUNION\nSELECT country_id FROM locations',
        oracle: 'SELECT country_id FROM customers\nUNION\nSELECT country_id FROM locations'
      },
      hint: 'UNION gộp mọi nước của hai table. Đề cần phép trừ: MINUS ở Oracle, EXCEPT ở MySQL.'
    }
  ]
};
