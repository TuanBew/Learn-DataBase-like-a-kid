import type { GlossaryEntry } from '../types';

export const entries: Record<string, GlossaryEntry> = {
  mysql: {
    term: 'MySQL',
    short: 'Một DBMS miễn phí, rất phổ biến. Khóa này học SQL trên MySQL trước.',
    example: 'Giống một hãng người giữ kho: nhiều tiệm thuê, ai cũng dặn bằng SQL.',
  },
  oracle: {
    term: 'Oracle',
    short: 'Một DBMS của hãng Oracle, nhiều công ty lớn dùng. Khóa này học nó sau MySQL.',
    example: 'Một hãng người giữ kho khác, nói SQL hơi khác MySQL ở vài chỗ.',
  },
  postgresql: {
    term: 'PostgreSQL',
    short: 'Một DBMS miễn phí, mã nguồn mở. Nhiều đội làm app chọn nó.',
    example: 'Cũng là một người giữ kho, nói SQL gần giống hai hãng còn lại.',
  },
};
