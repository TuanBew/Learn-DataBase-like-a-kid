# Đối chiếu độ phủ kiến thức

Đối chiếu khóa Learn Database (33 bài trong `docs/outline.md`, engine trong `docs/engine.md`) với các nguồn mở đã ghi công. Mục tiêu người học: chạy được query Oracle ở công ty. Ngày đọc nguồn: 2026-11-22.

## 1. Tóm tắt

- Khóa phủ chắc phần nền: table, key, NULL, constraint, SELECT một table, function chuỗi, ngày, gom nhóm, INNER JOIN, LEFT JOIN, subquery IN, INSERT/UPDATE/DELETE, transaction, index (khái niệm).
- Thiếu nhóm DDL sau CREATE TABLE: ALTER, DROP, TRUNCATE, và việc đọc cấu trúc table lạ (DESC, data dictionary).
- Thiếu nhóm ghép và lồng: RIGHT/FULL/CROSS JOIN, self join (engine chạy nhưng chưa dạy), UNION/MINUS, EXISTS, subquery trong FROM, CTE, view.
- Thiếu nhóm function Oracle đi làm hay gặp: TO_CHAR cho số, TO_NUMBER, DECODE, NVL2, ADD_MONTHS, MONTHS_BETWEEN, LAST_DAY, LISTAGG, window function (OVER).
- Thiếu nhóm Oracle thực tế: schema.table, data dictionary, sequence, MERGE, SAVEPOINT, GRANT, dấu (+) kiểu cũ. Engine cũng chưa chạy nhiều mục trong đó.

Ký hiệu ở mục Engine: "chạy được" nghĩa là đã thử thật theo `docs/engine.md` hoặc theo lượt thử 37 câu lệnh của phiên chính. "chưa" nghĩa là engine báo lỗi.

## 2. Đối chiếu theo chủ đề

### (a) Thiết kế và tạo table (DDL)

| Chủ đề | Nguồn dạy | Khóa hiện tại | Engine | Mức cần (Oracle đi làm) |
|---|---|---|---|---|
| table, row, column, data type | SQLBolt L16 (Creating tables); CS50 SQL tuần 0, tuần 2 (Data Types and Storage Classes) | c1-b3 | chạy được | cao: đọc table mỗi ngày |
| Entity Relationship Diagram | CS50 SQL tuần 1 (Entity Relationship Diagrams) | c2-b6 | chạy được (là hình, không phải SQL) | vừa: hay có sơ đồ tài liệu |
| primary key | CS50 SQL tuần 1 (Primary Keys) | c2-b1 | chạy được | cao: mọi JOIN dựa vào nó |
| foreign key | CS50 SQL tuần 1 (Foreign Keys) | c2-b2 | chạy được | cao: hiểu quan hệ giữa table |
| Chuẩn hóa, vì sao tách table | CS50 SQL tuần 2 (Normalizing) | c2-b3 | chạy được | vừa: đọc schema người khác |
| Quan hệ 1-nhiều | CS50 SQL tuần 1 (Relating) | c2-b2 | chạy được | cao: gặp ở mọi schema |
| Quan hệ nhiều-nhiều qua table nối | CS50 SQL tuần 2 (Relating, suy ra từ tên mục) | c6-b3 (nối order_items, chưa gọi tên) | chạy được | vừa: table nối rất phổ biến |
| NULL (khái niệm, IS NULL) | SQLBolt L8; CS50 SQL tuần 0 (NULL) | c2-b4 | chạy được | cao: gây lỗi báo cáo |
| constraint NOT NULL, UNIQUE, CHECK | CS50 SQL tuần 2 (Table Constraints, Column Constraints) | c2-b5 | chạy được | vừa: giải thích lỗi ORA-00001 |
| DEFAULT cho column (suy ra) | CS50 SQL tuần 2 (Column Constraints, DEFAULT là suy ra) | chưa dạy | chưa rõ (chưa thử) | thấp: ít tự tạo table |
| CREATE TABLE | SQLBolt L16; CS50 SQL tuần 2 (CREATE TABLE) | c2-b6 (đọc, không tự viết) | chạy được | vừa: thỉnh thoảng tạo table tạm |
| data type Oracle (NUMBER, VARCHAR2, DATE) | schema HR (oracle-samples) dùng NUMBER, VARCHAR2, CHAR, DATE | c2-b6 | chạy được | cao: đọc cấu trúc table |
| Tự tăng số (identity) | schema HR dùng CREATE SEQUENCE; Oracle 19c có GENERATED AS IDENTITY (suy ra) | c2-b6 (thẻ Oracle) | chạy được (GENERATED AS IDENTITY) | vừa: gặp khi INSERT |
| ALTER TABLE (thêm column, đổi) | SQLBolt L17; CS50 SQL tuần 2 (Altering Tables), tuần 6 (Altering Tables) | chưa dạy | chưa | vừa: DBA hay làm, dev ít |
| Thêm constraint bằng ALTER TABLE | schema HR (oracle-samples) thêm foreign key bằng ALTER TABLE | chưa dạy | chưa | thấp: đọc script cài đặt |
| DROP TABLE | SQLBolt L18 | chưa dạy | chưa | vừa: nguy hiểm, cần biết |
| TRUNCATE | (suy ra, không thấy ở nguồn đã đọc) | chưa dạy | chưa | vừa: xóa nhanh, không ROLLBACK |
| Cấu trúc table lạ: DESC / DESCRIBE | (suy ra, không thấy ở nguồn đã đọc) | chưa dạy | chưa | cao: việc đầu tiên khi gặp table |
| SHOW TABLES (MySQL) | (suy ra) | chưa dạy | chưa | thấp: lệnh của MySQL |
| Schema là gì (một "ngăn" chứa table) | CS50 SQL tuần 2 (Creating a Database Schema) | c2-b6 (nhắc ERD, chưa nói schema) | chạy được (khái niệm) | cao: tên user là schema |

