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

Cách đọc: id bài mới đánh số theo thứ tự trong khung (c3-b1 là bài đầu của Chương 3 mới). Bài (giữ) và (sửa) ghi id cũ trong ngoặc. Mục Nguồn theo `docs/coverage-audit.md`: "(suy ra)" nghĩa là chưa thấy ở nguồn đã đọc, người viết bài phải tra tài liệu MySQL 8 hoặc Oracle 19c trước khi dựng. Chỗ ghi "(cần kiểm tài liệu)" là chỗ người soạn chưa chắc. Bài tập ghi id `c<N>-e<số>` và `c<N>-boss`.

### Chương 1. Database là gì

Học xong chương này, bạn làm được:

- Kể ra database đang giữ dữ liệu gì sau một cú chạm trên app đặt trà sữa.
- Chỉ ra table, row, column và data type trong một danh sách bất kỳ.
- Bấm Chạy câu SELECT đầu tiên và đọc được kết quả.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c1-b1 | Dữ liệu ở quanh ta | Bấm từng cửa tiệm trên phố và bấm đặt đơn trên điện thoại để thấy dữ liệu đi đâu | (bài cũ c1-b1) | giống nhau | CS50 SQL tuần 0 |
| c1-b2 | Excel và database | Cảnh Excel và database: bấm cho nhiều người cùng ghi một ô | Ba khác biệt: nhiều người ghi cùng lúc, có luật giữ dữ liệu đúng, dữ liệu rất lớn. Excel vẫn tốt cho việc nhỏ. (bài cũ c1-b2) | giống nhau | CS50 SQL tuần 0 |
| c1-b3 | table, row, column | Cảnh giải phẫu table: bấm vào row, column, ô để xem tên gọi | table, row, column, ô. data type cơ bản: số, chữ, ngày. Mỗi column một data type. (bài cũ c1-b3) | giống nhau | CS50 SQL tuần 0, 2 |
| c1-b4 | DBMS và SQL | Cảnh kho hàng: bấm gửi yêu cầu cho người giữ kho | DBMS là người giữ kho. MySQL, Oracle, PostgreSQL là DBMS. SQL là ngôn ngữ nói với DBMS. Mỗi DBMS nói hơi khác: dialect. (bài cũ c1-b4) | giống nhau, chỉ giới thiệu dialect | CS50 SQL tuần 0 |
| c1-b5 | client, server và câu SELECT đầu tiên | Cảnh client và server, rồi khối thử tay chạy `SELECT * FROM products;` | client gửi, server nhận, DBMS trả kết quả. Bấm Chạy câu SELECT đầu tiên. (bài cũ c1-b5) | Oracle cần `FROM DUAL` khi không có table: chỉ nhắc | CS50 SQL tuần 0 |

Bài tập của chương 1:

- `c1-e1` (quiz): Chọn thứ nào nên nằm trong database, thứ nào nên nằm trong Excel. Database: tiệm trà sữa.
- `c1-e2` (quiz): Gọi tên đúng cho phần được tô sáng: table, row, column hay ô. Database: tiệm trà sữa.
- `c1-e3` (xếp clause): Xếp các bước từ lúc bấm đặt đơn tới lúc app báo thành công. Database: tiệm trà sữa.
- `c1-e4` (quiz): Ghép mỗi từ MySQL, Oracle, SQL, DBMS với việc nó làm. Database: tiệm trà sữa.
- `c1-e5` (đoán kết quả): Đoán `SELECT * FROM stores;` ra bao nhiêu row, bao nhiêu column. Database: tiệm trà sữa.
- `c1-e6` (viết query): Chạy `SELECT * FROM staff;` rồi đếm số nhân viên. Database: tiệm trà sữa.
- `c1-boss` (quiz): Mười câu hỏi ôn cả chương, có ảnh minh họa. Database: tiệm trà sữa.

### Chương 2. Table được thiết kế ra sao

Học xong chương này, bạn làm được:

- Chỉ ra primary key và foreign key của mỗi table trong một sơ đồ.
- Phân loại quan hệ giữa hai table: một với một, một với nhiều, nhiều với nhiều.
- Giải thích vì sao một ô NULL khác số 0 và khác chuỗi rỗng.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c2-b1 | primary key | Cảnh thử thêm row trùng mã và row bỏ trống mã, xem database chặn | Mỗi row một mã riêng, không trùng, không trống. Ví dụ số báo danh. (bài cũ c2-b1) | giống nhau | CS50 SQL tuần 1, 2 |
| c2-b2 | foreign key | Cảnh sợi dây nối đơn hàng với khách, thử xóa khách đang có đơn | foreign key trỏ sang primary key của table khác. Một khách nhiều đơn. Xóa row đang có row khác trỏ tới thì bị chặn. (bài cũ c2-b2) | giống nhau | CS50 SQL tuần 1 |
| c2-b3 | Vì sao phải tách table | Cảnh sửa tên một khách chép ở nhiều chỗ, rồi tách table | Một thông tin chép nhiều chỗ thì sửa một chỗ sẽ sai chỗ khác. Tách table, nối lại bằng key. (bài cũ c2-b3) | giống nhau | CS50 SQL tuần 1, 2 |
| c2-b4 | Ba kiểu quan hệ: một với một, một với nhiều, nhiều với nhiều | Kéo dây nối giữa các table của công ty Sao Mai và chọn kiểu quan hệ, cảnh báo đúng sai ngay | Một với một: nhân viên và thẻ ra vào. Một với nhiều: phòng ban và nhân viên. Nhiều với nhiều: nhân viên và dự án. foreign key nằm ở bên "nhiều". Nhiều với nhiều luôn cần table trung gian ở giữa. | giống nhau | CS50 SQL tuần 1, 2 |
| c2-b5 | NULL | Cảnh hộp NULL: so sánh ô trống với 0 và với chuỗi rỗng | NULL là "chưa có thông tin". Khác 0, khác chuỗi rỗng. So sánh với NULL không ra đúng cũng không ra sai. Dùng IS NULL. (bài cũ c2-b4) | Oracle coi chuỗi rỗng là NULL, MySQL thì không | SQLBolt L8, CS50 SQL tuần 0 |
| c2-b6 | constraint | Cảnh cổng constraint: thử đưa row hợp lệ và row phạm luật qua cổng | NOT NULL, UNIQUE, CHECK. primary key và foreign key cũng là constraint. Database từ chối row phạm luật. (bài cũ c2-b5) | giống nhau về ý. Mã lỗi khác: 1062 và ORA-00001 | CS50 SQL tuần 2 |
| c2-b7 | Đọc ERD của một database | Cảnh sơ đồ ERD 6 table: bấm vào đường nối để thấy hai column được nối | Đọc ký hiệu ERD: hộp là table, đường là quan hệ, chân chim là "nhiều". Tìm primary key và foreign key trên sơ đồ. Đọc đường đi từ khách tới món đã mua. Bỏ phần CREATE TABLE (chuyển sang Chương 3). (bài cũ c2-b6, sửa) | giống nhau | CS50 SQL tuần 1 |

Bài tập của chương 2:

- `c2-e1` (quiz): Chọn column nào làm primary key cho table nhân viên. Database: tiệm trà sữa.
- `c2-e2` (đọc query): Đọc sơ đồ ERD, nói column nào là foreign key của `orders`. Database: tiệm trà sữa.
- `c2-e3` (quiz): Phân loại quan hệ cho sáu cặp đời thường: nhân viên và phòng ban, sinh viên và môn học. Database: database của bạn.
- `c2-e4` (đoán kết quả): Đoán kết quả khi xóa một khách đang có đơn. Database: tiệm trà sữa.
- `c2-e5` (đoán kết quả): `WHERE phone = NULL` ra mấy row, vì sao. Database: tiệm trà sữa.
- `c2-e6` (xếp clause): Xếp các bước tách một table "đơn hàng chép tên khách" thành hai table. Database: tiệm trà sữa.
- `c2-boss` (diễn tập): Đọc ERD của công ty Sao Mai, tìm mọi foreign key và gọi tên kiểu quan hệ của từng cặp. Database: database của bạn.

### Chương 3. Tạo table từ A đến Z

Học xong chương này, bạn làm được:

