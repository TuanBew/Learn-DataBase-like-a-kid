/** Chữ và dữ liệu của cảnh "Excel và database" (bài c1-b2). */
export const copy = {
  tabsLabel: 'Chọn một thí nghiệm',
  tabs: [
    { id: 'write', label: 'Nhiều người cùng ghi' },
    { id: 'rules', label: 'Luật giữ dữ liệu đúng' },
    { id: 'size', label: 'Dữ liệu rất lớn' },
  ],
  excelTitle: 'Excel',
  excelSub: 'một sheet',
  dbTitle: 'Database',
  dbSub: 'một table',
  reset: 'Làm lại',
  fair: 'Danh sách nhỏ và chỉ một người dùng thì Excel vẫn tiện. Cứ dùng Excel.',

  write: {
    intro: 'Lan và Bảo đang cầm mỗi người một đơn. Bấm nút để cả hai cùng bấm Lưu.',
    button: 'Hai người cùng bấm Lưu',
    cashiers: [
      { id: 'lan', name: 'Lan', orderId: 12, drink: 'Trà đào cam sả' },
      { id: 'bao', name: 'Bảo', orderId: 13, drink: 'Cà phê sữa đá' },
    ],
    sheetCols: ['A', 'B'],
    headers: ['Mã đơn', 'Món'],
    sheetRowNo: 2,
    tableName: 'orders',
    rowWord: 'row',
    countExcel: 'đơn',
    countDb: 'row',
    during: 'Hai đơn cùng chạy vào file. Chờ một chút.',
    result:
      'Excel chỉ giữ đơn của Bảo, vì đơn của Bảo đè lên đơn của Lan. Database xếp hai đơn lần lượt và giữ cả hai. Nhờ vậy cuối ngày không thiếu đơn nào.',
  },

  rules: {
    intro: 'Ô giá của món Trà đào cam sả đang trống. Chọn một giá trị để ghi vào.',
    pickLabel: 'Ghi vào ô price',
    item: 'Trà đào cam sả',
    itemHead: 'Món',
    priceHead: 'Giá',
    totalHead: 'Tổng 2 ly',
    totalFormula: '= giá × 2',
    columnName: 'price',
    empty: 'trống',
    error: '#VALUE!',
    rejected: 'Bị bật lại',
    values: [
      { id: 'ok', label: '45000', num: 45000 },
      { id: 'text', label: 'bốn lăm nghìn', num: null },
      { id: 'neg', label: '-5000', num: -5000 },
    ],
    reasonText: 'Column price chỉ nhận số.',
    reasonSign: 'Giá trị của price phải lớn hơn 0.',
    say: {
      ok: 'Cả hai bên nhận 45000. Đây là số lớn hơn 0, đúng với luật của column price.',
      text: 'Excel nhận cả chữ, nên ô Tổng báo #VALUE!. Database bật giá trị lại vì column price chỉ nhận số.',
      neg: 'Excel nhận số âm và không báo gì. Database bật lại, vì price phải lớn hơn 0.',
    },
  },

  size: {
    intro: 'Kéo thanh trượt để chọn số row. Mỗi vạch là một mức lớn hơn.',
    sliderLabel: 'Số row',
    selected: 'Đang chọn',
    unit: 'row',
    min: 1000,
    max: 10000000,
    /** Số row tối đa của một sheet Excel. */
    limit: 1048576,
    limitLabel: 'trần 1.048.576',
    full: 'Hết chỗ',
    accepts: 'Còn chỗ',
    dbOk: 'Nhận được',
    barExcel: 'Excel',
    barDb: 'Database',
    scaleNote: 'Thang đo tăng theo từng nấc ×10.',
    say: {
      small: 'Ít row thế này thì Excel chạy ổn. Hai bên đều nhận.',
      near: 'Excel còn nhận được, nhưng đã gần trần của một sheet là 1.048.576 row.',
      over: 'Số row đã vượt 1.048.576. Sheet Excel hết chỗ. Database vẫn nhận tiếp.',
      huge: 'Vài triệu row vẫn nằm gọn trong database. Excel dừng ở 1.048.576 row.',
    },
  },

  start: {
    write: 'Bấm nút Lưu và nhìn hai đơn đi về đâu.',
    rules: 'Bấm một giá trị bên trên. Mình sẽ nói điều xảy ra.',
    size: 'Kéo thanh trượt sang phải. Mình sẽ nói khi có chuyện.',
  },
} as const;