### (b) Query một table

| Chủ đề | Nguồn dạy | Khóa hiện tại | Engine | Mức cần |
|---|---|---|---|---|
| SELECT column, `*` | SQLBolt L1; CS50 SQL tuần 0 (SELECT) | c3-b1 | chạy được | cao: câu nền tảng |
| Alias column (AS) | CS50 SQL tuần 0 (Aggregate Functions, có alias) | c3-b1 | chạy được | cao: báo cáo cần tên rõ |
| WHERE, so sánh | SQLBolt L2; CS50 SQL tuần 0 (WHERE) | c3-b2 | chạy được | cao: lọc row mỗi ngày |
| AND, OR, NOT | CS50 SQL tuần 0 (Compound Conditions) | c3-b2 | chạy được | cao: điều kiện ghép |
| IN, BETWEEN | SQLBolt L2; CS50 SQL tuần 0 (Ranges) | c3-b2 | chạy được | cao: lọc theo khoảng |
| LIKE, `%`, `_` | SQLBolt L3; CS50 SQL tuần 0 (LIKE) | c3-b2 | chạy được | cao: tìm theo chữ |
| IS NULL / IS NOT NULL | SQLBolt L8; CS50 SQL tuần 0 (NULL) | c2-b4, c3-b2 | chạy được | cao: lỗi phổ biến nhất |
| DISTINCT | SQLBolt L4; CS50 SQL tuần 0 (DISTINCT) | c3-b3 | chạy được | cao: loại row trùng |
| ORDER BY, ASC, DESC | SQLBolt L4; CS50 SQL tuần 0 (ORDER BY) | c3-b3 | chạy được | cao: báo cáo luôn sắp |
| NULLS FIRST / NULLS LAST | (suy ra, Oracle) | c3-b3 | chạy được | vừa: Oracle và MySQL khác |
| LIMIT, OFFSET (MySQL) | SQLBolt L4 (LIMIT, OFFSET); CS50 SQL tuần 0 (LIMIT, OFFSET) | c3-b4 | chạy được | thấp: Oracle không dùng |
| FETCH FIRST (Oracle 12c trở lên) | tài liệu Oracle (suy ra) | c3-b4 | chạy được | cao: thay LIMIT |
| ROWNUM | (suy ra, Oracle) | c3-b4 | chạy được | cao: code cũ đầy ROWNUM |
| Thứ tự query chạy thật | SQLBolt L12 | c3-b5 | chạy được | cao: hiểu lỗi alias |
| Review SELECT đơn giản | SQLBolt (mục "SQL Review: Simple SELECT Queries") | c3-e1 tới c3-boss | chạy được | vừa: luyện thêm |
| SELECT không có table, FROM DUAL | (suy ra, Oracle) | c1-b5 (chỉ nhắc) | chạy được | cao: thử function nhanh |
| Phép tính `+ - * /` | SQLBolt L9 | c4-b1 | chạy được | cao: tính tiền, thuế |
| Chia cho 0 | (suy ra) | c4-b1 | chạy được (Oracle ORA-01476) | vừa: lỗi hay gặp |
| Comment trong SQL (`--`, `/* */`) (suy ra) | chưa thấy ở nguồn đã đọc | chưa dạy | chưa rõ (chưa thử) | cao: đọc query cũ có comment |
| Dấu `;` và nhiều lệnh một lần (suy ra) | chưa thấy ở nguồn đã đọc | chưa dạy | chưa rõ (chưa thử) | vừa: tool Oracle cần |

