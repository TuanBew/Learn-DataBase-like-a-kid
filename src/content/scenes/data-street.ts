import type { DataStreetCopy } from '../types';

/** Chữ và dữ liệu của cảnh "Phố dữ liệu" (bài c1-b1). */
export const copy: DataStreetCopy = {
  hint: 'Bấm vào một nơi.',
  counterLabel: 'row đã ghi',
  places: [
    {
      id: 'tea',
      name: 'Tiệm trà sữa',
      action: 'Đặt một ly',
      ledger: 'orders',
      columns: ['order_id', 'drink', 'price', 'time'],
      rows: [
        ['101', 'Trà đào', '45.000', '08:15'],
        ['102', 'Cà phê sữa', '25.000', '08:20'],
        ['103', 'Trà matcha', '42.000', '08:31'],
      ],
      caption: 'Tiệm vừa ghi một đơn: mã đơn, món, giá và giờ đặt.',
    },
    {
      id: 'ride',
      name: 'App gọi xe',
      action: 'Gọi một chuyến',
      ledger: 'trips',
      columns: ['trip_id', 'driver', 'pickup', 'fare'],
      rows: [
        ['T501', 'Minh', 'Quận 1', '38.000'],
        ['T502', 'Hạnh', 'Quận 3', '52.000'],
        ['T503', 'Tuấn', 'Thủ Đức', '95.000'],
      ],
      caption: 'App vừa ghi một chuyến: mã chuyến, tài xế, nơi đón và cước.',
    },
    {
      id: 'bank',
      name: 'Ngân hàng',
      action: 'Chuyển tiền',
      ledger: 'transfers',
      columns: ['transfer_id', 'sender', 'amount', 'sent_at'],
      rows: [
        ['9001', 'Lan', '500.000', '09:02'],
        ['9002', 'Bảo', '1.200.000', '09:10'],
        ['9003', 'Thu', '250.000', '09:45'],
      ],
      caption: 'Ngân hàng vừa ghi một lần chuyển: người gửi, số tiền và giờ gửi.',
    },
    {
      id: 'school',
      name: 'Trường học',
      action: 'Vào điểm',
      ledger: 'scores',
      columns: ['student_id', 'student', 'subject', 'score'],
      rows: [
        ['S01', 'Nguyễn An', 'Toán', '9.0'],
        ['S02', 'Lê Bình', 'Văn', '7.5'],
        ['S03', 'Trần Chi', 'Anh', '8.5'],
      ],
      caption: 'Trường vừa ghi một điểm: học sinh, môn và số điểm.',
    },
  ],
  done: 'Bạn đã xem đủ bốn nơi. Nơi nào cũng ghi dữ liệu theo cùng một kiểu. Mỗi lần ghi một row, mỗi row đủ các ô.',
};
