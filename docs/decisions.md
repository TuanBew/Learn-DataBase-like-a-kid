# Các quyết định đã chốt

Mỗi dòng: quyết định, rồi lý do. Quyết định mới ghi xuống cuối.

## Công cụ và thư viện

- **Animation dùng Motion** (gói `motion`, giấy phép MIT). Lý do: tree shaking được qua `LazyMotion`, và có layout animation cho lúc các clause tự xếp lại.
- **Sân khấu của Theater không dùng layout animation.** Mỗi row có vị trí tính sẵn từ khung hình rồi animate bằng transform. Lý do: lùi và tới cho ra đúng một cảnh, chạy nhẹ trên điện thoại, và chế độ reduced motion chỉ cần tắt transition.
- **Router dùng wouter** thay cho react-router. Lý do: nhỏ hơn nhiều, site chỉ có vài route.
- **Font tự viết `@font-face`** trỏ vào file của `@fontsource`, chỉ lấy bộ latin và vietnamese. Lý do: không kéo các bộ chữ khác vào `dist`.
- **Skill đã cài vào `.claude/skills`:** `frontend-design` và `webapp-testing` từ `anthropics/skills` (Apache 2.0). Không cài MCP server nào: Playwright và Chromium có sẵn trong môi trường nên gọi thẳng bằng script trong `scripts/qa`.

## Engine

- **Tên table không phân biệt hoa thường ở cả hai dialect.** MySQL trên Linux mặc định có phân biệt, nhưng người học sẽ làm việc với Oracle, và phân biệt ở đây chỉ gây lỗi khó hiểu.
- **MySQL so sánh chuỗi bằng cách bỏ dấu và hạ chữ thường** (chuẩn hóa NFD), mô phỏng `utf8mb4_0900_ai_ci`. Chữ `đ` không tách dấu được nên engine coi `đ` khác `d`. Điểm này chưa kiểm được với tài liệu chính thức.
- **Số tiền hiện có dấu chấm ngăn nghìn** (25.000) ở mọi nơi trên site, theo ví dụ "giá 25.000 < 30.000" trong yêu cầu. Luật: số nguyên từ 10.000, hoặc số tròn 500 từ 1.000. Mã như 1001 và năm 2026 giữ nguyên. Tool SQL thật hiện 25000, bài học ở Mốc 2 sẽ nói rõ điều này một lần.
- **Phần engine chưa có ở Mốc 1** (GROUP BY, JOIN, aggregate, subquery, INSERT, UPDATE, DELETE) báo "sẽ có ở các chương sau", không crash.
- **Oracle: so sánh ngày với chuỗi báo ORA-01861.** Lý do: Oracle không tự hiểu chuỗi `'2026-02-01'` với định dạng ngày mặc định. Người học sẽ gặp đúng lỗi này ở công ty, nên engine báo lỗi thay vì âm thầm chạy.
- **Đáp án sai hay gặp được nhận ra bằng kết quả**, không bằng cách so chữ của query. Engine chạy từng đáp án sai đã khai báo và so kết quả với kết quả của người học.

## Kiểm bảng dialect với tài liệu chính thức

Kết quả đầy đủ, kèm link và câu trích, nằm ở `docs/dialect-verification.md`. Bảng ở mục 7 của `docs/PROMPT.md` giữ nguyên vì đó là bản lưu yêu cầu. Engine và bài học làm theo các chỉnh sửa dưới đây.

- 13 trong 17 dòng của bảng đúng với tài liệu. Không tìm thấy chỗ nào engine Mốc 1 lệch tài liệu.
- **Nối chuỗi:** bổ sung hai ý. `CONCAT` của MySQL ra NULL nếu có một tham số NULL. Ở Oracle, nối một chuỗi với NULL ra chính chuỗi đó.
- **Tên table và column:** câu "MySQL giữ như lúc viết" chưa đủ. Tên column và alias của column không phân biệt hoa thường. Tên table có phân biệt hay không tùy hệ điều hành và `lower_case_table_names`.
- **Lưu thay đổi:** tài liệu Oracle không nói tool nào chờ COMMIT, đó là hành vi của từng tool. Tài liệu có nói lệnh DDL như CREATE TABLE tự COMMIT ngầm. Bài về CREATE TABLE ở Mốc 2 sẽ ghi ý này.
- **So sánh chữ:** nói rõ đây là collation mặc định của MySQL 8 (`utf8mb4_0900_ai_ci`, NO PAD), đổi được bằng COLLATE. Oracle mặc định so sánh binary.
- **Chưa kiểm được vì tài liệu không nói rõ:** `đ` có bằng `d` ở `utf8mb4_0900_ai_ci` không; tiêu đề column của một biểu thức không có alias; Oracle báo mã gì cho dấu `%`, cho query rỗng và cho hai câu lệnh liền nhau; MySQL báo gì cho hai câu lệnh liền nhau. Các test liên quan vẫn mang comment `CHỜ KIỂM TÀI LIỆU`. Muốn chốt cần chạy trên MySQL và Oracle thật, ví dụ Oracle FreeSQL.

## Mạng và cách đọc nguồn

- Session chạy trong môi trường `learn-database-like-a-kid`, đã mở mạng tới các host của tài liệu và nguồn lý thuyết ở mục 11.
- Trong sandbox này công cụ WebFetch không phân giải được DNS. Subagent đọc nguồn bằng `curl` thường qua proxy của session, không đổi User-Agent.
- Bài 1 đã đối chiếu với CS50 SQL Lecture 0 và bài blog của GitHub. Một câu ở thẻ "Ngoài đời" đã sửa cho đúng mức bài blog viết.

## Tốc độ tải

- **React chỉ vẽ lần đầu sau khi chunk của route đang mở đã tải xong.** Lý do: nếu vẽ khung chờ trước, React hoãn hiện nội dung thêm khoảng 300ms, và Lighthouse tính LCP của trang bài tập lên hơn 4 giây.
- **CodeMirror là chunk riêng, gọi sau khi đề bài đã hiện.** Trong lúc chờ, chỗ của editor hiện sẵn câu query khởi đầu.

## Chia việc

- Chưa dùng subagent Fable nào. Mọi subagent đều chạy Sonnet.

## Góp ý sau Mốc 1

- **Tên trên site đổi thành "Learn Database".** Chủ dự án không muốn đưa tên repo lên giao diện.
- **Mascot đổi từ hạt trân châu Châu sang robot Bi.** Chủ dự án thấy mascot cũ đáng sợ và muốn một hình có nét công nghệ. Bi có thân là khối trụ database và đầu là màn hình sáng. Bi vẫn là người giữ kho, tức hình ảnh của DBMS.
- **Trang chủ dạy database trước.** Cảnh đầu trang không còn là query. Cảnh mới: chạm vào một ứng dụng, dữ liệu chạy qua server vào database và thành một row. Dưới đó là cảnh table, row, column, rồi mới tới một dải ngắn nói về SQL. Nút "Thử Query Theater" ở đầu trang đã bỏ.
- **Bài tập mẫu của Chương 3 chỉ còn nằm trong mục lục**, ở cuối Chương 3, với nhãn "Xem trước". Từ Mốc 2, bài tập luôn đứng sau lý thuyết của chương.
- **Tiêu đề trang chủ dùng đúng câu chủ dự án đưa.** Trong câu mô tả, chữ "truy vấn" được thay bằng "query" để khớp với luật thuật ngữ của chính dự án. Nếu chủ dự án muốn giữ "truy vấn" thì sửa một chỗ ở `src/content/ui-app.ts`.