- Viết một câu CREATE TABLE có primary key và ba constraint.
- Tạo nhiều table nối với nhau bằng foreign key, đúng thứ tự.
- Sửa cấu trúc table bằng ALTER TABLE, xóa bằng DROP hoặc TRUNCATE mà biết hậu quả.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c3-b1 | Từ tờ ghi chép tới bản thiết kế | Xưởng dựng table, bước phác: kéo các mục trên tờ ghi nghỉ phép vào table và column | Một tờ ghi chép lẫn nhiều thứ, mỗi loại thành một table. Mỗi table có một primary key. Viết bản thiết kế dạng `employees(employee_id, first_name)`. Đặt tên chữ thường, gạch dưới, table dùng số nhiều. | Oracle đổi tên không có nháy thành chữ hoa; MySQL giữ nguyên | CS50 SQL tuần 1, 2 |
| c3-b2 | Chọn data type cho từng column | Khối thử tay: kéo mỗi column vào một ô data type, thấy giá trị mẫu hợp hay không | Số nguyên, số có phần lẻ `DECIMAL(12,2)`, chữ `VARCHAR(50)`, ngày. Số điện thoại là chữ vì có số 0 đầu. Lương là số, không phải chữ. | MySQL: INT, DECIMAL, VARCHAR, DATE, DATETIME. Oracle: NUMBER, VARCHAR2, DATE (có giờ), TIMESTAMP. Oracle 19c không có BOOLEAN trong table, dùng `CHAR(1)`. VARCHAR2 mặc định đếm byte, tiếng Việt có dấu tốn thêm byte (cần kiểm tài liệu) | CS50 SQL tuần 2, SQLBolt L16 |
| c3-b3 | Câu CREATE TABLE đầu tiên | Xưởng dựng table: ghép các khối thành câu `CREATE TABLE departments (...)`, bấm Chạy, thấy table hiện trong sơ đồ | Cú pháp `CREATE TABLE departments (department_id INT, department_name VARCHAR(50));`. Dấu phẩy giữa các column, không có dấu phẩy sau column cuối. Tạo lại table đã có thì lỗi. Kiểm tra bằng `SELECT * FROM departments;` ra 0 row. | Oracle viết `NUMBER(4)`, `VARCHAR2(50)`. Tạo trùng tên: 1050 và ORA-00955. DDL ở Oracle tự COMMIT | CS50 SQL tuần 2, SQLBolt L16 |
| c3-b4 | primary key và mã tự tăng | Xưởng dựng table: thêm PRIMARY KEY, chèn hai row xem mã tăng, chèn trùng mã xem lỗi | `department_id INT PRIMARY KEY`. Primary key ghép: `PRIMARY KEY (a, b)`. Mã tự tăng để database tự cấp mã. Chèn trùng thì lỗi, và mã đã cấp không được cấp lại. | MySQL: `AUTO_INCREMENT`. Oracle: `GENERATED BY DEFAULT AS IDENTITY`, hoặc SEQUENCE với `emp_seq.NEXTVAL` | CS50 SQL tuần 1, 2; schema HR (SEQUENCE) |
| c3-b5 | Đặt luật ngay lúc tạo: NOT NULL, UNIQUE, CHECK, DEFAULT | Xưởng dựng table: bật tắt từng constraint rồi chèn row hợp lệ và phạm luật | `NOT NULL`, `UNIQUE`, `CHECK (salary > 0)`, `DEFAULT 'active'`. Đặt tên constraint: `CONSTRAINT ck_salary CHECK (...)` để đọc lỗi dễ. DEFAULT chỉ dùng khi INSERT bỏ qua column. | Oracle viết DEFAULT trước constraint trong định nghĩa column. MySQL 8 chặn CHECK từ bản 8.0.16. Mã lỗi: 3819 và ORA-02290 | CS50 SQL tuần 2 |
| c3-b6 | Table thứ hai và foreign key | Xưởng dựng table: tạo `employees` có `department_id`, nối foreign key tới `departments`, thử chèn nhân viên thuộc phòng không tồn tại | Tạo table cha trước, table con sau. `FOREIGN KEY (department_id) REFERENCES departments(department_id)`. Column foreign key cùng data type với primary key. Foreign key trỏ về chính table: `manager_id` trỏ `employee_id`. Mã lỗi 1452 và ORA-02291. | Mã lỗi khác nhau. `ON DELETE CASCADE` có ở cả hai, nhắc và cảnh báo | CS50 SQL tuần 1, 2 |
| c3-b7 | Quan hệ nhiều với nhiều: table trung gian | Xưởng dựng table: dựng `projects` rồi `assignments` nối `employees` với `projects` | Một nhân viên nhiều dự án, một dự án nhiều nhân viên. `assignments` có hai foreign key. `PRIMARY KEY (employee_id, project_id)` chặn gán trùng. Thêm column riêng của quan hệ: `role`, `hours_per_week`. | giống nhau | CS50 SQL tuần 2 |
| c3-b8 | Đưa dữ liệu vào bằng INSERT | Khối thử tay: chèn dữ liệu vào 5 table theo đúng thứ tự | `INSERT INTO departments (department_id, department_name) VALUES (10, 'Kế toán');`. Luôn ghi tên column. Chèn table cha trước. Ô bỏ trống nhận NULL hoặc DEFAULT. | MySQL: nhiều row một câu. Oracle 19c: mỗi câu một row (ORA-00933). Ngày: `'2026-03-02'` ở MySQL, `DATE '2026-03-02'` ở Oracle. Oracle cần COMMIT | SQLBolt L13, CS50 SQL tuần 3 |
| c3-b9 | Sửa cấu trúc bằng ALTER TABLE | Xưởng dựng table: thêm column `phone`, đổi độ dài, đổi tên, xóa column | `ALTER TABLE employees ADD phone VARCHAR(20);`. Column mới nhận NULL ở row cũ. Thêm constraint sau: `ADD CONSTRAINT`. Giảm độ dài khi dữ liệu cũ dài hơn thì lỗi. | MySQL: `ADD COLUMN`, `MODIFY COLUMN`. Oracle: `ADD (phone VARCHAR2(20))`, `MODIFY (...)`. `RENAME COLUMN a TO b` có ở cả hai | SQLBolt L17, CS50 SQL tuần 2, 6 |
| c3-b10 | DROP, TRUNCATE, và xem lại database của mình | Xưởng dựng table: xem danh sách table và cấu trúc, TRUNCATE rồi thử ROLLBACK, DROP table cha khi còn foreign key | DROP xóa cả table. TRUNCATE xóa hết row, giữ cấu trúc, không ROLLBACK được. DELETE khác TRUNCATE: có WHERE, ROLLBACK được. Xóa table cha khi còn table con trỏ tới thì bị chặn. | MySQL xem bằng `SHOW TABLES`, `DESCRIBE`, `SHOW CREATE TABLE`. Oracle xem bằng `USER_TABLES`, `USER_TAB_COLUMNS`, `USER_CONSTRAINTS`. `DESC` là lệnh của tool, không phải SQL. MySQL có `DROP TABLE IF EXISTS`, Oracle 19c không. Oracle: `DROP TABLE ... CASCADE CONSTRAINTS` | SQLBolt L18; tài liệu MySQL 8, Oracle 19c |

Dự án chương: dựng "database của bạn" cho công ty Sao Mai, 5 table.

Bài tập của chương 3:

- `c3-e1` (dựng table): Tạo `departments` đúng cấu trúc đề cho. Database: database của bạn.
- `c3-e2` (dựng table): Tạo `employees` có primary key tự tăng, NOT NULL, UNIQUE cho email, CHECK cho lương. Database: database của bạn.
- `c3-e3` (dựng table): Tạo `departments` và `employees` một lượt, có foreign key, đúng thứ tự. Database: database của bạn.
- `c3-e4` (sửa query lỗi): CREATE TABLE thiếu dấu phẩy và sai tên data type, sửa cho chạy. Database: database của bạn.
- `c3-e5` (dựng table): Tạo `projects` và `assignments` với primary key ghép. Database: database của bạn.
- `c3-e6` (dựng table): Tạo `leave_requests` có DEFAULT, CHECK và foreign key tới `employees` hai lần. Database: database của bạn.
- `c3-e7` (dựng table): ALTER thêm column `phone` và thêm constraint UNIQUE cho nó. Database: database của bạn.
- `c3-e8` (đoán kết quả): Đoán lỗi nào hiện ra khi chèn row phạm từng constraint. Database: database của bạn.
- `c3-boss` (dựng table): Dựng đủ 5 table của Sao Mai từ bản mô tả, rồi chèn 3 row mỗi table. Chấm bằng cách so cấu trúc. Database: database của bạn.

### Chương 4. Query một table

Học xong chương này, bạn làm được:

- Lọc row bằng WHERE với so sánh, IN, BETWEEN, LIKE, IS NULL.
- Sắp xếp, bỏ row trùng, lấy N row đầu ở cả MySQL và Oracle.
- Đọc và viết query nhiều khúc, có comment, dễ đọc cho người khác.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c4-b1 | SELECT và FROM | Khối thử tay: chọn column, bấm Chạy, đổi tên column bằng AS | (bài cũ c3-b1) Chọn column, dấu `*`, đặt tên mới bằng AS. | Oracle in hoa tiêu đề column | SQLBolt L1, CS50 SQL tuần 0 |
| c4-b2 | WHERE: so sánh, AND, OR, NOT | Khối thử tay: đổi điều kiện, thấy row nào còn, row nào mất | `=`, `<>`, `>`, `<=`. Chuỗi trong nháy đơn. AND chạy trước OR, dùng ngoặc cho rõ. `NOT` đảo điều kiện. Ví dụ `WHERE city = 'Hà Nội' AND price > 30000`. (bài cũ c3-b2, tách ra) | MySQL so chữ không phân biệt hoa thường và dấu. Oracle có phân biệt | SQLBolt L2, CS50 SQL tuần 0 |
| c4-b3 | WHERE: IN, BETWEEN, LIKE, IS NULL | Khối thử tay: gõ mẫu LIKE, xem row nào khớp | `IN ('A', 'B')`. `BETWEEN 10 AND 20` gồm cả hai đầu. `LIKE 'Trà%'` với `%` và `_`. `= NULL` không đúng, dùng `IS NULL`. (bài cũ c3-b2, tách ra) | LIKE không phân biệt hoa thường ở MySQL, có phân biệt ở Oracle | SQLBolt L2, L3, L8 |
| c4-b4 | ORDER BY và DISTINCT | Khối thử tay: đổi ASC, DESC, thêm column sắp, xem NULL đứng đâu | ASC, DESC, sắp theo nhiều column. `SELECT DISTINCT city`. DISTINCT tính trên cả bộ column đã chọn. (bài cũ c3-b3) | Sắp tăng dần: NULL đứng đầu ở MySQL, cuối ở Oracle. Oracle có `NULLS FIRST`, `NULLS LAST` | SQLBolt L4, CS50 SQL tuần 0 |
| c4-b5 | LIMIT, FETCH FIRST và ROWNUM | Khối thử tay: lấy 3 row đầu bằng từng cách, ROWNUM chạy trước ORDER BY | (bài cũ c3-b4) LIMIT, OFFSET. FETCH FIRST. Bẫy ROWNUM. | MySQL `LIMIT 3`. Oracle `FETCH FIRST 3 ROWS ONLY`, code cũ dùng `WHERE ROWNUM <= 3` | tài liệu MySQL 8, Oracle 19c |
| c4-b6 | Thứ tự query chạy thật | Cảnh thứ tự clause: bấm từng bước, thấy row đi qua FROM, WHERE, SELECT, ORDER BY | (bài cũ c3-b5) FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT. Vì sao WHERE không dùng được alias của SELECT. | MySQL cho dùng alias trong HAVING và GROUP BY, Oracle không | SQLBolt L12, Julia Evans |
| c4-b7 | Viết query cho dễ đọc: xuống dòng, alias, comment | Khối thử tay: dán một query viết liền một khối, bấm "Làm gọn" để xem bản đã ngắt khúc, rồi tự sửa | Mỗi clause một khúc, thụt đầu khúc con. Alias ngắn cho table. Comment `-- ghi chú` và `/* ... */`. Câu kết thúc bằng `;`. | MySQL cần dấu cách sau `--`, Oracle không cần. `#` chỉ có ở MySQL. Oracle alias table không có AS | tài liệu MySQL 8, Oracle 19c (suy ra) |

