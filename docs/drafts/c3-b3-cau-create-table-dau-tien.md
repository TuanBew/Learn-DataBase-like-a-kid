# Bài C3-B3: Câu CREATE TABLE đầu tiên

Bản nháp chờ duyệt. Chương 3 "Tạo table từ A đến Z", bài 3. Khoảng 15 phút. Dạy MySQL trước, Oracle ở thẻ riêng. Chưa dạy primary key và constraint (bài 4, 5), chưa dạy INSERT (bài 8).

Tiêu đề bài: Câu CREATE TABLE đầu tiên
Lead: Bạn tự viết một câu tạo table, chạy nó, rồi sửa ba lỗi hay gặp.

## Bạn sẽ học

- Viết câu CREATE TABLE từ tờ ghi chép column và data type
- Chạy câu đó và thấy table rỗng hiện ra
- Đọc lỗi khi thiếu dấu phẩy
- Xử lý lỗi table đã tồn tại và lỗi data type viết sai

## Câu chuyện

Ở bài 1, bạn ghi lên giấy những thứ công ty Sao Mai cần nhớ về phòng ban. Mỗi phòng có một mã, một tên và một nơi đặt.

Ở bài 2, bạn chọn data type cho từng thứ. Mã phòng là số nguyên. Tên phòng và nơi đặt là chữ, tối đa 50 ký tự.

Tờ giấy đã đủ. Nhưng database không đọc được chữ viết tay.

Bi nói: "Mình chỉ hiểu SQL. Bạn dịch tờ giấy thành một câu SQL, mình sẽ dựng table ra cho bạn xem."

Câu SQL đó có tên riêng. Bạn sẽ gõ nó ngay bây giờ.

## Tự bấm

Cảnh tên gợi ý: `create-table-lab`. Màn hình chia ba vùng. Trên điện thoại, ba vùng xếp thành ba thẻ chồng lên nhau.

- Vùng trái, tên "Tờ ghi chép của bạn". Có ba mục lấy từ bài 1 và bài 2: "mã phòng, số nguyên", "tên phòng, chữ tối đa 50", "nơi đặt, chữ tối đa 50".
- Vùng giữa là ô gõ SQL và nút Chạy. Ô gõ có sẵn một khung để trống. Có nút đổi MySQL và Oracle.
- Vùng phải, tên "Database của bạn". Lúc đầu ghi "Chưa có table nào".

Bước 1. Người học đọc tờ ghi chép.
Bi nói: "Đây là tờ ghi chép của bạn. Mình sẽ dịch từng mục sang SQL."

Bước 2. Người học gõ tên table.
Bi nói: "Gõ CREATE TABLE, cách một dấu cách, rồi gõ departments và mở ngoặc."
Gõ đúng thì tiêu đề tờ ghi chép sáng lên và có mũi tên chỉ sang chữ departments. Bi nói: "Tên table đứng ngay sau CREATE TABLE."

Bước 3. Người học gõ column đầu tiên.
Bi nói: "Gõ department_id, dấu cách, rồi data type. Gõ xong thì thêm dấu phẩy và bấm Enter."
Mỗi column gõ đúng thì mục tương ứng ở tờ ghi chép sáng xanh. Bi nói: "Mỗi column có hai phần: tên, rồi data type."

Bước 4. Người học gõ nốt hai column còn lại và đóng ngoặc.
Bi nói: "Column cuối không có dấu phẩy. Gõ xong thì đóng ngoặc và bấm Chạy."
Vùng phải hiện một thẻ table tên departments. Thẻ có ba tên column và nhãn "0 row". Bi nói: "Table có rồi. Chưa có row nào, giống cuốn sổ mới mua."

Bước 5. Người học bấm nút "Xem table". Nút này chạy `SELECT * FROM departments`.
Kết quả hiện ba tên column và không có row nào. Bi nói: "Table rỗng vẫn có tên column. Row sẽ đến ở bài 8."

Bước 6, lỗi một: thiếu dấu phẩy. Người học bấm nút "Nạp câu hỏng 1". Ô gõ hiện câu thiếu dấu phẩy giữa `name` và `location`.
Bi nói: "Bấm Chạy và xem DBMS nói gì."
Khung lỗi màu đỏ hiện lên. Cảnh gạch chân chữ `location` mà MySQL chỉ tới.
Bi nói: "DBMS chỉ vào chữ location. Lỗi nằm ngay trước chữ đó. Sửa xong thì bấm Chạy."
Người học thêm dấu phẩy sau `VARCHAR(50)` rồi Chạy. Chạy đúng thì thẻ departments hiện ra. Bi nói: "Đúng rồi. Dấu phẩy ngăn cách các column."

