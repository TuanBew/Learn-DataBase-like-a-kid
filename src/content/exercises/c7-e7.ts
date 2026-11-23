import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c7-e7',
  chapter: 7,
  kind: 'quiz',
  database: 'company',
  title: 'Đọc sơ đồ database công ty',
  prompt: 'Ba câu hỏi nhanh trên sơ đồ database công ty. Bạn tìm column nối hai table, và đếm số table ở giữa một đường nối.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Bạn cần nối `customers` với `countries`. Hai table nối nhau bằng column nào?',
      options: [
        { text: '`country_id`', correct: true, feedback: 'Đúng. `customers.country_id` là foreign key trỏ tới `countries.country_id`.' },
        { text: '`region_id`', feedback: '`region_id` nằm ở `countries` và `regions`. `customers` không có column này.' },
        { text: '`customer_id`', feedback: '`customer_id` nối `customers` với `orders`. Với `countries`, bạn cần column nói về quốc gia.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn cần nối `orders` với `employees` để biết ai bán đơn. Hai table nối nhau bằng cặp column nào?',
      options: [
        { text: '`orders.sales_rep_id` và `employees.employee_id`', correct: true, feedback: 'Đúng. Hai column khác tên nhưng cùng là mã nhân viên. Bạn viết `ON o.sales_rep_id = e.employee_id`.' },
        { text: '`orders.employee_id` và `employees.employee_id`', feedback: '`orders` không có column `employee_id`. Mã nhân viên bán đơn nằm ở `sales_rep_id`.' },
        { text: '`orders.order_id` và `employees.employee_id`', feedback: 'Hai column này là mã của hai thứ khác nhau, nên ghép lại ra kết quả vô nghĩa.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn cần nối `employees` với `countries`. Đường nối đi qua mấy table ở giữa?',
      options: [
        { text: 'Hai table: `departments` và `locations`', correct: true, feedback: 'Đúng. Đường là employees, departments, locations, countries. Ba JOIN nối bốn table.' },
        { text: 'Một table: `departments`', feedback: '`departments` chưa có column nào về quốc gia. `departments` trỏ tới `locations`, và `locations` mới trỏ tới `countries`.' },
        { text: 'Ba table', feedback: 'Đếm lại nhé. Đường chỉ có `departments` và `locations` ở giữa, nên là hai table.' },
      ],
    },
  ],
  why: 'Bạn đọc được sơ đồ rồi. Hai table cạnh nhau thì tìm foreign key. Hai table xa nhau thì đi theo từng foreign key một.',
};
