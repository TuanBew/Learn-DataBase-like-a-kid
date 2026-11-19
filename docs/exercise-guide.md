# Hướng dẫn soạn bài tập

Mỗi bài tập là một file `src/content/exercises/<id>.ts`, `export const exercise`. File tự có mặt trên site, không sửa `index.ts`. Khuôn dữ liệu: `SqlExercise` và `QuizExercise` trong `src/content/types.ts`. Bài mẫu: `src/content/exercises/c3-e6.ts`. Engine chạy được gì: `docs/engine.md`. Chữ theo `CLAUDE.md`.

Id: `c<chương>-e<số>` cho 6 bài thường, `c<chương>-boss` cho bài boss. Tên bài boss bắt đầu bằng "Boss:".

Sau khi soạn, chạy `npx vitest run src/content/exercises.test.ts`. Test này chạy lời giải và mọi đáp án sai của từng bài ở mọi dialect đã khai.

## Luật chung cho bài chạy SQL

- `prompt`: 1 tới 2 câu kể một việc cần làm ở tiệm trà sữa (hoặc phòng nhân sự với database `hr`). `asks`: 2 tới 4 gạch đầu dòng, mỗi gạch một yêu cầu kiểm được (column nào, điều kiện gì, sắp ra sao, lấy mấy row).
- `dialects`: `['mysql', 'oracle']` cho mọi bài, trừ bài dạy riêng một dialect và các bài trên `hr` (chỉ `['oracle']`). Mỗi dialect đã khai phải có `starter`, `solution`, `hints.skeleton`, và `wrong[].sql`.
- `solution` của Oracle viết đúng kiểu Oracle: FETCH FIRST thay cho LIMIT, alias của table không có AS, `||` để nối chuỗi, NVL, TO_CHAR, `DATE '2026-03-02'`.
- Kết quả của lời giải nên có 1 tới 12 row. `check.orderMatters: true` chỉ khi đề bài yêu cầu sắp xếp, và ORDER BY của lời giải phải cho ra một thứ tự duy nhất (thêm column phụ nếu có giá trị trùng).
- `check.aliasMatters: true` chỉ khi đề bài bắt đặt tên column.
- `wrong`: ít nhất 2 đáp án sai hay gặp, mỗi cái là một query chạy được, ra kết quả khác lời giải và khác nhau từng đôi. `hint` nói đúng lỗi đó và cách sửa, giọng động viên. Ví dụ lỗi hay gặp: quên WHERE, dùng `>=` thay cho `>`, quên ORDER BY, DESC thay cho ASC, quên LIMIT, dùng WHERE thay cho HAVING, JOIN thiếu ON (chỉ chạy ở MySQL), INNER JOIN thay cho LEFT JOIN, COUNT(column) thay cho COUNT(*), quên bỏ đơn cancelled.
- `hints.light`: nhắc lại khái niệm cần dùng. `hints.specific`: chỉ ra clause có vấn đề. `hints.skeleton`: khung query có chỗ trống `____`. Lời giải ở bậc 4 lấy từ `solution`.
- `why`: 1 tới 2 câu nói vì sao lời giải đúng.

## Từng dạng

| `kind` | Người học làm gì | Điều riêng phải có |
|---|---|---|
| `write` | Viết query từ đầu | `starter` là phần mở đầu ngắn hoặc chuỗi rỗng |
| `fill` | Điền chỗ trống | `starter` có ít nhất một `____` |
| `debug` | Tìm và sửa lỗi | `starter` là query lỗi: hoặc sai cú pháp, hoặc chạy ra kết quả sai. `prompt` nói rõ query đang có lỗi |
| `translate` | Viết lại query MySQL bằng Oracle | `dialects: ['oracle']`, `from` là query MySQL, `starter.oracle` chính là `from`, `solution.oracle` ra cùng kết quả với `from` |
| `order` | Bấm các mẩu theo đúng thứ tự viết | `pieces[dialect]`: 3 tới 7 mẩu theo thứ tự đúng, mỗi mẩu là một clause trọn vẹn. `solution[dialect]` là các mẩu nối bằng xuống dòng. `starter` là chuỗi rỗng. `wrong` vẫn cần 2 query chạy được |
| `predict` | Đọc query, chọn các row sẽ còn lại, rồi xem Theater | `solution` là SELECT trên đúng một table (`tables[0]`), không GROUP BY, không JOIN, kết quả là một phần của table đó (ít hơn toàn bộ, nhiều hơn 0). `starter` bằng `solution`. Dùng table nhỏ (`products`, `customers`, `stores`, `staff`) |
| `rehearsal` | Chạy INSERT, UPDATE hoặc DELETE trên bản sao | `target`: table bị sửa. `solution` là lệnh sửa đúng. Kết quả đúng là trạng thái của `target` sau lệnh. `wrong`: ít nhất 1 lệnh chạy được ra trạng thái khác, trong đó bài UPDATE và DELETE phải có bản quên WHERE. Lệnh không được vi phạm constraint (ví dụ không xóa row đang có row khác trỏ tới) |
| `quiz` | Trả lời 3 tới 5 câu hỏi nhanh | `items`: câu `choice` có đúng 1 lựa chọn `correct` và `feedback` cho mọi lựa chọn; câu `match` có 3 tới 5 cặp. `asks: []`. `why`: Bi nói một câu khi xong |

## Gắn bài tập vào bài học

Mỗi chương có một file `src/content/exercise-map/c<chương>.ts`:

```ts
export const map: Record<string, string[]> = {
  'c3-b2': ['c3-e1', 'c3-e2'],
  'c3-b5': ['c3-e6', 'c3-boss'],
};
```

Khóa là id bài học, giá trị là các bài tập hiện ở cuối bài đó. Bài tập chỉ được dùng kiến thức của bài học đó và các bài trước. Bài boss gắn vào bài cuối chương.