Bài tập của chương 4:

- `c4-e1` (viết query): Liệt kê tên và giá các món dưới 40.000 đồng, rẻ nhất lên đầu. Database: tiệm trà sữa.
- `c4-e2` (viết query): Tìm khách có tên bắt đầu bằng "Nguyễn" và chưa có số điện thoại. Database: tiệm trà sữa.
- `c4-e3` (sửa query lỗi): Query dùng `= NULL` và ngoặc sai làm ra thừa row, sửa lại. Database: tiệm trà sữa.
- `c4-e4` (xếp clause): Xếp các clause của một query về đơn hủy theo thứ tự cú pháp, rồi theo thứ tự chạy. Database: tiệm trà sữa.
- `c4-e5` (viết query): Liệt kê nhân viên còn làm của phòng 10, người mới vào làm lên đầu. Database: database của bạn.
- `c4-e6` (viết query): Lấy 5 nhân viên lương cao nhất, viết cho cả MySQL và Oracle. Database: database công ty.
- `c4-e7` (đọc query): Đọc một query có comment và nhiều điều kiện, nói nó trả về ai. Database: database công ty.
- `c4-boss` (diễn tập): Ba yêu cầu của kế toán: danh sách nhân viên theo điều kiện, top 10 lương, các phòng ban không trùng tên. Database: database công ty.

### Chương 5. Function và biểu thức

Học xong chương này, bạn làm được:

- Ghép họ tên, cắt mã, làm sạch chữ bằng function chuỗi.
- Tính tuổi, thâm niên, ngày cuối tháng, đổi chuỗi thành ngày ở cả MySQL và Oracle.
- Xử lý NULL và chia nhóm bằng CASE WHEN, và đọc được DECODE trong code cũ.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c5-b1 | Phép tính và function số | Khối thử tay: tính tiền thuế và làm tròn | (bài cũ c4-b1, sửa) `+ - * /`, `ROUND(x, 2)`, `FLOOR`, `CEIL`, `MOD`. Đặt tên column tính bằng AS. Thêm: `ABS`, `TRUNC` cho số. | MySQL có `%`. Oracle chỉ có `MOD(a, b)`. Chia cho 0: MySQL ra NULL, Oracle lỗi ORA-01476. Oracle luôn cần FROM: thử phép tính bằng `FROM DUAL` | SQLBolt L9, tài liệu MySQL 8, Oracle 19c |
| c5-b2 | function chuỗi cơ bản | Khối thử tay: ghép họ và tên, đổi hoa thường, cắt chuỗi | (bài cũ c4-b2) UPPER, LOWER, LENGTH, SUBSTR, nối chuỗi. | MySQL `CONCAT(a, b)`. Oracle `a \|\| b`. Oracle coi chuỗi rỗng là NULL. MySQL `LENGTH` đếm byte, `CHAR_LENGTH` đếm ký tự | tài liệu MySQL 8, Oracle 19c |
| c5-b3 | function chuỗi nâng cao: TRIM, REPLACE, INSTR, LPAD | Khối thử tay: làm sạch một column mã nhân viên bẩn từng bước | `TRIM(s)` bỏ dấu cách. `REPLACE(s, 'a', 'b')`. `INSTR(s, '@')` tìm vị trí, rồi `SUBSTR` cắt tên trước `@` của email. `LPAD(id, 5, '0')` đệm số 0. | `INSTR` và `LPAD` viết giống nhau ở cả hai. Oracle có `INITCAP`. MySQL không có `INITCAP` | tài liệu Oracle 19c, MySQL 8 |
| c5-b4 | Ngày giờ: lấy, định dạng, đổi chuỗi thành ngày | Khối thử tay: gõ định dạng ngày, thấy kết quả đổi | (bài cũ c4-b3) Ngày hiện tại. Định dạng ngày. Chuỗi thành ngày. DATE của Oracle có giờ, lọc theo ngày dùng `>=` và `<`. | MySQL `NOW()`, `DATE_FORMAT`, `STR_TO_DATE`. Oracle `SYSDATE`, `TO_CHAR`, `TO_DATE`, `DATE '...'` | tài liệu MySQL 8, Oracle 19c |
| c5-b5 | Ngày giờ: cộng trừ, khoảng cách, đầu tháng, cuối tháng | Khối thử tay: kéo thanh ngày, xem thâm niên và ngày cuối tháng đổi theo | Cộng ngày, cộng tháng. Số ngày giữa hai mốc. Tính thâm niên theo tháng. Cuối tháng. Đầu tháng. | MySQL: `DATE_ADD(d, INTERVAL 1 MONTH)`, `DATEDIFF`, `TIMESTAMPDIFF`, `LAST_DAY`. Oracle: `ADD_MONTHS`, `d + 7`, `a - b`, `MONTHS_BETWEEN`, `LAST_DAY`, `TRUNC(d, 'MM')` | tài liệu Oracle 19c, MySQL 8 |
| c5-b6 | Đổi data type: TO_CHAR, TO_NUMBER, CAST, và đổi ngầm | Khối thử tay: so một column chữ với số, xem database tự đổi hoặc báo lỗi | Đổi số thành chữ có dấu phẩy nghìn. Đổi chuỗi thành số. `CAST(x AS ...)` chuẩn ở cả hai. Đổi ngầm: dễ ra kết quả lạ. | MySQL đổi ngầm lặng lẽ (`'12abc'` thành 12). Oracle báo ORA-01722. MySQL `FORMAT(n, 0)`. Oracle `TO_CHAR(n, 'FM999,999,999')`, `TO_NUMBER` | tài liệu Oracle 19c, MySQL 8 |
| c5-b7 | Xử lý NULL: NVL, NVL2, COALESCE, IFNULL, NULLIF | Khối thử tay: thay NULL bằng giá trị, xem tổng đổi | (bài cũ c4-b4, sửa) `COALESCE(a, b, 0)` chạy ở cả hai. `NULLIF(a, 0)` tránh chia cho 0. NULL cộng với số ra NULL. | MySQL `IFNULL`, `IF(x IS NULL, a, b)`. Oracle `NVL`, `NVL2(x, khi_có, khi_NULL)` | tài liệu Oracle 19c, MySQL 8 |
| c5-b8 | CASE WHEN và DECODE | Khối thử tay: kéo mốc lương, xem nhãn "Thấp, Vừa, Cao" đổi theo | `CASE WHEN salary < 10000000 THEN 'Thấp' ELSE 'Cao' END`. Các nhánh chạy từ trên xuống. Không có ELSE thì ra NULL. DECODE trong code cũ Oracle: đọc và viết lại bằng CASE. (bài cũ c4-b4, sửa) | `CASE` giống nhau. `DECODE(x, 1, 'a', 'b')` chỉ có ở Oracle | tài liệu Oracle 19c, MySQL 8 |

Bài tập của chương 5:

- `c5-e1` (viết query): Ghép họ tên khách thành một column, viết cho MySQL rồi Oracle. Database: tiệm trà sữa.
- `c5-e2` (viết query): Tách tên miền khỏi email của nhân viên bằng INSTR và SUBSTR. Database: database của bạn.
- `c5-e3` (viết query): Tính số tháng làm việc của từng nhân viên tới hôm nay. Database: database công ty.
- `c5-e4` (đoán kết quả): Đoán kết quả của `SELECT LAST_DAY(...)`, `ADD_MONTHS(...)` trên ba ngày cho trước. Database: tiệm trà sữa.
- `c5-e5` (sửa query lỗi): Query cộng lương với thưởng ra NULL cho người không có thưởng, sửa lại. Database: database công ty.
- `c5-e6` (viết query): Gán nhãn "Mới", "Lâu năm" theo thâm niên bằng CASE. Database: database của bạn.
- `c5-e7` (quiz): Với mỗi function, chọn tên đúng ở MySQL và tên đúng ở Oracle. Database: tiệm trà sữa.
- `c5-boss` (diễn tập): Làm báo cáo lương rút gọn: họ tên viết hoa, thâm niên theo tháng, thưởng thay NULL bằng 0, nhãn mức lương. Database: database công ty.

### Chương 6. Gom nhóm và báo cáo

Học xong chương này, bạn làm được:

