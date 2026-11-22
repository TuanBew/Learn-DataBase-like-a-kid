import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c5-b5',
  chapter: 5,
  order: 5,
  title: 'Ngày giờ: cộng trừ, khoảng cách, đầu tháng, cuối tháng',
  lead: 'Bạn cộng trừ ngày, tính thâm niên, tìm đầu tháng và cuối tháng, rồi lọc đơn theo khoảng ngày cho đúng.',
  minutes: 18,
  goals: [
    'Cộng trừ ngày và tháng bằng DATE_ADD ở MySQL, và phép cộng hoặc ADD_MONTHS ở Oracle',
    'Tính khoảng cách giữa hai ngày bằng DATEDIFF, TIMESTAMPDIFF, hoặc phép trừ và MONTHS_BETWEEN',
    'Tìm cuối tháng bằng LAST_DAY và đầu tháng bằng DATE_FORMAT hoặc TRUNC',
    'Lọc theo khoảng ngày: từ đầu kỳ, nhỏ hơn đầu kỳ sau',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ba câu hỏi của phòng nhân sự và kế toán',
      paragraphs: [
        'Sáng thứ Hai, bạn nhận ba yêu cầu. Phòng nhân sự hỏi: nhân viên mới có kỳ đánh giá đầu sau hai tháng. Ngày đánh giá của từng người là ngày nào?',
        'Chị trưởng phòng hỏi thêm: mỗi người đã làm bao nhiêu tháng? Chị cần số này để tính ngày phép.',
        'Kế toán nhờ lấy các đơn của tháng 2. Tháng 2 có 28 ngày, nên bạn viết khoảng ngày từ 1 đến 28.',
        'Bi nói: "Hai câu đầu cần cộng trừ ngày. Câu thứ ba có một cái bẫy ở chỗ ngày 28. Mình đi từng câu."',
      ],
    },
    {
      type: 'text',
      title: 'Cộng trừ ngày và tháng',
      paragraphs: [
        'Oracle cộng trừ ngày bằng phép tính thường. `hire_date + 7` là bảy ngày sau. `hire_date - 7` là bảy ngày trước.',
        'Muốn cộng tháng, Oracle có **[[add-months]]**. `ADD_MONTHS(hire_date, 2)` là hai tháng sau. Số âm là lùi về trước.',
        'MySQL dùng **[[date-add]]**. `DATE_ADD(hire_date, INTERVAL 7 DAY)` là bảy ngày sau. `INTERVAL` đi kèm một con số và một đơn vị.',
        'Đơn vị là DAY, WEEK, MONTH, QUARTER, YEAR, HOUR, MINUTE hoặc SECOND. Đơn vị viết ở số ít, như DAY, không phải DAYS.',
        '`DATE_SUB` lùi về trước, cùng cách viết với DATE_ADD.',
        'Query dưới đây tính ngày đánh giá đầu của phòng IT. Kỳ đánh giá đến sau hai tháng.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: ngày đánh giá đầu tiên',
      intro: 'Bấm Chạy. Column review_date là ngày vào làm cộng hai tháng.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT last_name, hire_date,\n  DATE_ADD(hire_date, INTERVAL 2 MONTH) AS review_date,\n  DATE_ADD(hire_date, INTERVAL 7 DAY) AS plus_days,\n  DATE_SUB(hire_date, INTERVAL 7 DAY) AS minus_days\nFROM employees\nWHERE department_id = 30;',
        oracle:
          'SELECT last_name, hire_date,\n  ADD_MONTHS(hire_date, 2) AS review_date,\n  hire_date + 7 AS plus_days,\n  hire_date - 7 AS minus_days\nFROM employees\nWHERE department_id = 30',
      },
      tries: [
        {
          label: 'Đổi 2 tháng thành 3 tháng',
          sql: {
            mysql:
              'SELECT last_name, hire_date,\n  DATE_ADD(hire_date, INTERVAL 3 MONTH) AS review_date,\n  DATE_ADD(hire_date, INTERVAL 7 DAY) AS plus_days,\n  DATE_SUB(hire_date, INTERVAL 7 DAY) AS minus_days\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT last_name, hire_date,\n  ADD_MONTHS(hire_date, 3) AS review_date,\n  hire_date + 7 AS plus_days,\n  hire_date - 7 AS minus_days\nFROM employees\nWHERE department_id = 30',
          },
        },
        {
          label: 'Đổi 7 ngày thành 30 ngày',
          sql: {
            mysql:
              'SELECT last_name, hire_date,\n  DATE_ADD(hire_date, INTERVAL 2 MONTH) AS review_date,\n  DATE_ADD(hire_date, INTERVAL 30 DAY) AS plus_days,\n  DATE_SUB(hire_date, INTERVAL 30 DAY) AS minus_days\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT last_name, hire_date,\n  ADD_MONTHS(hire_date, 2) AS review_date,\n  hire_date + 30 AS plus_days,\n  hire_date - 30 AS minus_days\nFROM employees\nWHERE department_id = 30',
          },
        },
        {
          label: 'Lùi hai tháng thay vì tiến',
          sql: {
            mysql:
              'SELECT last_name, hire_date,\n  DATE_SUB(hire_date, INTERVAL 2 MONTH) AS review_date,\n  DATE_ADD(hire_date, INTERVAL 7 DAY) AS plus_days,\n  DATE_SUB(hire_date, INTERVAL 7 DAY) AS minus_days\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT last_name, hire_date,\n  ADD_MONTHS(hire_date, -2) AS review_date,\n  hire_date + 7 AS plus_days,\n  hire_date - 7 AS minus_days\nFROM employees\nWHERE department_id = 30',
          },
        },
      ],
      say: 'Anh Bảo vào làm ngày 22 tháng 5 năm 2017. Ngày đánh giá đầu là 22 tháng 7. Hai dialect cho cùng kết quả.',
    },
    {
      type: 'text',
      title: 'Khoảng cách giữa hai ngày',
      paragraphs: [
        'Chị trưởng phòng cần số tháng đã làm. Bạn trừ ngày vào làm khỏi hôm nay.',
        'Số ngày giữa hai ngày: MySQL viết `DATEDIFF(ngày_sau, ngày_trước)`. Oracle viết `ngày_sau - ngày_trước`.',
        'Số tháng: MySQL viết `TIMESTAMPDIFF(MONTH, ngày_trước, ngày_sau)`. Oracle viết `MONTHS_BETWEEN(ngày_sau, ngày_trước)`.',
        '**[[datediff]]** gồm cả DATEDIFF và TIMESTAMPDIFF. TIMESTAMPDIFF đổi đơn vị được: MONTH, YEAR, DAY, HOUR.',
        'Hai function này đặt ngày ở hai thứ tự khác nhau. DATEDIFF để ngày sau trước. TIMESTAMPDIFF để ngày trước trước. Đảo thứ tự thì kết quả âm.',
        '**[[months-between]]** của Oracle trả số có phần lẻ, ví dụ 12,98 tháng. Bạn cắt phần lẻ bằng TRUNC để ra số tháng tròn.',
        'Hôm nay của khóa học là 2026-03-09. Query dưới đây tính số ngày, số tháng và số năm đã làm của phòng IT.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: thâm niên của phòng IT',
      intro: 'Bấm Chạy. Ba column cuối là số ngày, số tháng tròn và số năm tròn đã làm tính tới hôm nay.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT last_name, hire_date,\n  DATEDIFF(CURDATE(), hire_date) AS days,\n  TIMESTAMPDIFF(MONTH, hire_date, CURDATE()) AS months,\n  TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) AS years\nFROM employees\nWHERE department_id = 30;',
        oracle:
          'SELECT last_name, hire_date,\n  TRUNC(SYSDATE) - hire_date AS days,\n  TRUNC(MONTHS_BETWEEN(SYSDATE, hire_date)) AS months,\n  TRUNC(MONTHS_BETWEEN(SYSDATE, hire_date) / 12) AS years\nFROM employees\nWHERE department_id = 30',
      },
      tries: [
        {
          label: 'Đảo thứ tự hai ngày',
          sql: {
            mysql:
              'SELECT last_name, hire_date,\n  DATEDIFF(hire_date, CURDATE()) AS days,\n  TIMESTAMPDIFF(MONTH, CURDATE(), hire_date) AS months,\n  TIMESTAMPDIFF(YEAR, CURDATE(), hire_date) AS years\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT last_name, hire_date,\n  hire_date - TRUNC(SYSDATE) AS days,\n  TRUNC(MONTHS_BETWEEN(hire_date, SYSDATE)) AS months,\n  TRUNC(MONTHS_BETWEEN(hire_date, SYSDATE) / 12) AS years\nFROM employees\nWHERE department_id = 30',
          },
        },
        {
          label: 'Tính tới 2026-01-01 thay vì hôm nay',
          sql: {
            mysql:
              "SELECT last_name, hire_date,\n  DATEDIFF('2026-01-01', hire_date) AS days,\n  TIMESTAMPDIFF(MONTH, hire_date, '2026-01-01') AS months,\n  TIMESTAMPDIFF(YEAR, hire_date, '2026-01-01') AS years\nFROM employees\nWHERE department_id = 30;",
            oracle:
              "SELECT last_name, hire_date,\n  DATE '2026-01-01' - hire_date AS days,\n  TRUNC(MONTHS_BETWEEN(DATE '2026-01-01', hire_date)) AS months,\n  TRUNC(MONTHS_BETWEEN(DATE '2026-01-01', hire_date) / 12) AS years\nFROM employees\nWHERE department_id = 30",
          },
        },
        {
          label: 'Đổi phòng 30 thành phòng 60',
          sql: {
            mysql:
              'SELECT last_name, hire_date,\n  DATEDIFF(CURDATE(), hire_date) AS days,\n  TIMESTAMPDIFF(MONTH, hire_date, CURDATE()) AS months,\n  TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) AS years\nFROM employees\nWHERE department_id = 60;',
            oracle:
              'SELECT last_name, hire_date,\n  TRUNC(SYSDATE) - hire_date AS days,\n  TRUNC(MONTHS_BETWEEN(SYSDATE, hire_date)) AS months,\n  TRUNC(MONTHS_BETWEEN(SYSDATE, hire_date) / 12) AS years\nFROM employees\nWHERE department_id = 60',
          },
        },
      ],
      say: 'Anh Dũng vào làm ngày 10 tháng 2 năm 2025. Tới hôm nay là 392 ngày, 12 tháng tròn và 1 năm tròn.',
    },
    {
      type: 'text',
      title: 'Đầu tháng và cuối tháng',
      paragraphs: [
        'Báo cáo theo tháng cần hai mốc: ngày đầu tháng và ngày cuối tháng.',
        '**[[last-day]]** cho ngày cuối tháng. `LAST_DAY(order_date)` ở cả hai dialect. Tháng 2 ra ngày 28, tháng 3 ra ngày 31.',
        'Oracle cắt về đầu tháng bằng `TRUNC(order_date, \'MM\')`. MM là chữ viết tắt của tháng.',
        'MySQL đổi ngày thành chữ có dạng đầu tháng: `DATE_FORMAT(order_date, \'%Y-%m-01\')`. Kết quả là chuỗi, ví dụ `2026-02-01`.',
        'Ngày đầu tháng sau là đầu tháng này cộng một tháng. Bạn dùng lại ADD_MONTHS hoặc DATE_ADD.',
        'Query dưới đây tìm đầu tháng, cuối tháng và đầu tháng sau của ba đơn gần nhất.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đầu tháng và cuối tháng của đơn',
      intro: 'Bấm Chạy. Mỗi đơn có ngày giờ đặt, đầu tháng của nó, cuối tháng của nó và đầu tháng sau.',
      database: 'company',
      tables: ['orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT order_id, order_date,\n  DATE_FORMAT(order_date, '%Y-%m-01') AS month_start,\n  LAST_DAY(order_date) AS month_end,\n  DATE_ADD(DATE_FORMAT(order_date, '%Y-%m-01'), INTERVAL 1 MONTH) AS next_start\nFROM orders\nWHERE order_id >= 5078;",
        oracle:
          "SELECT order_id, order_date,\n  TRUNC(order_date, 'MM') AS month_start,\n  LAST_DAY(order_date) AS month_end,\n  ADD_MONTHS(TRUNC(order_date, 'MM'), 1) AS next_start\nFROM orders\nWHERE order_id >= 5078",
      },
      tries: [
        {
          label: 'Đổi đầu tháng thành đầu năm',
          sql: {
            mysql:
              "SELECT order_id, order_date,\n  DATE_FORMAT(order_date, '%Y-01-01') AS month_start,\n  LAST_DAY(order_date) AS month_end,\n  DATE_ADD(DATE_FORMAT(order_date, '%Y-%m-01'), INTERVAL 1 MONTH) AS next_start\nFROM orders\nWHERE order_id >= 5078;",
            oracle:
              "SELECT order_id, order_date,\n  TRUNC(order_date, 'YYYY') AS month_start,\n  LAST_DAY(order_date) AS month_end,\n  ADD_MONTHS(TRUNC(order_date, 'MM'), 1) AS next_start\nFROM orders\nWHERE order_id >= 5078",
          },
        },
        {
          label: 'Đổi next_start thành hai tháng sau',
          sql: {
            mysql:
              "SELECT order_id, order_date,\n  DATE_FORMAT(order_date, '%Y-%m-01') AS month_start,\n  LAST_DAY(order_date) AS month_end,\n  DATE_ADD(DATE_FORMAT(order_date, '%Y-%m-01'), INTERVAL 2 MONTH) AS next_start\nFROM orders\nWHERE order_id >= 5078;",
            oracle:
              "SELECT order_id, order_date,\n  TRUNC(order_date, 'MM') AS month_start,\n  LAST_DAY(order_date) AS month_end,\n  ADD_MONTHS(TRUNC(order_date, 'MM'), 2) AS next_start\nFROM orders\nWHERE order_id >= 5078",
          },
        },
        {
          label: 'Đổi order_id >= 5078 thành order_id = 5079',
          sql: {
            mysql:
              "SELECT order_id, order_date,\n  DATE_FORMAT(order_date, '%Y-%m-01') AS month_start,\n  LAST_DAY(order_date) AS month_end,\n  DATE_ADD(DATE_FORMAT(order_date, '%Y-%m-01'), INTERVAL 1 MONTH) AS next_start\nFROM orders\nWHERE order_id = 5079;",
            oracle:
              "SELECT order_id, order_date,\n  TRUNC(order_date, 'MM') AS month_start,\n  LAST_DAY(order_date) AS month_end,\n  ADD_MONTHS(TRUNC(order_date, 'MM'), 1) AS next_start\nFROM orders\nWHERE order_id = 5079",
          },
        },
      ],
      say: 'Nhìn column month_end ở Oracle. LAST_DAY giữ nguyên giờ của đơn, còn MySQL ra ngày thuần.',
    },
    {
      type: 'text',
      title: 'Lọc theo khoảng ngày cho đúng',
      paragraphs: [
        'Column order_date là **[[datetime]]**, có cả giờ. Ngày 2026-02-28 viết một mình nghĩa là 00:00:00 của ngày đó.',
        'Vì vậy `BETWEEN \'2026-02-01\' AND \'2026-02-28\'` dừng ở nửa đêm đầu ngày 28. Đơn đặt lúc 16:47 ngày 28 bị bỏ sót.',
        'Cách đúng: giữ từ đầu kỳ, và nhỏ hơn đầu kỳ sau. Tháng 2 chạy từ `>= 2026-02-01` tới `< 2026-03-01`.',
        'Cách viết này đúng cho mọi kỳ. Tháng có 28, 30 hay 31 ngày thì bạn không phải đếm.',
        'Muốn khoảng ngày tự đổi theo hôm nay, dùng đầu tháng. Tháng trước chạy từ đầu tháng trước tới trước đầu tháng này.',
        'Query dưới đây lấy các đơn của tháng 2 năm 2026. Thử đổi sang BETWEEN để thấy một đơn biến mất.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: các đơn của tháng 2',
      intro: 'Bấm Chạy. Query giữ từ đầu tháng 2 tới trước đầu tháng 3.',
      database: 'company',
      tables: ['orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT order_id, order_date\nFROM orders\nWHERE order_date >= '2026-02-01'\n  AND order_date < '2026-03-01';",
        oracle: "SELECT order_id, order_date\nFROM orders\nWHERE order_date >= DATE '2026-02-01'\n  AND order_date < DATE '2026-03-01'",
      },
      tries: [
        {
          label: 'Đổi sang BETWEEN ... AND ngày 28',
          sql: {
            mysql: "SELECT order_id, order_date\nFROM orders\nWHERE order_date BETWEEN '2026-02-01' AND '2026-02-28';",
            oracle: "SELECT order_id, order_date\nFROM orders\nWHERE order_date BETWEEN DATE '2026-02-01' AND DATE '2026-02-28'",
          },
        },
        {
          label: 'Đổi sang tháng 3',
          sql: {
            mysql: "SELECT order_id, order_date\nFROM orders\nWHERE order_date >= '2026-03-01'\n  AND order_date < '2026-04-01';",
            oracle: "SELECT order_id, order_date\nFROM orders\nWHERE order_date >= DATE '2026-03-01'\n  AND order_date < DATE '2026-04-01'",
          },
        },
        {
          label: 'Tự tính tháng trước từ đồng hồ, không gõ ngày',
          sql: {
            mysql:
              "SELECT order_id, order_date\nFROM orders\nWHERE order_date >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 1 MONTH)\n  AND order_date < DATE_FORMAT(NOW(), '%Y-%m-01');",
            oracle:
              "SELECT order_id, order_date\nFROM orders\nWHERE order_date >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -1)\n  AND order_date < TRUNC(SYSDATE, 'MM')",
          },
        },
      ],
      say: 'Mục BETWEEN chỉ ra 4 đơn, thiếu đơn 5079 đặt lúc 16:47 ngày 28. Hai mục còn lại ra đủ 5 đơn của tháng 2.',
    },
    {
      type: 'oracle',
      body: [
        'Cộng trừ ngày: Oracle viết `d + 7`. MySQL viết `DATE_ADD(d, INTERVAL 7 DAY)`. Đừng viết `hire_date + 7` ở MySQL: kết quả là số 20250217, không phải ngày.',
        'Cộng tháng: Oracle viết `ADD_MONTHS(d, n)`. MySQL viết `DATE_ADD(d, INTERVAL n MONTH)`. Gọi nhầm tên thì MySQL báo lỗi 1305 và Oracle báo ORA-00904.',
        'Oracle không cộng hai ngày với nhau và báo ORA-00975. Muốn biết hai ngày cách nhau bao nhiêu, bạn trừ.',
        'Hai dialect khác nhau ở ngày cuối tháng. Oracle: `ADD_MONTHS(DATE \'2026-02-28\', 1)` ra 2026-03-31, vì ngày cuối tháng luôn về ngày cuối tháng. MySQL: `DATE_ADD(\'2026-02-28\', INTERVAL 1 MONTH)` ra 2026-03-28.',
        'Số tháng giữa hai ngày cuối tháng cũng lệch. `MONTHS_BETWEEN(DATE \'2026-02-28\', DATE \'2026-01-31\')` ra 1. `TIMESTAMPDIFF(MONTH, \'2026-01-31\', \'2026-02-28\')` ra 0, vì chưa đủ một tháng trọn.',
        'LAST_DAY của Oracle giữ nguyên giờ. LAST_DAY của MySQL ra ngày thuần.',
        'Cộng giờ: Oracle cộng phân số của ngày, `SYSDATE + 1/24` là một giờ sau. MySQL viết `DATE_ADD(NOW(), INTERVAL 1 HOUR)`.',
      ],
      mysql:
        "DATE_ADD(hire_date, INTERVAL 2 MONTH)\nDATEDIFF(CURDATE(), hire_date)\nTIMESTAMPDIFF(MONTH, hire_date, CURDATE())\nLAST_DAY(order_date)\nDATE_FORMAT(order_date, '%Y-%m-01')",
      oracle:
        "ADD_MONTHS(hire_date, 2)\nTRUNC(SYSDATE) - hire_date\nTRUNC(MONTHS_BETWEEN(SYSDATE, hire_date))\nLAST_DAY(order_date)\nTRUNC(order_date, 'MM')",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn dùng MySQL và muốn biết nhân viên đã vào làm bao nhiêu ngày. Hôm nay là 2026-03-09. Query nào ra số dương?',
          options: [
            { text: '`DATEDIFF(CURDATE(), hire_date)`', correct: true, feedback: 'Đúng. DATEDIFF đặt ngày sau trước. Hôm nay trừ ngày vào làm ra số dương.' },
            { text: '`DATEDIFF(hire_date, CURDATE())`', feedback: 'Ngày vào làm nhỏ hơn hôm nay, nên kết quả là số âm. Đảo hai ngày lại.' },
            { text: '`hire_date - CURDATE()`', feedback: 'MySQL trừ hai ngày như hai số nguyên và ra -10099 cho anh Dũng. Số đó không phải số ngày. Dùng DATEDIFF.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Một đơn đặt lúc 16:47 ngày 28 tháng 2. Bạn lọc bằng `BETWEEN \'2026-02-01\' AND \'2026-02-28\'`. Đơn đó có hiện không?',
          options: [
            { text: 'Có, vì đơn đặt trong ngày 28', feedback: 'Ngày 28 viết một mình là 00:00:00. Đơn đặt lúc 16:47 muộn hơn mốc đó.' },
            { text: 'Không, vì ngày 28 chỉ tính tới 00:00:00', correct: true, feedback: 'Đúng. Muốn giữ đơn, viết `< \'2026-03-01\'` thay cho BETWEEN.' },
            { text: 'Query báo lỗi', feedback: 'Query vẫn chạy và không báo gì. Đơn biến mất lặng lẽ, nên rất khó thấy.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn dùng Oracle và cần ngày đầu tháng của order_date. Viết thế nào?',
          options: [
            { text: "`TRUNC(order_date, 'MM')`", correct: true, feedback: 'Đúng. TRUNC với MM cắt về 00:00:00 của ngày 1 trong tháng.' },
            { text: '`LAST_DAY(order_date)`', feedback: 'LAST_DAY cho ngày cuối tháng, không phải đầu tháng.' },
            { text: '`TRUNC(order_date)`', feedback: 'TRUNC không có MM chỉ cắt phần giờ. Ngày vẫn là ngày của đơn.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo tháng chạy lại mỗi tháng',
      paragraphs: [
        'Phòng kế toán gửi báo cáo doanh thu tháng trước vào ngày mùng 1 mỗi tháng. Người làm data không muốn sửa ngày bằng tay mỗi lần.',
        'Họ viết khoảng ngày từ đầu tháng trước tới đầu tháng này, tính từ đồng hồ. Query chạy lại vào tháng sau vẫn đúng.',
        'Cùng cách đó áp dụng cho hạn thanh toán: ngày giao cộng 30 ngày.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Cộng trừ ngày: Oracle viết `d + 7` và ADD_MONTHS. MySQL viết DATE_ADD với INTERVAL.',
        'Khoảng cách: DATEDIFF và TIMESTAMPDIFF ở MySQL, phép trừ và MONTHS_BETWEEN ở Oracle. Để ý thứ tự hai ngày.',
        'LAST_DAY cho cuối tháng ở cả hai. Đầu tháng là `TRUNC(d, \'MM\')` ở Oracle và `DATE_FORMAT(d, \'%Y-%m-01\')` ở MySQL.',
        'Column ngày có giờ thì lọc từ đầu kỳ, nhỏ hơn đầu kỳ sau. Không dùng BETWEEN với ngày cuối kỳ.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, Date and Time Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/date-and-time-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Single-Row Functions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Single-Row-Functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, MONTHS_BETWEEN', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/MONTHS_BETWEEN.html' },
      ],
    },
  ],
};
