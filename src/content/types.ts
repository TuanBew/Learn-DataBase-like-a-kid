/**
 * Khuôn của toàn bộ nội dung bài học. Sửa chữ thì sửa các file trong `src/content`,
 * không cần đụng vào component.
 *
 * Chuỗi kiểu `Rich` hiểu ba ký hiệu:
 *   **chữ đậm**
 *   `code`
 *   [[id-thuật-ngữ]] hoặc [[id-thuật-ngữ|chữ hiện ra]]  -> mở glossary popover
 * Lần đầu một thuật ngữ xuất hiện trong bài thì viết **[[database]]**.
 */
import type { Dialect } from '../engine/types';

export type Rich = string;

export interface Source {
  name: string;
  url: string;
  /** Giấy phép hoặc ghi chú ngắn, ví dụ 'CC BY-NC-SA 4.0'. */
  note?: string;
}

export interface GlossaryEntry {
  /** Thuật ngữ, giữ nguyên tiếng Anh. */
  term: string;
  /** Một câu tiếng Việt nói thuật ngữ này dùng để làm gì. */
  short: string;
  /** Ví dụ đời thường, một câu. */
  example?: string;
}

/* ---------- Cảnh motion ---------- */

/** Cảnh "Phố dữ liệu": chạm vào từng nơi, nơi đó ghi một row vào sổ. */
export interface DataStreetCopy {
  /** Lời nhắc trước lần chạm đầu tiên. */
  hint: string;
  /** Nhãn của chip đếm, ví dụ 'row đã ghi'. */
  counterLabel: string;
  places: {
    id: 'tea' | 'ride' | 'bank' | 'school';
    /** Tên nơi, ví dụ 'Tiệm trà sữa'. */
    name: string;
    /** Chữ trên nút, dạng mệnh lệnh, ví dụ 'Đặt một ly'. */
    action: string;
    /** Tên sổ của nơi này, viết như tên table: 'orders'. */
    ledger: string;
    /** Tên các column của sổ, 3 hoặc 4 cái, tiếng Anh snake_case. */
    columns: string[];
    /** Hai hoặc ba row mẫu sẽ lần lượt được ghi, mỗi row khớp `columns`. */
    rows: string[][];
    /** Một câu Châu nói sau khi nơi này ghi row. */
    caption: Rich;
  }[];
  /** Châu nói khi người học đã chạm đủ bốn nơi. */
  done: Rich;
}

/** Cảnh "Đặt một ly": người học đặt món trên điện thoại, row bay vào table `orders`. */
export interface OrderPhoneCopy {
  /** Tiêu đề trên màn hình điện thoại. */
  phoneTitle: string;
  /** Chữ trên nút đặt. */
  orderButton: string;
  /** Các món chọn được. `price` tính bằng đồng. */
  drinks: { id: string; name: string; price: number }[];
  /** Tên table bên phải. */
  tableName: string;
  /** Lời nhắc khi table còn trống. */
  empty: string;
  /** Lời Châu theo số row đã ghi: phần tử 0 cho row đầu, 1 cho row thứ hai, ... */
  afterEach: Rich[];
}

/* ---------- Câu hỏi nhanh trong bài ---------- */

export interface ChoiceQuiz {
  kind: 'choice';
  question: Rich;
  options: { text: Rich; correct?: boolean; feedback: Rich }[];
}

export interface MatchQuiz {
  kind: 'match';
  question: Rich;
  pairs: { left: string; right: string }[];
  /** Châu nói khi ghép đúng hết. */
  done: Rich;
}

export type Quiz = ChoiceQuiz | MatchQuiz;

/* ---------- Các khối của một bài ---------- */

export type LessonBlock =
  | { type: 'story'; title: string; paragraphs: Rich[] }
  | { type: 'text'; title?: string; paragraphs: Rich[] }
  | { type: 'scene'; scene: 'data-street'; title: string; intro: Rich; copy: DataStreetCopy }
  | { type: 'scene'; scene: 'order-phone'; title: string; intro: Rich; copy: OrderPhoneCopy }
  | { type: 'quiz'; title: string; items: Quiz[] }
  | { type: 'exercise'; exerciseId: string }
  | { type: 'oracle'; body: Rich[]; mysql?: string; oracle?: string }
  | { type: 'realworld'; title: string; paragraphs: Rich[]; source?: Source }
  | { type: 'keypoints'; items: Rich[] }
  | { type: 'sources'; items: Source[] };

export interface Lesson {
  /** Ví dụ 'c1-b1'. */
  id: string;
  chapter: number;
  order: number;
  title: string;
  /** Một câu dưới tiêu đề. */
  lead: Rich;
  /** Số phút ước lượng. */
  minutes: number;
  /** Danh sách "Bạn sẽ học". */
  goals: string[];
  blocks: LessonBlock[];
}

export interface Chapter {
  id: number;
  title: string;
  /** Một câu nói chương này dạy gì. */
  about: string;
  /** Tên các bài theo thứ tự. Bài chưa viết thì chỉ có `title`. */
  lessons: { id: string; title: string; ready?: boolean }[];
}

/* ---------- Bài tập SQL ---------- */

export type ExerciseKind = 'write' | 'fill' | 'order' | 'predict' | 'debug' | 'translate' | 'rehearsal';

export interface Exercise {
  /** Ví dụ 'c3-e4'. */
  id: string;
  chapter: number;
  kind: ExerciseKind;
  title: string;
  /** Đề bài. Nói rõ cần column nào, điều kiện gì, sắp xếp ra sao. */
  prompt: Rich;
  /** Vài gạch đầu dòng nhắc lại yêu cầu, mỗi gạch một ý. */
  asks: Rich[];
  database: 'teashop' | 'hr';
  /** Các table hiện trong ô "Dữ liệu của bài". */
  tables: string[];
  /** Các dialect bài này dùng. */
  dialects: Dialect[];
  /** Query có sẵn trong editor lúc mở bài. */
  starter: Partial<Record<Dialect, string>>;
  /** Lời giải mẫu. */
  solution: Partial<Record<Dialect, string>>;
  check: {
    /** true nếu đề bài yêu cầu ORDER BY. */
    orderMatters: boolean;
    /** true nếu đề bài bắt đặt tên column bằng AS. */
    aliasMatters?: boolean;
  };
  /** Châu nói khi đúng: vì sao query này đúng. */
  why: Rich;
  /** Bốn bậc gợi ý. Bậc 3 là khung query có chỗ trống `____`. Bậc 4 là lời giải, lấy từ `solution`. */
  hints: {
    light: Rich;
    specific: Rich;
    skeleton: Partial<Record<Dialect, string>>;
  };
  /**
   * Đáp án sai hay gặp. Khi kết quả của người học trùng với kết quả của `sql`,
   * Châu nói `hint`.
   */
  wrong: { id: string; sql: Partial<Record<Dialect, string>>; hint: Rich }[];
}
