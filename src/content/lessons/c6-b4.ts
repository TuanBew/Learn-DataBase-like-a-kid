import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c6-b4',
  chapter: 6,
  order: 4,
  title: 'subquery với IN',
  lead: 'Bạn đặt một query nhỏ vào trong query lớn để lấy danh sách hoặc một con số.',
  minutes: 16,
  goals: [
    'Lọc bằng IN với danh sách do subquery trả về',
    'Dùng scalar subquery để so với một con số',
    'Biết subquery chạy trước, query ngoài chạy sau',
    'Tránh bẫy NOT IN khi danh sách có NULL',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Khách nào đã từng mua?',
      paragraphs: [
        'Chủ tiệm muốn gửi quà cho khách đã đặt ít nhất một đơn.',
        'Bi chưa thể mở danh sách khách ngay. Trước hết mình cần biết mã nào từng xuất hiện trong table orders.',
        'Bi chép các mã đó ra một tờ giấy nháp. Rồi mình mở danh sách khách, và giữ ai có mã nằm trên tờ nháp.',
        'Tờ nháp ấy là một query nhỏ. SQL cho bạn đặt nó ngay trong query lớn.',
      ],
    },
    {
      type: 'text',
      title: 'subquery trả một danh sách cho IN',
      paragraphs: [
        '**[[subquery]]** là query nhỏ nằm trong dấu ngoặc của query lớn.',
        'Database chạy subquery trước. Kết quả của nó trở thành dữ liệu cho query ngoài.',
        '**[[in]]** giữ row khi giá trị nằm trong một danh sách. Danh sách có thể do subquery trả về.',
        'Subquery ở đây chỉ chọn một column, nên kết quả là một danh sách các mã.',
        'Query dưới đây lấy mã khách từ orders, rồi giữ các khách có mã nằm trong đó.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: khách đã từng đặt đơn',
      intro: 'Bấm Chạy. Theater chạy query nhỏ trước, rồi mới lọc table customers.',
      database: 'teashop',
      tables: ['customers', 'orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders);',
        oracle:
          'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders)',
      },
      tries: [
        {
          label: 'Thêm WHERE store_id = 1 vào subquery',
          sql: {
            mysql:
              'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders WHERE store_id = 1);',
            oracle:
              'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders WHERE store_id = 1)',
          },
        },
        {
          label: "Thêm WHERE status = 'cancelled' vào subquery",
          sql: {
            mysql:
              "SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders WHERE status = 'cancelled');",
            oracle:
              "SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders WHERE status = 'cancelled')",
          },
        },
        {
          label: 'Đổi IN thành NOT IN',
          sql: {
            mysql:
              'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id NOT IN (SELECT customer_id FROM orders);',
            oracle:
              'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id NOT IN (SELECT customer_id FROM orders)',
          },
        },
      ],
      say: 'Có 9 khách đã đặt đơn. Mục cuối trả 0 row, dù ba khách chưa đặt đơn nào. Phần sau giải thích vì sao.',
    },
    {
      type: 'text',
      title: 'Bẫy của NOT IN',
      paragraphs: [
        'Vài đơn của khách vãng lai có customer_id là NULL. Danh sách do subquery trả về có NULL trong đó.',
        'Với `NOT IN`, database phải chắc giá trị không bằng bất kỳ phần tử nào. Gặp NULL, nó không chắc được, nên không giữ row nào.',
        'Kết quả là 0 row, và database không báo lỗi.',
        'Muốn tìm khách chưa đặt đơn, loại NULL khỏi danh sách: thêm `WHERE customer_id IS NOT NULL` vào subquery.',
        'Bài LEFT JOIN cũng tìm được các khách này. Chọn cách nào bạn thấy dễ đọc hơn.',
      ],
    },
    {
      type: 'playground',
      title: 'Món chưa có trong order_items',
      intro: 'Bấm Chạy. Column product_id của order_items không có NULL, nên NOT IN chạy đúng.',
      database: 'teashop',
      tables: ['products', 'order_items'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT product_id, name\nFROM products\nWHERE product_id NOT IN (SELECT product_id FROM order_items);',
        oracle:
          'SELECT product_id, name\nFROM products\nWHERE product_id NOT IN (SELECT product_id FROM order_items)',
      },
      tries: [
        {
          label: 'Đổi NOT IN thành IN',
          sql: {
            mysql:
              'SELECT product_id, name\nFROM products\nWHERE product_id IN (SELECT product_id FROM order_items);',
            oracle:
              'SELECT product_id, name\nFROM products\nWHERE product_id IN (SELECT product_id FROM order_items)',
          },
        },
        {
          label: 'Thêm WHERE quantity > 1 vào subquery',
          sql: {
            mysql:
              'SELECT product_id, name\nFROM products\nWHERE product_id NOT IN (SELECT product_id FROM order_items WHERE quantity > 1);',
            oracle:
              'SELECT product_id, name\nFROM products\nWHERE product_id NOT IN (SELECT product_id FROM order_items WHERE quantity > 1)',
          },
        },
      ],
      say: 'Hai món này giống kết quả của bài LEFT JOIN. Một câu hỏi, hai cách trả lời.',
    },
    {
      type: 'text',
      title: 'scalar subquery trả một con số',
      paragraphs: [
        '**[[scalar-subquery]]** chỉ trả đúng một giá trị. Bạn dùng nó như một con số trong điều kiện.',
        'Ví dụ: món nào đắt hơn giá trung bình? Trước hết cần giá trung bình, tức `AVG(price)`.',
        'Bạn đặt phép tính đó vào ngoặc và so với `price`: `WHERE price > (SELECT AVG(price) FROM products)`.',
        'Database tính giá trung bình một lần, rồi so từng món với con số đó.',
        'Subquery ở bài này đứng riêng. Subquery không nhắc tới table của query ngoài.',
      ],
    },
    {
      type: 'playground',
      title: 'Món đắt hơn giá trung bình',
      intro: 'Bấm Chạy. Xem Theater tính giá trung bình trước.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT name, price\nFROM products\nWHERE price > (SELECT AVG(price) FROM products);',
        oracle:
          'SELECT name, price\nFROM products\nWHERE price > (SELECT AVG(price) FROM products)',
      },
      tries: [
        {
          label: 'Đổi > thành <',
          sql: {
            mysql:
              'SELECT name, price\nFROM products\nWHERE price < (SELECT AVG(price) FROM products);',
            oracle:
              'SELECT name, price\nFROM products\nWHERE price < (SELECT AVG(price) FROM products)',
          },
        },
        {
          label: 'Đổi AVG thành MAX',
          sql: {
            mysql:
              'SELECT name, price\nFROM products\nWHERE price > (SELECT MAX(price) FROM products);',
            oracle:
              'SELECT name, price\nFROM products\nWHERE price > (SELECT MAX(price) FROM products)',
          },
        },
        {
          label: "Thêm WHERE category = 'Trà sữa' vào subquery",
          sql: {
            mysql:
              "SELECT name, price\nFROM products\nWHERE price > (SELECT AVG(price) FROM products WHERE category = 'Trà sữa');",
            oracle:
              "SELECT name, price\nFROM products\nWHERE price > (SELECT AVG(price) FROM products WHERE category = 'Trà sữa')",
          },
        },
      ],
      say: 'Giá trung bình là khoảng 30.286 đồng. Sáu món trên mức đó hiện ra.',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Query có subquery. Database chạy phần nào trước?',
          options: [
            { text: 'Subquery trong ngoặc', correct: true, feedback: 'Đúng. Kết quả của subquery là dữ liệu cho query ngoài.' },
            { text: 'Query ngoài', feedback: 'Query ngoài cần kết quả của subquery, nên phải chờ.' },
            { text: 'Cả hai cùng lúc', feedback: 'Subquery xong trước thì query ngoài mới có dữ liệu để chạy.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Danh sách của subquery có một giá trị NULL. Bạn dùng `NOT IN`. Chuyện gì xảy ra?',
          options: [
            { text: 'Kết quả là 0 row, không có lỗi', correct: true, feedback: 'Đúng. Gặp NULL, database không chắc giá trị nào khác danh sách.' },
            { text: 'Database báo lỗi', feedback: 'Không có lỗi nào cả. Đó là điều làm bẫy này khó thấy.' },
            { text: 'Database bỏ qua NULL và chạy bình thường', feedback: 'Ngược lại. NULL làm NOT IN loại hết mọi row.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Điều kiện nào dùng scalar subquery đúng?',
          options: [
            { text: '`WHERE price > (SELECT AVG(price) FROM products)`', correct: true, feedback: 'Đúng. Subquery trả đúng một con số.' },
            { text: '`WHERE price > (SELECT price FROM products)`', feedback: 'Subquery này trả 14 giá trị. Phép so với một con số cần đúng một giá trị.' },
            { text: '`WHERE price IN (SELECT AVG(price) FROM products)`', feedback: 'Cú pháp chạy được, nhưng chỉ giữ món có giá bằng đúng giá trung bình. Gần như không món nào.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Danh sách khách cần gửi quà',
      paragraphs: [
        'Một ứng dụng chăm sóc khách muốn gửi mã giảm giá cho những người đã mua từ ba lần trở lên.',
        'Query đầu tiên tìm mã những người đủ điều kiện. Query ngoài lấy tên và số điện thoại của họ.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'subquery là query nhỏ trong dấu ngoặc. Subquery chạy trước query ngoài.',
        'IN (subquery) giữ row khi giá trị nằm trong danh sách mà subquery trả về.',
        'NOT IN gặp NULL trong danh sách thì không giữ row nào. Loại NULL bằng IS NOT NULL.',
        'scalar subquery trả một con số, dùng để so sánh như `price > (SELECT AVG(price) ...)`.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
      ],
    },
  ],
};
