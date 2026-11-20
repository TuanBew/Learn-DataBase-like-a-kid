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
- **Tiêu đề và câu mô tả ở trang chủ dùng đúng câu chủ dự án đưa** (bản chốt lần hai): "Hãy cùng nhau hiểu rõ Database và SQL nào!" và "Khóa học này sẽ giúp bạn hiểu rõ hơn về kiến trúc hệ thống Database và học cách viết SQL query." Hai câu này nằm ở `src/content/ui-app.ts` và không sửa theo luật viết.

## Mốc 2

- **Engine có hai lối vào.** `run()` chỉ chạy SELECT và dùng cho Query Theater. `createSession()` giữ một bản sao của database và chạy được INSERT, UPDATE, DELETE, COMMIT, ROLLBACK, CREATE TABLE. Lý do: bài tập và Playground thường chỉ cần SELECT, và người học không vô tình sửa dữ liệu của bài.
- **Session theo đúng luật lưu của từng dialect.** MySQL tự COMMIT sau mỗi lệnh, trừ khi đã gõ START TRANSACTION. Oracle giữ thay đổi tới khi COMMIT. CREATE TABLE tự COMMIT.
- **Bài học, bài tập, cảnh motion và glossary tự nhận theo file** (`import.meta.glob`). Thêm một file là có thêm một mục, không sửa danh mục.
- **Bài tập gắn vào bài học qua `src/content/exercise-map/`.** Mỗi bài học có 1 tới 3 bài tập, hiện ở cuối bài. Mục lục chỉ dẫn tới bài học và ghi số bài tập đã làm. Lý do: chủ dự án muốn bài tập luôn đứng sau lý thuyết.
- **Tám dạng bài tập:** write, fill, order, predict, debug, translate, rehearsal, quiz. Hai chương đầu chủ yếu dùng quiz và predict, vì người học chưa viết SQL.
- **Bài tập chỉ dùng kiến thức đã dạy.** Lượt đọc soát tìm ra ba bài phạm luật này (INSERT ở Chương 2, phép tính ở bài đầu Chương 3, CREATE TABLE ở bài primary key) và ba bài đã được viết lại. Hai bài báo cáo ở cuối Chương 5 có JOIN viết sẵn, vì bài học `c5-b4` đã giới thiệu khung JOIN đó.
- **Query Theater chuyển sang chế độ gọn khi table có hơn 24 row:** vẽ 10 row đầu và gom phần còn lại thành một khối có số đếm.
- **Cảnh motion dùng dữ liệu rút gọn của riêng cảnh.** Ví dụ cảnh foreign key có 4 khách và 5 đơn. Cảnh diễn tập UPDATE, DELETE và cảnh giỏ transaction chạy bằng engine thật trên một bản sao của `products`.
- **Cảnh diễn tập cho ROLLBACK cứu dữ liệu** dù bài đó dạy trước bài transaction. Session của cảnh mở sẵn một transaction, và Bi nói rõ bài sau dạy kỹ lệnh này. Bài tập diễn tập thì theo đúng dialect: ở MySQL, quên WHERE là đã tự lưu.
- **Cuộc đua index đếm số lần so của tìm kiếm nhị phân** (7, 14, 20 lần cho 100, 10.000, 1.000.000 row). Index thật của DBMS là B-tree, số lần so cùng cỡ. Thời gian chạy trên màn hình là thời gian minh họa, con số mới là số thật.
- **Giấy chứng nhận mở khi xong 33 bài học và 7 bài boss.** Trước đó trang hiện bản xem trước và số bài còn thiếu. Giấy vẽ bằng Canvas, tải về dạng PNG.
- **Trang cắt phần tràn ngang ở `#main`.** Lý do: giấy vụn ăn mừng bay quá mép phải làm trang điện thoại trượt ngang 14px.
- **Chia việc ở Mốc 2:** phiên chính làm engine, Theater, tám cảnh motion còn lại, khung trang và duyệt. Subagent Sonnet viết nháp các bài học, soạn 49 bài tập, dữ liệu HR và bản 200 đơn, test engine, trang phụ, giấy chứng nhận, soát chữ và chạy QA. Lượt soát chữ đầu chỉ quét bằng grep, nên có thêm hai lượt đọc từng câu. Chưa dùng subagent Fable nào.
- **Trang đã tải sẵn thì vẽ thẳng, không qua `lazy()` của React.** Lý do: `lazy()` luôn hiện khung chờ ở lần vẽ đầu và giữ khung đó khoảng 300ms, kể cả khi chunk đã có. Nội dung chính vì thế hiện muộn, và Lighthouse mobile của trang bài học tụt còn 74 tới 89. `App.tsx` có hàm `page()` bọc từng trang, `useLoad` có thêm `preload()` để lần vẽ đầu có ngay bài học hoặc bài tập. Sau khi sửa, sáu trang đo lại đạt 99 tới 100.
- **Trang chủ và phần lõi của Motion tách khỏi chunk chính.** JS tải lần đầu còn khoảng 88 KB gzip. Animation tải ngay sau lần vẽ đầu.
- **Chân trang nằm trong cùng khung chờ với nội dung, và `#main` cao ít nhất một màn hình.** Lý do: chân trang hiện trước rồi bị nội dung đẩy xuống làm CLS lên 0,25.