- Đếm, cộng, lấy trung bình theo nhóm và theo tháng.
- Lọc nhóm bằng HAVING, đếm có điều kiện và xoay ngang bằng CASE.
- Làm một báo cáo có row tổng bằng ROLLUP.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c6-b1 | COUNT, SUM, AVG, MIN, MAX | Khối thử tay: đổi function gom, xem một con số đổi | (bài cũ c5-b1) Năm function gom. `COUNT(*)` khác `COUNT(column)` khi có NULL. `COUNT(DISTINCT ...)`. | giống nhau | SQLBolt L10, CS50 SQL tuần 0 |
| c6-b2 | GROUP BY | Cảnh gom row vào từng giỏ theo nhóm, mỗi giỏ ra một row | (bài cũ c5-b2) Column trong SELECT phải nằm trong GROUP BY hoặc trong function gom. | Lỗi: ORA-00979 ở Oracle, 1055 ở MySQL | SQLBolt L10, CS50 SQL tuần 1 |
| c6-b3 | GROUP BY nhiều column và theo tháng | Khối thử tay: chọn gom theo tiệm, theo tháng, hoặc cả hai | `GROUP BY store_id, status`. Gom theo tháng bằng function ngày. Đặt `ORDER BY` cho báo cáo. Nhóm càng nhiều column, row ra càng nhiều. | MySQL: `DATE_FORMAT(d, '%Y-%m')`. Oracle: `TO_CHAR(d, 'YYYY-MM')`. Oracle không cho GROUP BY theo alias | tài liệu MySQL 8, Oracle 19c |
| c6-b4 | HAVING | Khối thử tay: kéo ngưỡng HAVING, xem nhóm nào còn | (bài cũ c5-b3) WHERE lọc row trước khi gom, HAVING lọc nhóm sau khi gom. | giống nhau | SQLBolt L11 |
| c6-b5 | Đếm có điều kiện và xoay ngang bằng CASE | Khối thử tay: biến báo cáo dọc "mỗi trạng thái một row" thành ngang "mỗi trạng thái một column" | `SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)`. Một query đếm nhiều điều kiện. Xoay ngang: mỗi CASE thành một column. | giống nhau | SQLBolt (suy ra), tài liệu MySQL 8, Oracle 19c |
| c6-b6 | Gộp chữ trong nhóm và dòng tổng cộng: LISTAGG, GROUP_CONCAT, ROLLUP | Khối thử tay: bật tắt ROLLUP, thấy thêm row tổng phụ và tổng cuối | Gộp tên các nhân viên của một phòng thành một ô. ROLLUP thêm row tổng. Row tổng có NULL ở column nhóm. | Oracle `LISTAGG(name, ', ') WITHIN GROUP (ORDER BY name)`, `GROUP BY ROLLUP(a, b)`. MySQL `GROUP_CONCAT(name SEPARATOR ', ')`, `GROUP BY a, b WITH ROLLUP`. MySQL cắt kết quả GROUP_CONCAT ở 1024 ký tự mặc định. MySQL hạn chế ORDER BY khi có ROLLUP (cần kiểm tài liệu) | tài liệu Oracle 19c, MySQL 8 |
| c6-b7 | Báo cáo doanh thu | Khối thử tay trên database lớn: doanh thu theo ngày, món, tiệm, bỏ đơn hủy | (bài cũ c5-b4) Doanh thu theo ngày, theo món, theo tiệm. Bỏ đơn cancelled. | giống nhau, trừ hàm ngày | Mode SQL Tutorial (ý tưởng) |

Bài tập của chương 6:

- `c6-e1` (viết query): Đếm đơn của từng tiệm. Database: tiệm trà sữa.
- `c6-e2` (viết query): Tính lương trung bình, thấp nhất, cao nhất của từng phòng ban. Database: database công ty.
- `c6-e3` (sửa query lỗi): Query cho ra ORA-00979 vì thiếu column trong GROUP BY, sửa lại. Database: database công ty.
- `c6-e4` (viết query): Số đơn nghỉ phép theo từng loại và từng tháng. Database: database của bạn.
- `c6-e5` (viết query): Chỉ giữ phòng ban có từ 3 nhân viên trở lên, bằng HAVING. Database: database của bạn.
- `c6-e6` (đoán kết quả): Đoán ra bao nhiêu row nếu thêm ROLLUP vào một GROUP BY hai column. Database: tiệm trà sữa.
- `c6-e7` (viết query): Một query ra ba column đếm: đơn xong, đơn hủy, đơn đang làm, theo từng tiệm. Database: tiệm trà sữa.
- `c6-boss` (diễn tập): Báo cáo doanh thu theo tháng của từng tiệm, có row tổng, ghép tên món bán chạy vào một ô. Database: tiệm trà sữa.

### Chương 7. Nối table

Học xong chương này, bạn làm được:

- Tìm đường nối giữa hai table bất kỳ trong một database lạ bằng cách đọc sơ đồ.
- Viết query nối từ hai tới năm table, đúng loại JOIN.
- Phát hiện và sửa lỗi nối ra row nhân bội làm SUM quá lớn.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c7-b1 | Đọc một database lạ: tìm đường nối giữa hai table | Sơ đồ database công ty: bấm chọn hai table, đường nối sáng lên qua các table ở giữa | Tìm foreign key để biết hai table nối bằng column nào. Đi từ `order_items` tới `regions` qua mấy table. Chọn đường ngắn nhất. | giống nhau. Table của schema khác cần có quyền đọc: xem Chương 11 | CS50 SQL tuần 1, schema HR |
| c7-b2 | INNER JOIN | Cảnh ghép hai table: bấm "Chạy" và xem từng row ghép với row có cùng key | (bài cũ c6-b1) Nối hai table, viết ON. Alias của table. | Oracle báo lỗi nếu viết AS trước alias của table | SQLBolt L6, CS50 SQL tuần 1 |
| c7-b3 | LEFT JOIN và cách tìm thứ không có | Khối thử tay: đổi INNER thành LEFT, thấy row NULL xuất hiện | (bài cũ c6-b2) Giữ mọi row bên trái. Bên phải không khớp ra NULL. Tìm món chưa từng bán bằng `WHERE ... IS NULL`. | giống nhau | SQLBolt L7 |
| c7-b4 | RIGHT JOIN và FULL OUTER JOIN | Khối thử tay: đổi giữa LEFT, RIGHT, FULL và xem số row | RIGHT JOIN là LEFT JOIN đảo bên. FULL OUTER JOIN giữ row không khớp của cả hai bên. Dùng để đối soát hai danh sách. | Oracle có `FULL OUTER JOIN`. MySQL không có: ghép `LEFT JOIN` và `RIGHT JOIN` bằng `UNION` | SQLBolt L7, tài liệu MySQL 8 |
| c7-b5 | Nối ba, bốn, năm table | Khối thử tay: thêm từng JOIN một, xem sơ đồ đường nối dài ra | (bài cũ c6-b3, sửa) `orders` nối `order_items` nối `products` nối `customers` nối `stores`. Thêm từng JOIN, chạy lại sau mỗi lần. Nối trước, gom sau. | giống nhau | SQLBolt L7 (suy ra) |
| c7-b6 | Self join: nhân viên và người quản lý | Khối thử tay: cùng một table `employees` hiện hai lần với hai alias | Hai alias cho một table: `e` là nhân viên, `m` là sếp. `ON e.manager_id = m.employee_id`. Dùng LEFT JOIN để giữ người không có sếp. Tìm người không có ai báo cáo. | giống nhau. Oracle alias không có AS | schema HR, CS50 SQL tuần 1 (suy ra) |
| c7-b7 | Nối theo nhiều điều kiện, nối theo khoảng, CROSS JOIN | Khối thử tay: kéo khoảng lương, xem nhân viên nhảy sang bậc khác | `ON a.x = b.x AND a.y = b.y`. `ON salary BETWEEN min_salary AND max_salary`. `CROSS JOIN` ghép mọi cặp, dùng để tạo lưới ngày và tiệm. | MySQL và Oracle đều có CROSS JOIN | tài liệu MySQL 8, Oracle 19c (suy ra) |
| c7-b8 | Bẫy nhân bội row: nối xong SUM ra số quá lớn | Cảnh một đơn có 3 món bị đếm 3 lần: bấm "Chạy" từng bước để thấy row nhân lên | Nối một với nhiều làm row bên "một" lặp lại. SUM trên column của bên "một" bị cộng nhiều lần. Cách kiểm: so `COUNT(*)` trước và sau khi nối. Cách sửa: gom trước rồi mới nối. | giống nhau | SQLBolt L7 (suy ra) |
| c7-b9 | Đọc code Oracle cũ: dấu phẩy, dấu (+), USING, NATURAL JOIN | Khối thử tay: bấm "Viết lại" để dịch câu cũ thành LEFT JOIN, so hai kết quả | `FROM a, b WHERE a.id = b.id` là INNER JOIN. `WHERE a.id = b.id(+)` là LEFT JOIN. `USING (department_id)`. NATURAL JOIN nối theo mọi column trùng tên, nên tránh. Quên điều kiện thì ra tích Descartes. | Dấu `(+)` chỉ có ở Oracle. USING và NATURAL có ở cả hai. Oracle không cho viết `alias.column` với column trong USING | tài liệu Oracle 19c, MySQL 8 |

Bài tập của chương 7:

- `c7-e1` (viết query): Liệt kê mã đơn, tên khách, giờ đặt. Database: tiệm trà sữa (`orders`, `customers`).
- `c7-e2` (sửa query lỗi): Viết lại query Oracle cũ dùng dấu phẩy và `(+)` thành LEFT JOIN. Database: database công ty (`employees`, `departments`).
- `c7-e3` (sửa query lỗi): Query quên ON ra cả triệu row, sửa cho đúng. Database: database công ty (`employees`, `departments`).
- `c7-e4` (viết query): Tìm món chưa từng bán. Database: tiệm trà sữa (`products`, `order_items`).
- `c7-e5` (viết query): Nối bốn table để tính doanh thu của từng khách. Database: tiệm trà sữa (`orders`, `order_items`, `products`, `customers`).
- `c7-e6` (viết query): Liệt kê nhân viên kèm tên người quản lý, người không có sếp vẫn hiện. Database: database của bạn (`employees` tự nối).
- `c7-e7` (đoán kết quả): Đoán vì sao SUM sau khi nối ra số gấp ba lần, tìm chỗ nối sai. Database: database công ty (`orders`, `order_items`, `customers`).
- `c7-e8` (viết query): Nối năm table để ra món, đơn, khách, nhân viên bán và sản phẩm. Database: database công ty (`order_items`, `orders`, `customers`, `employees`, `products`).
- `c7-boss` (diễn tập): Mỗi đơn kèm khách, quốc gia, vùng, nhân viên bán và phòng ban của nhân viên đó. Database: database công ty (6 table).

### Chương 8. Subquery và ghép kết quả

Học xong chương này, bạn làm được:

- Dùng subquery để so sánh với giá trị tính ra, lọc theo danh sách, hoặc gom trước nối sau.
- Chọn đúng giữa JOIN, IN và EXISTS, và tránh bẫy NOT IN với NULL.
- Ghép hai kết quả bằng UNION, MINUS hoặc INTERSECT, và chia query dài thành các bước bằng WITH.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c8-b1 | subquery trả một giá trị | Cảnh hai ngăn: chạy ngăn trong, kết quả chui vào ngăn ngoài | (bài cũ c6-b4, sửa) `WHERE price > (SELECT AVG(price) FROM products)`. subquery chạy trước. Phải trả đúng một giá trị. | Trả nhiều hơn một giá trị: ORA-01427 ở Oracle, 1242 ở MySQL | SQLBolt Topic Subqueries, CS50 SQL tuần 1 |
| c8-b2 | subquery trả một danh sách: IN, NOT IN và bẫy NULL | Khối thử tay: thêm một row NULL vào danh sách, thấy NOT IN ra rỗng | (bài cũ c6-b4, sửa) `IN (SELECT ...)`. `NOT IN` gặp một NULL thì ra rỗng. Thay bằng `NOT EXISTS` hoặc lọc NULL. | giống nhau | CS50 SQL tuần 1 |
| c8-b3 | subquery trong FROM: gom trước, nối sau | Khối thử tay: tách một query lồng thành hai bước, xem kết quả tạm ở giữa | `FROM (SELECT ... GROUP BY ...) t`. Gom doanh thu theo tiệm trước, rồi nối với `stores`. Cách tránh bẫy nhân bội row. | MySQL bắt buộc có alias cho subquery trong FROM. Oracle không bắt buộc | tài liệu MySQL 8, Oracle 19c (suy ra) |
| c8-b4 | subquery phụ thuộc query bên ngoài | Cảnh query ngoài đưa từng row xuống subquery, bấm từng row | subquery nhắc tới column của query ngoài. Chạy lại với mỗi row ngoài. Ví dụ: lương cao hơn trung bình phòng của chính người đó. | giống nhau. Oracle alias table không có AS | SQLBolt Topic Subqueries |
| c8-b5 | EXISTS và NOT EXISTS | Khối thử tay: đổi giữa IN, JOIN và EXISTS, so kết quả | `WHERE EXISTS (SELECT 1 FROM ... WHERE ...)`. EXISTS chỉ hỏi "có row nào không". `NOT EXISTS` tìm row không có. An toàn với NULL hơn NOT IN. | giống nhau | SQLBolt Topic Subqueries (suy ra) |
| c8-b6 | UNION, UNION ALL, INTERSECT, MINUS | Cảnh hai danh sách chồng nhau: bấm chọn phép ghép, thấy phần nào được giữ | UNION bỏ row trùng, UNION ALL giữ hết. INTERSECT lấy phần chung. MINUS hoặc EXCEPT lấy phần chỉ có ở bên trái. Hai query phải cùng số column, data type hợp nhau. ORDER BY đặt ở cuối. | Oracle: `MINUS`. MySQL: `EXCEPT` và `INTERSECT` chỉ có từ 8.0.31, không có MINUS. Oracle báo ORA-01789 khi lệch số column | SQLBolt Topic Unions, CS50 SQL tuần 1 |
| c8-b7 | WITH: đặt tên cho từng bước của query | Khối thử tay: bấm từng bước trong WITH để xem kết quả trung gian | `WITH a AS (...), b AS (...) SELECT ...`. Mỗi bước một tên. Đọc từ trên xuống. Dùng lại một bước nhiều lần. | giống nhau với WITH thường. MySQL 8 có WITH, MySQL 5.7 thì không | CS50 SQL tuần 4 |

Bài tập của chương 8:

- `c8-e1` (viết query): Tìm nhân viên lương cao hơn trung bình toàn công ty, kèm tên phòng ban. Database: database công ty (`employees`, `departments`).
- `c8-e2` (sửa query lỗi): `NOT IN` trả rỗng vì có NULL, tìm khách chưa mua và sửa. Database: tiệm trà sữa (`customers`, `orders`).
- `c8-e3` (viết query): Doanh thu mỗi tiệm gom trước, rồi nối `stores` lấy tên tiệm. Database: tiệm trà sữa (`stores`, `orders`, `order_items`).
- `c8-e4` (viết query): Với mỗi phòng ban, tìm nhân viên lương cao nhất bằng subquery phụ thuộc. Database: database của bạn (`employees`, `departments`).
- `c8-e5` (viết query): Tìm nhân viên chưa được gán vào dự án nào bằng NOT EXISTS. Database: database của bạn (`employees`, `assignments`).
- `c8-e6` (viết query): Danh sách email của cả nhân viên và khách, bỏ trùng, bằng UNION. Database: database công ty (`employees`, `customers`).
- `c8-e7` (đọc query): Đọc một query WITH ba bước và nói từng bước làm gì. Database: database công ty (`orders`, `order_items`, `products`, `customers`).
- `c8-e8` (viết query): Tìm khách mua cả trà đào và trà sữa bằng INTERSECT hoặc cách tương đương ở MySQL. Database: tiệm trà sữa (`customers`, `orders`, `order_items`, `products`).
- `c8-boss` (diễn tập): Khách có tổng chi cao hơn trung bình và chưa từng mua món nhóm "Topping", kèm vùng và nhân viên bán. Database: database công ty (5 table).

### Chương 9. Báo cáo nâng cao

Học xong chương này, bạn làm được:

- Xếp hạng row và lấy top N của mỗi nhóm bằng window function.
- Tính cộng dồn và so với kỳ trước bằng SUM OVER, LAG, LEAD.
- Lưu một query dài thành VIEW để cả team dùng lại.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c9-b1 | Window function: tính trên nhóm mà vẫn giữ từng row | Cảnh hai cửa sổ: bấm xem GROUP BY gộp row lại, còn OVER giữ nguyên row | `AVG(salary) OVER (PARTITION BY department_id)`. GROUP BY gộp row, OVER giữ row. Thêm một column "trung bình phòng" cạnh từng nhân viên. | giống nhau | CS50 SQL tuần 4 (suy ra), tài liệu Oracle 19c |
| c9-b2 | Xếp hạng: ROW_NUMBER, RANK, DENSE_RANK | Khối thử tay: chèn thêm hai người đồng điểm, xem ba function ra khác nhau | `RANK() OVER (ORDER BY salary DESC)`. Đồng hạng: RANK nhảy số, DENSE_RANK không nhảy, ROW_NUMBER không đồng hạng. | giống nhau (MySQL 8 trở lên) | tài liệu Oracle 19c, MySQL 8 |
| c9-b3 | Top N của mỗi nhóm | Khối thử tay: đổi N và đổi nhóm, xem danh sách top thay đổi | `PARTITION BY` rồi `WHERE rn <= 3` ở query ngoài. Window function không viết trực tiếp trong WHERE. Bọc bằng subquery hoặc WITH. | giống nhau | tài liệu Oracle 19c (suy ra) |
| c9-b4 | Cộng dồn và so với kỳ trước: SUM OVER, LAG, LEAD | Khối thử tay: kéo thanh tháng, xem số cộng dồn và mức tăng so với tháng trước | `SUM(x) OVER (ORDER BY m)`. `LAG(x, 1)` lấy tháng trước, `LEAD` lấy tháng sau. Tính phần trăm tăng. Row đầu tiên của LAG là NULL. | giống nhau. Oracle `LAG(x, 1, 0)` cho giá trị thay NULL, MySQL cũng có | tài liệu Oracle 19c, MySQL 8 |
| c9-b5 | VIEW: một query có tên | Khối thử tay: tạo một VIEW, rồi `SELECT` từ nó như table | `CREATE VIEW v_doanh_thu AS SELECT ...`. VIEW không chứa dữ liệu riêng, chạy lại query mỗi lần gọi. Dùng để giấu phần nối phức tạp. `DROP VIEW`. | MySQL và Oracle đều có `CREATE OR REPLACE VIEW`. Oracle dùng `WITH READ ONLY` để chặn sửa qua VIEW | CS50 SQL tuần 4 |

Bài tập của chương 9:

- `c9-e1` (viết query): Thêm column "lương trung bình phòng" cạnh mỗi nhân viên. Database: database công ty.
- `c9-e2` (viết query): Xếp hạng khách theo tổng chi, dùng RANK. Database: tiệm trà sữa.
- `c9-e3` (đoán kết quả): Đoán ROW_NUMBER, RANK, DENSE_RANK của sáu nhân viên có lương trùng. Database: database của bạn.
- `c9-e4` (viết query): Top 3 món bán chạy của mỗi tiệm. Database: tiệm trà sữa.
- `c9-e5` (viết query): Doanh thu cộng dồn theo tháng, kèm mức tăng so với tháng trước. Database: database công ty.
- `c9-e6` (dựng table): Tạo VIEW "nhân viên đang làm, kèm phòng ban" rồi chạy SELECT từ VIEW. Database: database của bạn.
- `c9-boss` (diễn tập): Báo cáo top 3 nhân viên bán nhiều nhất mỗi quý, có cộng dồn, lưu thành VIEW. Database: database công ty.

### Chương 10. Sửa dữ liệu

Học xong chương này, bạn làm được:

- Viết UPDATE và DELETE có WHERE đúng, kiểm trước bằng SELECT.
- Dùng transaction, COMMIT, ROLLBACK, SAVEPOINT, và hiểu vì sao query bị treo.
- Làm đủ sáu bước sửa dữ liệu an toàn ở công ty, có bản sao lưu.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c10-b1 | INSERT, UPDATE, DELETE | Cảnh diễn tập sửa dữ liệu: bấm "Chạy" thử không WHERE và có WHERE, xem số row bị đổi | (bài cũ c7-b1) Ba lệnh sửa dữ liệu. Thiếu WHERE đổi mọi row. Chạy SELECT với cùng WHERE trước. | MySQL nhiều row một INSERT, Oracle mỗi câu một row | CS50 SQL tuần 3, SQLBolt L13 đến L15 |
| c10-b2 | UPDATE và DELETE dựa vào table khác | Khối thử tay: tăng lương cho nhân viên của một phòng theo tên phòng ban | `UPDATE ... SET salary = (SELECT ...)`. `DELETE ... WHERE EXISTS (SELECT ...)`. Viết SELECT cùng điều kiện, đếm row, rồi mới sửa. | MySQL: `UPDATE a JOIN b ON ... SET ...`. Oracle không có UPDATE JOIN, dùng subquery hoặc MERGE | tài liệu MySQL 8, Oracle 19c |
| c10-b3 | transaction, COMMIT, ROLLBACK, SAVEPOINT | Cảnh giỏ transaction: bỏ thay đổi vào giỏ, bấm COMMIT hoặc ROLLBACK | (bài cũ c7-b2, sửa) transaction là một giỏ thay đổi. COMMIT lưu, ROLLBACK bỏ. `SAVEPOINT a` rồi `ROLLBACK TO a`. Chuyển tiền: hai UPDATE phải cùng thành công hoặc cùng bỏ. | MySQL tự commit mỗi lệnh, cần `START TRANSACTION`. Oracle chờ COMMIT. DDL tự COMMIT ở cả hai | CS50 SQL tuần 5, tài liệu Oracle 19c |
| c10-b4 | Hai người cùng sửa một row: lock và query bị treo | Cảnh hai cửa sổ làm việc: người A sửa chưa COMMIT, người B bấm sửa cùng row và bị treo | Người A giữ lock tới khi COMMIT hoặc ROLLBACK. Người B chờ. Cách xử: nhắn người A COMMIT, hoặc báo DBA. Thói quen: COMMIT sớm, không để transaction mở. `SELECT ... FOR UPDATE`. | Oracle: `FOR UPDATE NOWAIT` báo ORA-00054. MySQL: chờ rồi báo 1205 | CS50 SQL tuần 5 (race condition), tài liệu Oracle 19c |
| c10-b5 | Sao lưu trước khi sửa: CREATE TABLE AS SELECT | Khối thử tay: chép `employees` ra `employees_bak`, sửa sai, rồi khôi phục từ bản chép | `CREATE TABLE employees_bak AS SELECT * FROM employees;`. Đặt tên có ngày. Khôi phục bằng UPDATE từ bản sao. Bản chép có thể thiếu primary key và index, nên đừng coi nó là table thay thế. | Cú pháp giống nhau. Oracle chỉ chép NOT NULL. MySQL chép column và dữ liệu, còn constraint nào được chép thì (cần kiểm tài liệu) | tài liệu MySQL 8, Oracle 19c (suy ra) |
| c10-b6 | Có thì sửa, chưa có thì thêm: MERGE và ON DUPLICATE KEY UPDATE | Khối thử tay: nạp một danh sách nhân viên mới, thấy row nào được sửa, row nào được thêm | Một câu làm cả hai việc: nếu mã đã có thì UPDATE, chưa có thì INSERT. Cần column để so: primary key hoặc UNIQUE. | Oracle: `MERGE INTO ... USING ... ON (...) WHEN MATCHED THEN UPDATE ... WHEN NOT MATCHED THEN INSERT ...`. MySQL không có MERGE: `INSERT ... ON DUPLICATE KEY UPDATE` | tài liệu Oracle 19c, MySQL 8 |
| c10-b7 | Sáu bước sửa dữ liệu ở công ty | Cảnh sáu bước: bấm từng bước theo thứ tự, bước nào bỏ qua thì cảnh báo | Sáu bước: đọc yêu cầu, SELECT đếm row, sao lưu, sửa trong transaction, SELECT kiểm lại, COMMIT hoặc ROLLBACK. Ghi lại ai sửa, sửa gì, lúc nào. | Oracle: nhớ COMMIT. MySQL: nhớ `START TRANSACTION` | CS50 SQL tuần 3, 5 (ý tưởng), tài liệu Oracle 19c |

Bài tập của chương 10:

- `c10-e1` (sửa query lỗi): UPDATE thiếu WHERE làm đổi mọi lương, tìm chỗ sai và ROLLBACK. Database: database của bạn.
- `c10-e2` (viết query): Tăng 5% lương cho nhân viên của phòng "Kế toán". Database: database của bạn.
- `c10-e3` (viết query): Xóa các đơn nghỉ phép đã bị từ chối từ năm ngoái, kiểm bằng SELECT trước. Database: database của bạn.
- `c10-e4` (đoán kết quả): Đoán dữ liệu còn lại sau chuỗi INSERT, SAVEPOINT, ROLLBACK TO, COMMIT. Database: tiệm trà sữa.
- `c10-e5` (viết query): Chép `employees` sang bản sao rồi khôi phục một lương bị sửa nhầm. Database: database công ty.
- `c10-e6` (viết query): Nạp danh sách nhân viên mới bằng MERGE (Oracle) và `ON DUPLICATE KEY UPDATE` (MySQL). Database: database công ty.
- `c10-e7` (xếp clause): Xếp sáu bước sửa dữ liệu an toàn theo đúng thứ tự. Database: database công ty.
- `c10-boss` (diễn tập): Sửa phòng ban của 12 nhân viên: đếm, sao lưu, sửa, kiểm, rồi COMMIT hoặc ROLLBACK, không để mất dữ liệu. Database: database công ty.

### Chương 11. Oracle ở công ty

Học xong chương này, bạn làm được:

