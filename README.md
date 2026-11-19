# Learn DataBase like a kid

Website tĩnh dạy database và SQL cho người lớn chưa biết gì về IT. Mascot Bi dẫn bạn đi từng bước nhỏ, từ "database là gì" tới sửa dữ liệu. MySQL 8 dùng để học nền, Oracle 19c dùng cho công việc.

Engine SQL tự viết bằng TypeScript chạy ngay trong browser. Không có backend, không cần đăng nhập.

## Chạy trên máy

```
npm install
npm run dev
npm test
npm run build
```

`npm run lint` kiểm type bằng `tsc`.

## Cấu trúc thư mục

```
src/engine     SQL engine: tokenizer, parser, executor ghi trace, grader
src/theater    Query Theater: trace -> khung hình -> sân khấu
src/scenes     Cảnh motion của từng bài
src/content    Toàn bộ chữ và nội dung bài học, bài tập, glossary
src/data       Database mẫu
src/sfx        Âm thanh Web Audio
src/components Component nền dùng lại
src/pages      Trang chủ, trang bài học, trang bài tập
docs           Yêu cầu, kế hoạch, quyết định đã chốt
```

## Sửa chữ ở đâu

- Bài học, bài tập, glossary: `src/content`.
- Thông báo lỗi của engine: `src/engine/messages.vi.ts`.
- Lời thoại của Query Theater: `src/theater/copy.vi.ts`.

Luật viết chữ nằm ở `CLAUDE.md`.

## Trạng thái

Đang ở Mốc 1: engine SELECT, WHERE, ORDER BY, LIMIT, FETCH FIRST, bài đầu Chương 1 và một bài tập Chương 3 có Query Theater. Chi tiết ở `docs/plan.md`.

Repo đã có `vercel.json`. Hướng dẫn deploy sẽ viết ở Mốc 3.

## Nguồn và giấy phép

Lý thuyết trong bài được viết lại bằng lời của repo này, dựa trên các nguồn sau.

- Harvard CS50 SQL, https://cs50.harvard.edu/sql
- Stanford, Jennifer Widom, khóa "Databases: Relational Databases and SQL" trên edX
- MIT OpenCourseWare 6.830 Database Systems, https://ocw.mit.edu/courses/6-830-database-systems-fall-2010
- Khan Academy, Intro to SQL
- SQLBolt, https://sqlbolt.com
- Julia Evans, "SQL queries don't start with SELECT", https://jvns.ca/blog/2019/10/03/sql-queries-don-t-start-with-select/
- Oracle Dev Gym, "Databases for Developers: Foundations", https://devgym.oracle.com/devgym/database-for-developers.html
- Oracle Database 19c SQL Language Reference và MySQL 8 Reference Manual
- oracle-samples/db-sample-schemas, https://github.com/oracle-samples/db-sample-schemas

Nội dung phỏng theo Harvard CS50 SQL và MIT OCW 6.830 dùng giấy phép CC BY-NC-SA 4.0. Giấy phép này yêu cầu ghi công, chỉ dùng phi thương mại, và chia sẻ lại cùng giấy phép. Vì vậy phần nội dung bài học của repo này cũng theo CC BY-NC-SA 4.0.

Cấu trúc dataset văn phòng lấy theo `oracle-samples/db-sample-schemas` (giấy phép MIT).

Font cài qua Fontsource, đều giấy phép SIL OFL 1.1: Baloo 2, Be Vietnam Pro, JetBrains Mono, Patrick Hand.
