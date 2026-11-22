import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c2-b4',
  chapter: 2,
  order: 4,
  title: 'Ba kiểu quan hệ',
  lead: 'Hai table nối với nhau theo một trong ba kiểu, và kiểu đó quyết định foreign key nằm ở đâu.',
  minutes: 12,
  goals: [
    'Kể tên ba kiểu quan hệ giữa hai table',
    'Chỉ ra foreign key nằm ở phía "nhiều"',
    'Nhận ra khi nào cần một table ở giữa',
    'Chọn đúng kiểu quan hệ cho một cặp table',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ba câu hỏi của chị Hạnh',
      paragraphs: [
        'Công ty Sao Mai có hai phòng và nhiều dự án. Chị Hạnh, trưởng phòng hành chính, muốn đưa danh sách nhân viên vào database.',
        'Chị hỏi mình ba câu. Một nhân viên thuộc mấy phòng? Một nhân viên có mấy thẻ ra vào? Một nhân viên làm mấy dự án?',
        'Mình trả lời: một phòng, một thẻ, và nhiều dự án. Ba câu trả lời có ba hình dạng khác nhau.',
        'Mỗi hình dạng cần một cách nối table riêng. Mình thử từng cách xem sao.',
      ],
    },
    {
      type: 'text',
      title: 'Một với một',
      paragraphs: [
        'Quan hệ **[[one-to-one]]** nối mỗi row của table này với đúng một row của table kia.',
        'Ví dụ: mỗi nhân viên có một thẻ ra vào, và mỗi thẻ thuộc về một nhân viên.',
        'Table `access_cards` giữ column `employee_id`. Column này là foreign key trỏ về `employees`.',
        'Database cần thêm một luật để một nhân viên không có hai thẻ. Bài về constraint sẽ dạy luật đó.',
        'Kiểu này ít gặp. Thường bạn tách table chỉ để giữ riêng một nhóm thông tin ít dùng.',
      ],
    },
    {
      type: 'text',
      title: 'Một với nhiều',
      paragraphs: [
        'Phòng ban và nhân viên thuộc kiểu [[one-to-many|một với nhiều]]. Một phòng có nhiều nhân viên. Mỗi nhân viên chỉ thuộc một phòng.',
        'Foreign key nằm ở phía "nhiều". Ở đây table `employees` giữ column `department_id`.',
        'Lý do nằm ở ô. Mỗi ô chỉ giữ một giá trị.',
        'Mỗi nhân viên chỉ có một phòng, nên một ô `department_id` là đủ.',
        'Ngược lại, một phòng có nhiều nhân viên. Bạn không nhét được ngần ấy mã vào một ô của table `departments`.',
      ],
    },
    {
      type: 'text',
      title: 'Nhiều với nhiều',
      paragraphs: [
        'Nhân viên và dự án thuộc kiểu **[[many-to-many]]**. Một nhân viên làm nhiều dự án. Một dự án có nhiều nhân viên.',
        'Cả hai phía đều là "nhiều". Table nào cũng không có ô đủ chỗ cho foreign key.',
        'Cách giải là thêm một table ở giữa, gọi là **[[junction-table]]**. Ở Sao Mai, table đó tên `assignments`.',
        'Table `assignments` có hai foreign key: `employee_id` trỏ về `employees`, và `project_id` trỏ về `projects`.',
        'Mỗi row của `assignments` là một cặp. Ví dụ: Hà làm dự án Website. Hà làm thêm dự án Báo cáo thì có thêm một row.',
        'Một quan hệ nhiều với nhiều biến thành hai quan hệ một với nhiều. Foreign key vẫn nằm ở phía nhiều: chính là table ở giữa.',
        'Table ở giữa còn giữ thông tin riêng của cặp, như vai trò và số giờ mỗi tuần.',
      ],
    },
    {
      type: 'text',
      title: 'Cách đoán kiểu quan hệ',
      paragraphs: [
        'Hỏi hai câu, mỗi câu một chiều. Câu đầu: một row của table A nối với mấy row của table B? Câu sau: ngược lại.',
        'Hai câu trả lời đều là "một": quan hệ một với một.',
        'Một câu là "một", câu kia là "nhiều": quan hệ một với nhiều. Đặt foreign key ở phía nhiều.',
        'Hai câu đều là "nhiều": quan hệ nhiều với nhiều. Dựng table ở giữa.',
      ],
    },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      items: [
        {
          kind: 'match',
          question: 'Nối mỗi cặp table với kiểu quan hệ của chúng.',
          pairs: [
            { left: 'Phòng ban và nhân viên', right: 'Một với nhiều' },
            { left: 'Nhân viên và thẻ ra vào', right: 'Một với một' },
            { left: 'Nhân viên và dự án', right: 'Nhiều với nhiều' },
          ],
          done: 'Đúng hết rồi. Mình hỏi hai chiều là ra kiểu quan hệ.',
        },
        {
          kind: 'choice',
          question: 'Phòng ban và nhân viên có quan hệ một với nhiều. Foreign key nằm ở table nào?',
          options: [
            { text: 'employees, vì đó là phía nhiều', correct: true, feedback: 'Đúng. Mỗi nhân viên có một phòng, nên một ô department_id là đủ.' },
            { text: 'departments, vì đó là phía một', feedback: 'Mỗi phòng có nhiều nhân viên, mà một ô chỉ giữ một mã. Foreign key phải nằm ở employees.' },
            { text: 'Cả hai table', feedback: 'Một foreign key là đủ để nối hai table. Foreign key đó nằm ở phía nhiều.' },
          ],
        },
      ],
    },
    {
      type: 'quiz',
      title: 'Thêm hai câu',
      items: [
        {
          kind: 'choice',
          question: 'Nhân viên và dự án có quan hệ nhiều với nhiều. Cách nối nào đúng?',
          options: [
            { text: 'Thêm column project_id vào employees', feedback: 'Một nhân viên làm nhiều dự án, mà một ô project_id chỉ giữ một mã.' },
            { text: 'Thêm column employee_id vào projects', feedback: 'Một dự án có nhiều nhân viên, mà một ô employee_id chỉ giữ một mã.' },
            { text: 'Dựng table assignments ở giữa, giữ cả employee_id và project_id', correct: true, feedback: 'Đúng. Mỗi row của assignments là một cặp nhân viên và dự án.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Hà làm hai dự án. Nam làm một dự án. Table assignments có bao nhiêu row cho ba cặp này?',
          options: [
            { text: '2 row', feedback: 'Hai là số dự án của Hà. Mỗi cặp một row, nên bạn đếm cả cặp của Nam.' },
            { text: '3 row', correct: true, feedback: 'Đúng. Hai cặp của Hà và một cặp của Nam là ba row.' },
            { text: '5 row', feedback: 'Mỗi cặp chỉ ghi một lần. Hai cặp của Hà cộng một cặp của Nam là ba row.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Đơn hàng và sản phẩm',
      paragraphs: [
        'Một công ty bán đồ qua mạng giữ đơn hàng và sản phẩm ở hai table. Một đơn có nhiều sản phẩm. Một sản phẩm nằm trong nhiều đơn.',
        'Đây là quan hệ nhiều với nhiều. Nhóm làm database dựng thêm table `order_items` ở giữa.',
        'Mỗi row của `order_items` ghi một sản phẩm trong một đơn, kèm số lượng và giá lúc bán.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Hai table nối theo một trong ba kiểu: một với một, một với nhiều, nhiều với nhiều.',
        'Một với nhiều: foreign key nằm ở phía nhiều.',
        'Nhiều với nhiều cần một table ở giữa, giữ hai foreign key.',
        'Hỏi hai chiều "một hay nhiều?" để nhận ra kiểu quan hệ.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1: Relating', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'Harvard CS50 SQL, Lecture 2: Designing', url: 'https://cs50.harvard.edu/sql/notes/2/', note: 'CC BY-NC-SA 4.0' },
      ],
    },
  ],
};