## Mốc 3

- **Làm việc trong một git worktree** (`.claude/worktrees/`, đã cho git bỏ qua) theo yêu cầu của chủ dự án. Commit vẫn đẩy lên nhánh `claude/exciting-feynman-avsqfd`.
- **Bài tập tiếp theo chỉ nằm trong cùng bài học.** Thẻ làm đúng trước đây dẫn sang bài tập kế tiếp của chương, tức là có thể nhảy sang bài tập của một bài học chưa học. Giờ hết bài tập của bài học thì thẻ dẫn về bài học, và trang bài tập có link về bài học ở đầu trang.
- **Chương xong khi mọi bài học của chương đã xong**, không kể học theo thứ tự nào. Lúc đó cuối bài hiện con dấu bút đỏ "Chương n, Xong", bảy chấm chương và tiếng ăn mừng của chương.
- **Trang chủ có nút Học tiếp cho người quay lại.** Nút dẫn tới bài học đầu tiên chưa xong, không bao giờ dẫn thẳng vào bài tập. Người mới vẫn thấy nút vào bài đầu tiên.
- **Bài xếp clause nhận cả bấm lẫn kéo thả.** Kéo thả dùng chuột trên máy tính. Bấm vẫn là cách chính trên điện thoại và bàn phím.
- **Bước JOIN của Theater chỉ ghi nhãn cho row không khớp hoặc khớp nhiều row.** Row khớp đúng một row chỉ có dấu tích. Lý do: trên màn hình 390px, nhãn ở mọi row đè lên dữ liệu.
- **Một tên cho một nút:** nút chạy query là "Chạy" ở mọi nơi (kể cả bài đoán kết quả và trang tra cứu dialect), nút làm lại là "Làm lại".
- **"Chữ trống" và "chuỗi rỗng" là một.** Chương 2 dùng "chữ trống" vì người học chưa biết từ "chuỗi". Bài function chuỗi ở Chương 4 giới thiệu "chuỗi rỗng" và nói rõ đó là chữ trống đã gặp.
- **Lời báo lỗi ngày của Oracle nói đúng nguyên nhân:** Oracle đọc chuỗi ngày theo một dạng mặc định, và chuỗi dạng 2026-03-08 không khớp dạng đó. Câu cũ "Oracle không tự đổi chuỗi thành ngày" chưa đúng.
- **Mỗi trang có tiêu đề tab riêng** (tên bài học, tên bài tập, tên trang), để lịch sử và dấu trang dễ nhận ra.
- **Có script quét chữ** `scripts/qa/copy-scan.cjs`: dò từ cấm và dấu hiệu văn AI trong mọi chuỗi người học nhìn thấy, có danh sách cụm đời thường hợp lệ. Script chỉ là lưới đỡ sau các lượt đọc từng câu.
- **Có giao diện tối kiểu "bảng đen, phấn màu".** Yêu cầu ghi dark mode là không bắt buộc. Màu của site đã nằm gần hết ở token, nên giao diện tối chỉ cần một bộ token thứ hai: nền là mặt bảng xanh đậm, chữ và viền là phấn trắng, các khối tô phấn màu đậm để chữ vẫn đọc rõ. Khoảng 55 chỗ màu viết cứng trong CSS và SVG đã chuyển về token.
- **Giao diện tối chỉ bật bằng công tắc ở đầu trang, và site nhớ lựa chọn** (`ldb:theme`). Site không tự bật theo cài đặt của máy. Lý do: giao diện sáng là bản chủ dự án đã duyệt, nên nó là mặc định cho mọi người.
- **Giấy chứng nhận luôn vẽ trên nền giấy sáng**, kể cả khi site đang ở giao diện tối, vì đó là một tờ giấy để tải về.
- **Kiểm accessibility bằng axe-core trên mọi trang** (`scripts/qa/axe.cjs`, 87 trang ở hai chiều rộng), ngoài Lighthouse trên trang mẫu. Lượt đầu tìm ra bốn loại lỗi và cả bốn đã sửa: một cặp màu chữ phụ thiếu tương phản, vai trò ARIA sai ở cảnh mổ xẻ table, khối code cuộn ngang không nhận focus bàn phím.
- **Âm thanh được kiểm bằng đo tín hiệu** (`scripts/qa/sfx-check.cjs`): cả 15 hiệu ứng có tiếng, biên độ đỉnh từ 0,05 tới 0,20, không tạo AudioContext trước lần chạm đầu, tắt tiếng thì im hẳn. Chưa ai nghe bằng tai, vì môi trường dựng site không có loa.
