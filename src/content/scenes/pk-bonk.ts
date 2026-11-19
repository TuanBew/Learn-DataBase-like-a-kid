/** Chữ và dữ liệu của cảnh "Số báo danh bật ra" (bài primary key). */

export const copy = {
  tableName: 'students',
  columns: ['student_id', 'full_name'],
  pkNote: 'primary key',
  rows: [
    { id: 12, name: 'Nguyễn Gia Minh' },
    { id: 17, name: 'Trần Nhật Minh' },
    { id: 23, name: 'Lê Thu Lan' },
  ],
  /** Các học sinh mới, lần lượt từng bạn. */
  candidates: ['Vũ Đức Minh', 'Đỗ Mai Hoa'],
  /** Số báo danh để chọn cho row mới. `null` là để trống. */
  ids: [17, 23, 31, 32, null] as (number | null)[],
  nullText: 'NULL',
  nullPick: 'NULL (để trống)',
  newLabel: 'Row mới',
  idLabel: 'Chọn student_id cho row mới',
  unset: '?',
  add: 'Thêm row',
  reset: 'Làm lại',
  codesLabel: 'Mã lỗi',
  mysql: 'MySQL',
  oracle: 'Oracle',
  codes: {
    dup: { mysql: '1062', oracle: 'ORA-00001' },
    null: { mysql: '1048', oracle: 'ORA-01400' },
  },
  rowsChip: (n: number) => `${n} row`,
  says: {
    start: 'Table `students` có 3 row. Column `student_id` là số báo danh. Chọn một `student_id` cho row mới, rồi bấm Thêm row.',
    picked: 'Bấm Thêm row để xem database trả lời thế nào.',
    dup: (id: number) => `Table đã có row mang \`student_id\` ${id}. Primary key không cho hai row trùng nhau, nên row mới bật ra.`,
    null: 'Row mới để trống `student_id`. Primary key không được để trống, nên row mới bật ra.',
    okSameName: (id: number) => `Row mới vào table với \`student_id\` ${id}. Table giờ có ba bạn tên Minh. Tên trùng thì được, số báo danh thì không.`,
    ok: (id: number) => `Row mới vào table. Chưa có row nào dùng \`student_id\` ${id}.`,
    next: 'Còn một bạn nữa. Thử cho bạn này một số báo danh đã có xem.',
    done: 'Table có 5 row, mỗi row một `student_id` riêng. Gọi một số báo danh thì chỉ một row trả lời.',
  },
};
