/** Chữ và dữ liệu của cảnh "Nhà kho của Bi" (bài DBMS và SQL). */

export interface WhBox {
  id: number;
  title: string;
  sub: string;
}

export interface WhShelf {
  table: string;
  /** Số row thật của table trong database tiệm trà sữa. */
  total: number;
  boxes: WhBox[];
}

export interface WhSlip {
  id: string;
  kind: 'fetch' | 'store';
  /** Vị trí của kệ trong `shelves`. */
  shelf: number;
  text: string;
  sql: string;
  /** id của các row mà Bi chép mang ra (phiếu lấy). */
  take: number[];
  /** Row mới mà Bi xếp lên kệ (phiếu cất). */
  box?: WhBox;
  going: string;
  done: string;
}

const shelves: WhShelf[] = [
  {
    table: 'products',
    total: 14,
    boxes: [
      { id: 2, title: 'Trà đào cam sả', sub: '45.000' },
      { id: 3, title: 'Cà phê sữa đá', sub: '25.000' },
      { id: 4, title: 'Trà sữa matcha', sub: '42.000' },
      { id: 5, title: 'Trà vải hoa hồng', sub: '48.000' },
      { id: 8, title: 'Trân châu đen', sub: '8.000' },
      { id: 12, title: 'Cà phê cacao đá xay', sub: '65.000' },
    ],
  },
  {
    table: 'customers',
    total: 12,
    boxes: [
      { id: 1, title: 'Nguyễn Thị Hường', sub: 'mã 1' },
      { id: 2, title: 'Trần Thu Hà', sub: 'mã 2' },
      { id: 3, title: 'Lê Hoàng Nam', sub: 'mã 3' },
    ],
  },
  {
    table: 'orders',
    total: 20,
    boxes: [
      { id: 1001, title: 'Đơn 1001', sub: '08:15' },
      { id: 1002, title: 'Đơn 1002', sub: '09:40' },
      { id: 1003, title: 'Đơn 1003', sub: '12:05' },
    ],
  },
];

const slips: WhSlip[] = [
  {
    id: 'price',
    kind: 'fetch',
    shelf: 0,
    text: 'Lấy các món giá trên 40.000',
    sql: 'SELECT name, price\nFROM products\nWHERE price > 40000;',
    take: [2, 4, 5, 12],
    going: 'Mình đọc phiếu rồi chạy tới kệ `products`. Mình xem giá của từng row.',
    done: 'Table `products` có 14 row. Mình tìm ra 4 row có giá trên 40.000. Mình chép chúng mang ra cho bạn. Row gốc vẫn nằm trên kệ.',
  },
  {
    id: 'customer',
    kind: 'fetch',
    shelf: 1,
    text: 'Tìm khách mang mã 3',
    sql: 'SELECT full_name\nFROM customers\nWHERE customer_id = 3;',
    take: [3],
    going: 'Mình chạy tới kệ `customers` và tìm row mang mã 3.',
    done: 'Kệ `customers` có đúng một row mang mã 3. Mình chép row đó mang ra cho bạn.',
  },
  {
    id: 'store',
    kind: 'store',
    shelf: 0,
    text: 'Cất món mới: Trà xoài, 40.000',
    sql: "INSERT INTO products\nVALUES (15, 'Trà xoài', 'Trà trái cây', 40000, 150, '2026-03-10');",
    take: [],
    box: { id: 15, title: 'Trà xoài', sub: '40.000' },
    going: 'Mình mang row mới tới kệ `products`.',
    done: 'Mình xếp row Trà xoài lên kệ `products`. Kệ này giờ có 15 row.',
  },
];

export const copy = {
  shelves,
  slips,
  slipsLabel: 'Phiếu yêu cầu',
  sqlLabel: 'Phiếu này viết bằng SQL',
  give: 'Đưa phiếu cho Bi',
  reset: 'Làm lại',
  trayLabel: 'Bi mang ra',
  trayEmpty: 'Chưa có gì ở quầy.',
  storedNote: 'Row mới đã nằm trên kệ.',
  more: (n: number) => `+${n} row`,
  rows: (n: number) => `${n} row`,
  says: {
    start: 'Kho của mình có ba kệ. Mỗi kệ là một table. Chọn một phiếu, rồi bấm Đưa phiếu cho Bi.',
    picked: 'Bạn chọn phiếu này. Bấm Đưa phiếu cho Bi.',
    storedAlready: 'Row Trà xoài đã nằm trên kệ. Chọn phiếu khác, hoặc bấm Làm lại.',
    all: 'Bạn chỉ viết phiếu. Mình tìm kệ, chép row và xếp row.',
  },
};
