import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c11-e4',
  chapter: 11,
  kind: 'quiz',
  title: 'Đọc query của đồng nghiệp',
  prompt:
    'Đồng nghiệp để lại query này, và bạn cần hiểu nó trước khi chạy. Query đọc từ trên xuống: ' +
    '`SELECT d.department_name,` ' +
    '`COUNT(*) AS headcount,` ' +
    '`ROUND(AVG(e.salary)) AS avg_salary` ' +
    '`FROM employees e` ' +
    '`JOIN departments d ON e.department_id = d.department_id` ' +
    '`JOIN jobs j ON e.job_id = j.job_id` ' +
    "`WHERE e.hire_date >= DATE '2020-01-01'` " +
    '`AND e.commission_pct IS NULL` ' +
    '`GROUP BY d.department_name` ' +
    '`HAVING COUNT(*) >= 2` ' +
    '`ORDER BY avg_salary DESC`. ' +
    'Đọc FROM và JOIN trước, rồi WHERE, GROUP BY, và cuối cùng SELECT.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Query này trả lời câu hỏi nào?',
      options: [
        { text: 'Phòng nào có lương trung bình cao nhất, trong số nhân viên vào làm từ 2020 và không có hoa hồng, chỉ tính phòng có ít nhất 2 người', correct: true, feedback: 'Đúng. WHERE lọc nhân viên, GROUP BY gom theo phòng, HAVING giữ phòng đủ 2 người, ORDER BY xếp lương cao lên trước.' },
        { text: 'Mỗi nhân viên có lương bao nhiêu', feedback: 'Chưa đúng. Query có GROUP BY, nên mỗi row kết quả là một phòng, không phải một nhân viên.' },
        { text: 'Chức danh nào có nhiều người nhất', feedback: 'Chưa đúng. Query nối `jobs` nhưng không hiện hay gom theo chức danh. Kết quả gom theo `department_name`.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Table nào là điểm xuất phát của query?',
      options: [
        { text: '`employees`', correct: true, feedback: 'Đúng. FROM nói table đầu tiên là `employees`. Hai table kia được nối thêm vào bằng JOIN.' },
        { text: '`departments`', feedback: '`departments` đứng đầu danh sách SELECT, nhưng điểm xuất phát là table sau FROM. Hãy tìm chữ FROM.' },
        { text: '`jobs`', feedback: '`jobs` là table nối sau cùng, và không có column nào của nó trong SELECT. Điểm xuất phát nằm ngay sau FROM.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn bỏ hai dòng WHERE đi. Số nhân viên được đưa vào gom nhóm tăng hay giảm?',
      options: [
        { text: 'Tăng, vì mất điều kiện lọc', correct: true, feedback: 'Đúng. WHERE lọc row trước khi gom nhóm. Bỏ nó đi thì nhiều nhân viên hơn đi vào GROUP BY.' },
        { text: 'Giảm, vì query ngắn hơn', feedback: 'Chưa đúng. Query ngắn hơn không có nghĩa là ít row hơn. WHERE chỉ làm số row ít đi, nên bỏ nó thì số row tăng.' },
        { text: 'Giữ nguyên', feedback: 'Chưa đúng. Có nhân viên vào làm trước 2020 hoặc có hoa hồng, và họ đang bị WHERE loại. Bỏ WHERE thì họ quay lại.' },
      ],
    },
  ],
  why: 'Bạn đọc từ trong ra ngoài: FROM và JOIN cho biết table, WHERE lọc row, GROUP BY gom, SELECT hiện. Mỗi khúc trả lời một câu hỏi nhỏ.',
};
