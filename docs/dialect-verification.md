# Kiểm tra bảng dialect với tài liệu chính thức

Ngày: 2026-11-19. Trạng thái: **chưa kiểm được dòng nào**.

Lần thử lại (cùng ngày): WebFetch tới `dev.mysql.com` và `docs.oracle.com` vẫn lỗi `getaddrinfo ENOTFOUND`, nên chưa đọc được trang nào. Hai host chưa nằm trong danh sách mạng cho phép của session này.

Lý do: sandbox không phân giải được `dev.mysql.com` và `docs.oracle.com` (lỗi `getaddrinfo ENOTFOUND`, host nằm ngoài danh sách mạng cho phép). WebSearch chỉ trả danh sách link và một bản tóm tắt thứ cấp, không có nguyên văn. Theo luật của việc này, không điền từ trí nhớ. Cần cho phép hai host trên trong cài đặt mạng của session rồi chạy lại.

Ghi chú duy nhất từ WebSearch (tóm tắt thứ cấp, chưa đọc nguyên văn): utf8mb4_0900_ai_ci là mặc định của MySQL 8.0, không phân biệt hoa thường và dấu, và có PAD_ATTRIBUTE là NO PAD.

## Bảng

| Chủ đề | Kết luận | Hành vi theo tài liệu | Link |
|---|---|---|---|
| Lấy n row đầu (LIMIT / FETCH FIRST / OFFSET) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Nối chuỗi (CONCAT, `||`, CONCAT 2 tham số ở Oracle 19c) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Thay NULL (IFNULL, NVL, COALESCE) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Ngày giờ hiện tại (NOW, CURDATE, SYSDATE, CURRENT_DATE) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Định dạng ngày (DATE_FORMAT, TO_CHAR) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Chuỗi thành ngày (STR_TO_DATE, TO_DATE, DATE literal) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| SELECT không cần table (FROM DUAL, ORA-00923) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Chuỗi rỗng ('' và NULL) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| So sánh chữ (collation, hoa thường, dấu) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Dấu nháy (nháy đơn, nháy kép, backtick) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Tên table và column (hoa thường, tiêu đề kết quả) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Alias của table (AS ở Oracle) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| NULL khi sắp xếp tăng dần (NULLS FIRST/LAST) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| data type hay gặp (INT, NUMBER, VARCHAR2...) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Tự tăng id (AUTO_INCREMENT, IDENTITY) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Lưu thay đổi (autocommit, COMMIT) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |
| Mã lỗi hay gặp (1064, 1146, 1054, ORA-*) | chưa kiểm được | chưa có nguyên văn | cần mở dev.mysql.com/doc/refman/8.0/en/ và docs.oracle.com/en/database/oracle/oracle-database/19/ |

## Chi tiết cho engine

Cả 14 câu hỏi: **chưa kiểm được**, vì cùng lý do chặn mạng ở trên. Các trang cần đọc:

1. MySQL charset-unicode-sets, charset-binary-collations, string-comparison-functions (câu 1)
2. MySQL problems-with-null, select (câu 2, 7, 10)
3. MySQL server-error-reference (câu 3)
4. Oracle Error Messages 19c, ORA-00900 đến ORA-01799 (câu 4, 5)
5. Oracle SQL Language Reference 19c: SELECT, row_limiting_clause, Database Object Names and Qualifiers, Nulls, Arithmetic (câu 5, 6, 12, 13, 14)
6. MySQL 8.0: Operators, Arithmetic Functions, lower_case_table_names, sql-mode PIPES_AS_CONCAT (câu 8, 11, 14)
7. Oracle 23ai SQL Language Reference, SELECT (câu 9)
