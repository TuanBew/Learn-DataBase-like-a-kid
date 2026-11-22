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
    /** Một câu Bi nói sau khi nơi này ghi row. */
    caption: Rich;
  }[];
  /** Bi nói khi người học đã chạm đủ bốn nơi. */
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
  /** Lời Bi theo số row đã ghi: phần tử 0 cho row đầu, 1 cho row thứ hai, ... */
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
  /** Bi nói khi ghép đúng hết. */
  done: Rich;
}

export type Quiz = ChoiceQuiz | MatchQuiz;

/* ---------- Các khối của một bài ---------- */

export type LessonBlock =
  | { type: 'story'; title: string; paragraphs: Rich[] }
  | { type: 'text'; title?: string; paragraphs: Rich[] }
  /** Một cảnh motion. `scene` là khóa trong `src/scenes/index.ts`. Chữ của cảnh nằm ở `src/content/scenes/<scene>.ts`. */
  | { type: 'scene'; scene: string; title: string; intro: Rich }
  /** "Thử tay ngay": một editor nhỏ kèm Query Theater, chạy trên dữ liệu thật. */
  | PlaygroundBlock
  /** Một đoạn code có chú thích từng phần, ví dụ CREATE TABLE. */
  | { type: 'code'; title: string; intro?: Rich; code: string; notes: { find: string; text: Rich }[] }
  | { type: 'quiz'; title: string; items: Quiz[] }
  /** Lối sang các bài tập của bài này. */
  | { type: 'exercise'; exerciseIds: string[] }
  | { type: 'oracle'; body: Rich[]; mysql?: string; oracle?: string }
  | { type: 'realworld'; title: string; paragraphs: Rich[]; source?: Source }
  | { type: 'keypoints'; items: Rich[] }
  | { type: 'sources'; items: Source[] };

export interface PlaygroundBlock {
  type: 'playground';
  title: string;
  intro: Rich;
  database: 'teashop' | 'teashop-big' | 'hr';
  /** Các table hiện tên column cho người học xem. */
  tables: string[];
  /** Dialect được chọn. Một dialect thì ẩn nút đổi. */
  dialects: Dialect[];
  /** Query có sẵn lúc mở. */
  sql: Partial<Record<Dialect, string>>;
  /** Các query gợi ý để bấm thử, mỗi cái đổi một điểm so với query gốc. */
  tries?: { label: string; sql: Partial<Record<Dialect, string>> }[];
  /** Bi nói một câu dưới editor. */
  say?: Rich;
}

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
  /** Tên các bài theo thứ tự. */
  lessons: { id: string; title: string; /** true nếu mục này là một bài tập, không phải bài học. */ exercise?: boolean }[];
}

/* ---------- Bài tập SQL ---------- */

/**
 * Các dạng bài tập.
 * - write: viết query từ đầu. fill: `starter` có chỗ trống `____`. debug: `starter` là query viết sai.
 * - translate: `from` là query MySQL, người học viết lại bằng Oracle.
 * - order: xếp các mẩu trong `pieces` cho đúng thứ tự viết của query.
 * - predict: đoán row nào còn lại sau khi chạy `solution`, rồi xem Theater để kiểm.
 * - rehearsal: diễn tập UPDATE hoặc DELETE trên bản sao của `target`.
 * - quiz: một nhóm câu hỏi nhanh trong `items`, không cần engine.
 */
export type ExerciseKind = 'write' | 'fill' | 'order' | 'predict' | 'debug' | 'translate' | 'rehearsal' | 'quiz';

interface ExerciseBase {
  /** Ví dụ 'c4-e4'. Bài boss của chương có đuôi '-boss'. */
  id: string;
  chapter: number;
  title: string;
  /** Đề bài. Nói rõ cần column nào, điều kiện gì, sắp xếp ra sao. */
  prompt: Rich;
  /** Vài gạch đầu dòng nhắc lại yêu cầu, mỗi gạch một ý. Bài quiz để mảng rỗng. */
  asks: Rich[];
}

/** Bài tập chạy trên SQL engine. */
export interface SqlExercise extends ExerciseBase {
  kind: Exclude<ExerciseKind, 'quiz'>;
  database: 'teashop' | 'teashop-big' | 'hr';
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
  /** Bi nói khi đúng: vì sao query này đúng. */
  why: Rich;
  /** Bốn bậc gợi ý. Bậc 3 là khung query có chỗ trống `____`. Bậc 4 là lời giải, lấy từ `solution`. */
  hints: {
    light: Rich;
    specific: Rich;
    skeleton: Partial<Record<Dialect, string>>;
  };
  /**
   * Đáp án sai hay gặp. Khi kết quả của người học trùng với kết quả của `sql`,
   * Bi nói `hint`.
   */
  wrong: { id: string; sql: Partial<Record<Dialect, string>>; hint: Rich }[];
  /** translate: query gốc viết bằng MySQL. */
  from?: string;
  /** order: các mẩu của query theo đúng thứ tự viết. Giao diện tự xáo. */
  pieces?: Partial<Record<Dialect, string[]>>;
  /** rehearsal: table bị sửa. Kết quả đúng là trạng thái của table này sau khi chạy `solution`. */
  target?: string;
}

/** Bài tập gồm các câu hỏi nhanh, không cần engine. */
export interface QuizExercise extends ExerciseBase {
  kind: 'quiz';
  items: Quiz[];
  /** Bi nói khi làm xong hết. */
  why: Rich;
}

export type Exercise = SqlExercise | QuizExercise;
