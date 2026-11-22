import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c5-b7',
  chapter: 5,
  order: 7,
  title: 'Xử lý NULL: NVL, NVL2, COALESCE, IFNULL, NULLIF',
  lead: 'Bạn thay NULL bằng giá trị rõ ràng, giữ NULL khỏi làm hỏng phép tính, và biến giá trị giữ chỗ thành NULL.',
  minutes: 16,
  goals: [
    'Thay NULL bằng IFNULL, NVL hoặc COALESCE',
    'Biết function nào chạy ở dialect nào',
    'Biết NULL làm phép tính và phép nối chuỗi ra kết quả gì',
    'Chọn kết quả theo NULL bằng NVL2 hoặc IF',
    'Biến một giá trị thành NULL bằng NULLIF, và tránh chia cho 0',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Món chưa có calo thì ghi gì?',
      paragraphs: [
        'Bi in thực đơn mới cho khách. Cạnh mỗi món có số calo.',
        'Ba món chưa đo calo, nên ô calories còn trống. Khách nhìn ô trống thì không biết đó là 0 hay chưa đo.',
        'Bi muốn ghi một con số rõ ràng ở những ô trống đó.',
        'Query làm được. Bài này dạy các function xử lý NULL.',
      ],
    },
    {
      type: 'text',
      title: 'Thay NULL bằng giá trị khác',
      paragraphs: [
        'Column calories có **[[null]]** ở các món chưa đo. NULL nghĩa là chưa có giá trị. Bạn thay NULL bằng một giá trị khác ngay trong kết quả.',
        'MySQL có **[[ifnull]]**: `IFNULL(calories, 0)`. Nếu calories khác NULL, kết quả giữ nguyên calories. Nếu là NULL, kết quả là 0.',
        'Oracle có **[[nvl]]**, dùng giống hệt: `NVL(calories, 0)`.',
        '**[[coalesce]]** chạy ở cả hai dialect. COALESCE nhận một danh sách và trả giá trị đầu tiên khác NULL.',
        'Cả ba chỉ đổi kết quả hiện ra. Table vẫn giữ NULL.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: thay NULL bằng 0',
      intro: 'Bấm Chạy. Hai món chưa có calo hiện số 0 ở column calories_filled.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT name, calories, IFNULL(calories, 0) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping');",
        oracle:
          "SELECT name, calories, NVL(calories, 0) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping')",
      },
      tries: [
        {
          label: 'Đổi IFNULL hoặc NVL thành COALESCE',
          sql: {
            mysql:
              "SELECT name, calories, COALESCE(calories, 0) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping');",
            oracle:
              "SELECT name, calories, COALESCE(calories, 0) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping')",
          },
        },
        {
          label: 'Đổi 0 thành 100',
          sql: {
            mysql:
              "SELECT name, calories, IFNULL(calories, 100) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping');",
            oracle:
              "SELECT name, calories, NVL(calories, 100) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping')",
          },
        },
        {
          label: 'Thêm column calories + 10',
          sql: {
            mysql:
              "SELECT name, calories, IFNULL(calories, 0) AS calories_filled, calories + 10 AS plus_ten\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping');",
            oracle:
              "SELECT name, calories, NVL(calories, 0) AS calories_filled, calories + 10 AS plus_ten\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping')",
          },
        },
      ],
      say: 'Column plus_ten vẫn là NULL ở hai món đó, vì phép cộng dùng calories gốc, không dùng calories_filled.',
    },
    {
      type: 'text',
      title: 'NULL trong phép tính và khi nối chuỗi',
      paragraphs: [
        'NULL nghĩa là chưa biết. Phép tính với một giá trị chưa biết cho kết quả chưa biết.',
        'Công ty trả thu nhập bằng lương cộng hoa hồng. Hoa hồng bằng lương nhân `commission_pct`.',
        'Nhiều người không có hoa hồng, nên commission_pct của họ là NULL. Với họ, `salary + salary * commission_pct` ra NULL, không ra lương.',
        'Bạn thay NULL bằng 0 trước khi tính: `COALESCE(commission_pct, 0)`. Người không có hoa hồng nhận hoa hồng 0.',
        'Nối chuỗi cũng gặp NULL. CONCAT của MySQL ra NULL khi một mảnh là NULL. Phép `||` của Oracle coi NULL như chuỗi rỗng.',
        'Query dưới đây tính thu nhập của năm người, và nối tên với hoa hồng.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: thu nhập có hoa hồng',
      intro: 'Bấm Chạy. Column raw_total dùng commission_pct thẳng. Column total thay NULL bằng 0 trước khi tính.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT last_name, salary, commission_pct,\n  salary + salary * commission_pct AS raw_total,\n  ROUND(salary * (1 + COALESCE(commission_pct, 0))) AS total,\n  CONCAT(last_name, ' - ', commission_pct) AS label\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118);",
        oracle:
          "SELECT last_name, salary, commission_pct,\n  salary + salary * commission_pct AS raw_total,\n  ROUND(salary * (1 + COALESCE(commission_pct, 0))) AS total,\n  last_name || ' - ' || commission_pct AS label\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118)",
      },
      tries: [
        {
          label: 'Đổi COALESCE thành IFNULL (MySQL) hoặc NVL (Oracle)',
          sql: {
            mysql:
              "SELECT last_name, salary, commission_pct,\n  salary + salary * commission_pct AS raw_total,\n  ROUND(salary * (1 + IFNULL(commission_pct, 0))) AS total,\n  CONCAT(last_name, ' - ', commission_pct) AS label\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118);",
            oracle:
              "SELECT last_name, salary, commission_pct,\n  salary + salary * commission_pct AS raw_total,\n  ROUND(salary * (1 + NVL(commission_pct, 0))) AS total,\n  last_name || ' - ' || commission_pct AS label\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118)",
          },
        },
        {
          label: 'Đổi 0 thành 0.05',
          sql: {
            mysql:
              "SELECT last_name, salary, commission_pct,\n  salary + salary * commission_pct AS raw_total,\n  ROUND(salary * (1 + COALESCE(commission_pct, 0.05))) AS total,\n  CONCAT(last_name, ' - ', commission_pct) AS label\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118);",
            oracle:
              "SELECT last_name, salary, commission_pct,\n  salary + salary * commission_pct AS raw_total,\n  ROUND(salary * (1 + COALESCE(commission_pct, 0.05))) AS total,\n  last_name || ' - ' || commission_pct AS label\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118)",
          },
        },
        {
          label: 'Bọc commission_pct trong COALESCE ở column label',
          sql: {
            mysql:
              "SELECT last_name, salary, commission_pct,\n  salary + salary * commission_pct AS raw_total,\n  ROUND(salary * (1 + COALESCE(commission_pct, 0))) AS total,\n  CONCAT(last_name, ' - ', COALESCE(commission_pct, 0)) AS label\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118);",
            oracle:
              "SELECT last_name, salary, commission_pct,\n  salary + salary * commission_pct AS raw_total,\n  ROUND(salary * (1 + COALESCE(commission_pct, 0))) AS total,\n  last_name || ' - ' || COALESCE(commission_pct, 0) AS label\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118)",
          },
        },
      ],
      say: 'Nhìn kết quả của Bảo ở column label. MySQL ra NULL, Oracle ra "Bảo - ". Cùng query, hai kết quả.',
    },
    {
      type: 'text',
      title: 'Chọn theo NULL và biến giá trị thành NULL',
      paragraphs: [
        '**[[nvl2]]** của Oracle xét một giá trị có NULL hay không, rồi chọn một trong hai kết quả.',
        'Viết `NVL2(x, khi_có, khi_NULL)`. Nếu x khác NULL, kết quả là giá trị thứ hai. Nếu x là NULL, kết quả là giá trị thứ ba.',
        'MySQL không có NVL2. Bạn viết `IF(x IS NULL, khi_NULL, khi_có)`. IF ra giá trị thứ hai khi điều kiện đúng, và giá trị thứ ba khi điều kiện sai.',
        '**[[nullif]]** làm ngược lại với COALESCE: NULLIF biến một giá trị thành NULL. `NULLIF(a, b)` ra NULL nếu a bằng b. Nếu a khác b, kết quả là a.',
        'Dùng NULLIF khi một giá trị giữ chỗ thực ra nghĩa là chưa có. Ở công ty này, hoa hồng 10% là mức mặc định.',
        'NULLIF còn tránh lỗi chia cho 0. `x / NULLIF(y, 0)` ra NULL khi y bằng 0, thay vì báo lỗi.',
        'Query dưới đây gắn nhãn Có hoặc Không cho hoa hồng, và biến mức mặc định 10% thành NULL.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: NVL2, IF và NULLIF',
      intro: 'Bấm Chạy. Column has_commission cho Có hoặc Không. Column special_rate chỉ giữ hoa hồng khác mức mặc định 10%.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT last_name, commission_pct,\n  IF(commission_pct IS NULL, 'Không', 'Có') AS has_commission,\n  NULLIF(commission_pct, 0.1) AS special_rate\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118);",
        oracle:
          "SELECT last_name, commission_pct,\n  NVL2(commission_pct, 'Có', 'Không') AS has_commission,\n  NULLIF(commission_pct, 0.1) AS special_rate\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118)",
      },
      tries: [
        {
          label: "Đổi 'Có' và 'Không' cho nhau",
          sql: {
            mysql:
              "SELECT last_name, commission_pct,\n  IF(commission_pct IS NULL, 'Có', 'Không') AS has_commission,\n  NULLIF(commission_pct, 0.1) AS special_rate\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118);",
            oracle:
              "SELECT last_name, commission_pct,\n  NVL2(commission_pct, 'Không', 'Có') AS has_commission,\n  NULLIF(commission_pct, 0.1) AS special_rate\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118)",
          },
        },
        {
          label: 'Đổi NULLIF(..., 0.1) thành NULLIF(..., 0.15)',
          sql: {
            mysql:
              "SELECT last_name, commission_pct,\n  IF(commission_pct IS NULL, 'Không', 'Có') AS has_commission,\n  NULLIF(commission_pct, 0.15) AS special_rate\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118);",
            oracle:
              "SELECT last_name, commission_pct,\n  NVL2(commission_pct, 'Có', 'Không') AS has_commission,\n  NULLIF(commission_pct, 0.15) AS special_rate\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118)",
          },
        },
        {
          label: 'Thêm column chia cho NULLIF(0, 0)',
          sql: {
            mysql:
              "SELECT last_name, commission_pct,\n  IF(commission_pct IS NULL, 'Không', 'Có') AS has_commission,\n  NULLIF(commission_pct, 0.1) AS special_rate,\n  salary / NULLIF(0, 0) AS safe_divide\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118);",
            oracle:
              "SELECT last_name, commission_pct,\n  NVL2(commission_pct, 'Có', 'Không') AS has_commission,\n  NULLIF(commission_pct, 0.1) AS special_rate,\n  salary / NULLIF(0, 0) AS safe_divide\nFROM employees\nWHERE employee_id IN (103, 104, 105, 107, 118)",
          },
        },
      ],
      say: 'Mục cuối chia lương cho NULL, nên cả năm người ra NULL và query không báo lỗi. Nếu chia thẳng cho 0, Oracle báo ORA-01476.',
    },
    {
      type: 'oracle',
      body: [
        'IFNULL chỉ có ở MySQL. NVL chỉ có ở Oracle. Gõ nhầm thì database báo không biết function đó.',
        'MySQL báo lỗi 1305 khi gặp NVL hoặc NVL2. Oracle báo ORA-00904 khi gặp IFNULL hoặc IF.',
        'Muốn một query chạy ở cả hai dialect, dùng COALESCE và NULLIF. COALESCE của Oracle cần ít nhất hai tham số.',
        'Chia cho 0: MySQL ra NULL, Oracle báo ORA-01476. Bọc mẫu số bằng NULLIF, như `salary / NULLIF(y, 0)`, thì cả hai cùng ra NULL.',
        'Oracle coi chuỗi rỗng là NULL, nên `NVL(\'\', \'trống\')` ra `trống`. MySQL giữ chuỗi rỗng, nên `IFNULL(\'\', \'trống\')` ra chuỗi rỗng.',
      ],
      mysql: "IFNULL(commission_pct, 0)\nIF(commission_pct IS NULL, 'Không', 'Có')\nsalary / 0   -- ra NULL",
      oracle: "NVL(commission_pct, 0)\nNVL2(commission_pct, 'Có', 'Không')\nsalary / 0   -- lỗi ORA-01476",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn cần một query chạy được ở cả MySQL và Oracle. Dùng function nào để thay NULL?',
          options: [
            { text: '`IFNULL`', feedback: 'Chỉ MySQL biết IFNULL. Oracle báo ORA-00904.' },
            { text: '`NVL`', feedback: 'Chỉ Oracle biết NVL. MySQL báo lỗi 1305.' },
            { text: '`COALESCE`', correct: true, feedback: 'Đúng. COALESCE chạy ở cả hai dialect.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Column commission_pct của anh Bảo là NULL. Query tính `salary + salary * commission_pct`. Kết quả là gì?',
          options: [
            { text: '38000000, đúng bằng lương', feedback: 'Database không tự coi NULL là 0. Muốn ra lương, viết `COALESCE(commission_pct, 0)`.' },
            { text: 'NULL', correct: true, feedback: 'Đúng. Một giá trị NULL làm cả phép tính thành NULL.' },
            { text: '0', feedback: 'NULL là chưa biết, không phải 0. Kết quả cũng chưa biết, nên là NULL.' },
          ],
        },
        {
          kind: 'choice',
          question: "Bạn dùng Oracle: `NVL2(commission_pct, 'Có', 'Không')`. Với anh Bảo, commission_pct là NULL. Kết quả là gì?",
          options: [
            { text: 'Có', feedback: 'Giá trị thứ hai chỉ hiện khi x khác NULL. Anh Bảo có x là NULL.' },
            { text: 'Không', correct: true, feedback: 'Đúng. x là NULL thì NVL2 ra giá trị thứ ba.' },
            { text: 'NULL', feedback: 'NVL2 luôn ra một trong hai giá trị bạn viết. Ở đây là giá trị thứ ba.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Phiếu lương thiếu số tiền',
      paragraphs: [
        'Cuối tháng, kế toán in phiếu lương. Tổng thu nhập bằng lương cộng thưởng cộng hoa hồng.',
        'Người không có hoa hồng làm cả tổng thành NULL, và phiếu của họ trống. Kế toán thêm COALESCE cho từng khoản, và phiếu hiện đủ.',
        'Câu hỏi đầu tiên khi một con số biến mất là: có column nào trong phép tính đang là NULL không?',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'IFNULL chỉ có ở MySQL. NVL và NVL2 chỉ có ở Oracle. COALESCE và NULLIF chạy ở cả hai.',
        'Một giá trị NULL làm phép tính ra NULL. CONCAT của MySQL ra NULL, còn `||` của Oracle bỏ qua NULL.',
        'NVL2(x, khi_có, khi_NULL) ở Oracle, `IF(x IS NULL, khi_NULL, khi_có)` ở MySQL.',
        'NULLIF(a, b) ra NULL khi a bằng b. `x / NULLIF(y, 0)` tránh lỗi chia cho 0.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, Flow Control Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/flow-control-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, NVL', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/NVL.html' },
        { name: 'Oracle Database 19c SQL Language Reference, NVL2', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/NVL2.html' },
        { name: 'Oracle Database 19c SQL Language Reference, COALESCE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/COALESCE.html' },
        { name: 'Oracle Database 19c SQL Language Reference, NULLIF', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/NULLIF.html' },
      ],
    },
  ],
};
