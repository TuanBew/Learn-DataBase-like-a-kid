export interface NextStep {
  name: string;
  href: string;
  /** Một câu nói khi nào nên tới đây. */
  when: string;
}

export const nextSteps = {
  title: 'Học tiếp',
  bi: 'Bạn đã đi hết khóa. Mình xếp sẵn tám chỗ để bạn học tiếp, từ dễ tới khó. Chọn chỗ nào hợp với bạn nhất.',
  pathLabel: 'Con đường học tiếp',
  stepWord: 'Mốc',
  open: 'Mở trang',
  newTab: 'mở ở tab mới',
  freesql: {
    pen: 'Chỗ này hợp nhất với bạn.',
    title: 'Oracle FreeSQL',
    lead: 'FreeSQL chạy Oracle SQL thật ngay trong browser. Bạn không cần cài gì và không cần trả tiền.',
    points: [
      'Có sẵn schema HR. Đây đúng là dữ liệu của nhiệm vụ cuối khóa.',
      'Bạn chọn được bản 19c hoặc 26ai.',
      'Mở trang, gõ query, bấm Chạy.',
    ],
    href: 'https://freesql.com',
    cta: 'Mở Oracle FreeSQL',
  },
  steps: [
    {
      name: 'SQLBolt',
      href: 'https://sqlbolt.com',
      when: 'Tới đây khi bạn muốn luyện lại phần cơ bản. Bài ngắn, có bài tập ngay.',
    },
    {
      name: 'Mode SQL Tutorial',
      href: 'https://mode.com/sql-tutorial',
      when: 'Tới đây khi bạn muốn dùng SQL để phân tích dữ liệu. Có phần cơ bản, trung cấp và nâng cao.',
    },
    {
      name: 'DataLemur',
      href: 'https://datalemur.com',
      when: 'Tới đây khi nền SQL của bạn đã vững. Bạn luyện đề SQL thật từ các công ty lớn.',
    },
    {
      name: 'Oracle FreeSQL',
      href: 'https://freesql.com',
      when: 'Tới đây khi bạn muốn chạy Oracle SQL thật. Chọn bản 19c hoặc 26ai, schema HR có sẵn.',
    },
    {
      name: 'Oracle Dev Gym: Databases for Developers',
      href: 'https://devgym.oracle.com/devgym/database-for-developers.html',
      when: 'Tới đây khi bạn muốn học Oracle bài bản, theo từng khóa.',
    },
    {
      name: 'SQL Murder Mystery',
      href: 'https://mystery.knightlab.com',
      when: 'Tới đây khi bạn muốn ôn JOIN và WHERE cho vui. Bạn phá một vụ án bằng SQL.',
    },
    {
      name: 'Harvard CS50 SQL',
      href: 'https://cs50.harvard.edu/sql',
      when: 'Tới đây khi bạn muốn hiểu sâu hơn về thiết kế database.',
    },
    {
      name: 'Khan Academy: Intro to SQL',
      href: 'https://www.khanacademy.org/computing/computer-programming/sql',
      when: 'Tới đây khi bạn muốn học thêm qua video chậm rãi.',
    },
  ] satisfies NextStep[],
} as const;
