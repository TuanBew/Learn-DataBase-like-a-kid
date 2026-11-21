# Learn Database

Website tĩnh dạy database và SQL cho người lớn chưa biết gì về IT, đặc biệt là người phải chạy query Oracle ở công ty. Mascot Bi dẫn người học đi từng bước nhỏ. Khóa học dạy hiểu database trước, SQL sau, sửa dữ liệu ở cuối. MySQL 8 dùng để học nền, Oracle 19c dùng cho công việc.

"Learn DataBase like a kid" chỉ là tên repo. Giao diện luôn hiện tên "Learn Database".

## Có gì trong site

- 7 chương, 33 bài học.
- 49 bài tập: mỗi chương 6 bài và một bài boss.
- 17 cảnh motion minh họa từng khái niệm.
- Query Theater diễn lại query từng bước, dựng từ trace của engine.
- SQL engine tự viết bằng TypeScript, chạy ngay trong browser ở hai dialect (MySQL 8 và Oracle 19c), báo lỗi bằng mã lỗi thật.
- Hiệu ứng âm thanh Web Audio, không có giọng đọc.
- Tiến trình lưu trong localStorage, kèm một mã để mang sang máy khác.
- Ăn mừng khi xong mỗi chương, và giấy chứng nhận tải về dạng ảnh PNG khi xong cả khóa.
- Hai giao diện: sáng (vở ô ly, mực tím, bút đỏ) và tối (bảng đen, phấn màu). Công tắc nằm ở đầu trang.

## Chạy trên máy

Cần Node 22 trở lên.

```
npm install
npm run dev        # server dev ở http://127.0.0.1:5173
npm run build      # kiểm type rồi build ra dist/
npm run preview    # mở bản build để xem thử
npm test           # chạy toàn bộ test
npm run lint       # kiểm type bằng tsc
```

## Deploy lên Vercel

Site là web tĩnh. Không cần backend, không cần database thật.

1. Đẩy repo lên GitHub.
2. Vào vercel.com, bấm Add New, rồi Project.
3. Chọn repo vừa đẩy.
4. Để nguyên cấu hình mà Vercel tự nhận từ `vercel.json`: Framework Vite, Build Command `npm run build`, Output Directory `dist`. Không cần biến môi trường.
5. Chọn nhánh production.
6. Bấm Deploy.

`vercel.json` chuyển mọi đường dẫn về `index.html`, nhờ đó các trang `/bai/...` và `/tap/...` mở trực tiếp được. File này cũng đặt cache dài cho `/assets/`.

Deploy bằng CLI:

```
npm i -g vercel
vercel --prod
```

## Cấu trúc thư mục

```
src/
  engine/       SQL engine: tokenizer, parser, executor ghi trace, session, chấm bài, mã lỗi
  theater/      Query Theater: trace thành khung hình, rồi thành sân khấu
  scenes/       Cảnh motion: trang chủ (HomeFlow, HomeInside) và các cảnh trong bài (lesson/)
  content/      Toàn bộ chữ của site
    lessons/        một file một bài học
    exercises/      một file một bài tập
    exercise-map/   bài tập nào hiện dưới bài học nào
    glossary.ts, glossary-extra/   từ điển thuật ngữ
    scenes/         chữ của cảnh motion
    ui-*.ts         chữ giao diện (app, lesson, exercise, progress, certificate)
  data/         Database mẫu: teashop, teashop-big (200 đơn), hr
  pages/        Trang chủ, bài học, bài tập, tiến trình, giấy chứng nhận, trang Nguồn
  components/   Component dùng lại: editor, ResultTable, Mascot, quiz, khối bài học
  sfx/          Âm thanh Web Audio
  lib/          Lưu tiến trình, vẽ giấy chứng nhận, hook tải trang
scripts/qa/     Script kiểm bằng Playwright
docs/           Yêu cầu, kế hoạch, quyết định, hướng dẫn soạn nội dung
```

## Sửa nội dung ở đâu

- Bài học: `src/content/lessons/<id>.ts`.
- Bài tập: `src/content/exercises/<id>.ts`.
- Bài tập nào hiện dưới bài học nào: `src/content/exercise-map/`.
- Chữ giao diện: `src/content/ui-*.ts`.
- Glossary: `src/content/glossary.ts` và `src/content/glossary-extra/`.
- Chữ của cảnh motion: `src/content/scenes/`.
- Thông báo lỗi của engine: `src/engine/messages.vi.ts`. Lời thoại của Query Theater: `src/theater/copy.vi.ts`.

Thêm một file vào các thư mục trên là site tự nhận, không cần sửa danh mục. Đọc mục "Luật viết chữ trên site" ở `CLAUDE.md` trước khi sửa chữ.

## Kiểm tra

`npm test` chạy hơn 1000 test. Trong đó có test so kết quả của engine với SQLite, test hành vi từng dialect, và test chạy mọi lời giải mẫu của bài tập.

Các script trong `scripts/qa/` cần site đang chạy và Playwright cài sẵn trên máy (repo không khai báo Playwright trong `package.json`). Mặc định script mở dev server ở `http://127.0.0.1:5173`.

