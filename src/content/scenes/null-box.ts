/** Chữ và dữ liệu của cảnh "Hộp quà rỗng" (bài NULL). */

export type BoxValue = 0 | 7 | null;
export type Truth = 'TRUE' | 'FALSE' | 'NULL';

const text = (v: BoxValue) => (v === null ? 'NULL' : String(v));

export const copy = {
  values: [0, 7, null] as BoxValue[],
  text,
  leftLabel: 'Hộp trái',
  rightLabel: 'Hộp phải',
  compare: 'So sánh bằng =',
  isNull: 'Hỏi hộp trái IS NULL',
  reset: 'Làm lại',
  resultLabel: 'Kết quả',
  hidden: '?',
  unknown: 'không biết',
  exprEq: (a: BoxValue, b: BoxValue) => `${text(a)} = ${text(b)}`,
  exprIsNull: (a: BoxValue) => `${text(a)} IS NULL`,
  says: {
    start: 'Mỗi hộp là một ô của table. Hộp NULL là hộp rỗng, không ai biết bên trong lẽ ra có gì. Chọn giá trị cho hai hộp, rồi bấm So sánh bằng =.',
    changed: 'Bạn vừa đổi hộp. Bấm So sánh bằng = hoặc Hỏi hộp trái IS NULL.',
    eqTrue: (a: BoxValue) => `Hai hộp cùng chứa ${text(a)}. Kết quả là TRUE.`,
    eqFalse: (a: BoxValue, b: BoxValue) => `Hộp trái chứa ${text(a)}, hộp phải chứa ${text(b)}. Kết quả là FALSE.`,
    eqOneNull: 'Một hộp là NULL. Database không biết hộp đó chứa gì, nên không so sánh được. Kết quả là NULL, nghĩa là không biết.',
    eqBothNull: 'Hai hộp cùng là NULL, nhưng kết quả không ra TRUE. Database không biết mỗi hộp chứa gì, nên không nói được hai hộp bằng nhau.',
    isNullTrue: '`IS NULL` hỏi thẳng: hộp này có rỗng không? Hộp trái là NULL, nên kết quả là TRUE.',
    isNullFalse: (a: BoxValue) => `Hộp trái chứa ${text(a)}. Số ${text(a)} là một giá trị, nên \`IS NULL\` ra FALSE.`,
  },
};
