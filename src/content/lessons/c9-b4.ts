import type { Lesson } from '../types';

type D = 'mysql' | 'oracle';

const MONTH: Record<D, string> = {
  mysql: "DATE_FORMAT(o.order_date, '%Y-%m')",
  oracle: "TO_CHAR(o.order_date, 'YYYY-MM')",
};

/** Doanh thu từng tháng (đơn chưa hủy), rồi thêm các column window ở query cuối. */
const monthly = (d: D, cols: string) =>
  `WITH monthly AS (
  SELECT ${MONTH[d]} AS order_month,
    SUM(i.quantity * i.unit_price) AS revenue
  FROM orders o
  JOIN order_items i ON i.order_id = o.order_id
  WHERE o.status <> 'cancelled'
  GROUP BY ${MONTH[d]}
)
SELECT order_month, revenue,
  ${cols}
FROM monthly
ORDER BY order_month${d === 'mysql' ? ';' : ''}`;

const BASE = `SUM(revenue) OVER (ORDER BY order_month) AS running_total,
  LAG(revenue) OVER (ORDER BY order_month) AS prev_revenue`;

const q = (cols: string) => ({ mysql: monthly('mysql', cols), oracle: monthly('oracle', cols) });

export const lesson: Lesson = {
  id: 'c9-b4',
  chapter: 9,
  order: 4,
  title: 'Cộng dồn và so với kỳ trước: SUM OVER, LAG, LEAD',
  lead: 'Bạn tính số cộng dồn và so từng tháng với tháng trước ngay trong một query.',
  minutes: 16,
  goals: [
    'Tính số cộng dồn bằng SUM(...) OVER (ORDER BY ...)',
    'Lấy giá trị của tháng trước bằng LAG và tháng sau bằng LEAD',
    'Đặt giá trị thay cho NULL ở row đầu bằng tham số thứ ba',
    'Tính phần trăm tăng so với tháng trước',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Tháng này hơn tháng trước bao nhiêu?',
      paragraphs: [
        'Chị Hạnh mở báo cáo doanh thu theo tháng và hỏi Bi hai câu.',
        'Câu một: "Từ đầu năm tới giờ mình bán được tổng cộng bao nhiêu?" Câu hai: "Tháng này tăng hay giảm so với tháng trước?"',
        'Cả hai câu cần nhìn sang các row khác. Câu một cộng các tháng đã qua. Câu hai lấy số của tháng ngay trước.',
        'Window function làm được cả hai, vì nó nhìn được các row xung quanh mà vẫn giữ từng row.',
      ],
    },
    {
      type: 'text',
      title: 'Cộng dồn với SUM OVER',
      paragraphs: [
        '**[[running-total]]** là số cộng dồn: mỗi row bằng tổng của row đó và mọi row trước nó.',
        'Bạn viết `SUM(revenue) OVER (ORDER BY order_month)`. Có ORDER BY trong OVER thì SUM cộng từ row đầu tới row hiện tại.',
        'Không có ORDER BY thì SUM tính trên cả nhóm, và mọi row nhận cùng một tổng. Cách này giống `OVER ()` ở bài đầu chương.',
        'Bước đầu tiên là có một table doanh thu theo tháng. Query dưới đây gom đơn chưa hủy theo tháng trong WITH, rồi thêm các column window ở query cuối.',
      ],
    },
    {
      type: 'text',
      title: 'So với kỳ trước bằng LAG và LEAD',
      paragraphs: [
        '**[[lag]]** lấy giá trị của một row phía trước. `LAG(revenue)` lấy doanh thu của tháng ngay trước.',
        '**[[lead]]** lấy giá trị của một row phía sau. `LEAD(revenue)` lấy doanh thu của tháng ngay sau.',
        '"Phía trước" và "phía sau" theo thứ tự của ORDER BY trong OVER. Vì thế hai function này luôn cần ORDER BY.',
        'Tháng đầu tiên không có tháng trước. LAG trả NULL ở row đó. Tháng cuối cùng không có tháng sau, nên LEAD trả NULL.',
        'Tham số thứ hai chọn lùi bao nhiêu row: `LAG(revenue, 3)` lấy tháng cách 3 tháng. Tham số thứ ba là giá trị thay cho NULL: `LAG(revenue, 1, 0)`.',
        'Mức tăng so với tháng trước là `revenue - LAG(revenue) OVER (...)`. Phần trăm tăng chia thêm cho tháng trước rồi nhân 100.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: cộng dồn và tháng trước',
      intro: 'Bấm Chạy. Column running_total tăng dần theo từng tháng. Column prev_revenue là NULL ở tháng đầu tiên.',
      database: 'company',
      tables: ['orders', 'order_items'],
      dialects: ['mysql', 'oracle'],
      sql: q(BASE),
      tries: [
        {
          label: 'Đổi LAG thành LEAD: lấy tháng sau',
          sql: q(`SUM(revenue) OVER (ORDER BY order_month) AS running_total,
  LEAD(revenue) OVER (ORDER BY order_month) AS next_revenue`),
        },
        {
          label: 'Thêm tham số thứ ba: LAG(revenue, 1, 0)',
          sql: q(`SUM(revenue) OVER (ORDER BY order_month) AS running_total,
  LAG(revenue, 1, 0) OVER (ORDER BY order_month) AS prev_revenue`),
        },
        {
          label: 'Tính phần trăm tăng so với tháng trước',
          sql: q(`ROUND((revenue - LAG(revenue) OVER (ORDER BY order_month)) * 100
    / LAG(revenue) OVER (ORDER BY order_month), 1) AS growth_pct`),
        },
        {
          label: 'Cộng dồn riêng từng năm bằng PARTITION BY',
          sql: q(`SUM(revenue) OVER (
    PARTITION BY SUBSTR(order_month, 1, 4)
    ORDER BY order_month
  ) AS year_to_date`),
        },
      ],
      say: 'Tháng đầu tiên có running_total bằng đúng doanh thu của tháng đó, và prev_revenue để trống. Tháng 3 năm 2026 mới có 1.850.000 đồng vì dữ liệu chỉ tới ngày 8. Mục cuối đổi cách chia nhóm: số cộng dồn bắt đầu lại từ tháng 1 năm 2026.',
    },
    {
      type: 'text',
      title: 'Ba chỗ dễ nhầm',
      paragraphs: [
        'Quên ORDER BY thì LAG và LEAD không biết "trước" là row nào. Oracle báo ORA-30485. MySQL cho qua, và kết quả không đoán trước được.',
        'NULL ở tháng đầu là đúng, không phải lỗi. Phép trừ có NULL cho kết quả NULL, nên mức tăng của tháng đầu cũng là NULL.',
        'Chia cho tháng trước bằng 0 thì hai dialect khác nhau: MySQL cho NULL, Oracle báo ORA-01476. Hãy kiểm xem có tháng nào bằng 0 không.',
        'Cẩn thận khi ORDER BY là chữ: `2025-02` đứng trước `2025-10` nhờ định dạng năm-tháng có hai chữ số. Nếu viết `2025-2` thì thứ tự sai.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'SUM OVER, LAG và LEAD viết giống nhau ở MySQL 8 và Oracle 19c, kể cả tham số thứ ba `LAG(revenue, 1, 0)`.',
        'Khác biệt nằm ở cách lấy năm và tháng từ ngày. MySQL dùng `DATE_FORMAT(order_date, \'%Y-%m\')`. Oracle dùng `TO_CHAR(order_date, \'YYYY-MM\')`.',
        'Hai dialect cũng khác khi thiếu ORDER BY trong OVER của LAG: Oracle báo ORA-30485, MySQL không báo.',
      ],
      mysql: monthly('mysql', BASE),
      oracle: monthly('oracle', BASE),
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Doanh thu ba tháng đầu là 10, 20, 30. `SUM(revenue) OVER (ORDER BY month)` ra gì ở tháng thứ ba?',
          options: [
            { text: '60', correct: true, feedback: 'Đúng. 10 + 20 + 30. Mỗi row cộng tất cả các row từ đầu tới nó.' },
            { text: '30', feedback: '30 là doanh thu của riêng tháng thứ ba. SUM OVER với ORDER BY cộng dồn từ đầu.' },
            { text: '50', feedback: '50 là 20 + 30, bỏ mất tháng đầu. Cộng dồn bắt đầu từ row đầu tiên.' },
          ],
        },
        {
          kind: 'choice',
          question: '`LAG(revenue)` ra gì ở row đầu tiên?',
          options: [
            { text: 'NULL, vì không có row nào phía trước', correct: true, feedback: 'Đúng. Muốn số khác, viết tham số thứ ba, ví dụ `LAG(revenue, 1, 0)`.' },
            { text: '0', feedback: 'Mặc định là NULL. Chỉ khi bạn viết tham số thứ ba thì mới ra 0.' },
            { text: 'Doanh thu của chính row đó', feedback: 'LAG chỉ nhìn các row phía trước. Row đầu không có gì để nhìn.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn cần so doanh thu mỗi tháng với cùng tháng năm ngoái. Dữ liệu có đủ 12 tháng liên tiếp. Bạn viết gì?',
          options: [
            { text: '`LAG(revenue, 12) OVER (ORDER BY order_month)`', correct: true, feedback: 'Đúng. Tham số thứ hai là số row lùi lại, và 12 tháng là 12 row.' },
            { text: '`LEAD(revenue, 12) OVER (ORDER BY order_month)`', feedback: 'LEAD nhìn về phía sau, tức năm sau. Bạn cần nhìn về năm ngoái.' },
            { text: '`LAG(revenue) OVER (ORDER BY order_month)`', feedback: 'Cách này lấy tháng ngay trước, không phải 12 tháng trước.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo tăng trưởng hằng tháng',
      paragraphs: [
        'Bộ phận tài chính gửi ban giám đốc một báo cáo: doanh thu từng tháng, số cộng dồn từ đầu năm và phần trăm tăng so với tháng trước.',
        'Chị làm báo cáo viết đủ ba column trong một query với SUM OVER và LAG. Trước đây phải xuất ra Excel rồi tự kéo công thức.',
        'Khi một tháng có số lạ, chị chạy riêng khối WITH để kiểm doanh thu gốc trước, rồi mới nhìn tới các column window.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        '`SUM(x) OVER (ORDER BY m)` cộng dồn từ row đầu tới row hiện tại. Thêm PARTITION BY thì cộng dồn riêng từng nhóm.',
        '`LAG(x)` lấy giá trị row trước, `LEAD(x)` lấy row sau. Row đầu của LAG và row cuối của LEAD là NULL.',
        '`LAG(x, n, giá_trị_thay)` chọn lùi n row và đặt giá trị thay cho NULL.',
        'Phần trăm tăng là `(x - LAG(x)) * 100 / LAG(x)`. Cách lấy tháng từ ngày khác nhau: DATE_FORMAT ở MySQL, TO_CHAR ở Oracle.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, Window Function Descriptions', url: 'https://dev.mysql.com/doc/refman/8.0/en/window-function-descriptions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, LAG', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/LAG.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Analytic Functions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Analytic-Functions.html' },
      ],
    },
  ],
};