Bước 7, lỗi hai: table đã tồn tại. Người học bấm Chạy lần nữa với câu đúng.
Khung lỗi hiện mã 1050 (MySQL) hoặc ORA-00955 (Oracle). Bi nói: "Table departments đã có từ lần chạy trước. Database không tạo hai table cùng tên."
Bi nói tiếp: "Đổi tên thành departments_copy rồi bấm Chạy."
Người học đổi tên và Chạy. Vùng phải hiện hai thẻ. Bi nói: "Tên mới thì chạy được. Bấm Làm lại từ đầu để xóa cả hai."
Nút "Làm lại từ đầu" đặt lại database luyện tập về trống. Cảnh dùng nút này, chưa dùng lệnh xóa table. Lệnh xóa table để dành bài 10.

Bước 8, lỗi ba: data type viết sai. Người học bấm "Nạp câu hỏng 2". Ô gõ hiện `name VARCHR(50)` (MySQL) hoặc `name VARCHR2(50)` (Oracle).
Bi nói: "Bấm Chạy và đọc lỗi."
Khung lỗi hiện: MySQL báo 1064 và chỉ vào `VARCHR(50)`; Oracle báo ORA-00902. Bi nói: "DBMS không đoán chữ bạn gõ sai. Sửa data type cho đúng rồi Chạy lại."
Người học sửa thành VARCHAR hoặc VARCHAR2 rồi Chạy. Chạy đúng thì Bi nói: "Xong ba lỗi. Lần sau thấy lỗi, bạn biết đọc từ đâu."

## Lý thuyết

**[[create-table]]** là lệnh tạo một table mới.

Câu CREATE TABLE ghi tên table trước. Sau đó là danh sách column nằm trong cặp ngoặc tròn.

Mỗi column viết theo mẫu: tên column, dấu cách, data type. Ví dụ `name VARCHAR(50)`.

Dấu phẩy ngăn các column với nhau. Column cuối cùng không có dấu phẩy.

Thứ tự column trong câu là thứ tự column khi bạn SELECT *.

Quy ước tên: chữ thường, không dấu, nối bằng dấu gạch dưới. Ví dụ `department_id`.

Table mới tạo chưa có row nào. SELECT * chỉ trả về tên column.

Mỗi tên table chỉ dùng một lần trong một database. Tên đã có thì DBMS từ chối.

Khi câu viết sai, DBMS không chạy gì cả. Table không hiện ra, kể cả một nửa.

**[[error-code]]** là con số DBMS gửi kèm lời báo lỗi. Tra con số này là cách nhanh nhất để hiểu lỗi.

MySQL hay chỉ vào chữ đứng sau chỗ sai, sau cụm "near". Lỗi thường nằm ngay trước chữ đó.

Ba lỗi trong bài này gặp nhiều nhất khi mới tập tạo table. Mã lỗi của chúng:

| Lỗi | MySQL | Oracle |
|---|---|---|
| Thiếu dấu phẩy | 1064 | ORA-00907 hoặc ORA-00922 (cần kiểm tài liệu) |
| Table đã tồn tại | 1050 | ORA-00955 |
| Data type viết sai | 1064 | ORA-00902 (cần kiểm tài liệu) |

## Thử tay ngay

Cảnh dùng ô SQL ở chế độ session, giữ table giữa các lần Chạy. Có nút "Làm lại từ đầu".

Intro: "Bấm Chạy. Query tạo table departments, rồi bạn xem table đó."

Query chính (chạy hai lệnh theo thứ tự):

```sql
CREATE TABLE departments (
  department_id INT,
  name VARCHAR(50),
  location VARCHAR(50)
);

SELECT * FROM departments;
```

Thử đổi:

1. Thêm column thứ tư `phone VARCHAR(20)` sau `location`. Nhớ thêm dấu phẩy sau `location VARCHAR(50)`.

```sql
CREATE TABLE departments (
  department_id INT,
  name VARCHAR(50),
  location VARCHAR(50),
  phone VARCHAR(20)
);
```

2. Đổi `location VARCHAR(50)` thành `budget DECIMAL(12,2)`. Table có một column số thập phân.

```sql
CREATE TABLE departments (
  department_id INT,
  name VARCHAR(50),
  budget DECIMAL(12,2)
);
```

3. Viết cả câu liền nhau, không bấm Enter. DBMS không quan tâm chỗ ngắt.

```sql
CREATE TABLE departments (department_id INT, name VARCHAR(50), location VARCHAR(50));
```

4. Viết chữ thường hết: `create table`, `int`, `varchar`. Câu vẫn chạy.

```sql
create table departments (department_id int, name varchar(50), location varchar(50));
```

Bi nói: "Table nào hiện ra cũng rỗng, vì mình chưa nhận row nào. Chỗ ngắt và chữ hoa chữ thường chỉ để bạn đọc cho dễ."

## Oracle viết thế này

Oracle khác MySQL ở ba chỗ.

Data type: Oracle dùng NUMBER cho số và VARCHAR2 cho chữ. DATE dùng giống MySQL. Oracle nhận cả `INT` và `VARCHAR`, nhưng code Oracle ở công ty viết NUMBER và VARCHAR2. Khóa học dùng hai chữ này cho Oracle.

