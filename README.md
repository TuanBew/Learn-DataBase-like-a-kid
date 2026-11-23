# Learn Database

Website tĩnh dạy database và SQL cho người lớn chưa biết gì về IT, đặc biệt là người phải chạy query Oracle ở công ty. Mascot Bi dẫn người học đi từng bước nhỏ. Khóa học dạy hiểu database trước, SQL sau, sửa dữ liệu ở cuối. MySQL 8 dùng để học nền, Oracle 19c dùng cho công việc.

"Learn DataBase like a kid" chỉ là tên repo. Giao diện luôn hiện tên "Learn Database".

## Có gì trong site

- 83 bài học xếp theo dàn ý 12 chương (`docs/outline-v2.md`), khoảng 21 giờ học. Id bài cũ và mới nằm ở `docs/id-map-v2.md`.
- 104 bài tập, gồm 11 bài boss.
- Database công ty 11 table (Chương 7 trở đi), kèm sơ đồ. Nút "Xem sơ đồ" mở sơ đồ ở mọi bài dùng database này. Cảnh "Tìm đường nối" ở bài c7-b1 cho bạn chọn hai table và đếm số điều kiện nối.
- Trang Tra cứu (`/tra-cuu`): 127 mục function và từ khóa. Gõ tên để tìm, đổi giữa MySQL và Oracle, bấm Chạy để thấy ví dụ chạy thật. Mỗi mục trỏ về bài dạy nó.
- Chương 9 dạy window function ở mức dùng cho báo cáo (xếp hạng, top N mỗi nhóm, cộng dồn, LAG, LEAD) và VIEW.
- Chương 10 dạy sửa dữ liệu an toàn: UPDATE và DELETE theo table khác, transaction, SAVEPOINT, lock, sao lưu bằng CREATE TABLE AS SELECT, MERGE, và sáu bước sửa dữ liệu ở công ty.
- Chương 11 là Oracle ở công ty: tool và kết nối, schema và user, data dictionary, quyền, index, ngày giờ, và chỗ MySQL khác Oracle.
- Xưởng dựng table ở Chương 3: gõ lệnh CREATE TABLE hoặc ALTER, bấm Chạy, rồi xem cấu trúc table hiện ra. Các bài dựng table lưu kết quả thành "Database của bạn" trong trình duyệt, và bài sau làm tiếp trên đó. Làm lại một bài đã xong thì database được dựng lại về trạng thái trước bài, không ghi đè.
- 18 cảnh motion minh họa từng khái niệm.
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
5. Chọn nhánh production. Repo hiện chỉ có một nhánh là `claude/exciting-feynman-avsqfd`, nên Vercel tự lấy nhánh này.
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

Mốc 4 đã xong cả bốn đợt: 12 chương, 83 bài học, 104 bài tập, trang Tra cứu, xưởng dựng table, database công ty với sơ đồ, window function và VIEW, sửa dữ liệu an toàn, Oracle ở công ty. Ba mốc đầu đã xong từ trước: engine, Query Theater, giao diện tối và lượt kiểm theo mục 13 của `docs/PROMPT.md`.

Lượt hoàn thiện ngày 23/11/2026 gồm các việc sau:

- Dialect Oracle đã đối chiếu với Oracle XE 21c và 18c thật (Docker). 19c không tải được nếu thiếu tài khoản Oracle, nên điểm nào hai bản cho cùng kết quả thì coi 19c cũng vậy. Engine sửa khoảng 15 chỗ lệch. Chi tiết ở `docs/dialect-verification.md`.
- Query Theater diễn trọn query nhiều phần: UNION, INTERSECT, MINUS và EXCEPT, subquery trong FROM, WITH, window function. Mỗi phần là một "màn" có chip riêng.
- Trang Tra cứu có 127 mục trong 12 nhóm.
- Đọc soát từng câu của 142 file nội dung, sửa 40 chỗ. Soi 575 mảnh ảnh của 124 trang và sửa các lỗi bố cục. Code gập dòng có thụt treo, số trong table kết quả định dạng theo cả column, khung "Database của bạn" có chiều cao giới hạn.

Con số của lượt kiểm cuối, chạy ngày 23/11/2026:

- Nội dung: 83 bài học, 104 bài tập (11 bài boss), 18 cảnh motion, 127 mục Tra cứu.
- `tsc --noEmit`: sạch. `npm test`: 3057 test qua, 2 bỏ qua. `copy-scan.cjs`: 0 dòng nghi phạm trong 322 file.
- `crawl.cjs` trên 374 lượt mở trang (187 trang, hai chiều rộng): không lỗi console, không tràn ngang, 0 trang có vấn đề.
- `axe.cjs` trên 193 trang ở hai chiều rộng, giao diện sáng và tối: 0 vi phạm.
- `checks-4.cjs`: 15 PASS. `checks-5.cjs`: 168 PASS. `sfx-check.cjs`: 18 PASS.
- `solve-all.cjs`: 182 lượt giải bài tập trong giao diện thật (kể cả bài dựng table), tất cả PASS.
- Lighthouse mobile trên 6 trang (`/`, `/bai/c3-b8`, `/bai/c9-b3`, `/tap/c8-e5`, `/tap/c9-e4`, `/tra-cuu`): Performance từ 92 tới 99, Accessibility 100 ở cả sáu trang. Trang thấp nhất là `/tap/c9-e4` (92, TBT 351 ms), vì trình soạn SQL tải sau khi trang hiện. Một lượt đo trước đó ra 78 và 89 cho `/tap/c8-e5` và `/tap/c9-e4` khi máy đang chạy tiến trình khác; đo lại trên máy rảnh cho 96 và 92.
- Kiểm tay bằng Playwright: Theater với INTERSECT (MySQL) và MINUS (Oracle), gõ nhiều dòng có thụt lề vào editor, định dạng số, hộp sơ đồ, khung "Database của bạn" cuộn bằng bàn phím, giao diện tối, Tra cứu, phát lại Theater ở 2x cho bài window function và WITH: tất cả PASS.

Con số của lượt kiểm sau Đợt 1 (22/11/2026), để so:

- `npm test`: 1621 test. `crawl.cjs`: 204 lượt. `axe.cjs`: 107 trang. `checks-5.cjs`: 136 PASS. `solve-all.cjs`: 98 lượt.
- Lighthouse mobile trên 4 trang: Performance từ 97 tới 100, Accessibility 100. Trang chủ có một lượt đo 86 khi máy đang bận, hai lượt đo lại cho 99 và 100.
- Trang bài tập mở thẳng tải hơn 250 KB JS gzip vì trình soạn SQL (122 KB gzip), tải sau khi trang đã hiện.

## Những điểm chưa kiểm được

MySQL đã kiểm trên MySQL 8.0.46 thật, Oracle trên XE 21c và 18c thật (xem `docs/dialect-verification.md`). Chưa có Oracle 19c, nên điểm nào chỉ khác giữa các bản thì đọc theo tài liệu 19c. Phần còn lại:

- Tiêu đề kết quả in hoa ở Oracle và việc tool Oracle thường chờ COMMIT là hành vi của từng tool, SQL Reference không nói rõ.
- Một số vế còn mang comment `CHỜ KIỂM TÀI LIỆU` trong test của engine. Danh sách nằm ở `docs/dialect-verification.md`.

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