### (c) function và biểu thức

| Chủ đề | Nguồn dạy | Khóa hiện tại | Engine | Mức cần |
|---|---|---|---|---|
| UPPER, LOWER, INITCAP | Oracle 19c SQL Ref (Character Functions: INITCAP, LOWER, UPPER) | c4-b2 | chạy được | vừa: chuẩn hóa tên |
| LENGTH, SUBSTR | Oracle 19c SQL Ref (LENGTH, SUBSTR) | c4-b2 | chạy được | cao: cắt mã, tên |
| INSTR | Oracle 19c SQL Ref (Character Functions Returning Number Values) | chưa dạy | chưa | cao: tìm vị trí chữ |
| LPAD, RPAD | Oracle 19c SQL Ref (LPAD, RPAD) | chưa dạy | chưa | vừa: đệm số 0 |
| TRIM, LTRIM, RTRIM, REPLACE | Oracle 19c SQL Ref (TRIM, LTRIM, RTRIM, REPLACE) | c4-b2 (nhắc) | chạy được | cao: dữ liệu bẩn |
| TRANSLATE, REGEXP_REPLACE, REGEXP_SUBSTR | Oracle 19c SQL Ref (Character Functions) | chưa dạy | chưa rõ (chưa thử) | thấp: chuyên sâu |
| Nối chuỗi: `\|\|` và CONCAT | Oracle 19c SQL Ref (CONCAT) | c4-b2 | chạy được | cao: ghép họ tên |
| ROUND, TRUNC, FLOOR, CEIL, MOD, ABS | Oracle 19c SQL Ref (Numeric Functions) | c4-b1, c4-b2 | chạy được | cao: làm tròn tiền |
| POWER, SQRT, SIGN (suy ra ít dùng) | Oracle 19c SQL Ref (Numeric Functions) | chưa dạy | chưa rõ (chưa thử) | thấp: ít gặp |
| SYSDATE, CURRENT_DATE | Oracle 19c SQL Ref (Datetime Functions) | c4-b3 | chạy được | cao: lọc theo hôm nay |
| TO_CHAR cho ngày | Oracle 19c SQL Ref (TO_CHAR (datetime)) | c4-b3 | chạy được | cao: định dạng báo cáo |
| TO_DATE, DATE '...' | Oracle 19c SQL Ref (TO_DATE) | c4-b3 | chạy được | cao: lọc theo ngày |
| TRUNC cho ngày | Oracle 19c SQL Ref (TRUNC (date)) | c4-b3 | chạy được | cao: bỏ phần giờ |
| EXTRACT | Oracle 19c SQL Ref (EXTRACT (datetime)) | c4-b3 | chạy được | vừa: lấy năm, tháng |
| ADD_MONTHS | Oracle 19c SQL Ref (Datetime Functions) | chưa dạy | chưa | cao: tính hạn, kỳ |
| MONTHS_BETWEEN | Oracle 19c SQL Ref (Datetime Functions) | chưa dạy | chưa | cao: tính tuổi, thâm niên |
| LAST_DAY, NEXT_DAY | Oracle 19c SQL Ref (Datetime Functions) | chưa dạy | chưa (LAST_DAY); NEXT_DAY chưa rõ | cao: báo cáo cuối tháng |
| DATE_ADD, INTERVAL (MySQL) | (suy ra) | chưa dạy | chưa | thấp: Oracle không có |
| Cộng trừ ngày (`d + 7`, `a - b`) | (suy ra, Oracle) | c4-b3 | chạy được | cao: tính ngày nhanh |
| TIMESTAMP, SYSTIMESTAMP | Oracle 19c SQL Ref (Datetime Functions) | chưa dạy | chưa rõ (chưa thử) | vừa: column log có TIMESTAMP |
| TO_NUMBER, TO_CHAR cho số | Oracle 19c SQL Ref (Conversion Functions: TO_NUMBER, TO_CHAR (number)) | chưa dạy | chưa rõ (chưa thử) | cao: định dạng tiền |
| CAST | Oracle 19c SQL Ref (Conversion Functions: CAST) | chưa dạy | chưa | vừa: đổi data type |
| NVL, COALESCE, NULLIF | Oracle 19c SQL Ref (NULL-Related Functions) | c4-b4 | chạy được | cao: thay NULL |
| NVL2 | Oracle 19c SQL Ref (NULL-Related Functions) | chưa dạy | chưa | vừa: rẽ nhánh theo NULL |
| LNNVL (suy ra ít dùng) | Oracle 19c SQL Ref (NULL-Related Functions) | chưa dạy | chưa rõ (chưa thử) | thấp: hiếm gặp |
| GREATEST, LEAST | Oracle 19c SQL Ref (General Comparison Functions) | chưa dạy | chưa | vừa: so nhiều giá trị |
| CASE WHEN | SQLBolt (không có bài riêng, suy ra từ L9) | c4-b4 | chạy được | cao: chia nhóm báo cáo |
| DECODE (Oracle) | (suy ra, Oracle; không nằm trong mục lục Single-Row đã đọc ở nhóm NULL) | chưa dạy | chưa | cao: code Oracle cũ đầy |
| USER, SYS_CONTEXT, SYS_GUID | Oracle 19c SQL Ref (Environment and Identifier Functions) | chưa dạy | chưa rõ (chưa thử) | thấp: việc của DBA |
| Chuỗi rỗng là NULL ở Oracle | (suy ra, đã có trong dàn ý) | c4-b2 | chạy được | cao: bẫy so sánh |

