import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c2-b5',
  chapter: 2,
  order: 5,
  title: 'NULL: ô chưa có thông tin',
  lead: 'Ô trống khác số 0, và so sánh với nó cho kết quả khác thường.',
  minutes: 14,
  goals: [
    'Phân biệt NULL, số 0 và chữ trống ở MySQL',
    'Nói được vì sao so sánh bằng với NULL không bao giờ ra đúng',
    'Dùng IS NULL và IS NOT NULL để hỏi về ô trống',
    'Biết Oracle coi chữ trống là NULL',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Khách chưa cho số điện thoại',
      paragraphs: [
        'Anh Nam đăng ký khách quen nhưng chưa cho số điện thoại. Ô số điện thoại của anh còn trống.',
        'Mình có ba cách ghi vào ô này. Cách một là ghi số 0. Cách hai là ghi chữ trống. Cách ba là để ô không có gì.',
        'Giờ mình hỏi sổ: "Số của anh Nam có bằng số của chị Hà không?" Mình không biết số của anh Nam, nên không trả lời đúng hay sai được.',
        'Database cũng gặp đúng chuyện này. Thử đặt hai hộp lên bàn xem sao.',
      ],
    },
    {
      type: 'scene',
      scene: 'null-box',
      title: 'Hộp quà rỗng',
      intro: 'Chọn giá trị cho hai hộp, rồi bấm So sánh bằng =. Sau đó bấm Hỏi hộp trái IS NULL.',
    },
    {
      type: 'text',
      title: 'NULL là ô không có giá trị',
      paragraphs: [
        'Ô chưa có thông tin gọi là **[[null]]**. NULL nghĩa là ô này không có giá trị nào.',
        'Số 0 là một giá trị. Chữ trống cũng là một giá trị. Ở MySQL, hai thứ này khác NULL.',
        'Khi so sánh bằng `=` với NULL, kết quả là NULL. Kết quả NULL nghĩa là "không biết".',
        'Câu `WHERE` chỉ giữ row có kết quả đúng. Row có kết quả "không biết" bị bỏ.',
        'Vì vậy `WHERE phone = NULL` không bao giờ ra row nào, kể cả khi table có khách chưa cho số.',
        'Muốn hỏi ô có phải NULL không, dùng `IS NULL`. Muốn hỏi ngược lại, dùng `IS NOT NULL`.',
        'Table orders cũng có NULL. Đơn của khách vãng lai để trống customer_id, vì khách không đăng ký.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Oracle coi chữ trống là NULL. Ở MySQL, chữ trống là một giá trị.',
        'Cùng ghi chữ trống vào một ô, MySQL lưu chữ trống, còn Oracle lưu NULL.',
        'Oracle còn nhắc rằng hành vi này có thể đổi ở bản sau. Nếu code phải chạy ở cả hai nơi, đừng dựa vào chữ trống.',
      ],
      mysql: "SELECT '' IS NULL;\n-- kết quả: 0, nghĩa là chữ trống không phải NULL",
      oracle: "-- Oracle: chữ trống được xem là NULL\nINSERT INTO customers (customer_id, full_name, phone)\nVALUES (20, 'Lê Thu Lan', '');\n-- ô phone của khách 20 là NULL",
    },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Query nào tìm các khách chưa cho số điện thoại?',
          options: [
            { text: '`WHERE phone = NULL`', feedback: 'So sánh bằng `=` với NULL cho kết quả "không biết", nên không row nào được giữ.' },
            { text: '`WHERE phone IS NULL`', correct: true, feedback: 'Đúng. `IS NULL` là cách hỏi ô có trống không.' },
            { text: "`WHERE phone = ''`", feedback: 'Ở MySQL, chữ trống là một giá trị, khác NULL. Query này không tìm ra ô NULL.' },
          ],
        },
        {
          kind: 'choice',
          question: "Ở MySQL, `'' IS NULL` cho kết quả gì?",
          options: [
            { text: '0, tức là sai', correct: true, feedback: 'Đúng. Chữ trống là một giá trị, nên không phải NULL.' },
            { text: '1, tức là đúng', feedback: 'Ở Oracle thì đúng, nhưng MySQL coi chữ trống là một giá trị.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn Lan thi bù nên chưa có điểm. Ô điểm của Lan nên ghi gì?',
          options: [
            { text: 'NULL', correct: true, feedback: 'Đúng. Lan chưa có điểm, nên ô không có giá trị.' },
            { text: '0', feedback: 'Số 0 nghĩa là Lan đã thi và được 0 điểm. Ô của Lan chưa có điểm nào.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Phiếu khảo sát',
      paragraphs: [
        'Một phiếu khảo sát có câu hỏi "Bạn có nuôi thú cưng không?". Người bỏ trống câu này khác người chọn "Không".',
        'Database ghi người bỏ trống là NULL, và người chọn "Không" là một giá trị thật.',
        'Đếm riêng hai nhóm này cho ra hai con số khác nhau.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'NULL nghĩa là ô chưa có thông tin.',
        'NULL khác số 0 và khác chữ trống ở MySQL.',
        '`= NULL` không bao giờ ra đúng. Dùng `IS NULL`.',
        'Oracle coi chữ trống là NULL.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual: Working with NULL Values', url: 'https://dev.mysql.com/doc/refman/8.0/en/working-with-null.html' },
        { name: 'Oracle Database 19c SQL Language Reference: Nulls', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Nulls.html' },
      ],
    },
  ],
};