Lưu lệnh: CREATE TABLE ở Oracle tự COMMIT. Bạn không cần gõ thêm COMMIT, và không ROLLBACK lại được.

Xem cấu trúc table: lệnh `DESC departments` ở Oracle là lệnh của tool như SQL*Plus hay SQL Developer. Server không nhận lệnh này như một câu SQL. MySQL thì `DESC` là lệnh SQL thật.

Tên table: Oracle lưu tên thành chữ hoa nếu bạn không đặt trong ngoặc kép. Bạn gõ `departments`, Oracle ghi `DEPARTMENTS`. Query vẫn gõ chữ thường được.

```sql
-- MySQL
CREATE TABLE departments (
  department_id INT,
  name VARCHAR(50),
  location VARCHAR(50)
);

-- Oracle
CREATE TABLE departments (
  department_id NUMBER,
  name VARCHAR2(50),
  location VARCHAR2(50)
)
```

Mã lỗi: table đã tồn tại thì Oracle báo ORA-00955. Data type sai thì ORA-00902 (cần kiểm tài liệu). Thiếu dấu phẩy thì ORA-00907 hoặc ORA-00922 (cần kiểm tài liệu).

## Kiểm tra nhanh

**Câu 1.** Câu CREATE TABLE có hai column mà thiếu dấu phẩy giữa chúng. Chuyện gì xảy ra?

- A. Database tạo table với column đầu rồi bỏ qua column sau. Phản hồi: "Không có table nào hiện ra. Câu viết sai thì database không chạy gì cả."
- B. Database báo lỗi và không tạo table. [đúng] Phản hồi: "Đúng. MySQL báo 1064 và chỉ vào chữ sau chỗ sai."
- C. Database tự thêm dấu phẩy. Phản hồi: "Database không đoán ý bạn. Câu sai thì database dừng lại và báo lỗi."

**Câu 2.** Bạn chạy một câu CREATE TABLE departments hai lần liên tiếp. Lần hai ra sao?

- A. Table có hai bản và mỗi bản một nửa dữ liệu. Phản hồi: "Table chưa có row nào, và database không tạo hai table cùng tên."
- B. Lần hai ghi đè table cũ thành table mới. Phản hồi: "Database không ghi đè. Muốn xóa table cũ, bạn phải có lệnh riêng ở bài 10."
- C. Lần hai báo lỗi 1050 trên MySQL hoặc ORA-00955 trên Oracle. [đúng] Phản hồi: "Đúng. Table departments đã có từ lần một, nên tên này bị chiếm."
- D. Lần hai chạy thành công và không đổi gì. Phản hồi: "Lần hai báo lỗi, không im lặng. Database nói rõ tên đã có."

**Câu 3.** Bạn viết `name VARCHR(50)`. Bạn thấy gì?

- A. Database hiểu là VARCHAR và tạo table. Phản hồi: "Database không đoán chữ gõ sai. Data type phải đúng từng chữ."
- B. Database báo lỗi. MySQL chỉ vào VARCHR, Oracle báo ORA-00902. [đúng] Phản hồi: "Đúng. Đọc lỗi, sửa data type, rồi bấm Chạy lại."
- C. Table hiện ra nhưng column name để trống. Phản hồi: "Câu sai thì không có table nào hiện ra."

## Bài tập của bài

1. Tạo table `meeting_rooms` có `room_id` (số nguyên), `room_name` (chữ tối đa 30) và `capacity` (số nguyên).
2. Tạo table `holidays` có `holiday_date` (ngày), `holiday_name` (chữ tối đa 60). Viết cho cả MySQL và Oracle.
3. Câu CREATE TABLE cho table `equipment` đang có hai lỗi: thiếu một dấu phẩy và một data type viết sai. Tìm cả hai lỗi và sửa. Máy chấm kiểm table cuối cùng có đủ column và đúng data type.

## Ngoài đời

Một bạn mới vào công ty nhận một file script có sẵn câu CREATE TABLE. Bạn chạy script trên database thử và nó chạy ổn.

Hôm sau bạn chạy lại script đó vì nghĩ mình quên lưu. Database báo ORA-00955 vì table đã có từ hôm qua.

Bạn không cần sửa gì. Lỗi này chỉ báo table đã tồn tại. Bạn đọc mã lỗi, hiểu ngay chuyện gì xảy ra và chuyển sang bước tiếp theo.

## Ý chính

- CREATE TABLE ghi tên table, rồi liệt kê từng column kèm data type trong ngoặc tròn.
- Dấu phẩy ngăn các column. Column cuối không có dấu phẩy.
- Table mới tạo rỗng. Mỗi tên table chỉ dùng một lần.
- Lỗi thì đọc mã lỗi trước. MySQL chỉ vào chữ đứng sau chỗ sai.
