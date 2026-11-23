import type { Lesson } from '../types';

const setupMysql = `CREATE TABLE menu_items (
  item_id INT PRIMARY KEY,
  item_name VARCHAR(40) NOT NULL,
  price DECIMAL(12,2) NOT NULL
);
INSERT INTO menu_items (item_id, item_name, price) VALUES
  (1, 'Cà phê sữa', 30000),
  (2, 'Trà đào', 45000),
  (3, 'Trà sữa', 48000),
  (4, 'Matcha đá xay', 55000),
  (5, 'Bánh flan', 25000);`;

const setupOracle = `CREATE TABLE menu_items (
  item_id NUMBER PRIMARY KEY,
  item_name VARCHAR2(40) NOT NULL,
  price NUMBER(12,2) NOT NULL
);
INSERT INTO menu_items (item_id, item_name, price) VALUES (1, 'Cà phê sữa', 30000);
INSERT INTO menu_items (item_id, item_name, price) VALUES (2, 'Trà đào', 45000);
INSERT INTO menu_items (item_id, item_name, price) VALUES (3, 'Trà sữa', 48000);
INSERT INTO menu_items (item_id, item_name, price) VALUES (4, 'Matcha đá xay', 55000);
INSERT INTO menu_items (item_id, item_name, price) VALUES (5, 'Bánh flan', 25000);
CREATE TABLE price_update (
  item_id NUMBER PRIMARY KEY,
  item_name VARCHAR2(40) NOT NULL,
  price NUMBER(12,2) NOT NULL
);
INSERT INTO price_update (item_id, item_name, price) VALUES (2, 'Trà đào', 47000);
INSERT INTO price_update (item_id, item_name, price) VALUES (3, 'Trà sữa', 50000);
INSERT INTO price_update (item_id, item_name, price) VALUES (6, 'Trà vải', 42000);
COMMIT;`;

const showMenu = 'SELECT item_id, item_name, price FROM menu_items ORDER BY item_id;';

const mysqlFirst = `-- Danh sách giá mới: món 2 và 3 đã có, món 6 chưa có.
INSERT INTO menu_items (item_id, item_name, price)
VALUES (2, 'Trà đào', 47000),
       (3, 'Trà sữa', 50000),
       (6, 'Trà vải', 42000) AS moi
ON DUPLICATE KEY UPDATE price = moi.price;

${showMenu}`;

const oracleMerge = `MERGE INTO menu_items m
USING price_update p
ON (m.item_id = p.item_id)
WHEN MATCHED THEN
  UPDATE SET m.price = p.price
WHEN NOT MATCHED THEN
  INSERT (item_id, item_name, price)
  VALUES (p.item_id, p.item_name, p.price);`;

const oracleFirst = `-- Danh sách giá mới nằm sẵn trong table price_update.
SELECT item_id, item_name, price FROM price_update ORDER BY item_id;

-- Món 2 và 3 đã có, món 6 chưa có.
${oracleMerge}

${showMenu}

COMMIT;`;

const mysqlSecond = `-- Thêm món 7 và đổi giá món 4.
INSERT INTO menu_items (item_id, item_name, price)
VALUES (4, 'Matcha đá xay', 52000),
       (7, 'Sinh tố bơ', 38000) AS moi
ON DUPLICATE KEY UPDATE price = moi.price;

${showMenu}`;

const oracleSecond = `-- Thay danh sách giá mới bằng hai món khác.
DELETE FROM price_update;
INSERT INTO price_update (item_id, item_name, price) VALUES (4, 'Matcha đá xay', 52000);
INSERT INTO price_update (item_id, item_name, price) VALUES (7, 'Sinh tố bơ', 38000);

${oracleMerge}

${showMenu}

COMMIT;`;