### (d) Gom nhóm

| Chủ đề | Nguồn dạy | Khóa hiện tại | Engine | Mức cần |
|---|---|---|---|---|
| COUNT, SUM, AVG, MIN, MAX | SQLBolt L10; CS50 SQL tuần 0 (Aggregate Functions) | c5-b1 | chạy được | cao: mọi báo cáo |
| COUNT(*) khác COUNT(column) | SQLBolt L10 (suy ra) | c5-b1 | chạy được | cao: sai số hay gặp |
| COUNT(DISTINCT) | SQLBolt L10 (suy ra) | c5-b1 | chạy được | cao: đếm khách thật |
| GROUP BY | SQLBolt L10; CS50 SQL tuần 1 (Groups) | c5-b2 | chạy được | cao: báo cáo theo nhóm |
| HAVING | SQLBolt L11; CS50 SQL tuần 1 (Groups) | c5-b3 | chạy được | cao: lọc sau khi gom |
| Lỗi ORA-00979 | (suy ra, Oracle) | c5-b2 | chạy được | cao: lỗi số một khi gom |
| ROUND với kết quả gom | CS50 SQL tuần 0 (ROUND) | c4-b1, c5-b4 | chạy được | cao: làm tròn trung bình |
| LISTAGG (nối chuỗi theo nhóm) | (suy ra, Oracle) | chưa dạy | chưa | vừa: gộp danh sách |
| GROUP_CONCAT (MySQL) | (suy ra) | chưa dạy | chưa | thấp: Oracle không có |
| ROLLUP, CUBE, GROUPING SETS (suy ra) | không thấy ở nguồn đã đọc | chưa dạy | chưa rõ (chưa thử) | vừa: tổng phụ trong báo cáo |

### (e) Nhiều table (JOIN)

