/** Chữ và dữ liệu của cảnh "Yêu cầu đi đâu" (bài client và server). */

export type CsNode = 'client' | 'server' | 'database';

export interface CsStep {
  from: CsNode;
  to: CsNode;
  /** Chữ trên gói tin đang đi. */
  packet: string;
  tone: 'ask' | 'query' | 'rows';
  say: string;
}

const steps: CsStep[] = [
  { from: 'client', to: 'server', packet: 'yêu cầu', tone: 'ask', say: 'Client gửi một yêu cầu qua internet tới server: cho xem thực đơn.' },
  { from: 'server', to: 'database', packet: 'query', tone: 'query', say: 'Server viết yêu cầu thành một query bằng SQL, rồi gửi cho DBMS.' },
  { from: 'database', to: 'server', packet: '14 row', tone: 'rows', say: 'DBMS đọc table `products` và trả 14 row về cho server.' },
  { from: 'server', to: 'client', packet: 'kết quả', tone: 'rows', say: 'Server gửi kết quả về client. App hiện thực đơn lên màn hình.' },
];

export const copy = {
  steps,
  nodes: [
    { id: 'client', name: 'client', note: 'điện thoại của bạn' },
    { id: 'server', name: 'server', note: 'máy luôn mở, chờ yêu cầu' },
    { id: 'database', name: 'database', note: 'Bi là DBMS, giữ database' },
  ] as { id: CsNode; name: string; note: string }[],
  appTitle: 'Tiệm trà',
  appButton: 'Xem thực đơn',
  appWaiting: 'Đang chờ',
  menu: ['Trà sữa trân châu', 'Trà đào cam sả', 'Cà phê sữa đá'],
  menuMore: 'và 11 món nữa',
  wire: 'internet',
  sqlLabel: 'Query mà server gửi',
  sql: 'SELECT name FROM products;',
  next: 'Bước tiếp',
  reset: 'Làm lại',
  stepOf: (n: number, total: number) => `Bước ${n}/${total}`,
  says: {
    start: 'Bạn mở app của tiệm và bấm Xem thực đơn. Điện thoại là client. Bấm Bước tiếp.',
    done: 'Một chuyến đi và về như vậy thường mất chưa tới một giây.',
  },
};
