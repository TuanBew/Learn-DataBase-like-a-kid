/** Chữ và dữ liệu của cảnh "Bảng dialect" (bài MySQL và Oracle khác nhau ở đâu). */

export interface DialectTopic {
  id: string;
  /** Tên chủ đề trên nút. */
  title: string;
  mysql: string;
  oracle: string;
  /** false: chủ đề chỉ có chữ, không có nút chạy. */
  run: boolean;
  /** Câu của Bi nói điểm khác nhau. */
  say: string;
}

export const copy = {
  listLabel: 'Chủ đề',
  seen: 'Đã xem',
  mysql: 'MySQL',
  oracle: 'Oracle',
  run: 'Chạy cả hai',
  rerun: 'Chạy lại',
  noRun: 'Chủ đề này chỉ có chữ, không có nút chạy.',
  mistake: 'Nếu viết nhầm',
  mistakeInMysql: 'Gõ câu của Oracle vào MySQL:',
  mistakeInOracle: 'Gõ câu của MySQL vào Oracle:',
  mistakeOk: 'Câu này vẫn chạy được, nhưng kết quả có thể khác ý bạn.',
  sameSql: 'Hai dialect dùng cùng một câu. Kết quả mới khác nhau.',
  noRows: 'Không có row nào.',
  rowsMore: (n: number) => `và ${n} row nữa`,
  loading: 'Đang mở database mẫu.',
  loadFail: 'Không mở được database mẫu. Tải lại trang rồi thử lại.',
  says: {
    start: 'Chọn một chủ đề bên trái. Mình sẽ chỉ chỗ MySQL và Oracle viết khác nhau.',
    ready: 'Bấm Chạy cả hai để xem hai query này ra gì.',
    ran: 'Mình vừa chạy cả hai câu. Nhìn mục Nếu viết nhầm để biết mã lỗi.',
    ranSame: 'Mình vừa chạy câu này ở cả hai dialect. Hai kết quả khác nhau.',
    done: 'Bạn đã xem hết các chủ đề. Khi gặp lỗi lạ, hãy hỏi mình: dialect nào đang chạy?',
  },
  topics: [
    {
      id: 'top-n',
      title: 'Lấy n row đầu',
      mysql: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3',
      oracle: 'SELECT name, price FROM products ORDER BY price DESC FETCH FIRST 3 ROWS ONLY',
      run: true,
      say: 'MySQL viết `LIMIT 3` ở cuối. Oracle viết `FETCH FIRST 3 ROWS ONLY`. Cả hai lấy 3 row đầu sau khi sắp xếp.',
    },
    {
      id: 'concat',
      title: 'Nối chuỗi',
      mysql: "SELECT CONCAT(name, ' - ', category) AS mon FROM products WHERE product_id <= 3",
      oracle: "SELECT name || ' - ' || category AS mon FROM products WHERE product_id <= 3",
      run: true,
      say: 'MySQL nối bằng `CONCAT`. Oracle nối bằng `||`. Ở MySQL, `||` nghĩa là OR, nên không nối được chữ.',
    },
    {
      id: 'null-replace',
      title: 'Thay NULL',
      mysql: 'SELECT name, IFNULL(calories, 0) AS calo FROM products WHERE product_id IN (4, 5, 6)',
      oracle: 'SELECT name, NVL(calories, 0) AS calo FROM products WHERE product_id IN (4, 5, 6)',
      run: true,
      say: 'Cả hai thay NULL bằng một giá trị. MySQL gọi `IFNULL`, Oracle gọi `NVL`. `COALESCE` chạy được ở cả hai.',
    },
    {
      id: 'now',
      title: 'Ngày giờ hiện tại',
      mysql: 'SELECT NOW() AS bay_gio',
      oracle: 'SELECT SYSDATE AS bay_gio FROM DUAL',
      run: true,
      say: 'MySQL lấy giờ bằng `NOW()`. Oracle lấy bằng `SYSDATE`, viết không có ngoặc.',
    },
    {
      id: 'date-format',
      title: 'Định dạng ngày',
      mysql: "SELECT name, DATE_FORMAT(launched_on, '%d/%m/%Y') AS ngay FROM products WHERE product_id <= 3",
      oracle: "SELECT name, TO_CHAR(launched_on, 'DD/MM/YYYY') AS ngay FROM products WHERE product_id <= 3",
      run: true,
      say: 'MySQL dùng `DATE_FORMAT` với `%d/%m/%Y`. Oracle dùng `TO_CHAR` với `DD/MM/YYYY`.',
    },
    {
      id: 'str-to-date',
      title: 'Chuỗi thành ngày',
      mysql: "SELECT STR_TO_DATE('15/02/2026', '%d/%m/%Y') AS ngay",
      oracle: "SELECT TO_DATE('15/02/2026', 'DD/MM/YYYY') AS ngay FROM DUAL",
      run: true,
      say: 'MySQL đổi chuỗi thành ngày bằng `STR_TO_DATE`. Oracle dùng `TO_DATE`. Chuỗi format của hai bên viết khác nhau.',
    },
    {
      id: 'no-table',
      title: 'SELECT không cần table',
      mysql: 'SELECT 1 + 1 AS ket_qua',
      oracle: 'SELECT 1 + 1 AS ket_qua FROM DUAL',
      run: true,
      say: 'MySQL cho SELECT không có FROM. Oracle 19c luôn đòi FROM, nên bạn viết `FROM DUAL`. DUAL là table có sẵn để dùng ở chỗ này.',
    },
    {
      id: 'empty-string',
      title: 'Chuỗi rỗng',
      mysql: "SELECT CASE WHEN '' IS NULL THEN 'Có' ELSE 'Không' END AS rong_la_null FROM stores WHERE store_id = 1",
      oracle: "SELECT CASE WHEN '' IS NULL THEN 'Có' ELSE 'Không' END AS rong_la_null FROM stores WHERE store_id = 1",
      run: true,
      say: 'Oracle coi chuỗi rỗng là NULL. MySQL coi chuỗi rỗng là một giá trị thật. Cùng một câu, hai kết quả.',
    },
    {
      id: 'text-compare',
      title: 'So sánh chữ',
      mysql: "SELECT name FROM products WHERE name = 'trà sữa matcha'",
      oracle: "SELECT name FROM products WHERE name = 'trà sữa matcha'",
      run: true,
      say: 'MySQL 8 mặc định không phân biệt hoa thường. Oracle mặc định có phân biệt. Cùng một câu, MySQL tìm ra row, Oracle không.',
    },
    {
      id: 'quotes',
      title: 'Dấu nháy',
      mysql: 'SELECT name FROM products WHERE category = "Topping"',
      oracle: "SELECT name FROM products WHERE category = 'Topping'",
      run: true,
      say: 'Nháy đơn dùng được ở cả hai. MySQL nhận luôn nháy kép cho chữ. Oracle hiểu nháy kép là tên, nên báo tên sai.',
    },
    {
      id: 'table-alias',
      title: 'Alias của table',
      mysql: 'SELECT p.name FROM products AS p WHERE p.price > 40000',
      oracle: 'SELECT p.name FROM products p WHERE p.price > 40000',
      run: true,
      say: 'MySQL cho viết `AS` trước alias của table. Oracle không nhận `AS` ở chỗ này. Viết `products p` chạy được ở cả hai.',
    },
    {
      id: 'null-sort',
      title: 'NULL khi sắp xếp',
      mysql: 'SELECT name, calories FROM products ORDER BY calories LIMIT 4',
      oracle: 'SELECT name, calories FROM products ORDER BY calories FETCH FIRST 4 ROWS ONLY',
      run: true,
      say: 'Xếp tăng dần, MySQL đặt NULL lên đầu. Oracle đặt NULL xuống cuối. Oracle cho đổi bằng `NULLS FIRST` hoặc `NULLS LAST`.',
    },
    {
      id: 'data-type',
      title: 'Data type',
      mysql: 'CREATE TABLE menu (\n  price DECIMAL(10, 0),\n  name VARCHAR(100),\n  launched_on DATETIME\n)',
      oracle: 'CREATE TABLE menu (\n  price NUMBER(10),\n  name VARCHAR2(100),\n  launched_on DATE\n)',
      run: false,
      say: 'Mỗi dialect đặt tên data type riêng. Số là `DECIMAL` hay `NUMBER`. Chữ là `VARCHAR` hay `VARCHAR2`. `DATE` của Oracle có cả giờ.',
    },
    {
      id: 'auto-id',
      title: 'Tự tăng id',
      mysql: 'CREATE TABLE orders (\n  order_id INT AUTO_INCREMENT PRIMARY KEY,\n  status VARCHAR(20)\n)',
      oracle: 'CREATE TABLE orders (\n  order_id NUMBER GENERATED AS IDENTITY PRIMARY KEY,\n  status VARCHAR2(20)\n)',
      run: false,
      say: 'MySQL dùng `AUTO_INCREMENT`. Oracle dùng `GENERATED AS IDENTITY`. Viết gọn như trên thì Oracle không cho bạn tự gán id khi INSERT.',
    },
    {
      id: 'commit',
      title: 'Lưu thay đổi',
      mysql: "INSERT INTO products (product_id, name, category, price)\nVALUES (15, 'Bánh flan', 'Topping', 12000)",
      oracle: "INSERT INTO products (product_id, name, category, price)\nVALUES (15, 'Bánh flan', 'Topping', 12000);\nCOMMIT;",
      run: false,
      say: 'MySQL mặc định tự lưu sau mỗi lệnh. Oracle giữ thay đổi ở trạng thái chờ, người khác chưa thấy, tới khi bạn gõ `COMMIT`.',
    },
  ] as readonly DialectTopic[],
} as const;
