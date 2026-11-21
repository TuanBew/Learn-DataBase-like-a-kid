import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c3-b3',
  chapter: 3,
  order: 3,
  title: 'ORDER BY và DISTINCT',
  lead: 'Bạn xếp row theo thứ tự mình muốn và bỏ các row trùng nhau.',
  minutes: 15,
  goals: [
    'Xếp row tăng dần và giảm dần',
    'Xếp theo nhiều column',
    'Biết NULL đứng đầu hay cuối ở MySQL và Oracle',
    'Bỏ row trùng bằng DISTINCT',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Topping nào đắt nhất?',
      paragraphs: [
        'Một khách muốn thêm topping và hỏi mình: "Topping nào đắt nhất?"',
        'Mình lấy các topping ra, rồi xếp theo giá từ cao xuống thấp. Món đắt nhất nằm trên cùng.',
        'Sổ của tiệm không tự xếp như vậy. Các món nằm theo thứ tự lúc mình ghi vào.',
        'Muốn có thứ tự khác, bạn phải nói rõ trong query.',
      ],
    },
    {
      type: 'text',
      title: 'ORDER BY xếp row',
      paragraphs: [
        '**[[order-by]]** xếp các row trong kết quả theo column bạn chọn.',
        'ASC xếp tăng dần, từ nhỏ đến lớn hoặc từ A đến Z. DESC xếp giảm dần. Không viết gì thì database hiểu là ASC.',
        'Không có ORDER BY thì database không hứa row nào đứng trước. Cần thứ tự thì phải viết ORDER BY.',
        'ORDER BY đứng sau WHERE, ở cuối query.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: topping từ đắt đến rẻ',
      intro: 'Bấm Chạy. Query lấy các topping và xếp theo price giảm dần.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT name, price\nFROM products\nWHERE category = 'Topping'\nORDER BY price DESC;",
        oracle: "SELECT name, price\nFROM products\nWHERE category = 'Topping'\nORDER BY price DESC",
      },
      tries: [
        {
          label: 'Đổi DESC thành ASC',
          sql: {
            mysql: "SELECT name, price\nFROM products\nWHERE category = 'Topping'\nORDER BY price ASC;",
            oracle: "SELECT name, price\nFROM products\nWHERE category = 'Topping'\nORDER BY price ASC",
          },
        },
        {
          label: 'Thêm name làm column xếp thứ hai',
          sql: {
            mysql: "SELECT name, price\nFROM products\nWHERE category = 'Topping'\nORDER BY price DESC, name;",
            oracle: "SELECT name, price\nFROM products\nWHERE category = 'Topping'\nORDER BY price DESC, name",
          },
        },
        {
          label: "Đổi 'Topping' thành 'Cà phê'",
          sql: {
            mysql: "SELECT name, price\nFROM products\nWHERE category = 'Cà phê'\nORDER BY price DESC;",
            oracle: "SELECT name, price\nFROM products\nWHERE category = 'Cà phê'\nORDER BY price DESC",
          },
        },
      ],
      say: 'Hai topping cùng giá 10000. Thêm một column nữa vào ORDER BY để chia thứ tự giữa hai món đó.',
    },
    {
      type: 'text',
      paragraphs: [
        'ORDER BY nhận nhiều column, ngăn cách bằng dấu phẩy. Database xếp theo column đầu trước.',
        'Hai row bằng nhau ở column đầu thì database xếp tiếp theo column sau. Mỗi column có ASC hoặc DESC riêng.',
        'Row nào có NULL thì đứng đâu? Mỗi DBMS có luật riêng. Query sau xếp calories tăng dần. Hai món trong kết quả có calories là NULL.',
      ],
    },
    {
      type: 'playground',
      title: 'NULL đứng đầu hay cuối?',
      intro: 'Bấm Chạy ở MySQL, rồi đổi sang Oracle và bấm Chạy lại.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT name, calories\nFROM products\nWHERE category IN ('Cà phê', 'Topping')\nORDER BY calories;",
        oracle: "SELECT name, calories\nFROM products\nWHERE category IN ('Cà phê', 'Topping')\nORDER BY calories",
      },
      tries: [
        {
          label: 'Đổi ORDER BY calories thành ORDER BY calories DESC',
          sql: {
            mysql: "SELECT name, calories\nFROM products\nWHERE category IN ('Cà phê', 'Topping')\nORDER BY calories DESC;",
            oracle: "SELECT name, calories\nFROM products\nWHERE category IN ('Cà phê', 'Topping')\nORDER BY calories DESC",
          },
        },
        {
          label: 'Đổi sang xếp theo name',
          sql: {
            mysql: "SELECT name, calories\nFROM products\nWHERE category IN ('Cà phê', 'Topping')\nORDER BY name;",
            oracle: "SELECT name, calories\nFROM products\nWHERE category IN ('Cà phê', 'Topping')\nORDER BY name",
          },
        },
      ],
      say: 'Query này có hai row calories là NULL. MySQL và Oracle đặt chúng ở hai đầu khác nhau.',
    },
    {
      type: 'oracle',
      body: [
        'Khi xếp tăng dần, MySQL đặt NULL lên đầu. Oracle đặt NULL xuống cuối.',
        'Khi xếp giảm dần thì ngược lại: MySQL đặt NULL cuối, Oracle đặt NULL đầu.',
        'Oracle cho bạn chọn bằng `NULLS FIRST` hoặc `NULLS LAST` ở cuối ORDER BY. Bài này dùng cách xếp mặc định.',
        'Chữ Đ cũng xếp khác nhau. MySQL coi Đ như D, nên tên Đinh đứng gần tên Dương.',
        'Theo mặc định, Oracle xếp chữ có dấu sau chữ không dấu. Ở Oracle, tên Đinh đứng sau tên Vũ.',
      ],
      mysql: 'ORDER BY calories\n-- NULL đứng đầu',
      oracle: 'ORDER BY calories\n-- NULL đứng cuối',
    },
    {
      type: 'text',
      title: 'DISTINCT bỏ row trùng',
      paragraphs: [
        'Table products có 14 món, nhưng chỉ có vài nhóm món. Nhiều món cùng ghi một nhóm.',
        'Muốn liệt kê mỗi nhóm một lần, thêm **[[distinct]]** sau SELECT. DISTINCT bỏ các row trùng nhau trong kết quả.',
      ],
    },
    {
      type: 'playground',
      title: 'Các nhóm món của tiệm',
      intro: 'Bấm Chạy. Mỗi nhóm món hiện đúng một lần.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT DISTINCT category\nFROM products;',
        oracle: 'SELECT DISTINCT category\nFROM products',
      },
      tries: [
        {
          label: 'Bỏ DISTINCT',
          sql: { mysql: 'SELECT category\nFROM products;', oracle: 'SELECT category\nFROM products' },
        },
        {
          label: 'Thêm ORDER BY category',
          sql: {
            mysql: 'SELECT DISTINCT category\nFROM products\nORDER BY category;',
            oracle: 'SELECT DISTINCT category\nFROM products\nORDER BY category',
          },
        },
        {
          label: 'Thêm column price',
          sql: {
            mysql: 'SELECT DISTINCT category, price\nFROM products;',
            oracle: 'SELECT DISTINCT category, price\nFROM products',
          },
        },
      ],
      say: 'DISTINCT nhìn cả cặp column. Thêm price thì chỉ row trùng cả nhóm lẫn giá mới bị bỏ.',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn muốn món đắt nhất đứng đầu. Clause nào đúng?',
          options: [
            { text: '`ORDER BY price DESC`', correct: true, feedback: 'Đúng. DESC xếp từ lớn đến nhỏ, nên món đắt nhất lên đầu.' },
            { text: '`ORDER BY price`', feedback: 'Không viết gì thì database hiểu là ASC. Món rẻ nhất sẽ lên đầu.' },
            { text: '`ORDER BY DESC price`', feedback: 'DESC đứng sau tên column, không đứng trước.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn xếp `calories` tăng dần. Các row có calories là NULL đứng ở đâu?',
          options: [
            { text: 'MySQL đặt ở đầu, Oracle đặt ở cuối', correct: true, feedback: 'Đúng. Khi xếp tăng dần, hai nơi đặt NULL ở hai đầu khác nhau.' },
            { text: 'Cả hai đặt ở cuối', feedback: 'Chỉ Oracle đặt NULL ở cuối. MySQL đặt NULL ở đầu.' },
            { text: 'Cả hai đặt ở đầu', feedback: 'Chỉ MySQL đặt NULL ở đầu. Oracle đặt NULL ở cuối.' },
          ],
        },
        {
          kind: 'choice',
          question: '`SELECT DISTINCT category, price FROM products` trả nhiều row hơn `SELECT DISTINCT category FROM products`. Vì sao?',
          options: [
            { text: 'DISTINCT xét cả cặp column. Cặp khác nhau thì được giữ', correct: true, feedback: 'Đúng. Hai món cùng nhóm nhưng khác giá là hai cặp khác nhau.' },
            { text: 'DISTINCT chỉ xét column đầu tiên', feedback: 'DISTINCT xét mọi column sau SELECT, không chỉ column đầu.' },
            { text: 'Thêm price làm database lấy thêm row từ nơi khác', feedback: 'Table vẫn có 14 row. Cặp category và price chỉ bị bỏ khi trùng cả hai giá trị.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Xếp món theo giá trong app mua sắm',
      paragraphs: [
        'Trong app mua sắm, bạn bấm "Giá thấp đến cao" hoặc "Giá cao đến thấp".',
        'Mỗi nút gửi một query có ORDER BY price. Một nút dùng ASC, nút kia dùng DESC.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'ORDER BY xếp row, mặc định là ASC.',
        'DESC xếp giảm dần. Không có ORDER BY thì database không hứa thứ tự row.',
        'ORDER BY xếp được theo nhiều column, mỗi column có ASC hoặc DESC riêng.',
        'Xếp tăng dần: MySQL đặt NULL đầu, Oracle đặt NULL cuối.',
        'DISTINCT bỏ row trùng, và xét cả cặp column.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 4: Filtering and sorting Query results', url: 'https://sqlbolt.com/lesson/filtering_sorting_query_results' },
      ],
    },
  ],
};
