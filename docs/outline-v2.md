# Dàn ý khóa học, bản mở rộng (v2)

Trạng thái: bản nháp chờ chủ dự án duyệt. Chưa bài nào trong danh sách mới được dựng lên site.

## Vì sao phải mở rộng

Góp ý của chủ dự án ngày 22/11/2026:

1. Khóa hiện tại chỉ dạy đọc một câu CREATE TABLE. Người học chưa từng tự tạo table, nên chưa hiểu table từ gốc.
2. Database ở công ty có rất nhiều table. Khóa hiện tại dừng ở nối ba table.
3. Kiến thức query còn thiếu nhiều. Người học gõ thử một function là gặp ngay "khóa học chưa dạy tới".

Mình đã thử 37 câu lệnh trên engine. Các nhóm sau chưa chạy được: ALTER, DROP, TRUNCATE, VIEW, RIGHT JOIN, FULL JOIN, CROSS JOIN, UNION, EXISTS, subquery trong FROM, subquery phụ thuộc, WITH, window function, CAST, MERGE, và khoảng 20 function hay dùng (INSTR, LPAD, DECODE, NVL2, ADD_MONTHS, MONTHS_BETWEEN, LISTAGG...). Danh sách đối chiếu đầy đủ với các nguồn mở nằm ở `docs/coverage-audit.md`.

## Khóa mới khác khóa cũ ở đâu

| | Khóa hiện tại | Bản v2 |
|---|---|---|
| Số bài học | 33 | 83 |
| Số chương | 7 | 12, chia 6 phần |
| Thời gian học | 4 tới 6 giờ | khoảng 20 tới 25 giờ |
| Tạo table | chỉ đọc hiểu | tự viết từ tờ giấy trắng, 10 bài |
| Database để luyện | tiệm trà sữa 6 table | tiệm trà sữa, database tự dựng 5 table, database công ty 11 table |
| Nối table | 3 bài | 9 bài, tới 5 table một query |
| Function | khoảng 35 | khoảng 70, có trang tra cứu gõ tên là ra |
| Dạng bài tập | viết query, đoán kết quả, xếp clause, quiz, diễn tập | thêm: dựng table, sửa query lỗi, đọc query của người khác |

## Năm điểm mới đáng kể

1. **"Database của bạn".** Ở Phần 2, người học tự dựng database của một công ty nhỏ, từng table một. Database này nằm lại trong trình duyệt. Các chương sau có bài tập chạy trên chính các table người học đã tạo.
2. **Database công ty 11 table.** Từ Phần 4, bài tập chạy trên một database giống nơi làm việc: 7 table nhân sự theo schema HR của Oracle và 4 table bán hàng, nối với nhau qua nhân viên bán hàng. Mọi bài tập có nút mở sơ đồ để tra đường nối.
3. **Trang Tra cứu.** Gõ `length` hay `nvl` là ra: function làm gì, MySQL viết sao, Oracle viết sao, kèm một ví dụ bấm Chạy được.
4. **Ba dạng bài tập sát công việc.** Dựng table theo đề. Sửa một query đang lỗi hoặc ra sai số. Đọc một query dài của người khác và nói nó làm gì.
5. **Một chương riêng cho Oracle ở công ty.** Tìm table trong database lạ, tên đầy đủ `HR.EMPLOYEES`, quyền, lock, mã lỗi ORA, quy trình sửa dữ liệu an toàn.

## Ba điểm đổi so với luật cũ, cần chủ dự án đồng ý

1. **INSERT xuất hiện sớm.** Luật cũ: sửa dữ liệu ở cuối. Bản v2: INSERT nằm ở Phần 2, vì tạo table xong phải có dữ liệu. UPDATE, DELETE và transaction vẫn ở gần cuối.
2. **Có window function.** Luật cũ không dạy. Bản v2 dạy ở mức dùng được cho báo cáo: xếp hạng, top N mỗi nhóm, cộng dồn. Thống kê vẫn không dạy.
3. **Có một bài về query chậm.** Luật cũ không dạy tối ưu. Bản v2 chỉ dạy nhận biết và vài thói quen tốt, không đi sâu.

Giới hạn 250 KB JS đã được chủ dự án bỏ.

## Khung chương và bài

Ký hiệu: (giữ) là bài đã có, (sửa) là bài đã có cần viết thêm, (mới) là bài mới.

### Phần 1. Hiểu database

**Chương 1. Database là gì** (5 bài, giữ nguyên)

1. Dữ liệu ở quanh ta (giữ)
2. Excel và database (giữ)
3. table, row, column (giữ)
4. DBMS và SQL (giữ)
5. client, server và câu SELECT đầu tiên (giữ)

**Chương 2. Table được thiết kế ra sao** (7 bài)

1. primary key (giữ)
2. foreign key (giữ)
3. Vì sao phải tách table (giữ)
4. Ba kiểu quan hệ: một với một, một với nhiều, nhiều với nhiều (mới)
5. NULL (giữ)
6. constraint (giữ)
7. Đọc ERD của một database (sửa: bỏ phần CREATE TABLE, chuyển sang Chương 3)

### Phần 2. Tự tay dựng database

**Chương 3. Tạo table từ A đến Z** (10 bài, mới toàn bộ)

1. Từ tờ ghi chép tới bản thiết kế
2. Chọn data type cho từng column
3. Câu CREATE TABLE đầu tiên
4. primary key và mã tự tăng
5. Đặt luật ngay lúc tạo: NOT NULL, UNIQUE, CHECK, DEFAULT
6. Table thứ hai và foreign key
7. Quan hệ nhiều với nhiều: table trung gian
8. Đưa dữ liệu vào bằng INSERT
9. Sửa cấu trúc bằng ALTER TABLE
10. DROP, TRUNCATE, và xem lại database của mình