- `crawl.cjs`: mở mọi bài học và bài tập ở 1440px và 390px, tìm lỗi console, trang trắng và nội dung tràn ngang.
- `axe.cjs`: quét accessibility (WCAG 2.1 AA) bằng axe-core trên mọi trang. Đặt `THEME=dark` để quét giao diện tối.
- `checks-4.cjs`: kiểm tiến trình không mất khi tải lại, xuất và nhập mã tiến trình, nút tắt tiếng, dùng bằng bàn phím và dấu focus.
- `checks-5.cjs`: kiểm chế độ reduced motion ở mọi cảnh motion, trang chủ và Query Theater.
- `solve-all.cjs`: giải mọi bài tập trong giao diện thật, ở từng dialect mà bài đó dùng. Chỉ chạy trên dev server.
- `sfx-check.cjs`: đo tín hiệu của 15 hiệu ứng âm thanh (có tiếng, không vỡ tiếng, tắt tiếng thì im). Chỉ chạy trên dev server.
- `copy-scan.cjs`: dò từ cấm và dấu hiệu văn AI trong mọi chữ người học nhìn thấy. Không cần dev server.
- `all-shots.cjs`: chụp toàn trang mọi màn hình ở 1440px và 390px. Dùng `node scripts/qa/all-shots.cjs <thư mục ra> [lọc]`.
- `scene-shot.cjs`: chụp một cảnh motion sau một chuỗi thao tác. Dùng `node scripts/qa/scene-shot.cjs <bài> <chiều rộng> <file ra> [thao tác...]`.
- `moc2-shots.cjs`: chụp bộ ảnh Mốc 2 (Theater với JOIN và GROUP BY, vài dạng bài tập, mục lục, giấy chứng nhận).
- `moc3-shots.cjs`: chụp bộ ảnh Mốc 3 (trang chủ sáng và tối, con dấu cuối chương, bài học và Theater ở giao diện tối).
- `checks.cjs`, `checks-2.cjs`, `checks-3.cjs`, `page-shots.cjs`, `theater-shots.cjs`: các script kiểm và chụp của Mốc 1.

Mọi script nhận địa chỉ gốc qua biến `BASE`, ví dụ `BASE=http://127.0.0.1:4173 node scripts/qa/crawl.cjs` để kiểm bản build đang chạy bằng `npm run preview`. Ảnh và các lượt kiểm giao diện nên chạy trên bản build, vì dev server tải CSS theo thứ tự khác.

## Trạng thái

Cả ba mốc đã xong: đủ 7 chương, engine, Query Theater, toàn bộ bài tập, giao diện tối và lượt kiểm theo danh sách ở mục 13 của `docs/PROMPT.md`.

Con số của lượt kiểm cuối, chạy ngày 21/11/2026:

- Nội dung: 33 bài học, 49 bài tập, 17 cảnh motion.
- `npm test`: 1099 test qua. `copy-scan.cjs`: 0 dòng nghi phạm trong 184 file.
- `crawl.cjs` trên 164 trang: không lỗi console, không tràn ngang.
- `axe.cjs` trên 87 trang ở hai chiều rộng, giao diện sáng và tối: 0 vi phạm.
- `checks-4.cjs`: 15 PASS. `checks-5.cjs`: 132 PASS. `sfx-check.cjs`: 18 PASS.
- `solve-all.cjs`: 81 lượt giải bài tập trong giao diện thật, tất cả PASS.
- Lighthouse mobile trên 13 trang: Performance từ 94 tới 100, Accessibility 100.
- JS tải ở lần vào đầu, tính theo gzip: trang chủ 138 KB, một bài học 159 KB.
- Trang bài tập mở thẳng tải 306 KB JS gzip, cao hơn mức 250 KB của yêu cầu. Trong đó trình soạn SQL chiếm 118 KB và tải sau khi trang đã hiện.

## Những điểm chưa kiểm được

Các điểm MySQL đã kiểm trên MySQL 8.0.46 thật (xem `docs/dialect-verification.md`). Các điểm sau cần chạy trên Oracle thật mới chốt được, vì tài liệu chính thức không nói rõ. Test liên quan mang comment `CHỜ KIỂM TÀI LIỆU`. Chi tiết ở `docs/dialect-verification.md`.

- Oracle báo mã gì cho dấu `%` (engine báo ORA-00911), cho query rỗng (ORA-00900) và cho chuỗi ngày ISO như `'2026-02-15'` (ORA-01861).
- Tiêu đề column của biểu thức không alias ở Oracle.
- Mã lỗi khi gửi hai câu lệnh liền nhau ở Oracle.
- Vế "tiêu đề kết quả in hoa" ở Oracle, và việc tool Oracle thường chờ COMMIT. Tài liệu SQL Reference xem đây là hành vi của từng tool.

Âm thanh mới được kiểm bằng đo tín hiệu (`scripts/qa/sfx-check.cjs`): cả 15 hiệu ứng có tiếng ở mức nhỏ. Chưa ai nghe bằng tai, vì môi trường dựng site không có loa.

## Nguồn và giấy phép

Lý thuyết trong bài được viết lại bằng lời của repo này, dựa trên các nguồn sau. Trang Nguồn và ghi công trên site nằm ở `/nguon`.

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

Cấu trúc dataset HR lấy theo `oracle-samples/db-sample-schemas` (giấy phép MIT).

Font tự host qua Fontsource, đều giấy phép SIL OFL 1.1: Baloo 2, Be Vietnam Pro, JetBrains Mono, Patrick Hand.

## Tài liệu trong repo

- `docs/PROMPT.md`: yêu cầu đầy đủ của dự án.
- `docs/plan.md`: kế hoạch, hướng visual và kiến trúc.
- `docs/decisions.md`: các quyết định đã chốt, kèm lý do.
- `docs/outline.md`: dàn ý khóa học và danh sách bài.
- `docs/engine.md`: SQL engine chạy được những gì.
- `docs/exercise-guide.md`: hướng dẫn soạn bài tập.
- `docs/scene-guide.md`: hướng dẫn dựng một cảnh motion.
- `docs/dialect-verification.md`: kết quả đối chiếu table dialect với tài liệu chính thức.
- `docs/screenshots/`: ảnh chụp của Mốc 1, Mốc 2 và Mốc 3.