| Chủ đề | Nguồn dạy | Khóa hiện tại | Engine | Mức cần |
|---|---|---|---|---|
| INNER JOIN, ON | SQLBolt L6; CS50 SQL tuần 1 (JOIN) | c6-b1 | chạy được | cao: nối table mỗi ngày |
| Alias của table | SQLBolt L6 (suy ra) | c6-b1 | chạy được | cao: viết ngắn gọn |
| LEFT JOIN | SQLBolt L7 | c6-b2 | chạy được | cao: tìm row thiếu |
| RIGHT JOIN | SQLBolt L7 | chưa dạy | chưa | vừa: gặp trong code cũ |
| FULL OUTER JOIN | SQLBolt L7 | chưa dạy | chưa | vừa: đối chiếu hai nguồn |
| Nối ba table trở lên | SQLBolt L7 (suy ra) | c6-b3 | chạy được | cao: schema thật nhiều table |
| Self join | (suy ra; HR có employees.manager_id trỏ về employees, đọc ở schema HR) | chưa dạy (engine chạy được) | chạy được | cao: nhân viên và sếp |
| CROSS JOIN | (suy ra) | chưa dạy | chưa | thấp: hiếm dùng |
| USING, NATURAL JOIN | (suy ra) | chưa dạy | chưa | thấp: nên tránh NATURAL |
| JOIN kiểu cũ bằng dấu phẩy | (suy ra, đã có trong engine.md) | c6-b1 (nhắc) | chạy được | cao: code cũ đầy |
| Nối sai ra tích Descartes | (suy ra) | chưa dạy | chạy được | cao: lỗi làm sập query |
| Nối rồi mới gom nhóm | SQLBolt L7 (suy ra) | c6-b3 | chạy được | cao: báo cáo nhiều table |
| JOIN dựa trên điều kiện khác `=` | (suy ra) | chưa dạy | chưa rõ (chưa thử) | thấp: hiếm gặp |

### (f) Subquery và ghép kết quả

| Chủ đề | Nguồn dạy | Khóa hiện tại | Engine | Mức cần |
|---|---|---|---|---|
| subquery trong IN | SQLBolt Topic: Subqueries; CS50 SQL tuần 1 (Subqueries, IN) | c6-b4 | chạy được | cao: lọc theo danh sách |
| Scalar subquery | SQLBolt Topic: Subqueries | c6-b4 | chạy được | cao: so với trung bình |
| subquery phụ thuộc query ngoài | SQLBolt Topic: Subqueries (correlated) | chưa dạy | chưa | vừa: gặp trong code cũ |
| EXISTS, NOT EXISTS | SQLBolt Topic: Subqueries (suy ra) | chưa dạy | chưa | cao: tìm row thiếu |
| NOT IN và bẫy NULL | (suy ra) | chưa dạy | chạy được (NOT IN danh sách) | cao: bẫy kinh điển |
| subquery trong FROM (inline view) | (suy ra) | chưa dạy | chưa | cao: Oracle dùng nhiều |
| subquery trong SELECT | SQLBolt Topic: Subqueries (suy ra) | c6-b4 (scalar) | chạy được (không phụ thuộc) | vừa: thay JOIN |
| UNION, UNION ALL | SQLBolt Topic: Unions, Intersections & Exceptions; CS50 SQL tuần 1 (Sets) | chưa dạy | chưa | cao: gộp hai báo cáo |
| INTERSECT | SQLBolt Topic: Unions, Intersections & Exceptions; CS50 SQL tuần 1 (Sets) | chưa dạy | chưa | vừa: tìm phần chung |
| MINUS (Oracle; EXCEPT ở chuẩn SQL) | SQLBolt Topic: Unions, Intersections & Exceptions (EXCEPT) | chưa dạy | chưa | vừa: tìm phần thiếu |

### (g) window function, CTE, view