export const lesson: Lesson = {
  id: 'c10-b6',
  chapter: 10,
  order: 6,
  title: 'Có thì sửa, chưa có thì thêm: MERGE và ON DUPLICATE KEY UPDATE',
  lead: 'Bạn nạp một danh sách vào table bằng một lệnh: row đã có thì sửa, row chưa có thì thêm.',
  minutes: 14,
  goals: [
    'Hiểu vì sao cần một lệnh làm cả sửa lẫn thêm',
    'Viết MERGE ở Oracle',
    'Viết INSERT ... ON DUPLICATE KEY UPDATE ở MySQL',
    'Biết lệnh này cần primary key hoặc UNIQUE để nhận ra row đã có',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Nhà cung cấp gửi bảng giá mới',
      paragraphs: [
        'Sáng thứ hai, nhà cung cấp gửi cho Bi một danh sách giá mới: ba món.',
        'Hai món đã có trong thực đơn, chỉ đổi giá. Một món là trà vải, thực đơn chưa có.',
        'Bi có thể xem từng món: có rồi thì UPDATE, chưa có thì INSERT. Danh sách ba món thì làm được. Danh sách ba nghìn món thì không.',
        'Bi cần một lệnh tự xem từng món và chọn đúng cách xử lý.',
      ],
    },
    {
      type: 'text',
      title: 'Hai thử nghiệm sai trước',
      paragraphs: [
        'Bi thử INSERT cả danh sách. Món đã có bị trùng primary key, nên database báo lỗi và không thêm gì.',
        'Bi thử UPDATE cả danh sách. Món trà vải chưa có row nào để sửa, nên nó bị bỏ sót.',
        'Cần một lệnh làm cả hai: tìm row theo mã, thấy thì sửa, không thấy thì thêm.',
      ],
    },
    {
      type: 'text',
      title: 'Oracle: MERGE',
      paragraphs: [
        '**[[merge]]** gộp danh sách mới vào table. Bạn viết ba phần: nguồn, điều kiện khớp, và cách xử lý cho từng trường hợp.',
        '`MERGE INTO menu_items m` là table đích, nơi dữ liệu được gộp vào.',
        '`USING price_update p` là nguồn: table hoặc subquery chứa danh sách mới.',
        '`ON (m.item_id = p.item_id)` là điều kiện khớp. Hai row cùng mã thì coi là cùng một món.',
        '`WHEN MATCHED THEN UPDATE SET ...` chạy cho món đã có. `WHEN NOT MATCHED THEN INSERT ...` chạy cho món chưa có.',
        'Column trong ON không được sửa ở nhánh UPDATE. Oracle báo ORA-38104 nếu bạn thử.',
      ],
    },
    {
      type: 'code',
      title: 'MERGE từng phần',
      intro: 'Đọc từng mục chú thích, rồi qua phần MySQL.',
      code:
        'MERGE INTO menu_items m\n' +
        'USING price_update p\n' +
        'ON (m.item_id = p.item_id)\n' +
        'WHEN MATCHED THEN\n' +
        '  UPDATE SET m.price = p.price\n' +
        'WHEN NOT MATCHED THEN\n' +
        '  INSERT (item_id, item_name, price)\n' +
        '  VALUES (p.item_id, p.item_name, p.price);',
      notes: [
        { find: 'MERGE INTO menu_items m', text: 'Table đích. Mọi thay đổi ghi vào đây.' },
        { find: 'USING price_update p', text: 'Nguồn. Mỗi row của nguồn được xét một lần.' },
        { find: 'ON (m.item_id = p.item_id)', text: 'Điều kiện khớp. Nên dùng primary key để mỗi row nguồn khớp tối đa một row đích.' },
        { find: 'UPDATE SET m.price = p.price', text: 'Món đã có: đổi giá theo danh sách.' },
        { find: 'INSERT (item_id, item_name, price)', text: 'Món chưa có: thêm row mới với giá trị từ nguồn.' },
      ],
    },
    {
      type: 'text',
      title: 'MySQL: ON DUPLICATE KEY UPDATE',
      paragraphs: [
        'MySQL không có MERGE. MySQL thêm một đuôi vào INSERT: **[[on-duplicate-key]]**.',
        'Bạn viết INSERT như bình thường. Nếu row mới trùng primary key hoặc UNIQUE với một row có sẵn, MySQL không báo lỗi. MySQL chạy phần UPDATE sau đuôi đó cho row có sẵn.',
        '`AS moi` đặt tên cho row mới. Sau đó `moi.price` là giá trong danh sách. Cú pháp này dành cho MySQL 8.0.19 trở lên.',
        'Bản MySQL cũ viết `price = VALUES(price)`. Bạn sẽ gặp cách này trong code cũ.',
      ],
    },
    {
      type: 'text',
      title: 'Cả hai cần cách nhận ra row đã có',
      paragraphs: [
        'MERGE so theo điều kiện ON. ON DUPLICATE KEY so theo primary key hoặc UNIQUE của table.',
        'Table không có primary key và không có UNIQUE thì ON DUPLICATE KEY không có gì để so. Row nào cũng bị coi là mới và được thêm.',
        'Nên chạy SELECT đếm trước, như mọi lần sửa dữ liệu. Biết trước bao nhiêu row sẽ sửa và bao nhiêu row sẽ thêm.',
      ],
    },
    {
      type: 'workshop',
      title: 'Xưởng: nạp giá mới',
      intro:
        'Thực đơn có 5 món. Danh sách giá mới có 3 món: món 2 và món 3 đã có, món 6 chưa có. Bấm Chạy để nạp. Mỗi dialect dùng lệnh của riêng nó. Rồi bấm từng nút thử, theo thứ tự từ trên xuống.',
      start: 'empty',
      setup: { mysql: setupMysql, oracle: setupOracle },
      dialects: ['mysql', 'oracle'],
      sql: { mysql: mysqlFirst, oracle: oracleFirst },
      tries: [
        {
          label: 'INSERT thường: món đã có',
          expect: 'error',
          sql: {
            mysql: "-- INSERT thường gặp row trùng primary key: lỗi 1062.\nINSERT INTO menu_items (item_id, item_name, price)\nVALUES (2, 'Trà đào', 47000);",
            oracle: "-- INSERT thường gặp row trùng primary key: ORA-00001.\nINSERT INTO menu_items (item_id, item_name, price)\nVALUES (2, 'Trà đào', 47000);",
          },
        },
        {
          label: 'Chạy lại danh sách cũ',
          sql: {
            mysql: `INSERT INTO menu_items (item_id, item_name, price)
VALUES (2, 'Trà đào', 47000),
       (3, 'Trà sữa', 50000),
       (6, 'Trà vải', 42000) AS moi
ON DUPLICATE KEY UPDATE price = moi.price;

SELECT COUNT(*) AS so_mon FROM menu_items;`,
            oracle: `${oracleMerge}

SELECT COUNT(*) AS so_mon FROM menu_items;

COMMIT;`,
          },
        },
        {
          label: 'Gõ nhầm lệnh của dialect kia',
          expect: 'error',
          sql: {
            mysql: `-- MySQL không có MERGE: lỗi 1064.
${oracleMerge}`,
            oracle: `-- Oracle không có ON DUPLICATE KEY: lỗi ORA-00933.
INSERT INTO menu_items (item_id, item_name, price)
VALUES (2, 'Trà đào', 47000)
ON DUPLICATE KEY UPDATE price = 47000;`,
          },
        },
        {
          label: 'Danh sách mới: một món có, một món chưa',
          sql: { mysql: mysqlSecond, oracle: oracleSecond },
        },
      ],
      say: 'Sau lần nạp đầu, thực đơn có 6 món. Chạy lại cùng danh sách thì vẫn 6 món, vì món nào cũng đã có.',
    },
    {
      type: 'oracle',
      body: [
        'Oracle dùng MERGE với bốn phần: INTO, USING, ON, và hai nhánh WHEN.',
        'MySQL dùng INSERT với đuôi ON DUPLICATE KEY UPDATE. Gõ lệnh của dialect này vào dialect kia thì database báo lỗi cú pháp.',
        'MERGE còn một lỗi đáng nhớ: ORA-30926. Lỗi này báo khi hai row nguồn cùng khớp một row đích. Hãy chắc nguồn không có hai row cùng mã.',
        'Ở Oracle, nhớ COMMIT sau MERGE. Ở MySQL, thêm START TRANSACTION trước nếu bạn muốn ROLLBACK được.',
      ],
      mysql:
        "INSERT INTO menu_items (item_id, item_name, price)\nVALUES (6, 'Trà vải', 42000) AS moi\nON DUPLICATE KEY UPDATE price = moi.price;",
      oracle:
        'MERGE INTO menu_items m\nUSING price_update p\nON (m.item_id = p.item_id)\nWHEN MATCHED THEN UPDATE SET m.price = p.price\nWHEN NOT MATCHED THEN INSERT (item_id, item_name, price)\n  VALUES (p.item_id, p.item_name, p.price);',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Danh sách mới có món đã có và món chưa có. Cách nào xử lý cả hai bằng một lệnh?',
          options: [
            { text: 'MERGE (Oracle) hoặc INSERT ... ON DUPLICATE KEY UPDATE (MySQL)', correct: true, feedback: 'Đúng. Mỗi dialect có một lệnh làm cả sửa lẫn thêm.' },
            { text: 'Chỉ cần INSERT', feedback: 'INSERT gặp món đã có sẽ báo lỗi trùng primary key.' },
            { text: 'Chỉ cần UPDATE', feedback: 'UPDATE không thêm được món chưa có row.' },
          ],
        },
        {
          kind: 'choice',
          question: 'MySQL dựa vào đâu để biết một row mới là "đã có"?',
          options: [
            { text: 'Row mới trùng primary key hoặc UNIQUE với một row có sẵn', correct: true, feedback: 'Đúng. Không có primary key hay UNIQUE thì MySQL không có gì để so.' },
            { text: 'Tên món giống nhau', feedback: 'MySQL không tự so tên. MySQL chỉ so primary key và UNIQUE.' },
            { text: 'Giá giống nhau', feedback: 'Giá không dùng để nhận ra row.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi phần của MERGE với ý của nó.',
          pairs: [
            { left: 'MERGE INTO', right: 'Table đích' },
            { left: 'USING', right: 'Nguồn: danh sách mới' },
            { left: 'ON', right: 'Điều kiện nhận ra row đã có' },
            { left: 'WHEN NOT MATCHED', right: 'Nhánh INSERT cho row chưa có' },
          ],
          done: 'Đúng hết. Bốn phần này đủ để đọc mọi câu MERGE ở công ty.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Nạp file giá mỗi sáng',
      paragraphs: [
        'Nhiều công ty nạp file từ đối tác vào database mỗi sáng: giá mới, tồn kho mới, danh sách khách mới.',
        'Script nạp thường chạy bằng một lệnh MERGE. Chạy lần hai cùng file thì kết quả không đổi, nên nếu script bị chạy lại, dữ liệu không bị nhân đôi.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Một lệnh làm cả hai: row đã có thì sửa, row chưa có thì thêm.',
        'Oracle: MERGE INTO ... USING ... ON (...) WHEN MATCHED THEN UPDATE ... WHEN NOT MATCHED THEN INSERT ...',
        'MySQL: INSERT ... ON DUPLICATE KEY UPDATE ...',
        'Cần primary key hoặc UNIQUE để nhận ra row đã có.',
        'Chạy lại cùng danh sách thì kết quả không đổi.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, INSERT ... ON DUPLICATE KEY UPDATE Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html' },
        { name: 'Oracle Database 19c SQL Language Reference, MERGE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/MERGE.html' },
      ],
    },
  ],
};
