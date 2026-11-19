import type { OrderPhoneCopy } from '../types';

/** Chữ và dữ liệu của cảnh "Đặt một ly" (bài c1-b1). */
export const copy: OrderPhoneCopy = {
  phoneTitle: 'Tiệm trà sữa',
  orderButton: 'Đặt món',
  drinks: [
    { id: 'p1', name: 'Trà sữa trân châu', price: 35000 },
    { id: 'p2', name: 'Trà đào cam sả', price: 45000 },
    { id: 'p3', name: 'Cà phê sữa đá', price: 25000 },
    { id: 'p4', name: 'Trà sữa matcha', price: 42000 },
  ],
  tableName: 'orders',
  empty: 'Table orders còn trống. Chọn một món rồi bấm Đặt món.',
  afterEach: [
    'Row đầu tiên đã vào table orders. Mỗi ô giữ một thông tin của đơn: mã, món, giá, giờ.',
    'Row thứ hai nằm ngay dưới row đầu. Row mới luôn thêm vào cuối table.',
    'Nhìn column order_id: mã tự tăng 1, 2, 3, nên không đơn nào trùng mã.',
    'Bốn đơn, bốn row, row nào cũng đủ các ô giống nhau. Table giữ mọi đơn theo cùng một khuôn.',
  ],
};