| Chủ đề | Nguồn dạy | Khóa hiện tại | Engine | Mức cần |
|---|---|---|---|---|
| CTE (WITH) | CS50 SQL tuần 4 (Common Table Expression (CTE)) | chưa dạy | chưa | cao: query dài dễ đọc |
| window function (OVER) | CS50 SQL tuần 4 có mục "Partitioning" (nội dung chưa đối chiếu, suy ra) | chưa dạy (ngoài phạm vi CLAUDE.md) | chưa | vừa: đọc được là đủ |
| ROW_NUMBER, RANK (suy ra) | Oracle 19c SQL Ref (Analytic Functions, tên mục) | chưa dạy (ngoài phạm vi) | chưa | vừa: top N theo nhóm |
| CREATE VIEW | CS50 SQL tuần 4 (Views, Simplifying, Aggregating, Securing) | chưa dạy | chưa | cao: công ty có sẵn view |
| Đọc dữ liệu từ view như table | CS50 SQL tuần 4 (Views) | chưa dạy | chưa | cao: báo cáo lấy từ view |
| Soft deletion (đánh dấu xóa, không xóa) | CS50 SQL tuần 3 và tuần 4 (Soft Deletions) | chưa dạy | chưa rõ (chưa thử) | vừa: gặp ở dữ liệu thật |
| Trigger | CS50 SQL tuần 3 (Triggers, Creating a "Sell" Trigger) | chưa dạy | chưa | thấp: dev viết, ít đọc |
| Stored procedure | CS50 SQL tuần 6 (Stored Procedures) | chưa dạy | chưa | vừa: công ty dùng PL/SQL |
| CONNECT BY (truy hồi cây) | Oracle 19c SQL Ref (Single-Row Functions nhắc CONNECT BY) | chưa dạy | chưa | vừa: cây sếp và nhân viên |

### (h) Sửa dữ liệu và transaction

| Chủ đề | Nguồn dạy | Khóa hiện tại | Engine | Mức cần |
|---|---|---|---|---|
| INSERT một row | SQLBolt L13; CS50 SQL tuần 3 (Inserting Data) | c7-b1 | chạy được | cao: nhập dữ liệu |
| INSERT nhiều row | CS50 SQL tuần 3 (Inserting Multiple Rows) | c7-b1 (nhắc dialect) | chạy được (MySQL) | vừa: Oracle 19c không có |
| INSERT ... SELECT | (suy ra) | chưa dạy | chưa rõ (chưa thử) | cao: sao chép dữ liệu |
| UPDATE | SQLBolt L14; CS50 SQL tuần 3 (Updating Data) | c7-b1 | chạy được | cao: sửa dữ liệu |
| DELETE | SQLBolt L15; CS50 SQL tuần 3 (Deleting Data) | c7-b1 | chạy được | cao: xóa dữ liệu |
| UPDATE, DELETE thiếu WHERE | (suy ra) | c7-b1 | chạy được | cao: lỗi tốn kém nhất |
| Lỗi constraint khi ghi | CS50 SQL tuần 3 (Other Constraints) | c2-b5, c7-b1 | chạy được | cao: đọc mã ORA-02291 |
| transaction, COMMIT, ROLLBACK | CS50 SQL tuần 5 (Transactions) | c7-b2 | chạy được | cao: Oracle chờ COMMIT |
| SAVEPOINT | (suy ra) | chưa dạy | chưa | thấp: ít dùng |
| Race condition, concurrency | CS50 SQL tuần 5 (Concurrency, Race Conditions) | c1-b2 (nhắc nhiều người ghi) | chạy được (khái niệm) | vừa: hiểu lock, chờ nhau |
| DDL tự COMMIT ở Oracle | (suy ra, đã có trong dàn ý) | c2-b6 (thẻ Oracle) | chạy được | vừa: bẫy khi thử DDL |
| MERGE (upsert) | (suy ra, Oracle) | chưa dạy | chưa | cao: ETL Oracle hay dùng |
| Sao lưu dữ liệu trước khi sửa (CREATE TABLE AS SELECT) | (suy ra) | chưa dạy | chưa rõ (chưa thử) | vừa: an toàn khi sửa |

### (i) index, hiệu năng, quyền

