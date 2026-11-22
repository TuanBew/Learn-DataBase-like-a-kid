import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c6-b5',
  chapter: 6,
  order: 5,
  title: 'Đếm có điều kiện và xoay ngang bằng CASE',
  lead: 'Bạn đếm nhiều loại row trong một query, và đặt mỗi loại vào một column riêng.',
  minutes: 16,
  goals: [
    'Đếm có điều kiện bằng SUM(CASE ...) và COUNT(CASE ...)',
    'Xoay báo cáo dọc thành báo cáo ngang, mỗi trạng thái một column',
    'Biết khi nào CASE hợp hơn WHERE',
    'Biết SUM không có ELSE cho NULL, còn COUNT cho 0',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Mỗi tiệm: bao nhiêu đơn xong, bao nhiêu đơn hủy?',
      paragraphs: [
        'Chủ tiệm hỏi Bi: "Mỗi tiệm có bao nhiêu đơn xong và bao nhiêu đơn hủy?"',
        'Ở bài GROUP BY, mình gom theo tiệm và trạng thái. Kết quả có 6 row. Tiệm nào cũng chiếm một đến hai row.',
        'Chủ tiệm muốn một row cho mỗi tiệm. Hai con số đứng cạnh nhau: số đơn xong, số đơn hủy.',
        'Kiểu báo cáo này gọi là xoay ngang. Mỗi trạng thái từ một row thành một column.',
      ],
    },
    {
      type: 'text',
      title: 'CASE biến mỗi row thành 1 hoặc 0',
      paragraphs: [
        '**[[case-when]]** chọn một giá trị theo điều kiện, giống câu "nếu... thì...".',
        '`CASE WHEN status = \'done\' THEN 1 ELSE 0 END` cho 1 với đơn xong và 0 với mọi đơn khác.',
        'Bọc CASE trong SUM thì SUM cộng các số 1 đó. Kết quả là số đơn xong của nhóm.',
        'Mỗi CASE thành một column của báo cáo. Hai CASE cho hai column cạnh nhau.',
        '**[[pivot]]** là tên gọi của cách xoay giá trị của một column thành nhiều column.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đơn xong và đơn hủy của từng tiệm',
      intro: 'Bấm Chạy. Mỗi tiệm một row. Table orders có 20 đơn.',
      database: 'teashop',
      tables: ['orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT store_id,\n       SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done_orders,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,\n       COUNT(*) AS total_orders\nFROM orders\nGROUP BY store_id\nORDER BY store_id;",
        oracle:
          "SELECT store_id,\n       SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done_orders,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,\n       COUNT(*) AS total_orders\nFROM orders\nGROUP BY store_id\nORDER BY store_id",
      },
      tries: [
        {
          label: 'Đổi SUM(CASE ... ELSE 0) thành COUNT(CASE ...) không ELSE',
          sql: {
            mysql:
              "SELECT store_id,\n       COUNT(CASE WHEN status = 'done' THEN 1 END) AS done_orders,\n       COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders,\n       COUNT(*) AS total_orders\nFROM orders\nGROUP BY store_id\nORDER BY store_id;",
            oracle:
              "SELECT store_id,\n       COUNT(CASE WHEN status = 'done' THEN 1 END) AS done_orders,\n       COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders,\n       COUNT(*) AS total_orders\nFROM orders\nGROUP BY store_id\nORDER BY store_id",
          },
        },
        {
          label: 'Bỏ ELSE 0 trong hai SUM',
          sql: {
            mysql:
              "SELECT store_id,\n       SUM(CASE WHEN status = 'done' THEN 1 END) AS done_orders,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders,\n       COUNT(*) AS total_orders\nFROM orders\nGROUP BY store_id\nORDER BY store_id;",
            oracle:
              "SELECT store_id,\n       SUM(CASE WHEN status = 'done' THEN 1 END) AS done_orders,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders,\n       COUNT(*) AS total_orders\nFROM orders\nGROUP BY store_id\nORDER BY store_id",
          },
        },
        {
          label: 'Đổi status thành payment',
          sql: {
            mysql:
              "SELECT store_id,\n       SUM(CASE WHEN payment = 'tiền mặt' THEN 1 ELSE 0 END) AS cash_orders,\n       SUM(CASE WHEN payment = 'thẻ' THEN 1 ELSE 0 END) AS card_orders,\n       SUM(CASE WHEN payment = 'ví điện tử' THEN 1 ELSE 0 END) AS wallet_orders\nFROM orders\nGROUP BY store_id\nORDER BY store_id;",
            oracle:
              "SELECT store_id,\n       SUM(CASE WHEN payment = 'tiền mặt' THEN 1 ELSE 0 END) AS cash_orders,\n       SUM(CASE WHEN payment = 'thẻ' THEN 1 ELSE 0 END) AS card_orders,\n       SUM(CASE WHEN payment = 'ví điện tử' THEN 1 ELSE 0 END) AS wallet_orders\nFROM orders\nGROUP BY store_id\nORDER BY store_id",
          },
        },
        {
          label: 'Xem lại bản dọc: GROUP BY store_id, status',
          sql: {
            mysql:
              'SELECT store_id, status, COUNT(*) AS orders_count\nFROM orders\nGROUP BY store_id, status\nORDER BY store_id, status;',
            oracle:
              'SELECT store_id, status, COUNT(*) AS orders_count\nFROM orders\nGROUP BY store_id, status\nORDER BY store_id, status',
          },
        },
      ],
      say: 'Bỏ ELSE 0 thì SUM cho NULL ở tiệm không có đơn hủy. COUNT thì luôn cho số, kể cả số 0.',
    },
    {
      type: 'text',
      title: 'COUNT(CASE ...) và SUM(CASE ...)',
      paragraphs: [
        'Có hai cách đếm có điều kiện, và cả hai cho cùng kết quả.',
        '`SUM(CASE WHEN điều kiện THEN 1 ELSE 0 END)` cộng các số 1 và 0.',
        '`COUNT(CASE WHEN điều kiện THEN 1 END)` không có ELSE. CASE trả NULL cho row không thỏa, và COUNT bỏ qua NULL.',
        'Đừng viết `COUNT(CASE WHEN điều kiện THEN 1 ELSE 0 END)`. Số 0 cũng khác NULL, nên COUNT đếm mọi row.',
        'Tiệm không có đơn hủy: SUM không có ELSE cho NULL, vì mọi giá trị đều NULL. COUNT cho 0.',
      ],
    },
    {
      type: 'text',
      title: 'CASE hay WHERE?',
      paragraphs: [
        'WHERE lọc một điều kiện cho cả query. Mọi column của kết quả chịu chung điều kiện đó.',
        '`WHERE status = \'cancelled\'` chỉ giữ đơn hủy. Kết quả chỉ có tiệm 1 và tiệm 2. Tiệm 3 và tiệm 4 biến mất, dù họ có đơn.',
        'CASE nằm trong từng column. Mỗi column có điều kiện riêng, và mọi tiệm đều có row.',
        'Cần nhiều con số với nhiều điều kiện trong một báo cáo thì dùng CASE.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đơn theo trạng thái và theo tháng',
      intro: 'Bấm Chạy. Mỗi tháng một row, mỗi trạng thái một column. Dữ liệu là đơn của công ty từ tháng 2025-10.',
      database: 'company',
      tables: ['orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n       SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
        oracle:
          "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n       SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month",
      },
      tries: [
        {
          label: 'Thêm column COUNT(*) AS total',
          sql: {
            mysql:
              "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       COUNT(*) AS total,\n       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n       SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
            oracle:
              "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       COUNT(*) AS total,\n       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n       SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month",
          },
        },
        {
          label: 'Bỏ điều kiện WHERE order_date >= ...',
          sql: {
            mysql:
              "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n       SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
            oracle:
              "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n       SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month",
          },
        },
        {
          label: "Đổi điều kiện in_progress thành status <> 'delivered' AND status <> 'cancelled'",
          sql: {
            mysql:
              "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n       SUM(CASE WHEN status <> 'delivered' AND status <> 'cancelled' THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
            oracle:
              "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n       SUM(CASE WHEN status <> 'delivered' AND status <> 'cancelled' THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month",
          },
        },
      ],
      say: 'Tháng 2025-10 và 2025-11 cùng có 6 đơn, nhưng tháng 2025-11 có 1 đơn hủy. Nhìn ngang, bạn thấy ngay tháng nào có đơn hủy.',
    },
    {
      type: 'oracle',
      body: [
        'SUM(CASE ...) và COUNT(CASE ...) chạy giống nhau ở cả hai dialect. Bài này dùng chúng vì lý do đó.',
        'Oracle còn có từ khóa PIVOT riêng để xoay ngang. MySQL không có PIVOT.',
        'Báo cáo viết bằng CASE chạy được ở cả hai nơi, nên bạn chuyển query từ MySQL sang Oracle không phải sửa.',
        'Alias hiện chữ hoa ở Oracle: `done_orders` hiện thành `DONE_ORDERS`. Giá trị bên trong không đổi.',
      ],
      mysql: "COUNT(CASE WHEN status = 'done' THEN 1 END) AS done_orders",
      oracle: "COUNT(CASE WHEN status = 'done' THEN 1 END) AS done_orders",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Biểu thức nào đếm đúng số đơn có status là done?',
          options: [
            { text: "`SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)`", correct: true, feedback: 'Đúng. Đơn xong cho 1, đơn khác cho 0, SUM cộng lại.' },
            { text: "`SUM(CASE WHEN status = 'done' THEN 0 ELSE 1 END)`", feedback: 'Biểu thức này đếm đơn không phải done, vì 1 và 0 bị đổi chỗ.' },
            { text: "`COUNT(CASE WHEN status = 'done' THEN 1 ELSE 0 END)`", feedback: 'COUNT đếm mọi giá trị khác NULL, và số 0 cũng khác NULL. Biểu thức này đếm cả 20 đơn.' },
          ],
        },
        {
          kind: 'choice',
          question: "Tiệm 3 không có đơn hủy. `SUM(CASE WHEN status = 'cancelled' THEN 1 END)` cho tiệm 3 giá trị gì?",
          options: [
            { text: 'NULL', correct: true, feedback: 'Đúng. Không có ELSE, CASE trả NULL cho mọi row, và SUM của toàn NULL là NULL.' },
            { text: '0', feedback: 'Muốn ra 0 thì thêm ELSE 0, hoặc dùng COUNT.' },
            { text: '1', feedback: 'Tiệm 3 không có đơn hủy nào, nên không có số 1 nào để cộng.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Báo cáo đã có hai column đếm. Bạn muốn thêm column đếm đơn trả bằng thẻ. Làm gì?',
          options: [
            { text: 'Thêm một biểu thức CASE nữa vào SELECT', correct: true, feedback: 'Đúng. Mỗi con số cần thêm là một biểu thức, trong cùng một query.' },
            { text: "Thêm `WHERE payment = 'thẻ'`", feedback: 'WHERE lọc cả query, nên hai column đếm cũ cũng chỉ đếm đơn trả bằng thẻ.' },
            { text: 'Viết thêm một query và ghép kết quả bằng tay', feedback: 'Một query là đủ. Ghép tay dễ sai và tốn thời gian.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo chấm công cuối tháng',
      paragraphs: [
        'Phòng nhân sự cần một báo cáo chấm công: mỗi nhân viên một row, các column là số ngày đi làm, nghỉ phép và đi muộn.',
        'Dữ liệu gốc ghi mỗi ngày một row với một trạng thái. Query dùng SUM(CASE ...) để xoay các trạng thái thành column.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'SUM(CASE WHEN điều kiện THEN 1 ELSE 0 END) đếm số row thỏa điều kiện trong mỗi nhóm.',
        'COUNT(CASE WHEN điều kiện THEN 1 END) cho cùng kết quả, và cho 0 khi không có row nào thỏa.',
        'Mỗi CASE là một column. Nhiều CASE xoay báo cáo dọc thành báo cáo ngang.',
        'Cần nhiều điều kiện trong một báo cáo thì dùng CASE. WHERE lọc cả query và làm mất row.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, bài 10: Queries with aggregates (Pt. 1)', url: 'https://sqlbolt.com/lesson/select_queries_with_aggregates' },
        { name: 'SQLBolt, bài 11: Queries with aggregates (Pt. 2)', url: 'https://sqlbolt.com/lesson/select_queries_with_aggregates_pt_2' },
        { name: 'MySQL 8.0 Reference Manual, Flow Control Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/flow-control-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, CASE Expressions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CASE-Expressions.html' },
      ],
    },
  ],
};