Dự án chương: dựng "database của bạn" cho công ty Sao Mai, 5 table: `departments`, `employees`, `projects`, `assignments`, `leave_requests`.

### Phần 3. Lấy dữ liệu từ một table

**Chương 4. Query một table** (7 bài)

1. SELECT và FROM (giữ)
2. WHERE: so sánh, AND, OR, NOT (sửa: tách từ bài WHERE cũ)
3. WHERE: IN, BETWEEN, LIKE, IS NULL (sửa: tách từ bài WHERE cũ)
4. ORDER BY và DISTINCT (giữ)
5. LIMIT, FETCH FIRST và ROWNUM (giữ)
6. Thứ tự query chạy thật (giữ)
7. Viết query cho dễ đọc: xuống dòng, alias, comment (mới)

**Chương 5. Function và biểu thức** (8 bài)

1. Phép tính và function số (sửa)
2. function chuỗi cơ bản (giữ)
3. function chuỗi nâng cao: TRIM, REPLACE, INSTR, LPAD (mới)
4. Ngày giờ: lấy, định dạng, đổi chuỗi thành ngày (giữ)
5. Ngày giờ: cộng trừ, khoảng cách, đầu tháng, cuối tháng (mới)
6. Đổi data type: TO_CHAR, TO_NUMBER, CAST, và đổi ngầm (mới)
7. Xử lý NULL: NVL, NVL2, COALESCE, IFNULL, NULLIF (sửa)
8. CASE WHEN và DECODE (sửa)

**Chương 6. Gom nhóm và báo cáo** (7 bài)

1. COUNT, SUM, AVG, MIN, MAX (giữ)
2. GROUP BY (giữ)
3. GROUP BY nhiều column và theo tháng (mới)
4. HAVING (giữ)
5. Đếm có điều kiện và xoay ngang bằng CASE (mới)
6. Gộp chữ trong nhóm và dòng tổng cộng: LISTAGG, GROUP_CONCAT, ROLLUP (mới)
7. Báo cáo doanh thu (giữ)

### Phần 4. Làm việc với nhiều table

**Chương 7. Nối table** (9 bài)

1. Đọc một database lạ: tìm đường nối giữa hai table (mới)
2. INNER JOIN (giữ)
3. LEFT JOIN và cách tìm thứ không có (giữ)
4. RIGHT JOIN và FULL OUTER JOIN (mới)
5. Nối ba, bốn, năm table (sửa)
6. Self join: nhân viên và người quản lý (mới)
7. Nối theo nhiều điều kiện, nối theo khoảng, CROSS JOIN (mới)
8. Bẫy nhân bội row: nối xong SUM ra số quá lớn (mới)
9. Đọc code Oracle cũ: dấu phẩy, dấu (+), USING, NATURAL JOIN (mới)

**Chương 8. Subquery và ghép kết quả** (7 bài)

1. subquery trả một giá trị (sửa)
2. subquery trả một danh sách: IN, NOT IN và bẫy NULL (sửa)
3. subquery trong FROM: gom trước, nối sau (mới)
4. subquery phụ thuộc query bên ngoài (mới)
5. EXISTS và NOT EXISTS (mới)
6. UNION, UNION ALL, INTERSECT, MINUS (mới)
7. WITH: đặt tên cho từng bước của query (mới)

**Chương 9. Báo cáo nâng cao** (5 bài, mới toàn bộ)

1. Window function: tính trên nhóm mà vẫn giữ từng row
2. Xếp hạng: ROW_NUMBER, RANK, DENSE_RANK
3. Top N của mỗi nhóm
4. Cộng dồn và so với kỳ trước: SUM OVER, LAG, LEAD
5. VIEW: một query có tên

### Phần 5. Sửa dữ liệu an toàn

**Chương 10. Sửa dữ liệu** (7 bài)

1. INSERT, UPDATE, DELETE (giữ)
2. UPDATE và DELETE dựa vào table khác (mới)
3. transaction, COMMIT, ROLLBACK, SAVEPOINT (sửa)
4. Hai người cùng sửa một row: lock và query bị treo (mới)
5. Sao lưu trước khi sửa: CREATE TABLE AS SELECT (mới)
6. Có thì sửa, chưa có thì thêm: MERGE và ON DUPLICATE KEY UPDATE (mới)
7. Sáu bước sửa dữ liệu ở công ty (mới)

### Phần 6. Đi làm với Oracle

**Chương 11. Oracle ở công ty** (8 bài)

1. Tool và kết nối: SQL Developer, DBeaver, worksheet, nút COMMIT (mới)
2. schema, user và tên đầy đủ `HR.EMPLOYEES` (mới)
3. Tìm table và column trong database lạ: data dictionary, DESC (mới)
4. Quyền: vì sao mình chỉ đọc được (mới)
5. index và query chậm (sửa)
6. Ngày giờ ở Oracle thật: DATE có giờ, định dạng mặc định, so ngày cho đúng (mới)
7. MySQL và Oracle khác nhau ở đâu, mã lỗi ORA hay gặp (giữ)
8. Đọc một query dài của người khác (mới)

**Chương 12. Dự án cuối** (3 nhiệm vụ, mới)

1. Báo cáo nhân sự trên database công ty
2. Báo cáo bán hàng theo tháng, có xếp hạng
3. Đối soát và sửa dữ liệu lỗi, có transaction

## Chi tiết từng bài

(Phần này do subagent soạn theo khung ở trên.)
