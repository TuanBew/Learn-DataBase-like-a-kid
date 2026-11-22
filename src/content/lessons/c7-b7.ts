import type { Lesson } from '../types';

/** Cùng một query cho hai dialect: MySQL có dấu chấm phẩy cuối, Oracle thì không. */
const both = (q: string) => ({ mysql: `${q};`, oracle: q });

export const lesson: Lesson = {
  id: 'c7-b7',
  chapter: 7,
  order: 7,
  title: 'Nối theo nhiều điều kiện, nối theo khoảng, CROSS JOIN',
  lead: 'Bạn nối bằng nhiều điều kiện, nối theo khoảng giá trị, và ghép mọi cặp row bằng CROSS JOIN.',
  minutes: 18,
  goals: [
    'Nối bằng hai điều kiện với AND trong ON',
    'Nối theo khoảng bằng BETWEEN trong ON',
    'Ghép mọi cặp row bằng CROSS JOIN',
    'Đoán trước số row của CROSS JOIN',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Lương nằm ngoài khoảng',
      paragraphs: [
        'Chị Hạnh nhờ Bi kiểm lương. Mỗi chức danh có mức lương thấp nhất và cao nhất, ghi ở table jobs.',
        'Chị muốn biết nhân viên nào đang lĩnh lương ngoài khoảng của chức danh mình.',
        'Từ đầu chương, Bi chỉ nối hai table bằng một dấu bằng. Lần này Bi cần so lương với một khoảng.',
        'Bi cũng cần thêm hai kiểu nối nữa: nối bằng hai điều kiện cùng lúc, và ghép mọi cặp có thể có.',
      ],
    },
    {
      type: 'text',
      title: 'Nhiều điều kiện trong ON',
      paragraphs: [
        'Điều kiện trong ON có thể gồm nhiều phần. Bạn nối các phần bằng `AND`.',
        'Hai row ghép với nhau khi mọi điều kiện cùng đúng.',
        'Table có primary key gồm hai column cần hai điều kiện. Một điều kiện chưa đủ để chỉ đúng một row.',
        'Ví dụ: tìm nhân viên từng làm đúng chức danh hiện tại. Table job_history ghi các chức danh cũ. Bạn ghép theo mã nhân viên và theo mã chức danh.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: nối bằng hai điều kiện',
      intro: 'Bấm Chạy. Query ghép employees với job_history khi mã nhân viên và mã chức danh cùng bằng nhau.',
      database: 'company',
      tables: ['employees', 'job_history'],
      dialects: ['mysql', 'oracle'],
      sql: both(
        'SELECT e.employee_id, e.last_name, e.job_id,\n       jh.job_id AS job_cu, jh.department_id AS phong_cu\nFROM employees e\nJOIN job_history jh\n  ON jh.employee_id = e.employee_id\n AND jh.job_id = e.job_id\nORDER BY e.employee_id',
      ),
      tries: [
        {
          label: 'Bỏ điều kiện AND jh.job_id = e.job_id',
          sql: both(
            'SELECT e.employee_id, e.last_name, e.job_id,\n       jh.job_id AS job_cu, jh.department_id AS phong_cu\nFROM employees e\nJOIN job_history jh\n  ON jh.employee_id = e.employee_id\nORDER BY e.employee_id',
          ),
        },
        {
          label: 'Đổi job_id thành department_id trong AND',
          sql: both(
            'SELECT e.employee_id, e.last_name, e.job_id,\n       jh.job_id AS job_cu, jh.department_id AS phong_cu\nFROM employees e\nJOIN job_history jh\n  ON jh.employee_id = e.employee_id\n AND jh.department_id = e.department_id\nORDER BY e.employee_id',
          ),
        },
        {
          label: 'Giữ cả hai AND: job_id và department_id',
          sql: both(
            'SELECT e.employee_id, e.last_name, e.job_id,\n       jh.job_id AS job_cu, jh.department_id AS phong_cu\nFROM employees e\nJOIN job_history jh\n  ON jh.employee_id = e.employee_id\n AND jh.job_id = e.job_id\n AND jh.department_id = e.department_id\nORDER BY e.employee_id',
          ),
        },
      ],
      say: 'Chỉ nhân viên 104 có row cũ cùng chức danh với chức danh hiện tại. Mỗi AND thêm một điều kiện, nên kết quả chỉ ít đi.',
    },
    {
      type: 'text',
      title: 'Điều kiện nằm trong ON hay trong WHERE',
      paragraphs: [
        'Với INNER JOIN, điều kiện lọc đặt trong ON hay trong WHERE đều cho cùng kết quả.',
        'Với LEFT JOIN thì khác. Điều kiện trong ON quyết định row nào ghép được, và row bên trái vẫn được giữ.',
        'Điều kiện trong WHERE chạy sau khi nối. Row bên trái có NULL ở bên phải bị lọc mất.',
        'Ví dụ: LEFT JOIN customers với orders, rồi chỉ lấy đơn `cancelled` của bốn khách 1001, 1002, 1003 và 1028.',
        'Đặt `o.status = \'cancelled\'` trong ON, bạn nhận 4 row, đủ bốn khách. Đặt nó trong WHERE, chỉ còn 1 row: khách 1001.',
        'Muốn giữ mọi row bên trái, hãy đặt điều kiện lọc của bên phải trong ON.',
      ],
    },
    {
      type: 'text',
      title: 'Nối theo khoảng',
      paragraphs: [
        'Điều kiện trong ON cũng có thể là một khoảng. Kiểu này gọi là **[[non-equi-join]]**, nối không dùng dấu bằng.',
        'Viết `ON e.salary BETWEEN j.min_salary AND j.max_salary`. Hai row ghép với nhau khi lương nằm trong khoảng của chức danh.',
        'Một nhân viên có thể ghép với nhiều chức danh, vì nhiều khoảng lương chồng lên nhau. Row của nhân viên lặp lại cho mỗi khoảng khớp.',
        'Thêm `AND j.job_id = e.job_id` thì mỗi nhân viên chỉ ghép với chức danh của mình. Khi đó, người lĩnh lương ngoài khoảng không ghép được.',
        'Muốn tìm đúng người lĩnh lương ngoài khoảng, đổi `BETWEEN` thành `NOT BETWEEN`.',
      ],
    },
    {
      type: 'playground',
      title: 'Lương rơi vào khoảng của chức danh nào',
      intro: 'Bấm Chạy. Query ghép hai nhân viên với mọi chức danh có khoảng lương chứa mức lương của họ.',
      database: 'company',
      tables: ['employees', 'jobs'],
      dialects: ['mysql', 'oracle'],
      sql: both(
        'SELECT e.employee_id, e.last_name, e.salary, j.job_id\nFROM employees e\nJOIN jobs j\n  ON e.salary BETWEEN j.min_salary AND j.max_salary\nWHERE e.employee_id IN (116, 137)\nORDER BY e.employee_id, j.job_id',
      ),
      tries: [
        {
          label: 'Đổi IN (116, 137) thành IN (100, 105)',
          sql: both(
            'SELECT e.employee_id, e.last_name, e.salary, j.job_id\nFROM employees e\nJOIN jobs j\n  ON e.salary BETWEEN j.min_salary AND j.max_salary\nWHERE e.employee_id IN (100, 105)\nORDER BY e.employee_id, j.job_id',
          ),
        },
        {
          label: 'Thêm AND j.job_id = e.job_id vào ON',
          sql: both(
            'SELECT e.employee_id, e.last_name, e.salary, j.job_id\nFROM employees e\nJOIN jobs j\n  ON e.salary BETWEEN j.min_salary AND j.max_salary\n AND j.job_id = e.job_id\nWHERE e.employee_id IN (116, 137)\nORDER BY e.employee_id, j.job_id',
          ),
        },
        {
          label: 'Tìm người lương ngoài khoảng của chính chức danh mình',
          sql: both(
            'SELECT e.employee_id, e.last_name, e.salary, j.job_id,\n       j.min_salary, j.max_salary\nFROM employees e\nJOIN jobs j\n  ON j.job_id = e.job_id\n AND e.salary NOT BETWEEN j.min_salary AND j.max_salary\nORDER BY e.employee_id',
          ),
        },
      ],
      say: 'Nhân viên 137 lương 10 triệu rơi vào khoảng của bốn chức danh, nên ra bốn row. Mục cuối tìm được hai người: 116 vượt max_salary của SA_REP, 122 thấp hơn min_salary của IT_PROG.',
    },
    {
      type: 'text',
      title: 'CROSS JOIN: ghép mọi cặp',
      paragraphs: [
        '**[[cross-join]]** ghép mỗi row của table bên trái với mỗi row của table bên phải. CROSS JOIN không có ON.',
        'Kết quả gọi là **[[cartesian-product]]**, tức tích Descartes. Số row bằng số row bên trái nhân số row bên phải.',
        'Table regions có 4 row, table products có 20 row. CROSS JOIN ra 4 × 20 = 80 row.',
        'CROSS JOIN không chọn lọc gì cả. Chỉ dùng nó khi bạn cần mọi cặp.',
        'Ví dụ: dựng lưới "khu vực × nhóm sản phẩm" cho báo cáo. Lưới có đủ ô, kể cả ô chưa có số liệu.',
      ],
    },
    {
      type: 'playground',
      title: 'Ghép mọi cặp khu vực và sản phẩm',
      intro: 'Bấm Chạy. Query ghép 4 khu vực với 2 sản phẩm đầu tiên. Đếm trước: 4 × 2 ra bao nhiêu row?',
      database: 'company',
      tables: ['regions', 'products', 'jobs'],
      dialects: ['mysql', 'oracle'],
      sql: both(
        'SELECT r.region_name, p.product_name\nFROM regions r\nCROSS JOIN products p\nWHERE p.product_id <= 2002\nORDER BY r.region_id, p.product_id',
      ),
      tries: [
        {
          label: 'Đếm mọi cặp khu vực và sản phẩm',
          sql: both('SELECT COUNT(*) AS so_row\nFROM regions r\nCROSS JOIN products p'),
        },
        {
          label: 'Đổi products thành jobs, và đếm',
          sql: both('SELECT COUNT(*) AS so_row\nFROM regions r\nCROSS JOIN jobs j'),
        },
        {
          label: 'Dựng lưới: gom theo khu vực và nhóm sản phẩm',
          sql: both(
            'SELECT r.region_name, p.category\nFROM regions r\nCROSS JOIN products p\nGROUP BY r.region_id, r.region_name, p.category\nORDER BY r.region_id, p.category',
          ),
        },
      ],
      say: '4 khu vực nhân 2 sản phẩm ra 8 row. Mục lưới ra 16 row, đúng 4 khu vực nhân 4 nhóm sản phẩm.',
    },
    {
      type: 'oracle',
      body: [
        'CROSS JOIN, ON nhiều điều kiện và BETWEEN trong ON chạy giống nhau ở cả hai dialect.',
        'Khác biệt nằm ở chỗ quên ON khi viết `a JOIN b`.',
        'MySQL coi đó là CROSS JOIN và không báo gì. Bạn nhận 80 row mà không có cảnh báo.',
        'Oracle báo ORA-00905 và dừng lại. Muốn ghép mọi cặp, bạn phải viết chữ CROSS.',
        'Ở MySQL, hãy đếm row sau mỗi lần nối để bắt lỗi quên ON.',
      ],
      mysql: 'SELECT COUNT(*) AS so_row\nFROM regions r\nJOIN products p;\n-- Không lỗi, ra 80 row',
      oracle:
        'SELECT COUNT(*) AS so_row\nFROM regions r\nJOIN products p\n-- ORA-00905\n\nSELECT COUNT(*) AS so_row\nFROM regions r\nCROSS JOIN products p\n-- Ra 80 row',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Table a có 6 row, table b có 5 row. `a CROSS JOIN b` ra bao nhiêu row?',
          options: [
            { text: '30', correct: true, feedback: 'Đúng. Mỗi row của a ghép với cả 5 row của b: 6 × 5 = 30.' },
            { text: '11', feedback: '11 là 6 cộng 5. CROSS JOIN ghép từng cặp nên phải nhân.' },
            { text: '5', feedback: 'Con số này chỉ đúng nếu a có 1 row. Mỗi row của a đều được ghép với b.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn LEFT JOIN customers với orders, và đặt `o.status = \'cancelled\'` trong WHERE. Khách chưa có đơn cancelled ra sao?',
          options: [
            {
              text: 'Rơi khỏi kết quả',
              correct: true,
              feedback: 'Đúng. WHERE chạy sau khi nối. Bên phải của khách ấy là NULL, và NULL không bằng \'cancelled\'.',
            },
            {
              text: 'Vẫn hiện, kèm NULL ở bên phải',
              feedback: 'Điều kiện trong ON làm vậy. Điều kiện trong WHERE lọc mất row đó.',
            },
            { text: 'Database báo lỗi', feedback: 'Không có lỗi. Query chạy bình thường, chỉ là kết quả ít row hơn bạn nghĩ.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Điều kiện ON nào ghép nhân viên với chức danh có khoảng lương chứa lương của họ?',
          options: [
            {
              text: '`ON e.salary BETWEEN j.min_salary AND j.max_salary`',
              correct: true,
              feedback: 'Đúng. BETWEEN đúng khi lương nằm giữa min_salary và max_salary.',
            },
            {
              text: '`ON e.salary = j.min_salary`',
              feedback: 'Điều kiện này chỉ ghép khi lương bằng đúng min_salary.',
            },
            {
              text: '`ON e.salary > j.max_salary`',
              feedback: 'Điều kiện này ghép khi lương vượt max_salary. Đó là câu hỏi ngược lại.',
            },
          ],
        },
      ],
    },
    { type: 'exercise', exerciseIds: ['c7-e11'] },
    {
      type: 'realworld',
      title: 'Phí vận chuyển theo cân nặng',
      paragraphs: [
        'Cửa hàng online có một table phí. Từ 0 đến 1 kg giá một mức, từ 1 đến 5 kg giá mức khác.',
        'Table đơn hàng chỉ ghi cân nặng. Hai table không có mã chung để nối bằng dấu bằng.',
        'Query nối đơn với table phí bằng BETWEEN trên cân nặng. Mỗi đơn rơi vào đúng một khoảng, nên mỗi đơn nhận đúng một mức phí.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Nối bằng nhiều điều kiện: `ON a.x = b.x AND a.y = b.y`. Hai row ghép khi mọi điều kiện cùng đúng.',
        'Nối theo khoảng: `ON salary BETWEEN min_salary AND max_salary`. Một row có thể ghép với nhiều row.',
        'Với LEFT JOIN, điều kiện lọc của bên phải đặt trong ON thì giữ được row bên trái. Đặt trong WHERE thì mất.',
        'CROSS JOIN ghép mọi cặp, số row bằng tích hai bên. Ở MySQL, quên ON thành CROSS JOIN, Oracle thì báo ORA-00905.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, bài 6: Multi-table queries with JOINs', url: 'https://sqlbolt.com/lesson/select_queries_with_joins' },
        { name: 'MySQL 8.0 Reference Manual: JOIN Clause', url: 'https://dev.mysql.com/doc/refman/8.0/en/join.html' },
        { name: 'Oracle Database 19c SQL Language Reference: Joins', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html' },
        { name: 'oracle-samples/db-sample-schemas (schema HR)', url: 'https://github.com/oracle-samples/db-sample-schemas', note: 'MIT' },
      ],
    },
  ],
};
