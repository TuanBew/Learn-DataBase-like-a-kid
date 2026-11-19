# Learn DataBase like a kid

Website tĩnh dạy database và SQL cho người chưa biết gì về IT. Yêu cầu đầy đủ nằm ở `docs/PROMPT.md`. Mỗi khi bắt đầu một phần mới, đọc lại mục liên quan trong file đó. Các quyết định đã chốt nằm ở `docs/decisions.md`, kế hoạch và hướng visual ở `docs/plan.md`.

## Luật viết chữ trên site (không được quên)

- Người học là người lớn không biết IT. Dạy từng bước nhỏ, ví dụ đời thường. Không nói ngọng, không chê, không mỉa.
- Mascot tên Bi (một chú robot database), xưng "mình", gọi người học là "bạn". Giữ cặp này trên toàn site.
- Lý thuyết theo STE: mỗi câu một ý, câu chủ động, câu lý thuyết dưới 20 chữ, câu hướng dẫn dưới 15 chữ và ở dạng mệnh lệnh ("Bấm Chạy"). Điều kiện đặt trước hành động. Mỗi từ một nghĩa: nút chạy query luôn gọi là "Chạy".
- Vào thẳng ý. Không "Hãy cùng tìm hiểu", "Dưới đây là", "Tóm lại", "Hy vọng". Không "không chỉ X mà còn Y", "không phải X mà là Y". Không bộ ba cho tròn. Không câu châm ngôn chốt đoạn. Không gạch ngang dài nối ý. In đậm rất ít.
- Tránh từ sáo: đóng vai trò quan trọng, then chốt, hành trình, khám phá, nâng tầm, chìa khóa, mở ra cánh cửa, một cách hiệu quả, trải nghiệm liền mạch, vô cùng, cực kỳ.
- Không văn dịch: tránh "được... bởi", "Điều này cho phép", "việc", "sự", "một cách", "tiến hành". Không mở câu bằng "Điều này", "Nó".
- Thuật ngữ giữ nguyên tiếng Anh. Lần đầu xuất hiện: in đậm, một câu nói nó dùng để làm gì, gắn glossary popover. Không chêm ngoặc kiểu "khóa chính (primary key)".

### Từ cấm (dùng từ tiếng Anh ở cột trái)

| Viết | Cấm viết |
|---|---|
| database | cơ sở dữ liệu |
| DBMS | hệ quản trị cơ sở dữ liệu |
| table | bảng |
| row | hàng, dòng, bản ghi |
| column | cột, trường |
| primary key | khóa chính |
| foreign key | khóa ngoại |
| index | chỉ mục, chỉ số |
| query | truy vấn |
| schema | lược đồ |
| constraint | ràng buộc |
| transaction | giao dịch (từ đời thường "giao dịch ngân hàng" vẫn dùng được) |
| clause | mệnh đề |
| data type | kiểu dữ liệu |
| limit, ceiling | trần |

Luật áp cho mọi kiểu dịch tương tự. Cũng giữ tiếng Anh: function, JOIN, subquery, COMMIT, ROLLBACK, client, server, dialect, và mọi từ khóa SQL.

## Góp ý của chủ dự án sau Mốc 1 (đã chốt)

- Tên hiện trên site là "Learn Database". "Learn DataBase like a kid" chỉ là tên repo, không đưa lên giao diện.
- Mascot là Bi, một chú robot database, nét sáng và thân thiện. Không quay lại hạt trân châu.
- Trang chủ dạy database trước: ứng dụng quanh ta, dữ liệu đi đâu, bên trong database có gì. SQL và Query Theater chỉ xuất hiện sau, và không có nút nào ở đầu trang dẫn thẳng vào bài tập.
- Bài tập chỉ đến sau lý thuyết của chương đó. Không mời người học làm bài tập khi chưa học.
- Tiêu đề trang chủ "Hãy khám phá xem làm việc với database như thế nào" do chủ dự án chọn. Giữ nguyên, không sửa theo luật từ sáo.

## Phạm vi

- Hiểu database trước, SQL sau, sửa dữ liệu ở cuối. MySQL 8 để học nền, Oracle 19c cho công việc.
- Không dạy thống kê, window function, tối ưu query. Không chia theo ngày, không streak.
- Web tĩnh: Vite, React, TypeScript. Không backend, không đăng nhập. Engine SQL tự viết ở `src/engine`, không đưa sql.js lên web.
- Animation trong Query Theater chỉ dựng từ trace của engine.
- Âm thanh chỉ là hiệu ứng Web Audio, không giọng đọc.
- Lần tải đầu dưới 250 KB JS gzip. Lighthouse mobile: Performance từ 90, Accessibility từ 95.
- Nội dung bài học nằm ở `src/content`, tách khỏi component.

## Các mốc dừng

- Mốc 1: kế hoạch, engine SELECT/WHERE/ORDER BY/LIMIT/FETCH FIRST có test, bài đầu Chương 1, một bài tập Chương 3 có Query Theater ở cả hai dialect, screenshot 1440px và 390px. Dừng chờ duyệt.
- Mốc 2: hết engine, đủ chương và bài tập. Gặp quyết định lớn thì hỏi.
- Mốc 3: đánh bóng, kiểm theo danh sách "Chỉ được báo xong khi" ở mục 13 của `docs/PROMPT.md`, hướng dẫn deploy Vercel.
- Chỉ hỏi khi quyết định không đảo ngược được hoặc phải đổi phạm vi. Việc khác tự quyết và ghi vào `docs/decisions.md`. Commit nhỏ.

## Chia việc (mục 14)

- Phiên chính (Fable) chỉ làm: kiến trúc, lõi engine (parser, executor, trace), Query Theater, cảnh motion chính, design token và component nền, duyệt mẫu kết quả subagent, quyết định khó.
- Giao subagent Sonnet: dữ liệu mẫu, nháp nội dung bài, bài tập theo khuôn, test bảng dialect và tra tài liệu, glossary, trang phụ, README, chạy build/test/Lighthouse/screenshot, quét từ cấm, component đơn giản, sửa lint.
- Subagent có sẵn trong `.claude/agents/`: `content-writer`, `exercise-author`, `test-writer`, `data-author`, `qa-runner`, `copy-checker`. Tất cả `model: sonnet`.
- Gọi subagent tạm bằng Agent tool thì luôn truyền `model: "sonnet"`. Dùng subagent Fable phải ghi lý do vào `docs/decisions.md`.
- Lời giao việc: mục tiêu, đường dẫn file, luật cần theo, tiêu chí xong. Yêu cầu trả tóm tắt dưới 200 chữ kèm danh sách file đã đổi.
- Không kéo log dài hay file lớn vào phiên chính.

## Lệnh

- `npm run dev`, `npm run build`, `npm test`, `npm run lint` (tsc).
- Nhánh làm việc: `claude/exciting-feynman-avsqfd`.