| Chủ đề | Nguồn dạy | Khóa hiện tại | Engine | Mức cần |
|---|---|---|---|---|
| index (khái niệm) | CS50 SQL tuần 5 (Index) | c7-b3 | chạy được (cảnh minh họa) | vừa: biết vì sao query chậm |
| CREATE INDEX | CS50 SQL tuần 5 (Index); schema HR có CREATE INDEX | chưa dạy | chưa | thấp: DBA tạo |
| index nhiều table, đánh đổi dung lượng và thời gian | CS50 SQL tuần 5 (Index across Multiple Tables, Space Trade-off, Time Trade-off) | c7-b3 (chỉ nhắc ghi chậm hơn) | chạy được (khái niệm) | thấp: ít tự quyết |
| Partial index | CS50 SQL tuần 5 (Partial Index) | chưa dạy | chưa | thấp: không có ở Oracle chuẩn (suy ra) |
| Đọc kế hoạch chạy (EXPLAIN) | (suy ra; ngoài phạm vi CLAUDE.md) | chưa dạy | chưa | vừa: nhờ DBA đọc |
| Query chậm: lọc sớm, tránh `SELECT *` (suy ra) | (suy ra; CLAUDE.md không dạy tối ưu) | chưa dạy | chưa rõ (chưa thử) | cao: tránh làm sập server |
| Scaling: MySQL, PostgreSQL | CS50 SQL tuần 6 (MySQL, PostgreSQL, Scaling with MySQL) | c1-b4 (chỉ nhắc tên) | chạy được (khái niệm) | thấp: khóa tập trung Oracle |
| Quyền truy cập, GRANT | CS50 SQL tuần 6 (Access Controls) | chưa dạy | chưa | vừa: lỗi thiếu quyền hay gặp |
| SQL injection | CS50 SQL tuần 6 (SQL Injection Attacks) | chưa dạy | chưa rõ (chưa thử) | vừa: nếu viết app |
| VACUUM (SQLite) | CS50 SQL tuần 5 (Vacuum) | chưa dạy | chưa | thấp: không dùng Oracle |

### (j) Riêng cho Oracle khi đi làm

| Chủ đề | Nguồn dạy | Khóa hiện tại | Engine | Mức cần |
|---|---|---|---|---|
| DUAL | Oracle 19c (suy ra) | c1-b5 (chỉ nhắc) | chạy được | cao: thử function nhanh |
| ROWNUM và bẫy ORDER BY | Oracle 19c (suy ra) | c3-b4 | chạy được | cao: code cũ đầy |
| NVL | Oracle 19c SQL Ref (NULL-Related Functions) | c4-b4 | chạy được | cao: thay NULL |
| DECODE | Oracle 19c (suy ra) | chưa dạy | chưa | cao: code cũ đầy |
| TO_CHAR / TO_DATE | Oracle 19c SQL Ref (Conversion Functions) | c4-b3 | chạy được | cao: ngày và số |
| Data dictionary (USER_TABLES, ALL_TAB_COLUMNS, USER_TAB_COLUMNS) | (suy ra; không thấy ở nguồn đã đọc) | chưa dạy | chưa | cao: tra table và column |
| Tên đầy đủ schema.table | schema HR (oracle-samples): schema tên HR, table employees | chưa dạy (c7-b5 dùng hr) | chưa rõ (chưa thử) | cao: table của team khác |
| Đọc table của schema khác cần quyền | (suy ra) | chưa dạy | chưa rõ (chưa thử) | cao: lỗi ORA-00942 |
| Sequence (CREATE SEQUENCE, NEXTVAL) | schema HR (oracle-samples): locations_seq, departments_seq, employees_seq | chưa dạy | chưa | cao: tạo mã khi INSERT |
| MERGE | (suy ra, Oracle) | chưa dạy | chưa | cao: upsert dữ liệu |
| Dấu (+) nối ngoài kiểu cũ | (suy ra, Oracle) | chưa dạy | chưa rõ (chưa thử) | cao: đọc code từ thời 9i |
| Chuỗi rỗng là NULL | (suy ra, đã có trong dàn ý) | c4-b2 | chạy được | cao: bẫy so sánh |
| ROWID (suy ra) | Oracle 19c SQL Ref (Conversion Functions có ROWIDTOCHAR, tên mục) | chưa dạy | chưa rõ (chưa thử) | thấp: ít cần |
| Pseudocolumn (ROWNUM, SYSDATE, LEVEL) | Oracle 19c SQL Ref (Functions: Pseudocolumns) | c3-b4 (ROWNUM) | chạy được (ROWNUM) | vừa: LEVEL cho cây |
| Mã lỗi ORA- thường gặp | (suy ra; có trong c7-b4) | c7-b4 | chạy được | cao: đọc lỗi nhanh |
| Dùng SQL Developer, SQL*Plus (client Oracle) (suy ra) | không thấy ở nguồn đã đọc | chưa dạy | chưa áp dụng (không phải SQL) | cao: công cụ hằng ngày |
| PL/SQL: khối BEGIN...END (suy ra) | Oracle (suy ra) | chưa dạy (ngoài phạm vi) | chưa | vừa: đọc script có sẵn |
| Schema HR: 7 table | schema HR (oracle-samples): regions, countries, locations, departments, jobs, employees, job_history | c7-b5 (dùng hr) | chạy được (hr trong dữ liệu mẫu) | cao: schema học chuẩn Oracle |

