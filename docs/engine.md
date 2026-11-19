# Engine chạy được gì

Dùng file này khi viết query cho bài học và bài tập. Query nằm ngoài danh sách sẽ ra lỗi "khóa học chưa dạy tới".

API: `run(sql, db, dialect)` cho SELECT. `createSession(db, dialect).run(sql)` cho mọi lệnh, giữ trạng thái giữa các lần chạy (xem `src/engine/session.ts`).

## SELECT

- `SELECT [DISTINCT] *`, `t.*`, column, biểu thức, alias bằng `AS` hoặc viết liền sau.
- `FROM table [alias]`. Oracle không nhận `AS` trước alias của table. `FROM DUAL`. MySQL cho `SELECT` không có FROM.
- `[INNER] JOIN ... ON ...`, `LEFT [OUTER] JOIN ... ON ...`, nối nhiều table. Nối kiểu cũ bằng dấu phẩy và điều kiện trong WHERE cũng chạy. Chưa có: RIGHT JOIN, FULL JOIN, CROSS JOIN, NATURAL, USING.
- `WHERE`: `= <> != < <= > >=`, AND, OR, NOT, `IN (danh sách)`, `IN (subquery)`, BETWEEN, LIKE với `%` và `_`, IS NULL, IS NOT NULL.
- `GROUP BY` một hay nhiều biểu thức. `HAVING`. COUNT(*), COUNT(column), COUNT(DISTINCT column), SUM, AVG, MIN, MAX.
- Column đứng ngoài function gom mà không nằm trong GROUP BY: Oracle báo ORA-00979 (có GROUP BY) hoặc ORA-00937 (không có GROUP BY); MySQL báo 1055 hoặc 1140. Riêng MySQL cho chọn column khác của một table khi đã GROUP BY primary key của table đó.
- Function gom trong WHERE: MySQL 1111, Oracle ORA-00934.
- `ORDER BY` nhiều biểu thức, ASC, DESC, theo alias, theo số thứ tự column. Oracle có `NULLS FIRST`, `NULLS LAST`.
- MySQL: `LIMIT n`, `LIMIT m, n`, `LIMIT n OFFSET m`. Oracle: `FETCH FIRST n ROWS ONLY`, `OFFSET m ROWS FETCH NEXT n ROWS ONLY`, và `ROWNUM` trong WHERE (ROWNUM được gán trước ORDER BY).
- Scalar subquery không phụ thuộc query bên ngoài: `WHERE price > (SELECT AVG(price) FROM products)`. Chưa có: subquery trong FROM, subquery nhắc tới table bên ngoài, EXISTS, UNION, window function, CAST.
- `CASE WHEN ... THEN ... ELSE ... END`, `CASE x WHEN ...`.
- Phép tính `+ - * /`. MySQL có `%` và `MOD`; Oracle chỉ có `MOD(a, b)`. Chia cho 0: MySQL ra NULL, Oracle báo ORA-01476.

## Function

| Việc | MySQL | Oracle |
|---|---|---|
| Chữ hoa, chữ thường | UPPER, LOWER | UPPER, LOWER, INITCAP |
| Độ dài | LENGTH (đếm byte), CHAR_LENGTH (đếm ký tự) | LENGTH (đếm ký tự) |
| Cắt chuỗi | SUBSTR, SUBSTRING, LEFT, RIGHT | SUBSTR |
| Bỏ dấu cách, thay chữ | TRIM, LTRIM, RTRIM, REPLACE | TRIM, LTRIM, RTRIM, REPLACE |
| Nối chuỗi | CONCAT(a, b, c...). Có NULL thì ra NULL. `\|\|` là OR | `a \|\| b`. CONCAT chỉ nhận 2 tham số. NULL coi như chuỗi rỗng |
| Số | ABS, ROUND, FLOOR, CEIL, CEILING, TRUNCATE, MOD | ABS, ROUND, FLOOR, CEIL, TRUNC, MOD |
| Thay NULL | IFNULL, COALESCE, NULLIF | NVL, COALESCE, NULLIF |
| Bây giờ | NOW(), CURDATE(), CURRENT_DATE | SYSDATE, CURRENT_DATE (viết không ngoặc) |
| Định dạng ngày | DATE_FORMAT(d, '%Y-%m-%d %H:%i') | TO_CHAR(d, 'YYYY-MM-DD HH24:MI') |
| Chuỗi thành ngày | STR_TO_DATE(s, '%d/%m/%Y'), hoặc so thẳng với chuỗi ISO | TO_DATE(s, 'DD/MM/YYYY'), `DATE '2026-03-02'`. So ngày với chuỗi báo ORA-01861 |
| Cắt phần giờ | DATE(d) | TRUNC(d) |
| Lấy một phần | YEAR, MONTH, DAY, HOUR, EXTRACT(YEAR FROM d) | EXTRACT(YEAR FROM d), TO_CHAR |
| Khoảng cách ngày | DATEDIFF(a, b) | `a - b` ra số ngày, `d + 7` cộng 7 ngày |

"Bây giờ" của engine cố định là 2026-03-09 10:30:00. Chuỗi rỗng `''` là NULL ở Oracle. MySQL so chữ không phân biệt hoa thường và dấu; Oracle có phân biệt.

## Sửa dữ liệu (chỉ qua `createSession`)

- `INSERT INTO t [(columns)] VALUES (...)`. MySQL nhận nhiều row trong một câu; Oracle 19c thì không (ORA-00933).
- `UPDATE t SET c = biểu thức [, ...] [WHERE ...]`, `DELETE FROM t [WHERE ...]`.
- `COMMIT`, `ROLLBACK`. MySQL tự lưu sau mỗi lệnh, trừ khi đã `START TRANSACTION` hoặc `BEGIN`. Oracle giữ thay đổi ở trạng thái chờ tới khi COMMIT.
- `CREATE TABLE` với data type của từng dialect, NOT NULL, UNIQUE, PRIMARY KEY, CHECK, FOREIGN KEY/REFERENCES, AUTO_INCREMENT (MySQL), GENERATED AS IDENTITY (Oracle).
- Lỗi constraint: trùng primary key hoặc UNIQUE (1062, ORA-00001), NULL vào column NOT NULL (1048, ORA-01400, ORA-01407), sai CHECK (3819, ORA-02290), foreign key trỏ vào row không có (1452, ORA-02291), xóa row đang có row khác trỏ tới (1451, ORA-02292), sai số giá trị (1136, ORA-00947, ORA-00913).
