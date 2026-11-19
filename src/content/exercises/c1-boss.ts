import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c1-boss',
  chapter: 1,
  kind: 'quiz',
  title: 'Boss: Ôn Chương 1',
  prompt: 'Năm câu ôn lại cả chương. Làm chậm cũng được. Câu nào sai, mình giải thích ngay.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Cô giáo có sổ điểm của 40 học sinh. Mỗi học sinh một đường kẻ ngang. Sổ điểm và mỗi đường kẻ ngang là gì?',
      options: [
        { text: 'Sổ điểm là một table, mỗi đường kẻ ngang là một row', correct: true, feedback: 'Đúng. Table giữ các row cùng loại, và mỗi row là một lần ghi.' },
        { text: 'Sổ điểm là một row, mỗi đường kẻ ngang là một table', feedback: 'Hai tên này đang đổi chỗ nhau. Đường kẻ ngang là row, còn cả sổ là table.' },
        { text: 'Sổ điểm là một column, mỗi đường kẻ ngang là một database', feedback: 'Column đi dọc và giữ một loại thông tin. Đường kẻ ngang là row, còn cả sổ là table.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Chủ tiệm mở thêm mười quầy, và cả mười cùng ghi đơn. Vì sao nên chuyển từ Excel sang database?',
      options: [
        { text: 'Database nhận nhiều người ghi cùng lúc mà không mất đơn', correct: true, feedback: 'Đúng. Nhiều người ghi cùng lúc là chỗ Excel dễ vấp và database làm tốt.' },
        { text: 'Database có nhiều màu hơn Excel', feedback: 'Màu sắc không phải lý do. Lý do là nhiều người ghi cùng lúc mà không mất đơn.' },
        { text: 'Excel không mở được file có chữ tiếng Việt', feedback: 'Excel mở chữ tiếng Việt bình thường. Chỗ nó yếu là khi nhiều người ghi cùng lúc.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Column ngày ra mắt của table products nhận data type ngày. Bạn ghi chữ "mai" vào đó. Điều gì xảy ra?',
      options: [
        { text: 'Database từ chối vì "mai" không phải một ngày', correct: true, feedback: 'Đúng. Column có data type ngày chỉ nhận ngày hợp lệ.' },
        { text: 'Database nhận vào và hiểu là ngày mai', feedback: 'Database không đoán ý bạn. "mai" không phải ngày hợp lệ nên bị từ chối.' },
        { text: 'Database đổi data type của column thành chữ', feedback: 'Data type của column không tự đổi. Giá trị sai thì bị từ chối.' },
      ],
    },
    {
      kind: 'match',
      question: 'Nối mỗi mô tả với tên của nó.',
      pairs: [
        { left: 'Điện thoại của khách, gửi yêu cầu đi', right: 'client' },
        { left: 'Máy luôn mở, chờ yêu cầu của client', right: 'server' },
        { left: 'Phần mềm giữ database', right: 'DBMS' },
        { left: 'Câu lệnh client gửi đi, viết bằng SQL', right: 'query' },
      ],
      done: 'Đúng hết rồi. Client gửi query, server nhận, DBMS lấy dữ liệu, rồi kết quả quay về.',
    },
    {
      kind: 'choice',
      question: 'Bạn chạy `SELECT * FROM products;`. Kết quả hiện gì?',
      options: [
        { text: 'Mọi column của mọi row trong table products', correct: true, feedback: 'Đúng. Dấu * là mọi column, và không có điều kiện lọc nên mọi row đều hiện.' },
        { text: 'Chỉ row đầu tiên của table products', feedback: 'Query này không giới hạn số row. Mọi row đều hiện ra.' },
        { text: 'Mọi row của table stores', feedback: 'Table được chọn là products, vì nó đứng sau chữ FROM.' },
      ],
    },
  ],
  why: 'Bạn đã qua hết Chương 1. Giờ bạn nói được database là gì, bên trong có gì, và query đi đâu.',
};
