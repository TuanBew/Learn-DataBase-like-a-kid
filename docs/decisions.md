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

## Việc chưa làm được và lý do

- **Chưa kiểm được bảng dialect với tài liệu chính thức.** Mạng của session chặn `dev.mysql.com` và `docs.oracle.com` (và cả `cs50.harvard.edu`, `github.blog`). `docs/dialect-verification.md` ghi rõ từng dòng đang ở trạng thái "chưa kiểm được". Engine Mốc 1 viết theo hiểu biết sẵn có; test nào cần kiểm lại có comment `CHỜ KIỂM TÀI LIỆU`.
- **Bài 1 chưa đối chiếu được với CS50 SQL và bài blog của GitHub** vì cùng lý do. Thẻ "Ngoài đời" chỉ viết đúng ý đã được kiểm sẵn trong yêu cầu.

## Chia việc

- Chưa dùng subagent Fable nào. Mọi subagent đều chạy Sonnet.
