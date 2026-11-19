import { teashop } from '../../data/teashop';

const products = teashop.tables.find((t) => t.name === 'products');

/** Vị trí các column của table products trong dữ liệu mẫu: product_id, name, price, launched_on. */
const PICK = [0, 1, 3, 5];

/** Năm món đầu của table products, chỉ giữ bốn column cần dạy. */
const rows: string[][] = (products?.rows ?? []).slice(0, 5).map((r) => PICK.map((i) => String(r[i] ?? '')));

/** Chữ và dữ liệu của cảnh "table, row, column" (bài c1-b3). */
export const copy = {
  tableName: 'products',
  columns: [
    { name: 'product_id', type: 'INT' },
    { name: 'name', type: 'VARCHAR' },
    { name: 'price', type: 'INT' },
    { name: 'launched_on', type: 'DATE' },
  ],
  rows,

  part1Title: 'Gọi tên từng phần',
  part1Intro: 'Bấm một nút, hoặc bấm thẳng vào table. Phần được chọn sẽ sáng màu vàng.',
  parts: [
    { id: 'table', label: 'table' },
    { id: 'row', label: 'row' },
    { id: 'column', label: 'column' },
    { id: 'cell', label: 'ô' },
  ],
  partsLabel: 'Chọn một phần của table',
  rowLabel: 'Chọn row',
  columnLabel: 'Chọn column',
  cellLabel: 'Chọn ô',
  counter: { row: 'row', column: 'column' },
  startSay: 'Bấm một nút ở trên. Mình sẽ nói phần đó là gì.',
  say: {
    table: 'Đây là **table** products. Table là một tấm lưới giữ một loại thông tin, ở đây là các món của tiệm.',
    row: 'Đây là row của món {name}. Một **row** giữ mọi thông tin của đúng một món. Table này có 5 row.',
    column: 'Đây là column {col}. Một **column** giữ một loại thông tin, và row nào cũng có đủ. Table này có 4 column.',
    cell: 'Đây là một ô. Ô nằm ở chỗ một row gặp một column, và giữ đúng một giá trị: {value}.',
  },

  part2Title: 'Thử ghi sai data type',
  part2Intro: 'Chọn một ô trong column price hoặc launched_on. Rồi bấm một giá trị để ghi vào.',
  nameHead: 'name',
  cellPickLabel: 'Chọn ô để ghi',
  valuesLabel: 'Giá trị để ghi',
  values: [
    { id: 'int', label: '42000', kind: 'int' },
    { id: 'text', label: 'bốn hai nghìn', kind: 'text' },
    { id: 'date', label: '2026-03-01', kind: 'date' },
  ],
  reset: 'Làm lại',
  part2Start: 'Chọn một ô trước. Rồi bấm một giá trị.',
  chooseFirst: 'Bạn chưa chọn ô. Bấm một ô trong column price hoặc launched_on.',
  accept: {
    price: 'Column price có data type INT. 42000 là số nguyên, nên ô nhận giá trị mới.',
    launched_on: 'Column launched_on có data type DATE. 2026-03-01 là một ngày, nên ô nhận giá trị mới.',
  },
  reject: {
    price: {
      text: 'Giá trị bật lại. Column price có data type INT, chỉ nhận số nguyên. Chữ thì không vào được.',
      date: 'Giá trị bật lại. Column price có data type INT, chỉ nhận số nguyên. Một ngày không phải số nguyên.',
    },
    launched_on: {
      int: 'Giá trị bật lại. Column launched_on có data type DATE, chỉ nhận ngày. 42000 là số, không phải ngày.',
      text: 'Giá trị bật lại. Column launched_on có data type DATE, chỉ nhận ngày. Chữ thì không vào được.',
    },
  },
} as const;