## 3. Chi tiết schema HR (đọc từ `hr_create.sql`)

| Table | Column chính | Quan hệ |
|---|---|---|
| regions | region_id, region_name | countries.region_id trỏ về regions |
| countries | country_id (primary key), country_name, region_id | locations.country_id trỏ về countries |
| locations | location_id, street_address, postal_code, city, state_province, country_id | departments.location_id trỏ về locations |
| departments | department_id, department_name, manager_id, location_id | manager_id trỏ về employees |
| jobs | job_id, job_title, min_salary, max_salary | employees.job_id và job_history.job_id trỏ về jobs |
| employees | employee_id, first_name, last_name, email, phone_number, hire_date, job_id, salary, commission_pct, manager_id, department_id | manager_id trỏ về chính employees (self join); department_id trỏ về departments |
| job_history | employee_id, start_date, end_date, job_id, department_id | trỏ về employees, jobs, departments; CHECK end_date > start_date |

Script HR cũng tạo: 3 sequence (locations_seq, departments_seq, employees_seq), view emp_details_view, và 10 index. Khóa dùng `hr` ở c7-b5; chưa có bài nào dạy self join hay view trên HR.

## 4. Link đã đọc

Đọc được:

- https://sqlbolt.com (trang chủ có danh sách bài: Lesson 1 tới 4, mục Review, Lesson 6 tới 18, Lesson X, và hai Topic: Subqueries, Unions Intersections & Exceptions. Không có Lesson 5, trang ghi là Review.)
- https://sqlbolt.com/topic/subqueries (chỉ kiểm có tải được; nội dung chi tiết lấy từ tên mục)
- https://cs50.harvard.edu/sql/ và các trang tuần 0 tới 6 (`/sql/2024/weeks/N/`)
- https://cs50.harvard.edu/sql/notes/0/ tới `/6/` (đọc tiêu đề mục của từng bài giảng, lấy danh sách chủ đề)
- https://raw.githubusercontent.com/oracle-samples/db-sample-schemas/main/human_resources/hr_create.sql
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Functions.html (mục lục chương Functions)
- https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Single-Row-Functions.html (danh sách function theo nhóm: numeric, character, datetime, conversion, NULL-related, general comparison)

Không đọc được:

- Khan Academy Intro to SQL (https://www.khanacademy.org/computing/computer-programming/sql): trang trả về màn thử thách JavaScript, không có tên unit hay bài. Không ghi chủ đề nào từ nguồn này.
- Oracle Dev Gym "Databases for Developers: Foundations" (https://devgym.oracle.com/devgym/database-for-developers.html): trả về lỗi 403. Không ghi chủ đề nào từ nguồn này.
- Stanford (Jennifer Widom), thử cs.stanford.edu/people/widom, edx.org, online.stanford.edu, coursera.org: không kết nối được. Không ghi chủ đề nào từ nguồn này.
- Các trang con Oracle Datetime-Functions.html, Conversion-Functions.html... trả về 404. Danh sách function lấy từ trang Single-Row-Functions đã đọc.

Ghi chú về cách đọc: số bài SQLBolt lấy từ tên trên trang chủ. Tên mục CS50 lấy từ tiêu đề trong notes. Chỗ ghi "(suy ra)" là hiểu biết chung, chưa thấy ở trang đã đọc. Mục "Mức cần" là đánh giá của người soạn, không phải số liệu từ nguồn.
