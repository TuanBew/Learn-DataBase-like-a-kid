export interface Source {
  name: string;
  href?: string;
  usedFor: string;
  note: string;
}

export interface Company {
  name: string;
  claim: string;
  href: string;
  linkText: string;
}

export interface Pkg {
  name: string;
  usedFor: string;
  license: string;
  href?: string;
}

export const sources = {
  title: 'Nguồn và ghi công',
  bi: 'Mỗi bài trên site dựa trên ít nhất một nguồn dưới đây. Mình viết lại bằng lời của mình và không chép nguyên văn.',
  open: 'mở ở tab mới',
  cols: { name: 'Nguồn', usedFor: 'Dùng cho', note: 'Ghi chú' },

  theory: {
    title: 'Nguồn lý thuyết',
    items: [
      {
        name: 'Harvard CS50 SQL',
        href: 'https://cs50.harvard.edu/sql',
        usedFor: 'Khung kiến thức chính, từ cơ bản tới thêm, sửa, xóa dữ liệu.',
        note: 'CC BY-NC-SA 4.0: ghi công, phi thương mại, chia sẻ cùng giấy phép.',
      },
      {
        name: 'Stanford, Jennifer Widom: Databases, Relational Databases and SQL (edX)',
        usedFor: 'Relational model, cách nghĩ về table và quan hệ giữa các table.',
        note: 'Học miễn phí.',
      },
      {
        name: 'MIT OpenCourseWare 6.830 Database Systems',
        href: 'https://ocw.mit.edu/courses/6-830-database-systems-fall-2010',
        usedFor: 'Kiểm lại khái niệm DBMS và relational model ở bài 1 và bài 2.',
        note: 'Mức cao học, chỉ dùng để kiểm khái niệm. CC BY-NC-SA.',
      },
      {
        name: 'Khan Academy: Intro to SQL',
        href: 'https://www.khanacademy.org/computing/computer-programming/sql',
        usedFor: 'Nhịp dạy chậm, thân thiện cho người mới.',
        note: 'Miễn phí.',
      },
      {
        name: 'SQLBolt',
        href: 'https://sqlbolt.com',
        usedFor: 'Cách mỗi bài đi kèm một bài tập.',
        note: 'Miễn phí.',
      },
      {
        name: 'Julia Evans: SQL queries don’t start with SELECT',
        href: 'https://jvns.ca/blog/2019/10/03/sql-queries-don-t-start-with-select/',
        usedFor: 'Thứ tự chạy của query, nền của Query Theater.',
        note: 'Site không dùng hình trong zine của tác giả.',
      },
      {
        name: 'Oracle Dev Gym: Databases for Developers, Foundations',
        href: 'https://devgym.oracle.com/devgym/database-for-developers.html',
        usedFor: 'Phần Oracle.',
        note: 'Miễn phí.',
      },
      {
        name: 'Oracle Database 19c SQL Language Reference và MySQL 8 Reference Manual',
        usedFor: 'Kiểm cú pháp và table khác biệt giữa hai dialect.',
        note: 'Tài liệu chính thức.',
      },
      {
        name: 'oracle-samples/db-sample-schemas',
        href: 'https://github.com/oracle-samples/db-sample-schemas',
        usedFor: 'Cấu trúc dataset văn phòng.',
        note: 'MIT.',
      },
    ] satisfies Source[],
  },

  license: {
    title: 'Giấy phép của nội dung bài học',
    body: [
      'Nội dung của site phỏng theo Harvard CS50 SQL và MIT OpenCourseWare 6.830. Hai nguồn này dùng giấy phép CC BY-NC-SA 4.0.',
      'Giấy phép đó đòi ba điều. Bạn ghi công tác giả. Bạn không dùng cho mục đích thương mại. Bạn chia sẻ lại cùng giấy phép.',
      'Vì vậy phần nội dung bài học của site cũng theo CC BY-NC-SA 4.0.',
    ],
    linkText: 'Đọc giấy phép CC BY-NC-SA 4.0',
    href: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  },

  dataset: {
    title: 'Dataset văn phòng',
    body: 'Dataset văn phòng phỏng theo cấu trúc của oracle-samples/db-sample-schemas, giấy phép MIT. Tên người và số liệu là dữ liệu bịa cho bài học.',
    href: 'https://github.com/oracle-samples/db-sample-schemas',
    linkText: 'db-sample-schemas trên GitHub',
  },

  companies: {
    title: 'Ví dụ về công ty',
    lead: 'Mỗi thẻ "Ngoài đời" có một nguồn chính thức. Mình chỉ viết điều nguồn đó nói.',
    items: [
      {
        name: 'GitHub',
        claim: 'GitHub dùng MySQL làm kho dữ liệu chính cho mọi thứ ngoài git, gồm website, API và phần đăng nhập.',
        href: 'https://github.blog/engineering/infrastructure/mysql-high-availability-at-github/',
        linkText: 'MySQL High Availability at GitHub',
      },
      {
        name: 'YouTube',
        claim: 'YouTube tạo ra Vitess vào năm 2010 khi MySQL của họ sắp quá tải vì lượng người dùng.',
        href: 'https://vitess.io/docs/overview/history/',
        linkText: 'Lịch sử của Vitess',
      },
      {
        name: 'Instagram',
        claim: 'Instagram dùng PostgreSQL làm database chính và chia dữ liệu ra nhiều máy khi lớn lên.',
        href: 'https://instagram-engineering.com/1cf5a71e5a5c',
        linkText: 'Instagram Engineering',
      },
    ] satisfies Company[],
  },

  fonts: {
    title: 'Font',
    lead: 'Site tự host bốn font, lấy qua Fontsource. Cả bốn dùng giấy phép SIL OFL 1.1.',
    cols: { name: 'Font', usedFor: 'Dùng cho', license: 'Giấy phép' },
    items: [
      { name: 'Baloo 2', usedFor: 'Tiêu đề và nút', license: 'SIL OFL 1.1' },
      { name: 'Be Vietnam Pro', usedFor: 'Chữ thân bài', license: 'SIL OFL 1.1' },
      { name: 'JetBrains Mono', usedFor: 'Code và query', license: 'SIL OFL 1.1' },
      { name: 'Patrick Hand', usedFor: 'Lời phê bút đỏ', license: 'SIL OFL 1.1' },
    ] satisfies Pkg[],
    href: 'https://fontsource.org',
    linkText: 'Fontsource',
  },

  libs: {
    title: 'Thư viện',
    lead: 'Các thư viện chính của site đều dùng giấy phép MIT. Engine SQL do dự án tự viết.',
    cols: { name: 'Thư viện', usedFor: 'Dùng cho', license: 'Giấy phép' },
    items: [
      { name: 'React', usedFor: 'Giao diện', license: 'MIT', href: 'https://react.dev' },
      { name: 'Vite', usedFor: 'Build và chạy thử', license: 'MIT', href: 'https://vite.dev' },
      { name: 'Motion', usedFor: 'Animation', license: 'MIT', href: 'https://motion.dev' },
      { name: 'CodeMirror', usedFor: 'Ô gõ query', license: 'MIT', href: 'https://codemirror.net' },
      { name: 'wouter', usedFor: 'Chuyển trang', license: 'MIT', href: 'https://github.com/molefrog/wouter' },
    ] satisfies Pkg[],
  },
} as const;
