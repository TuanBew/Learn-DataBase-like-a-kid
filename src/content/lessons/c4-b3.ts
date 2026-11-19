import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c4-b3',
  chapter: 4,
  order: 3,
  title: 'Ngày giờ',
  lead: 'Bạn lọc đơn theo ngày và đổi cách hiện ngày giờ.',
  minutes: 18,
  goals: [
    'Lọc đơn theo ngày bằng khoảng >= và <',
    'Biết vì sao so bằng một ngày không ra row nào',
    'Đổi cách hiện ngày giờ bằng DATE_FORMAT và TO_CHAR',
    'Đổi chữ thành ngày bằng STR_TO_DATE và TO_DATE',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Hôm qua bán được mấy đơn?',
      paragraphs: [
        'Sáng nay quản lý hỏi Bi: "Hôm qua có mấy đơn?"',
        'Mỗi đơn lưu giờ đặt trong column ordered_at. Giờ đặt có cả ngày lẫn giờ, ví dụ ngày 8 tháng 3 lúc 14:00.',
        'Bi cần giữ mọi đơn của ngày 8, dù khách đặt lúc sáng sớm hay tối muộn.',
        'Đồng hồ của khóa học đứng yên ở 2026-03-09 10:30:00. Hôm nay luôn là ngày 9 tháng 3, nên hôm qua luôn là ngày 8.',
      ],
    },
    {
      type: 'text',
      title: 'Giờ đặt có cả ngày lẫn giờ',
      paragraphs: [
        'Column ordered_at chứa **[[datetime]]**, tức là cả ngày lẫn giờ.',
        'DATE của Oracle cũng lưu cả giờ. Tên DATE dễ làm bạn hiểu nhầm.',
        'Một ngày viết một mình, như 2026-03-08, nghĩa là 00:00:00 của ngày đó.',
        'Vì vậy `ordered_at = ngày 8` chỉ giữ đơn đặt đúng nửa đêm. Gần như không đơn nào đặt lúc đó.',
        'Cách đúng là hỏi một khoảng. Giữ đơn từ đầu ngày 8 tới trước đầu ngày 9.',
        'Viết `>=` cho đầu khoảng và `<` cho ngày hôm sau.',
        'Oracle cần chữ DATE đứng trước ngày, như `DATE \'2026-03-08\'`. MySQL chỉ cần ngày nằm trong nháy đơn.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đơn của hôm qua',
      intro: 'Bấm Chạy. Query giữ đơn từ đầu ngày 8 tới trước đầu ngày 9.',
      database: 'teashop',
      tables: ['orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT order_id, ordered_at, status\nFROM orders\nWHERE ordered_at >= '2026-03-08'\n  AND ordered_at < '2026-03-09';",
        oracle:
          "SELECT order_id, ordered_at, status\nFROM orders\nWHERE ordered_at >= DATE '2026-03-08'\n  AND ordered_at < DATE '2026-03-09'",
      },
      tries: [
        {
          label: 'Đổi cả khoảng thành ordered_at = ngày 8',
          sql: {
            mysql: "SELECT order_id, ordered_at, status\nFROM orders\nWHERE ordered_at = '2026-03-08';",
            oracle: "SELECT order_id, ordered_at, status\nFROM orders\nWHERE ordered_at = DATE '2026-03-08'",
          },
        },
        {
          label: 'Cắt giờ: DATE(ordered_at) ở MySQL, TRUNC(ordered_at) ở Oracle',
          sql: {
            mysql: "SELECT order_id, ordered_at, status\nFROM orders\nWHERE DATE(ordered_at) = '2026-03-08';",
            oracle: "SELECT order_id, ordered_at, status\nFROM orders\nWHERE TRUNC(ordered_at) = DATE '2026-03-08'",
          },
        },
        {
          label: 'Tính hôm qua từ đồng hồ, không gõ ngày',
          sql: {
            mysql: 'SELECT order_id, ordered_at, status\nFROM orders\nWHERE DATEDIFF(CURDATE(), ordered_at) = 1;',
            oracle: 'SELECT order_id, ordered_at, status\nFROM orders\nWHERE TRUNC(SYSDATE) - TRUNC(ordered_at) = 1',
          },
        },
        {
          label: 'Đổi đầu khoảng thành STR_TO_DATE hoặc TO_DATE',
          sql: {
            mysql:
              "SELECT order_id, ordered_at, status\nFROM orders\nWHERE ordered_at >= STR_TO_DATE('08/03/2026', '%d/%m/%Y')\n  AND ordered_at < '2026-03-09';",
            oracle:
              "SELECT order_id, ordered_at, status\nFROM orders\nWHERE ordered_at >= TO_DATE('08/03/2026', 'DD/MM/YYYY')\n  AND ordered_at < DATE '2026-03-09'",
          },
        },
      ],
      say: 'Thử mục "ordered_at = ngày 8". Cả hai dialect trả 0 row, vì không đơn nào đặt đúng 00:00:00.',
    },
    {
      type: 'text',
      title: 'Cắt giờ và lấy ngày hôm nay',
      paragraphs: [
        'Còn một hướng khác: cắt phần giờ trước, rồi mới so.',
        'MySQL có `DATE(x)`. Oracle có **[[trunc]]**: `TRUNC(x)`. Cả hai trả về ngày lúc 00:00:00.',
        'MySQL lấy giờ hiện tại bằng `NOW()` và ngày hôm nay bằng `CURDATE()`. Oracle lấy giờ hiện tại bằng `SYSDATE`.',
        'MySQL có `DATEDIFF(a, b)` để tính số ngày giữa hai ngày. Oracle lấy hai ngày trừ nhau: `a - b`.',
        'Mục "Tính hôm qua từ đồng hồ" ở trên dùng đúng các function này. Đồng hồ đứng yên, nên kết quả không đổi theo ngày bạn học.',
      ],
    },
    {
      type: 'text',
      title: 'Đổi cách hiện ngày giờ',
      paragraphs: [
        '**[[date-format]]** đổi ngày giờ thành chữ theo khuôn bạn viết. MySQL gọi `DATE_FORMAT`. Oracle gọi `TO_CHAR`.',
        'Khuôn của MySQL dùng `%d` (ngày), `%m` (tháng), `%Y` (năm), `%H` (giờ), `%i` (phút).',
        'Khuôn của Oracle viết `DD`, `MM`, `YYYY`, `HH24`, `MI`.',
        'Query dưới đây hiện giờ đặt của hai ngày cuối theo kiểu Việt Nam.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: giờ đặt kiểu Việt Nam',
      intro: 'Bấm Chạy. Column shown_time là chữ, không còn là ngày giờ.',
      database: 'teashop',
      tables: ['orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT order_id, DATE_FORMAT(ordered_at, '%d/%m/%Y %H:%i') AS shown_time, status\nFROM orders\nWHERE ordered_at >= '2026-03-07'\n  AND ordered_at < '2026-03-09';",
        oracle:
          "SELECT order_id, TO_CHAR(ordered_at, 'DD/MM/YYYY HH24:MI') AS shown_time, status\nFROM orders\nWHERE ordered_at >= DATE '2026-03-07'\n  AND ordered_at < DATE '2026-03-09'",
      },
      tries: [
        {
          label: "Đổi khuôn thành chỉ có giờ và phút",
          sql: {
            mysql:
              "SELECT order_id, DATE_FORMAT(ordered_at, '%H:%i') AS shown_time, status\nFROM orders\nWHERE ordered_at >= '2026-03-07'\n  AND ordered_at < '2026-03-09';",
            oracle:
              "SELECT order_id, TO_CHAR(ordered_at, 'HH24:MI') AS shown_time, status\nFROM orders\nWHERE ordered_at >= DATE '2026-03-07'\n  AND ordered_at < DATE '2026-03-09'",
          },
        },
        {
          label: 'Đổi khuôn thành chỉ có ngày và tháng',
          sql: {
            mysql:
              "SELECT order_id, DATE_FORMAT(ordered_at, '%d/%m') AS shown_time, status\nFROM orders\nWHERE ordered_at >= '2026-03-07'\n  AND ordered_at < '2026-03-09';",
            oracle:
              "SELECT order_id, TO_CHAR(ordered_at, 'DD/MM') AS shown_time, status\nFROM orders\nWHERE ordered_at >= DATE '2026-03-07'\n  AND ordered_at < DATE '2026-03-09'",
          },
        },
        {
          label: 'Thêm column NOW() ở MySQL, SYSDATE ở Oracle',
          sql: {
            mysql:
              "SELECT order_id, DATE_FORMAT(ordered_at, '%d/%m/%Y %H:%i') AS shown_time, NOW() AS now_time\nFROM orders\nWHERE ordered_at >= '2026-03-07'\n  AND ordered_at < '2026-03-09';",
            oracle:
              "SELECT order_id, TO_CHAR(ordered_at, 'DD/MM/YYYY HH24:MI') AS shown_time, SYSDATE AS now_time\nFROM orders\nWHERE ordered_at >= DATE '2026-03-07'\n  AND ordered_at < DATE '2026-03-09'",
          },
        },
      ],
      say: 'Đổi khuôn chỉ đổi cách hiện. Ngày giờ lưu trong table vẫn như cũ.',
    },
    {
      type: 'text',
      title: 'Đổi chữ thành ngày',
      paragraphs: [
        'Đôi khi ngày đến từ một đoạn chữ, như người dùng gõ `08/03/2026`. Bạn phải đổi chữ đó thành ngày trước khi so.',
        '**[[str-to-date]]** đổi chữ thành ngày theo khuôn bạn nói. MySQL gọi `STR_TO_DATE`. Oracle gọi `TO_DATE`.',
        "MySQL viết `STR_TO_DATE('08/03/2026', '%d/%m/%Y')`. Oracle viết `TO_DATE('08/03/2026', 'DD/MM/YYYY')`.",
        'Mục cuối trong ô thử tay đầu tiên dùng đúng hai function này.',
      ],
    },
    {
      type: 'oracle',
      body: [
        "DATE của Oracle luôn có giờ. `ordered_at = DATE '2026-03-08'` chỉ khớp đơn đặt đúng 00:00:00, nên ra 0 row.",
        "Oracle đọc chuỗi ngày theo một dạng mặc định, và dạng đó khác 2026-03-08. Vì vậy `ordered_at = '2026-03-08'` báo lỗi ORA-01861.",
        "Gặp ORA-01861, kiểm lại: ngày đã đứng sau chữ DATE, hay nằm trong TO_DATE chưa?",
        "MySQL đổi chữ dạng 2026-03-08 thành ngày giúp bạn, nên `ordered_at >= '2026-03-08'` chạy bình thường.",
      ],
      mysql: "WHERE ordered_at >= '2026-03-08'\n  AND ordered_at < '2026-03-09'",
      oracle: "WHERE ordered_at >= DATE '2026-03-08'\n  AND ordered_at < DATE '2026-03-09'",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: "Bạn chạy `WHERE ordered_at = DATE '2026-03-08'` trên Oracle. Chuyện gì xảy ra?",
          options: [
            { text: 'Ra mọi đơn của ngày 8', feedback: 'Ngày viết một mình là 00:00:00. Chỉ đơn đặt đúng giờ đó mới khớp.' },
            { text: 'Ra 0 row', correct: true, feedback: 'Đúng. DATE của Oracle có cả giờ, và không đơn nào đặt đúng 00:00:00.' },
            { text: 'Oracle báo ORA-01861', feedback: 'ORA-01861 xuất hiện khi so ngày với chuỗi mà thiếu chữ DATE hoặc TO_DATE.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Cách nào giữ mọi đơn của ngày 8 ở cả hai dialect?',
          options: [
            { text: 'Từ đầu ngày 8 (`>=`) tới trước đầu ngày 9 (`<`)', correct: true, feedback: 'Đúng. Khoảng này gồm mọi giờ của ngày 8.' },
            { text: '`ordered_at <= ngày 8`', feedback: 'Ngày 8 viết một mình là 00:00:00. Đơn lúc 14:00 lớn hơn mức đó nên bị bỏ.' },
            { text: '`ordered_at = ngày 8`', feedback: 'Cách này chỉ giữ đơn đặt đúng 00:00:00.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Đồng hồ của khóa học đang chỉ lúc nào?',
          options: [
            { text: 'Giờ thật trên máy của bạn', feedback: 'Khóa học cố định đồng hồ để mọi người thấy cùng một kết quả.' },
            { text: '2026-03-09 10:30:00, và đứng yên', correct: true, feedback: 'Đúng. Hôm nay luôn là ngày 9 tháng 3, nên hôm qua luôn là ngày 8.' },
            { text: '2026-03-01 00:00:00', feedback: 'Đó là ngày đầu của dữ liệu tháng 3, không phải đồng hồ.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo đơn của ngày hôm qua',
      paragraphs: [
        'Mỗi sáng, quản lý một chuỗi cửa hàng mở báo cáo đơn của ngày hôm qua.',
        'Query giữ đơn từ đầu ngày hôm qua tới trước đầu ngày hôm nay. Viết khoảng như vậy thì báo cáo không sót đơn đặt lúc tối muộn.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'ordered_at có cả ngày lẫn giờ. DATE của Oracle cũng có giờ.',
        'Lọc theo ngày bằng khoảng `>=` và `<` ngày hôm sau. Cũng có thể cắt giờ bằng DATE ở MySQL, TRUNC ở Oracle.',
        "Ở Oracle, viết ngày bằng `DATE '2026-03-08'` hoặc TO_DATE. So thẳng với chuỗi '2026-03-08' thì gặp ORA-01861.",
        'DATE_FORMAT và TO_CHAR đổi ngày thành chữ. STR_TO_DATE và TO_DATE đổi chữ thành ngày.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, Date and Time Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/date-and-time-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Data Types (mục DATE)', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html' },
        { name: 'Oracle Database 19c SQL Language Reference, TO_CHAR (datetime)', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TO_CHAR-datetime.html' },
        { name: 'Oracle Database 19c SQL Language Reference, TRUNC (date)', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TRUNC-date.html' },
      ],
    },
  ],
};
