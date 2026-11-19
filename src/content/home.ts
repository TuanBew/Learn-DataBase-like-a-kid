/** Nội dung của ba cảnh trên trang chủ. Sửa chữ ở đây. */

/** Cảnh 1: ứng dụng quanh ta gửi dữ liệu qua server vào database. */
export const homeFlow = {
  apps: [
    {
      id: 'shop',
      name: 'App mua sắm',
      tone: 'peach',
      table: 'orders',
      rows: [
        ['101', 'Trà đào', '45.000'],
        ['102', 'Cà phê sữa', '25.000'],
        ['103', 'Trà matcha', '42.000'],
      ],
      say: 'App mua sắm vừa gửi một đơn hàng. Database lưu đơn đó thành một row trong table orders.',
    },
    {
      id: 'ride',
      name: 'App gọi xe',
      tone: 'sky',
      table: 'trips',
      rows: [
        ['T501', 'Quận 1', '38.000'],
        ['T502', 'Quận 3', '52.000'],
        ['T503', 'Thủ Đức', '95.000'],
      ],
      say: 'App gọi xe vừa gửi một chuyến đi. Database lưu chuyến đó vào table trips.',
    },
    {
      id: 'bank',
      name: 'Ngân hàng',
      tone: 'taro',
      table: 'transfers',
      rows: [
        ['9001', 'Lan', '500.000'],
        ['9002', 'Bảo', '1.200.000'],
        ['9003', 'Thu', '250.000'],
      ],
      say: 'Ngân hàng vừa gửi một lần chuyển tiền. Database lưu lại, nên số dư của bạn luôn đúng.',
    },
    {
      id: 'school',
      name: 'Trường học',
      tone: 'mango',
      table: 'scores',
      rows: [
        ['S01', 'Toán', '9.0'],
        ['S02', 'Văn', '7.5'],
        ['S03', 'Anh', '8.5'],
      ],
      say: 'Trường học vừa gửi một điểm thi. Database lưu điểm đó vào table scores.',
    },
  ],
  labels: {
    apps: 'ứng dụng',
    requests: 'yêu cầu',
    rows: 'row đã lưu',
    server: 'server',
    database: 'database',
    saved: 'Đã lưu',
    empty: 'Chưa có row nào. Chạm vào một ứng dụng ở trên.',
    send: (app: string) => `${app}: gửi dữ liệu vào database`,
  },
  say: {
    start: 'Chạm vào một ứng dụng. Mình chỉ bạn xem dữ liệu đi đâu.',
    all: 'Ứng dụng nào cũng cất dữ liệu trong database. Bài đầu tiên bắt đầu từ chuyện này.',
  },
  pen: 'Chạm thử vào đây!',
} as const;

/** Cảnh 2: bên trong database có table, row, column. */
export const homeInside = {
  title: 'Bên trong database có gì',
  lead: 'Database chứa nhiều table. Mỗi table giống một tờ sổ kẻ ô, ghi một loại dữ liệu.',
  hint: 'Bấm vào từng từ để xem nó nằm ở đâu.',
  parts: [
    { id: 'table', term: 'table', say: 'Cả tờ sổ này là một table. Table products ghi mọi món của tiệm trà sữa.' },
    { id: 'row', term: 'row', say: 'Một row là một món. Row nào cũng có đủ các ô giống nhau.' },
    { id: 'column', term: 'column', say: 'Một column là một loại thông tin. Column price ghi giá của mọi món.' },
  ],
  table: {
    name: 'products',
    columns: ['product_id', 'name', 'price'],
    rows: [
      ['1', 'Trà sữa trân châu', '35.000'],
      ['2', 'Trà đào cam sả', '45.000'],
      ['3', 'Cà phê sữa đá', '25.000'],
      ['4', 'Trà sữa matcha', '42.000'],
    ],
  },
} as const;

/** Cảnh 3: hiểu database rồi mới hỏi nó bằng SQL. */
export const homeAsk = {
  title: 'Hiểu database rồi mới hỏi nó bằng SQL',
  lead: 'SQL là ngôn ngữ để hỏi database. Một câu hỏi viết bằng SQL gọi là query. Bạn học phần này từ Chương 3, sau khi đã hiểu database và table.',
  note: 'Database không chạy query theo thứ tự bạn viết. Query Theater ở Chương 3 sẽ diễn lại từng bước cho bạn xem.',
  youWrite: 'Bạn viết',
  dbRuns: 'Database chạy',
} as const;