- Mở SQL Developer hoặc DBeaver, kết nối và chạy query Oracle trên database công ty.
- Tìm table và column trong database lạ bằng data dictionary, đọc tên đầy đủ `HR.EMPLOYEES`.
- Đọc mã lỗi ORA hay gặp và biết khi nào phải xin quyền hay nhờ DBA.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c11-b1 | Tool và kết nối: SQL Developer, DBeaver, worksheet, nút COMMIT | Cảnh giả lập giao diện tool: bấm vào từng vùng, xem tên và chức năng | Các vùng: danh sách kết nối, worksheet, kết quả, nút COMMIT và ROLLBACK. Chạy một câu và chạy cả script. Kiểm tra chế độ auto-commit. Chọn đúng kết nối trước khi chạy. | Mỗi tool có phím tắt riêng và mặc định auto-commit riêng (cần kiểm tài liệu của từng tool). Server MySQL tự commit mỗi lệnh | tài liệu Oracle 19c, SQL Developer (suy ra) |
| c11-b2 | schema, user và tên đầy đủ `HR.EMPLOYEES` | Khối thử tay: chạy `SELECT * FROM hr.employees` rồi bỏ `hr.`, xem lỗi | schema là ngăn chứa table của một user. Tên đầy đủ `schema.table`. Bỏ tên schema thì database tìm trong schema của mình. Cùng tên table có thể có ở hai schema. | Oracle: schema là user. MySQL: schema và database là một. Oracle không phân biệt hoa thường với tên không có nháy | schema HR, tài liệu Oracle 19c |
| c11-b3 | Tìm table và column trong database lạ: data dictionary, DESC | Khối thử tay: gõ tên một column, tìm ra table chứa nó | `SELECT table_name FROM user_tables`. `SELECT column_name, data_type FROM user_tab_columns WHERE table_name = 'EMPLOYEES'`. `ALL_TABLES` cho table của người khác. `USER_CONSTRAINTS` xem foreign key. Tên trong dictionary viết hoa. | Oracle: `DESC employees` là lệnh của tool, không phải SQL. MySQL: `DESCRIBE`, `SHOW TABLES`, `information_schema` | tài liệu Oracle 19c (suy ra) |
| c11-b4 | Quyền: vì sao mình chỉ đọc được | Cảnh cổng quyền: bấm SELECT, INSERT, DELETE trên table của người khác, xem cổng nào mở | Quyền SELECT, INSERT, UPDATE, DELETE cấp riêng từng table. Đọc được mà không sửa được là bình thường. `GRANT SELECT ON hr.employees TO an;`. Xin quyền: nhắn DBA tên table và lý do. | Oracle báo ORA-00942 khi thiếu quyền đọc, ORA-01031 khi thiếu quyền sửa. MySQL báo 1142 | tài liệu Oracle 19c, CS50 SQL tuần 6 |
| c11-b5 | index và query chậm | Cảnh cuộc đua index: một bên tìm từng row, một bên dùng index | (bài cũ c7-b3, sửa) index như mục lục sách. Ghi chậm hơn một chút. Query chậm hay gặp: `SELECT *` trên table lớn, thiếu WHERE, hàm bọc column trong WHERE. Nhờ DBA xem kế hoạch chạy, không tự đoán. | MySQL `EXPLAIN`. Oracle `EXPLAIN PLAN FOR ...` | CS50 SQL tuần 5 |
| c11-b6 | Ngày giờ ở Oracle thật: DATE có giờ, định dạng mặc định, so ngày cho đúng | Khối thử tay: lọc `hire_date = DATE '2026-03-02'`, thấy thiếu row, đổi sang khoảng | DATE ở Oracle có cả giờ. So bằng `=` thì sót row có giờ khác 00:00. Dùng `>= ngày AND < ngày kế`, hoặc `TRUNC(d)`. Định dạng hiển thị phụ thuộc cấu hình tool. TIMESTAMP chính xác tới giây lẻ. | MySQL: DATE không có giờ, DATETIME có giờ. Oracle: `NLS_DATE_FORMAT` quyết định cách hiện, mặc định thường là `DD-MON-RR` (cần kiểm tài liệu). So ngày với chuỗi: ORA-01861 | tài liệu Oracle 19c |
| c11-b7 | MySQL và Oracle khác nhau ở đâu, mã lỗi ORA hay gặp | Cảnh so dialect: bấm một chủ đề, câu MySQL và câu Oracle hiện ra cạnh nhau | (bài cũ c7-b4) Ôn khác biệt đã gặp, theo `docs/dialect-verification.md`. Mã lỗi ORA hay gặp: 00942, 00904, 00979, 01722, 00001, 02291. Cách đọc một thông báo lỗi. | Đây là bài tổng hợp hai bên | tài liệu MySQL 8, Oracle 19c |
| c11-b8 | Đọc một query dài của người khác | Cảnh query dài có thể gập mở: bấm vào từng khúc, thấy chú thích khúc đó làm gì | Đọc từ trong ra ngoài. Đọc FROM và JOIN trước để biết có table nào. Rồi WHERE, GROUP BY, SELECT. Ghi chú bằng một câu cho mỗi khúc. Chạy từng khúc riêng để kiểm. | giống nhau | tài liệu Oracle 19c (suy ra) |

Bài tập của chương 11:

- `c11-e1` (viết query): Liệt kê mọi table của schema hiện tại. Database: database công ty.
- `c11-e2` (viết query): Tìm table có column tên `SALARY` và data type của nó. Database: database công ty.
- `c11-e3` (sửa query lỗi): Query báo ORA-00942 vì thiếu tên schema, sửa lại. Database: database công ty.
- `c11-e4` (đoán kết quả): Đoán số row khi lọc `order_date = DATE '2026-03-02'` trong khi column có giờ. Database: database công ty.
- `c11-e5` (đọc query): Đọc một query 40 khúc của team khác, viết chú thích cho mỗi khúc. Database: database công ty.
- `c11-e6` (quiz): Đọc năm thông báo lỗi ORA và chọn việc cần làm tiếp theo. Database: database công ty.
- `c11-boss` (diễn tập): Nhận một table lạ, tìm cấu trúc, foreign key, rồi trả lời một câu hỏi bằng query. Database: database công ty.

### Chương 12. Dự án cuối

Học xong chương này, bạn làm được:

- Làm một báo cáo nhân sự hoàn chỉnh trên database công ty.
- Làm một báo cáo bán hàng theo tháng, có xếp hạng, đúng số.
- Đối soát và sửa dữ liệu lỗi an toàn, có transaction và bản sao lưu.

| Bài | Tên | Người học tự bấm gì | Ý phải có | MySQL và Oracle khác nhau | Nguồn |
|---|---|---|---|---|---|
| c12-b1 | Báo cáo nhân sự trên database công ty | Khối thử tay lớn: nhận đề của chị trưởng phòng nhân sự, viết từng query, so với kết quả mẫu | Đề: số nhân viên và lương trung bình mỗi phòng, thâm niên, người đứng đầu nhóm, nhân viên không có sếp. Dùng nối nhiều table, self join, gom nhóm, function ngày. Thay bài cũ c7-b5 (báo cáo bằng Oracle SQL). | Viết bằng Oracle. Có thẻ gợi ý MySQL | oracle-samples/db-sample-schemas |
| c12-b2 | Báo cáo bán hàng theo tháng, có xếp hạng | Khối thử tay lớn: dựng báo cáo doanh thu theo tháng, top 3 nhân viên bán mỗi tháng, cộng dồn | Nối `orders`, `order_items`, `products`, `employees`. Gom theo tháng. Xếp hạng trong từng tháng. Cộng dồn. Kiểm tổng với số mẫu. Tránh bẫy nhân bội row. | Viết bằng Oracle. Có thẻ gợi ý MySQL | tài liệu Oracle 19c |
| c12-b3 | Đối soát và sửa dữ liệu lỗi, có transaction | Cảnh diễn tập: nhận một báo cáo lệch số, tìm row lỗi, sửa theo sáu bước | Tìm đơn không có món nào, khách trùng, lương NULL. Sao lưu rồi mới sửa. Sửa trong transaction. Kiểm lại, COMMIT. Viết ghi chú ngắn cho người duyệt. | Oracle: nhớ COMMIT. MySQL: `START TRANSACTION` | CS50 SQL tuần 3, 5 (ý tưởng), tài liệu Oracle 19c |

Bài tập của chương 12:

- `c12-e1` (viết query): Số nhân viên và lương trung bình của từng phòng, kèm tên địa điểm. Database: database công ty.
- `c12-e2` (đọc query): Đọc query báo cáo cũ của team, tìm nó nhân bội row ở đâu. Database: database công ty.
- `c12-e3` (viết query): Doanh thu mỗi tháng và mức tăng so với tháng trước. Database: database công ty.
- `c12-e4` (viết query): Top 3 nhân viên bán nhiều nhất mỗi tháng. Database: database công ty.
- `c12-e5` (sửa query lỗi): Báo cáo lệch so với kế toán 3 đơn, tìm nguyên nhân và sửa query. Database: database công ty.
- `c12-e6` (viết query): Sửa 5 đơn hàng lỗi trong transaction, có bản sao lưu. Database: database công ty.
- `c12-boss` (diễn tập): Ba nhiệm vụ liền nhau trong một phiên, như một ngày làm việc ở công ty. Database: database công ty.

## Ba database để luyện

### (1) Tiệm trà sữa: 6 table có sẵn

Dữ liệu có sẵn trong `src/data/teashop.ts`. Dùng cho Chương 1 tới 10 và một số bài tập sau.

| Table | Column chính | Quan hệ |
|---|---|---|
| `stores` | `store_id` (primary key), `name`, `district`, `city`, `opened_on` | |
| `staff` | `staff_id` (primary key), `full_name`, `role`, `store_id`, `hired_on`, `salary` | `store_id` trỏ `stores` |
| `customers` | `customer_id` (primary key), `full_name`, `phone`, `city`, `joined_on` | |
| `products` | `product_id` (primary key), `name`, `category`, `price`, `calories`, `launched_on` | |
| `orders` | `order_id` (primary key), `customer_id`, `store_id`, `staff_id`, `ordered_at`, `status`, `payment` | trỏ `customers`, `stores`, `staff` |
| `order_items` | `item_id` (primary key), `order_id`, `product_id`, `quantity`, `unit_price` | trỏ `orders`, `products` |

### (2) "Database của bạn": công ty Sao Mai, 5 table

Người học tự tạo ở Chương 3. Dùng cho bài tập từ Chương 4. Các table dưới ghi data type ở MySQL và Oracle.

`departments`

| Column | MySQL | Oracle | Constraint |
|---|---|---|---|
| `department_id` | `INT` | `NUMBER(4)` | primary key |
| `department_name` | `VARCHAR(50)` | `VARCHAR2(50)` | NOT NULL, UNIQUE |
| `location` | `VARCHAR(50)` | `VARCHAR2(50)` | cho phép NULL |

`employees`

| Column | MySQL | Oracle | Constraint |
|---|---|---|---|
| `employee_id` | `INT AUTO_INCREMENT` | `NUMBER GENERATED BY DEFAULT AS IDENTITY` | primary key |
| `first_name` | `VARCHAR(50)` | `VARCHAR2(50)` | NOT NULL |
| `last_name` | `VARCHAR(50)` | `VARCHAR2(50)` | NOT NULL |
| `email` | `VARCHAR(100)` | `VARCHAR2(100)` | NOT NULL, UNIQUE |
| `hire_date` | `DATE` | `DATE` | NOT NULL |
| `salary` | `DECIMAL(12,0)` | `NUMBER(12,0)` | NOT NULL, CHECK (salary > 0) |
| `status` | `VARCHAR(10)` | `VARCHAR2(10)` | DEFAULT 'active', CHECK (status IN ('active', 'left')) |
| `department_id` | `INT` | `NUMBER(4)` | foreign key tới `departments(department_id)` |
| `manager_id` | `INT` | `NUMBER` | foreign key tới `employees(employee_id)`, cho phép NULL (giám đốc không có sếp) |

