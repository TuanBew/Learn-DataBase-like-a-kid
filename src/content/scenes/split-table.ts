/** Chữ và dữ liệu của cảnh "Vì sao phải tách table". */
export const copy = {
  buttons: {
    edit: 'Hường đổi số điện thoại',
    split: 'Tách thành hai table',
    reset: 'Làm lại',
  },
  tables: { orders: 'orders', customers: 'customers' },
  rowUnit: 'row',
  columns: {
    big: ['order_id', 'customer_name', 'customer_phone', 'drink'],
    orders: ['order_id', 'customer_id', 'drink'],
    customers: ['customer_id', 'customer_name', 'customer_phone'],
  },
  customers: [
    { id: 'C1', name: 'Nguyễn Thị Hường', phone: '0901 234 567', tag: 'c1' },
    { id: 'C2', name: 'Lê Văn Bình', phone: '0912 111 222', tag: 'c2' },
    { id: 'C3', name: 'Trần Minh Châu', phone: '0933 456 789', tag: 'c3' },
  ],
  orders: [
    { id: 1, customer: 'C1', drink: 'Trà sữa' },
    { id: 2, customer: 'C2', drink: 'Cà phê sữa' },
    { id: 3, customer: 'C1', drink: 'Trà đào' },
    { id: 4, customer: 'C3', drink: 'Matcha' },
    { id: 5, customer: 'C1', drink: 'Cà phê sữa' },
  ],
  /** Row đầu của Hường là row nhân viên sửa ở table to. */
  editedOrderId: 1,
  newPhone: '0988 765 432',
  aria: {
    stale: 'số cũ, lệch với row đã sửa',
    fresh: 'số mới',
  },
  says: {
    start: 'Table `orders` có 5 row. Ba row là đơn của Hường, và row nào cũng chép số điện thoại của Hường. Bấm Hường đổi số điện thoại.',
    afterEditBig:
      'Nhân viên chỉ sửa một row. Hai row còn lại của Hường giữ số cũ. Ba row nói hai số khác nhau, nên mình không biết số nào đúng. Bấm Tách thành hai table.',
    afterSplit:
      'Mình chuyển tên và số điện thoại sang table `customers`. Mỗi khách có đúng một row ở đó. Table `orders` giữ `customer_id` để chỉ về khách. Row cùng màu nhãn thì nối với nhau. Mình đưa số của Hường về số cũ để bạn thử lại. Bấm Hường đổi số điện thoại.',
    afterEditSplit:
      'Mình chỉ sửa một ô ở table `customers`. Ba đơn của Hường cùng nhìn về ô đó, nên cả ba thấy số mới. Nếu muốn xem lại, bấm Làm lại.',
  },
} as const;