`projects`

| Column | MySQL | Oracle | Constraint |
|---|---|---|---|
| `project_id` | `INT` | `NUMBER(6)` | primary key |
| `project_name` | `VARCHAR(100)` | `VARCHAR2(100)` | NOT NULL |
| `start_date` | `DATE` | `DATE` | NOT NULL |
| `end_date` | `DATE` | `DATE` | cho phép NULL, CHECK (end_date IS NULL OR end_date >= start_date) |
| `budget` | `DECIMAL(14,0)` | `NUMBER(14,0)` | CHECK (budget >= 0) |
| `department_id` | `INT` | `NUMBER(4)` | NOT NULL, foreign key tới `departments` |

`assignments` (table trung gian giữa `employees` và `projects`)

| Column | MySQL | Oracle | Constraint |
|---|---|---|---|
| `employee_id` | `INT` | `NUMBER` | foreign key tới `employees`, một phần của primary key |
| `project_id` | `INT` | `NUMBER(6)` | foreign key tới `projects`, một phần của primary key |
| `role` | `VARCHAR(30)` | `VARCHAR2(30)` | NOT NULL, DEFAULT 'member' |
| `hours_per_week` | `INT` | `NUMBER(2)` | CHECK (hours_per_week BETWEEN 1 AND 40) |

Primary key ghép: `PRIMARY KEY (employee_id, project_id)`.

`leave_requests`

| Column | MySQL | Oracle | Constraint |
|---|---|---|---|
| `request_id` | `INT AUTO_INCREMENT` | `NUMBER GENERATED BY DEFAULT AS IDENTITY` | primary key |
| `employee_id` | `INT` | `NUMBER` | NOT NULL, foreign key tới `employees` |
| `leave_type` | `VARCHAR(20)` | `VARCHAR2(20)` | NOT NULL, CHECK (leave_type IN ('annual', 'sick', 'unpaid')) |
| `start_date` | `DATE` | `DATE` | NOT NULL |
| `end_date` | `DATE` | `DATE` | NOT NULL, CHECK (end_date >= start_date) |
| `status` | `VARCHAR(10)` | `VARCHAR2(10)` | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending', 'approved', 'rejected')) |
| `approved_by` | `INT` | `NUMBER` | foreign key tới `employees`, cho phép NULL |

Thứ tự tạo: `departments`, `employees`, `projects`, `assignments`, `leave_requests`. Thứ tự xóa ngược lại.

### (3) Database công ty: 11 table

Bảy table đầu theo schema HR của Oracle (nguồn: oracle-samples/db-sample-schemas, đã đọc ở `docs/coverage-audit.md`). Bốn table bán hàng do dự án tự soạn, nối với HR qua `orders.sales_rep_id`. Dùng cho Chương 7 tới 12.

| Table | Column chính | Foreign key |
|---|---|---|
| `regions` | `region_id` (primary key), `region_name` | không |
| `countries` | `country_id` (primary key), `country_name`, `region_id` | `region_id` trỏ `regions` |
| `locations` | `location_id` (primary key), `street_address`, `postal_code`, `city`, `state_province`, `country_id` | `country_id` trỏ `countries` |
| `departments` | `department_id` (primary key), `department_name`, `manager_id`, `location_id` | `manager_id` trỏ `employees`, `location_id` trỏ `locations` |
| `jobs` | `job_id` (primary key), `job_title`, `min_salary`, `max_salary` | không |
| `employees` | `employee_id` (primary key), `first_name`, `last_name`, `email`, `phone_number`, `hire_date`, `job_id`, `salary`, `commission_pct`, `manager_id`, `department_id` | `job_id` trỏ `jobs`, `manager_id` trỏ chính `employees`, `department_id` trỏ `departments` |
| `job_history` | `employee_id`, `start_date` (hai column này là primary key ghép), `end_date`, `job_id`, `department_id`; CHECK `end_date > start_date` | `employee_id` trỏ `employees`, `job_id` trỏ `jobs`, `department_id` trỏ `departments` |
| `customers` | `customer_id` (primary key), `customer_name`, `email`, `city`, `country_id`, `joined_on` | `country_id` trỏ `countries` |
| `products` | `product_id` (primary key), `product_name`, `category`, `list_price`, `cost` | không |
| `orders` | `order_id` (primary key), `customer_id`, `sales_rep_id`, `order_date`, `status` | `customer_id` trỏ `customers`, `sales_rep_id` trỏ `employees` |
| `order_items` | `order_id`, `line_no` (hai column này là primary key ghép), `product_id`, `quantity`, `unit_price` | `order_id` trỏ `orders`, `product_id` trỏ `products` |

Đường nối dài nhất: `order_items` tới `orders`, tới `employees`, tới `departments`, tới `locations`, tới `countries`, tới `regions`. Cần dữ liệu đủ lớn (vài trăm đơn) để bài xếp hạng và cộng dồn có nghĩa.

## Engine cần thêm gì

Danh sách các câu lệnh và function bài học cần mà `docs/engine.md` chưa có. Chưa kể dữ liệu mẫu mới (database Sao Mai mẫu, database công ty 11 table, bản lưu "database của bạn" trong trình duyệt).

- Chương 2: không cần thêm.
- Chương 3: `DEFAULT` trong CREATE TABLE. `PRIMARY KEY (a, b)` ghép. `CHECK` với `IN` và `BETWEEN`. `ALTER TABLE` (ADD, MODIFY, DROP COLUMN, RENAME COLUMN, ADD CONSTRAINT). `DROP TABLE` (có `IF EXISTS` ở MySQL, `CASCADE CONSTRAINTS` ở Oracle). `TRUNCATE TABLE`. `CREATE SEQUENCE` với `NEXTVAL`, `CURRVAL`. `SHOW TABLES`, `DESCRIBE`, `SHOW CREATE TABLE`. Lệnh `DESC` của tool ở Oracle. Query đọc `USER_TABLES`, `USER_TAB_COLUMNS`, `USER_CONSTRAINTS`, `ALL_TABLES`. `ON DELETE CASCADE`.
- Chương 4: comment `--`, `/* */` và `#` (MySQL). Nhiều câu một lần, ngăn bằng `;`.
- Chương 5: `INSTR`, `LOCATE`, `LPAD`, `RPAD`, `INITCAP` (đã có), `TO_CHAR` và `TO_NUMBER` cho số, `FORMAT` (MySQL), `CAST`, `ADD_MONTHS`, `MONTHS_BETWEEN`, `LAST_DAY`, `TRUNC(d, 'MM')`, `DATE_ADD` với `INTERVAL`, `TIMESTAMPDIFF`, `NVL2`, `DECODE`, `IF()`, `GREATEST`, `LEAST`, `%` (đã có).
- Chương 6: `LISTAGG ... WITHIN GROUP`, `GROUP_CONCAT ... SEPARATOR`, `GROUP BY ROLLUP(...)`, `GROUP BY ... WITH ROLLUP`, `GROUPING()`. `SUM(CASE ...)` kiểm lại.
- Chương 7: `RIGHT JOIN`, `FULL OUTER JOIN`, `CROSS JOIN`, `USING`, `NATURAL JOIN`, dấu `(+)`, điều kiện nối không phải `=` (`BETWEEN`), nối nhiều điều kiện bằng AND. Cảnh báo tích Descartes khi thiếu điều kiện nối.
- Chương 8: subquery trong FROM, subquery phụ thuộc, `EXISTS`, `NOT EXISTS`, `NOT IN (subquery)`, `UNION`, `UNION ALL`, `INTERSECT`, `MINUS`, `EXCEPT` (MySQL 8.0.31), `WITH`. Mã lỗi: 1242 và ORA-01427, ORA-01789.
- Chương 9: window function với `OVER`, `PARTITION BY`, `ORDER BY`: `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `SUM OVER`, `AVG OVER`, `LAG`, `LEAD`. `CREATE VIEW`, `CREATE OR REPLACE VIEW`, `DROP VIEW`, `WITH READ ONLY`.
- Chương 10: `UPDATE ... JOIN` (MySQL), `UPDATE ... SET x = (subquery)`, `DELETE ... WHERE EXISTS`, `SAVEPOINT`, `ROLLBACK TO`, `SELECT ... FOR UPDATE`. Hai phiên chạy cùng lúc để làm cảnh lock (trace giả lập, không cần chạy song song thật). `CREATE TABLE ... AS SELECT`, `INSERT ... SELECT`, `MERGE`, `INSERT ... ON DUPLICATE KEY UPDATE`.
- Chương 11: tên đầy đủ `schema.table` và nhiều schema trong một database. `GRANT`, `REVOKE` và mã lỗi ORA-00942, ORA-01031 (giả lập quyền). `CREATE INDEX`, `EXPLAIN` hoặc `EXPLAIN PLAN` (có thể chỉ là cảnh minh họa). `DATE` có giờ ở Oracle, `TIMESTAMP`, `SYSTIMESTAMP`, `NLS_DATE_FORMAT`. Data dictionary trả đúng tên table và column của database công ty.
- Chương 12: không cần thêm ngoài các mục trên. Cần database công ty đủ lớn.

Ghi chú: các mã lỗi mới ghi ở trên (1050, ORA-00955, ORA-01427, ORA-01789, ORA-00054, ORA-01031, ORA-01722, 1205, 1242, 1142) lấy theo hiểu biết chung, cần đối chiếu `docs/dialect-verification.md` hoặc tài liệu trước khi engine in ra.

