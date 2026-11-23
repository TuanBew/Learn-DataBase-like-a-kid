# Kiểm tra bảng dialect với tài liệu chính thức

Ngày: 2026-11-19. Nguồn: MySQL 8.0 Reference Manual và Oracle Database 19c SQL Language Reference, đọc bằng `curl` (tất cả HTTP 200, trừ các URL ghi rõ). Mọi câu trích là nguyên văn tiếng Anh. Điều tài liệu không nói rõ thì ghi "tài liệu không nói rõ".

Viết tắt link: **M** = `https://dev.mysql.com/doc/refman/8.0/en/`, **O** = `https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/`, **E** = `https://docs.oracle.com/en/error-help/db/`.

Tóm tắt: 17 dòng của bảng gốc. 13 dòng đúng, 4 dòng cần chỉnh (2 nối chuỗi, 9 so sánh chữ, 11 tên table và column, 16 lưu thay đổi). Một số vế chi tiết chưa kiểm được, liệt kê ở cuối file.

## Bảng mục 7 của PROMPT.md

| # | Chủ đề | Kết luận | Hành vi theo tài liệu | Link và trích dẫn |
|---|---|---|---|---|
| 1 | Lấy n row đầu | đúng | MySQL: `LIMIT row_count` bằng `LIMIT 0, row_count`; `LIMIT offset, row_count` và `row_count OFFSET offset` đều hợp lệ, offset đầu tiên là 0. Oracle: `OFFSET m ROWS FETCH NEXT n ROWS ONLY`; FIRST/NEXT và ROW/ROWS dùng thay nhau; bỏ rowcount thì lấy 1 row; rowcount vượt số row còn lại thì trả hết phần còn lại. ROWNUM có trong tài liệu, nhưng Oracle khuyên dùng row_limiting_clause. | M `select.html`: "LIMIT row_count is equivalent to LIMIT 0, row_count". O `SELECT.html` (mục row_limiting_clause): "If you do not specify rowcount or percent PERCENT, then 1 row is returned." O `ROWNUM-Pseudocolumn.html`: "The row_limiting_clause of the SELECT statement provides superior support for limiting the number of rows returned" |
| 2 | Nối chuỗi | cần chỉnh | Phần gốc đúng: `\|\|` là OR mặc định ở MySQL, CONCAT của Oracle chỉ nhận 2 tham số (sơ đồ cú pháp: `CONCAT ( char1 , char2 )`). Thiếu: MySQL CONCAT trả NULL nếu có tham số NULL. Oracle coi chuỗi rỗng là NULL nhưng nối với toán hạng khác thì ra toán hạng đó; CONCAT tương đương `\|\|`. | M `string-functions.html`: "CONCAT() returns NULL if any argument is NULL." M `sql-mode.html`: "Treat \|\| as a string concatenation operator (same as CONCAT()) rather than as a synonym for OR." O `Concatenation-Operator.html`: "concatenating a zero-length character string with another operand always results in the other operand". O `CONCAT.html`: "This function is equivalent to the concatenation operator (\|\|)." |
| 3 | Thay NULL | đúng | IFNULL(expr1, expr2) ở MySQL, NVL(expr1, expr2) ở Oracle, COALESCE ở cả hai. COALESCE của Oracle bắt buộc từ 2 biểu thức trở lên. | M `flow-control-functions.html`: "If expr1 is not NULL, IFNULL() returns expr1; otherwise it returns expr2." O `NVL.html`: "If expr1 is null, then NVL returns expr2." O `COALESCE.html`: "You must specify at least two expressions." M `comparison-operators.html`: "Returns the first non-NULL value in the list" |
| 4 | Ngày giờ hiện tại | đúng | MySQL: NOW() trả datetime theo múi giờ session; CURDATE() trả ngày, CURRENT_DATE là từ đồng nghĩa của CURDATE (dùng được ở MySQL luôn). Oracle: SYSDATE lấy giờ hệ điều hành của server, kiểu DATE (có giờ); CURRENT_DATE lấy theo múi giờ session. | M `date-and-time-functions.html`: "CURRENT_DATE(), CURRENT_DATE Synonyms for CURDATE()". O `SYSDATE.html`: "SYSDATE returns the current date and time set for the operating system on which the database server resides." O `CURRENT_DATE.html`: "CURRENT_DATE returns the current date in the session time zone" |
| 5 | Định dạng ngày | đúng | MySQL `DATE_FORMAT(date, format)` dùng `%Y` (năm 4 số) và `%m` (tháng 00..12). Oracle `TO_CHAR(datetime, fmt)` trả VARCHAR2, fmt kiểu `YYYY`. Bản ghi chi tiết từng format element của Oracle ở trang Format Models, chưa đọc. | M `date-and-time-functions.html`: "%Y Year, numeric, four digits". O `TO_CHAR-datetime.html`: "TO_CHAR (datetime) converts a datetime or interval value ... to a value of VARCHAR2 data type in the format specified by the date format fmt" |
| 6 | Chuỗi thành ngày | đúng | MySQL: `STR_TO_DATE(str, format)`; cũng có `DATE 'str'` (MySQL nhận nhưng không bắt buộc). Oracle: `TO_DATE(char, fmt)` và ANSI literal `DATE 'YYYY-MM-DD'` (không có phần giờ). Oracle khuyên luôn đưa format vào TO_DATE. | M `date-and-time-functions.html`: "This is the inverse of the DATE_FORMAT() function." M `date-and-time-literals.html`: "DATE 'str'". O `Literals.html`: "The ANSI date literal contains no time portion, and must be specified in the format 'YYYY-MM-DD'." O `TO_DATE.html`: "TO_DATE converts char to a value of DATE data type." |
| 7 | SELECT không cần table | đúng | MySQL không bắt buộc FROM, và cho phép `FROM DUAL`. Oracle 19c: sơ đồ query_block có FROM không nằm trong nhánh tùy chọn, tức bắt buộc; Oracle 23 ghi FROM là tùy chọn và có ví dụ bỏ FROM. ORA-00923 có nghĩa "FROM keyword not found where expected" (hợp với `SELECT 1 + 1` thiếu FROM). Tài liệu không nói rõ câu `SELECT 1 + 1` cụ thể ra mã nào, chỉ nói ORA-00923 khi thiếu FROM sau select list. | M `select.html`: "MySQL does not require FROM DUAL if no tables are referenced." O 19c `Selecting-from-the-DUAL-Table.html`: "Selecting from the DUAL table is useful for computing a constant expression with the SELECT statement." O 23 `.../database/oracle/oracle-database/23/sqlrf/SELECT.html`: "From Release 23 you can omit the optional FROM clause". E `ora-00923/`: "The keyword FROM must follow the last selected item in a SELECT statement" |
| 8 | Chuỗi rỗng | đúng | Oracle coi chuỗi dài 0 là NULL, và Oracle cảnh báo hành vi này có thể đổi ở bản sau. MySQL: `''` là giá trị, không phải NULL (`'' IS NULL` ra 0). | O `Nulls.html`: "Oracle Database treats a character value with a length of zero as null." M `working-with-null.html`: "These are in fact values, whereas NULL means "not having a value."" |
| 9 | So sánh chữ | cần chỉnh nhẹ | MySQL 8 mặc định server là utf8mb4 và utf8mb4_0900_ai_ci, nên `'Hà' = 'ha'` đúng. Cần ghi thêm: đó là mặc định, đổi được bằng COLLATE; collation NO PAD nên `'a' = 'a '` sai. Oracle: collation mặc định là binary nên phân biệt hoa thường và dấu; đổi được bằng NLS_SORT/NLS_COMP (không đọc kỹ ở đây). Chữ `đ` có bằng `d` ở collation 0900_ai_ci không: tài liệu không nói rõ (xem phần câu hỏi). | M `charset-server.html`: "By default, these are utf8mb4 and utf8mb4_0900_ai_ci". M `charset-unicode-sets.html`: "is accent-insensitive and case-insensitive. These characteristics are indicated by _0900, _ai, and _ci". M `case-sensitivity.html`: "comparisons are case-insensitive by default". O `Data-Type-Comparison-Rules.html`: "In binary collation, which is the default, Oracle compares character values like binary values." |
| 10 | Dấu nháy | đúng | MySQL: chuỗi nằm trong nháy đơn hoặc nháy kép; tên dùng backtick; chế độ ANSI_QUOTES đổi nháy kép thành tên. Oracle: ký tự chuỗi nằm trong nháy đơn; nháy kép bao tên (quoted identifier). | M `string-literals.html`: "enclosed within either single quote (') or double quote (") characters". M `identifiers.html`: "The identifier quote character is the backtick (`)". O `Literals.html`: "Character literals are enclosed in single quotation marks". O `Database-Object-Names-and-Qualifiers.html`: "A quoted identifier begins and ends with double quotation marks (")." |
| 11 | Tên table và column | cần chỉnh | Oracle: tên không có nháy kép không phân biệt hoa thường và được hiểu là chữ hoa; có nháy kép thì phân biệt. Tiêu đề kết quả in hoa là hành vi của tool hiển thị, tài liệu SQL Reference không nói rõ. MySQL "giữ như lúc viết" chưa đúng hết: tên column, index, alias của column không phân biệt hoa thường ở mọi nền tảng; tên table phụ thuộc hệ điều hành và biến `lower_case_table_names` (Unix phân biệt, Windows không); alias của table phân biệt trên Unix. Sửa dòng gốc thành: "MySQL: column không phân biệt hoa thường, table tùy hệ điều hành. Tiêu đề kết quả in đúng chữ đã gõ" (vế tiêu đề: tài liệu không nói rõ). | O `Database-Object-Names-and-Qualifiers.html`: "Nonquoted identifiers are not case sensitive. Oracle interprets them as uppercase. Quoted identifiers are case sensitive." M `identifier-case-sensitivity.html`: "column, index, stored routine, event, and resource group names are not case-sensitive on any platform, nor are column aliases." |
| 12 | Alias của table | đúng | MySQL: cú pháp `[[AS] alias]`. Oracle: sơ đồ table_reference chỉ có `t_alias` tùy chọn, không có AS (đọc từ hình sơ đồ). Tài liệu không nói rõ mã lỗi khi viết AS. Ngược lại, alias của column ở Oracle cho phép AS. | M `join.html`: "[[AS] alias]". O `SELECT.html` (sơ đồ table_reference.gif, ảnh): chỉ có hộp `t_alias`. O `SELECT.html`, mục c_alias: "The AS keyword is optional." (áp cho column alias) |
| 13 | NULL khi sắp xếp tăng dần | đúng | MySQL: NULL đầu tiên khi ASC, cuối khi DESC. Oracle: NULLS LAST mặc định cho ASC, NULLS FIRST mặc định cho DESC. | M `working-with-null.html`: "NULL values are presented first if you do ORDER BY ... ASC and last if you do ORDER BY ... DESC." O `SELECT.html`: "NULLS LAST is the default for ascending order, and NULLS FIRST is the default for descending order." |
| 14 | data type hay gặp | đúng | MySQL có INT, DECIMAL, VARCHAR, DATE, DATETIME. Oracle có NUMBER, VARCHAR2, DATE (lưu cả giờ, đến giây), TIMESTAMP. | O `Data-Types.html`: "The DATE data type stores date and time information." O `Data-Types.html`: "TIMESTAMP [(fractional_seconds_precision)]". M `data-types.html` (mục lục): "The DATE, DATETIME, and TIMESTAMP Types", "Fixed-Point Types (Exact Value) - DECIMAL, NUMERIC", "The CHAR and VARCHAR Types" |
| 15 | Tự tăng id | đúng | MySQL: thuộc tính `AUTO_INCREMENT`. Oracle: identity column, cú pháp đầy đủ `GENERATED [ALWAYS \| BY DEFAULT [ON NULL]] AS IDENTITY`; viết `GENERATED AS IDENTITY` thì mặc định là ALWAYS (INSERT gán id thủ công sẽ lỗi). | M `example-auto-increment.html`: "The AUTO_INCREMENT attribute can be used to generate a unique identity for new rows" O `CREATE-TABLE.html`: "The identity column will be assigned an increasing or decreasing integer value from a sequence generator for each subsequent INSERT statement." và "If you specify ALWAYS ... This is the default." |
| 16 | Lưu thay đổi | cần chỉnh | MySQL đúng: autocommit mặc định bật. Oracle: tài liệu SQL Reference không nói tool nào chờ COMMIT (đó là hành vi của client như SQL*Plus, chưa kiểm được). Điều tài liệu nói: thay đổi chưa COMMIT thì người khác không thấy, và mọi câu DDL (như CREATE TABLE) tự COMMIT ngầm trước và sau. Nên thêm ý DDL vào bài học Oracle. | M `commit.html`: "By default, MySQL runs with autocommit mode enabled." O `COMMIT.html`: "After any data definition language (DDL) statement that completes without an error" (Oracle issues an implicit COMMIT) |
| 17 | Mã lỗi hay gặp | đúng | MySQL: 1064 ER_PARSE_ERROR ("%s near '%s' at line %d"), 1146 ER_NO_SUCH_TABLE ("Table '%s.%s' doesn't exist"), 1054 ER_BAD_FIELD_ERROR ("Unknown column '%s' in '%s'"). Oracle: 00933 "SQL command not properly ended", 00942 "table or view does not exist", 00904 "invalid identifier", 00923 "FROM keyword not found where expected", 00936 "missing expression", 00979 "not a GROUP BY expression", 01722 "invalid number". Ghi chú: trang E hiện đặt tiêu đề kiểu mới ("unexpected keyword at or near keyword_value") và liệt kê câu cổ điển ở phần sau trên cùng trang, tab 19c. Engine dùng câu cổ điển, khớp. | M `https://dev.mysql.com/doc/mysql-errors/8.0/en/server-error-reference.html`: "Error number: 1146; Symbol: ER_NO_SUCH_TABLE; SQLSTATE: 42S02". E `ora-00933/`: "SQL command not properly ended". E `ora-00936/`: "missing expression". E `ora-00979/` và `ora-01722/` có câu cổ điển "not a GROUP BY expression", "invalid number". |

## Chi tiết cho engine (14 câu hỏi)

1. **Collation `utf8mb4_0900_ai_ci`: 'Hà' = 'ha' đúng; 'đ' có bằng 'd' không.**
   'Hà' = 'ha' đúng: collation accent-insensitive và case-insensitive (M `charset-unicode-sets.html`: "is accent-insensitive and case-insensitive"). 'đ' bằng 'd': **tài liệu không nói rõ**. Trang chỉ nhắc `Đ` như một chữ riêng của collation Croatian (tailoring), và không nêu bảng trọng số cho `đ` ở collation không theo ngôn ngữ. Engine đang coi `đ` khác `d`: chưa kiểm được, giữ nguyên, cần chạy MySQL 8 thật hoặc đọc bảng UCA 9.0.0 (unicode.org, ngoài danh sách host cho phép).
2. **MySQL: `''` khác NULL, NULL xếp đầu khi ASC.** Đúng. M `working-with-null.html`. Xem bảng dòng 8, 13.
3. **Mã lỗi MySQL 1064 / 1146 / 1054 / 1065 / 1305.** Đúng. M server-error-reference: 1065 "Query was empty"; 1305 "%s %s does not exist" (dùng khi gọi function không có, ví dụ NVL ở MySQL; engine in "FUNCTION trasua.NVL does not exist", khớp mẫu).
4. **Oracle ORA-00909 (CONCAT 3 tham số).** Trang E `ora-00909/`: "A function was called with an incorrect number of arguments." Khớp test. Tài liệu CONCAT 19c chỉ định 2 tham số (sơ đồ), nên đúng.
5. **Oracle ORA-00904 (IFNULL, tên sai), ORA-00923, ORA-00936, ORA-01756.** Đúng theo trang E. ORA-01756: "A quoted string must be terminated with a single quote mark (')." ORA-00936: "This message was also issued in cases where a reserved word was misused, as in SELECT TABLE."
6. **Oracle FETCH FIRST / OFFSET.** Xem bảng dòng 1. Đúng. Lưu ý: tài liệu cho phép `FETCH FIRST ROW ONLY` và mặc định 1 row.
7. **MySQL LIMIT m, n và OFFSET vượt quá số row.** LIMIT m, n: M `select.html`: "LIMIT 5,10; # Retrieve rows 6-15". OFFSET vượt quá: tài liệu MySQL không nói rõ kết quả rỗng hay phần còn lại (suy ra từ ví dụ `LIMIT 95,18446744073709551615` là lấy từ row 96 đến cuối). Với Oracle: "If rowcount is greater than the number of rows available beginning at row offset + 1, then all available rows are returned."
8. **MySQL `||` là OR, PIPES_AS_CONCAT.** Đúng. M `logical-operators.html`: "OR, ||  Logical OR"; M `sql-mode.html` như dòng 2. Test `0 || 1` bằng 1 khớp.
9. **Oracle 23ai/26ai SELECT không cần FROM.** Đúng, xem dòng 7. Trang 23 ghi "From Release 23 you can omit the optional FROM clause". Trang 19c cùng tên không có câu này và sơ đồ bắt buộc FROM.
10. **MySQL DUAL, SELECT không FROM.** Đúng, xem dòng 7. Test `SELECT 1 FROM DUAL` ở MySQL hợp lệ.
11. **`%` ở MySQL là modulo, ở Oracle phải dùng MOD.** MySQL: `N % M` và `MOD(N,M)` đều là modulo (M `arithmetic-functions.html`: "Modulo operation. Returns the remainder of N divided by M."). Oracle: tài liệu liệt kê `+ - * /` là toán tử số học, không có `%` (O `Arithmetic-Operators.html`). Mã lỗi khi gõ `%`: **tài liệu không nói rõ** (engine báo ORA-00911 tại ký tự `%`; chưa kiểm được).
12. **Oracle tên không nháy thành chữ hoa; alias table không AS; chuỗi rỗng là NULL.** Đúng, xem dòng 11, 12, 8. Tiêu đề biểu thức không alias (`PRICE*2` ở Oracle, `price * 2` ở MySQL): **tài liệu không nói rõ** cả hai vế, chưa kiểm được. M `select.html` chỉ nói alias "is used as the expression's column name"; O `SELECT.html` chỉ nói alias "will use this alias in the column heading".
13. **Oracle so sánh ngày với chuỗi ISO.** Tài liệu xác nhận chuỗi được đổi ngầm sang DATE bằng default date format (O `Data-Type-Comparison-Rules.html`: "Oracle implicitly converts '24-JUN-06' to a DATE value using the default date format 'DD-MON-YY'"). ORA-01861 = "literal does not match format string" (E `ora-01861/`). Tài liệu không nói rõ mã lỗi cho đúng chuỗi `'2026-02-15'`, và không nêu giá trị mặc định `DD-MON-RR`. Engine báo ORA-01861, hợp lý, chưa kiểm được chắc chắn.
14. **Câu lệnh rỗng, nhiều câu lệnh một lần.** MySQL rỗng: 1065 "Query was empty", đúng. Oracle rỗng ra ORA-00900: tài liệu chỉ nói "The statement was not recognized as a valid SQL statement" (E `ora-00900/`), không nói rõ cho chuỗi rỗng, chưa kiểm được. MySQL nhiều câu lệnh: cần cờ CLIENT_MULTI_STATEMENTS để chạy; mã lỗi khi cờ tắt tài liệu không nói rõ (M C API `c-api-multiple-queries.html`: "CLIENT_MULTI_STATEMENTS enables mysql_real_query() and mysql_query() to execute statement strings containing multiple statements separated by semicolons"). Oracle nhiều câu lệnh: tài liệu SQL Reference không nói rõ (hành vi của client), chưa kiểm được.

## Việc cần làm theo kết quả

- Sửa dòng 2, 11, 16 (và ghi chú ở dòng 9) của bảng ở `docs/PROMPT.md` mục 7 theo cột "Hành vi theo tài liệu" ở trên; ghi vào `docs/decisions.md`. Phiên này không được sửa hai file đó.
- Engine không lệch tài liệu ở điểm nào đã kiểm được (106/106 test của `dialect.test.ts` xanh).
- Còn chưa kiểm được (chỉ còn vế Oracle và các vế tool): tiêu đề biểu thức không alias ở Oracle; ORA-00911 cho `%`; ORA-00900 cho câu rỗng; mã lỗi của hai câu lệnh liền nhau ở Oracle; ORA-01861 cho chuỗi ISO cụ thể; vế "tiêu đề in hoa" ở Oracle và "Tool thường chờ COMMIT". Các vế MySQL đã chốt ở mục "Kiểm trên MySQL thật" bên dưới.

## Kiểm trên MySQL thật

Phiên bản: MySQL 8.0.46 (Ubuntu 24.04, gói `mysql-server`). Client `mysql -t --default-character-set=utf8mb4` và PyMySQL với cờ mặc định. Ngày chạy: 2026-11-21.

- Mặc định: `@@character_set_connection` là `utf8mb4`, `@@collation_connection` và `@@collation_server` là `utf8mb4_0900_ai_ci`. Đúng như dòng 9.
- Collation `utf8mb4_0900_ai_ci` (COLLATE ghi tường minh): `'đ' = 'd'` ra 1, `'Đ' = 'd'` ra 1, `'Đ' = 'đ'` ra 1, `'Hà' = 'ha'` ra 1, `'a' = 'a '` ra 0, `'Đỗ Linh' LIKE 'd%'` ra 1, `'Đỗ Linh' LIKE 'đ%'` ra 1. Vậy `đ` bằng `d`. Engine trước đó coi hai chữ này khác nhau. Engine đã sửa: ở dialect mysql, `đ` gấp thành `d` khi so bằng `=`, `LIKE`, khi xếp và khi gom nhóm.
- Tiêu đề column của biểu thức không alias: MySQL giữ nguyên chữ người gõ, gồm khoảng trắng và chữ hoa. `price * 2`, `price*2`, `PRICE * 2`, `COUNT(*)`, `count( * )`, `UPPER(name)`, `price + 1000`, `1 + 1` đều ra đúng như gõ. Riêng chuỗi `'abc'` ra tiêu đề `abc` (không có nháy). Engine khớp mọi trường hợp trên. Riêng `'abc'` engine trước đó ra `'abc'`, và đã sửa thành `abc`.
- Hai câu lệnh một lần gửi (PyMySQL, không multi-statement): `SELECT 1; SELECT 2` ra lỗi 1064, "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'SELECT 2' at line 1". Engine khớp.
- `SELECT 1;` chạy được. Chuỗi rỗng `""` ra lỗi 1065 "Query was empty". Chuỗi `";"` cũng ra 1065 "Query was empty". Engine khớp với `""` và `SELECT 1;`. Với `";"` engine trước đó ra 1064, và đã sửa thành 1065.
- Hệ quả khi xếp: ở MySQL, tên có chữ Đ đứng ở chỗ của chữ D (Đinh đứng gần Dương). Oracle vẫn so binary, nên chữ Đ đứng sau mọi chữ không dấu. Bài `c3-b3` và `c6-b3` có câu giải thích. Vế Oracle này chưa chạy trên Oracle thật.

## Kiểm trên Oracle thật

Phiên bản: Oracle Database XE 21c (`gvenzl/oracle-xe:21-slim-faststart`) và XE 18c (`gvenzl/oracle-xe:18-slim-faststart`), chạy bằng Docker. Ngày chạy: 2026-11-23. Charset AL32UTF8, `NLS_TERRITORY` AMERICA. 19c không tải được nếu không có tài khoản Oracle (xem `docs/decisions.md`), nên điểm nào có thể khác giữa các bản thì chạy cả hai bản: 18c và 21c cho cùng kết quả thì coi 19c cũng vậy. Điểm nào chỉ một bản khác thì đọc tài liệu 19c.

### Cách chạy lại

```
docker run -d --name oraxe -e ORACLE_PASSWORD=... -e APP_USER=hoc -e APP_USER_PASSWORD=... gvenzl/oracle-xe:21-slim-faststart
# chờ log có "DATABASE IS READY TO USE"
ORACLE_REAL=1 ORA_PW=<mật khẩu của user hoc> npx vitest run src/engine/__tests__/oracle-real.test.ts
```

Biến phụ: `ORACLE_CONTAINER` (mặc định `oraxe`), `ORA_USER` (mặc định `hoc`), `ORA_SERVICE` (mặc định `XEPDB1`), `ORACLE_REAL_SUMMARY` (file ghi số liệu). Không có `ORACLE_REAL` thì test tự bỏ qua. Mật khẩu chỉ nằm trong biến môi trường, không nằm trong repo.

Bộ đối chiếu (`oracle-real.test.ts` và `oracle-real-util.ts`) làm ba việc:

1. Đổi từng database mẫu ở `src/data` thành DDL và INSERT của Oracle, dọn sạch table, view, sequence của user rồi nạp. Chạy lời giải Oracle, đáp án sai hay gặp của mọi bài tập SQL và mọi query của khối playground trên cả engine và Oracle thật. Không có ORDER BY thì so như tập row. Tên column không phân biệt hoa thường. Ngày về `YYYY-MM-DD`. Số bỏ số 0 ở đuôi. Query dùng `FETCH FIRST` hoặc `ROWNUM` mà không có ORDER BY chỉ so tiêu đề và số row. `SYSDATE` và `CURRENT_DATE` đổi thành `2026-03-09 10:30:00`, giờ cố định của engine. Tên schema của database mẫu (ví dụ `CONGTY`) đổi thành `HOC`.
2. Bài tập `rehearsal` (UPDATE, DELETE): chạy lời giải, đọc table đích, ROLLBACK, so với `after` của engine.
3. Bài tập `build` và khối `workshop` trong bài học: chạy `base` và `solution`, hoặc `setup`, `sql`, `tries`, từng lệnh một ở schema sạch. So chạy được hay báo lỗi, và mã ORA, với engine. Có cả các `tries` mang `expect: 'error'`.

Kết quả lần chạy này, trên 21c: 684 query (72 lời giải, 186 đáp án sai, 426 query playground) và 3 bài rehearsal; 17 khối workshop và 11 bài build (392 lệnh). Lệch còn lại được liệt kê ở `KNOWN` trong test, mỗi chỗ có lý do: khối workshop `c10-b2` (khác biệt của 21c, xem dưới). Bốn query của playground `c5-b3` từng lệch vì alias `raw`; bài đã đổi alias và nay khớp. Chạy lại trên 18c: khớp như 21c, chỉ thêm một chỗ lệch là `LISTAGG(DISTINCT ...)` ở `c6-b6` (18c chưa có DISTINCT, 19c có theo tài liệu).

### Các điểm chờ kiểm tài liệu (các comment cũ chờ kiểm) và kết quả

Cột "Oracle thật" ghi bản đã chạy: 21c, 18c, hoặc cả hai.

| # | Điểm | Oracle thật | Engine trước | Kết quả |
|---|---|---|---|---|
| 1 | `VARCHAR2(0)`, `CHAR(0)`, `VARCHAR(0)`, `VARCHAR2(0 CHAR)` | ORA-01723 `zero-length columns are not allowed` (cả hai) | ORA-00910 | lệch, đã sửa |
| 2 | `CREATE TABLE IF NOT EXISTS` | ORA-00922 `missing or invalid option` (cả hai) | ORA-00906 | lệch, đã sửa |
| 3 | `a NUMBER NOT NULL DEFAULT 5` | ORA-00907 (21c) | ORA-00907 | khớp |
| 4 | `ON DELETE RESTRICT`, `ON UPDATE CASCADE` | ORA-00905 (21c) | ORA-00905 | khớp |
| 5 | identity BY DEFAULT ghi NULL tường minh | ORA-01400 (21c) | ORA-01400 | khớp |
| 6 | `CREATE TABLE schema_lạ.t`, `DROP TABLE schema_lạ.t` | ORA-01918, ORA-00942 (21c) | cùng mã | khớp |
| 7 | `CREATE TABLE ... AS SELECT` chép NOT NULL ngầm của primary key | không chép; NOT NULL viết rõ thì chép (cả hai) | chép | lệch, đã sửa (xem giới hạn bên dưới) |
| 8 | `DATA_LENGTH` của `VARCHAR2(20 CHAR)` | 80 (21c) | 80 | khớp |
| 9 | `LAST_NUMBER` trong `USER_SEQUENCES` | theo CACHE, mặc định 20: START 100 INCREMENT 5, sau NEXTVAL đầu là 200; NOCACHE: 2; CACHE 3: 4; `CACHE 1` ORA-04010 (cả hai) | như NOCACHE | lệch, đã sửa |
| 10 | `ALTER TABLE t ADD COLUMN x NUMBER` | ORA-00904 (cả hai) | ORA-00904 | khớp |
| 11 | `ALTER TABLE t ADD a NUMBER, ADD b NUMBER` | ORA-01735 ở dấu phẩy (cả hai) | ORA-00933 | lệch, đã sửa |
| 12 | `MODIFY (age NOT NULL)` khi có NULL | ORA-02296 `cannot enable (HOC.) - null values found` (21c) | cùng mã và câu | khớp |
| 13 | `ALTER TABLE t MODIFY COLUMN age NUMBER` | ORA-00905 (cả hai) | ORA-00904 | lệch, đã sửa |
| 14 | `ALTER TABLE t DROP name` | ORA-00905 (21c) | ORA-00905 | khớp |
| 15 | Xóa column con có foreign key một column, rồi `DROP TABLE` cha | chạy được (21c) | chạy được | khớp |
| 16 | Xóa column có CHECK một column; CHECK nhiều column | CHECK đi theo; ORA-12991 (21c) | cùng | khớp |
| 17 | `RENAME COLUMN` với CHECK | CHECK đi theo, ORA-02290 vẫn chặn (21c) | cùng | khớp |
| 18 | `ADD PRIMARY KEY` trên column có NULL | ORA-01449 (21c) | ORA-01449 | khớp |
| 19 | `DROP FOREIGN KEY fk`, `DROP CHECK ck` | ORA-00905 (21c) | ORA-00905 | khớp |
| 20 | `ALTER TABLE t` trơ trọi | ORA-02210 `no options specified for ALTER TABLE` (cả hai) | ORA-01735 | lệch, đã sửa |
| 21 | `DROP TABLE IF EXISTS nope` | ORA-00933 (cả hai) | ORA-00933 | khớp |
| 22 | `SELECT * FROM (SELECT 1 a, 2 a FROM DUAL)` | ORA-00918; `COUNT(*)` và `SELECT 1` thì chạy được; `SELECT a` và `t.a` ORA-00918 (cả hai) | `SELECT *` chạy được | lệch, đã sửa |
| 23 | `SELECT 1 FROM DUAL EXCEPT SELECT 2 FROM DUAL` | 18c ORA-00933; 21c chạy được (EXCEPT mới từ 21c) | ORA-00933 | khớp với 19c (tài liệu 19c chỉ có UNION, INTERSECT, MINUS) |
| 24 | `... UNION SELECT ... ORDER BY d + 1` | ORA-01785 (21c) | ORA-01785 | khớp |
| 25 | `... UNION ... ORDER BY departments.d` | ORA-00904 `"DEPARTMENTS"."D"` (21c) | ORA-00904 | khớp |
| 26 | `SELECT 1 FROM DUAL UNION` | ORA-00928 (cả hai) | ORA-00928 | khớp |
| 27 | Hai khối `WITH` trùng tên | không lỗi, khối đầu thắng, khối sau không chạy (kể cả `1/0`) (cả hai) | ORA-00955 | lệch, đã sửa |
| 28 | `LISTAGG(x, ',')` không có `WITHIN GROUP` | chạy được (cả hai); tài liệu 19c: `order_by_clause` và `WITHIN GROUP` đi cùng nhau hoặc vắng cùng nhau | ORA-00905 | lệch, đã sửa |
| 29 | `GROUP BY ... WITH ROLLUP` | ORA-00933 (21c) | ORA-00933 | khớp |
| 30 | `CROSS JOIN ... ON` | ORA-00933 (21c) | ORA-00933 | khớp |
| 31 | `SELECT *` với `JOIN ... USING (a, b)` | thứ tự column theo thứ tự viết trong USING (21c) | cùng | khớp |
| 32 | `RIGHT JOIN ... USING` | column của table trái đứng trước (21c) | cùng | khớp |
| 33 | Column trong `USING` không có ở một bên | ORA-00904 `"bên thiếu"."COLUMN"` (21c). Bên trái có nhiều table thì Oracle ghi tên nội bộ `"from$_subquery$_003"` | cùng mã, câu thông báo thiếu phần đứng trước | khớp mã; câu thông báo đã sửa |
| 34 | `NATURAL JOIN` | column gộp theo thứ tự table bên trái (21c) | cùng | khớp |
| 35 | `(+)` cùng table hai vế | ORA-01416 (21c) | ORA-01416 | khớp |
| 36 | `ASCII('đ')` | 50321, mã byte UTF-8 (21c) | 50321 | khớp |
| 37 | `GREATEST(1, NULL, 3)` | NULL (cả hai) | NULL | khớp |
| 38 | `CAST(1.5 AS SIGNED)` | ORA-00902 (cả hai) | ORA-00902 | khớp |
| 39 | `TO_CHAR(1234, 'FM9999.99')` | `1234.` (21c) | `1234.` | khớp |
| 40 | `TRUNC(d, 'DAY')` | về Chủ nhật, `NLS_TERRITORY` AMERICA (cả hai) | Chủ nhật | khớp |
| 41 | `NVL(a, b)` | `NVL(DATE, số)` ORA-00932 (cả hai); `NVL(cột_số_đang_NULL, 'abc')` ORA-01722 | không báo lỗi ở cả hai | `NVL(DATE, số)` lệch, đã sửa. `NVL(NULL, chữ)` còn lệch: engine không biết data type của NULL (chưa sửa) |
| 42 | Tiêu đề biểu thức không alias | `PRICE*2`, `COUNT(*)` cho `COUNT( * )` (21c) | cùng | khớp |
| 43 | Query rỗng | `EXECUTE IMMEDIATE ' '`: ORA-00900 (21c). Chuỗi rỗng hẳn thì tùy client (PL/SQL ORA-06535) | ORA-00900 | khớp |
| 44 | Hai câu lệnh liền nhau `SELECT 1 FROM DUAL; SELECT 2 FROM DUAL` | ORA-00933 ở dấu chấm phẩy; cả câu có dấu `;` ở cuối cũng ORA-00933 khi gửi thẳng cho server (21c) | ORA-00933 | khớp |
| 45 | Thứ tự row khi query có window function mà không có ORDER BY | 5 query thử cho đúng thứ tự sắp của window đứng cuối, như engine (21c). Oracle không hứa thứ tự này | cùng | khớp |

Tổng: 45 điểm, trên 52 dòng comment trong code và test (một điểm có thể có comment ở cả code lẫn test). Cộng thêm 4 dòng tiêu đề file test và 4 dòng trong `docs`, là 60 dòng ban đầu. Kết quả: 34 khớp, 10 lệch đã sửa, 1 lệch một phần (mục 41, phần NULL, chưa sửa).

### Điểm lệch mới tìm thấy khi chạy bộ đối chiếu (ngoài các comment cũ)

| Điểm | Oracle thật | Engine trước | Kết quả |
|---|---|---|---|
| Tên data type lạ có ngoặc theo sau: `name VARCHR2(50)`, `FOO(5)` | ORA-00907. Không có ngoặc (`FOO`): ORA-00902 | ORA-00902 | đã sửa. `ALTER TABLE t ADD b FOO(5)` (không ngoặc ngoài) Oracle báo ORA-01735, engine báo ORA-00907: chưa sửa |
| `INT(5)`, `INTEGER(5)`, `SMALLINT(5)`, `DATE(5)`, `CLOB(5)` | ORA-00907 | chạy được | đã sửa |
| Số nhỏ hơn 1 đổi sang chữ ngầm: `0.1 \|\| 'x'`, `CONCAT(0.25, 'y')`, `LENGTH(0.5)`, `LISTAGG` | `.1x`, `.25y`, 2: mất số 0 đứng đầu; không dùng ký hiệu e (`.0000000001`) | `0.1x` (TO_CHAR đúng, các đường khác sai) | đã sửa |
| `TO_CHAR(38000000, 'FM999,999')` tràn mẫu | độ rộng mẫu cộng 1 dấu `#`, có FM hay không đều vậy (8 dấu) | 7 dấu khi có FM | đã sửa |
| Alias `raw` (`SELECT 1 AS raw FROM DUAL`) | ORA-00923: RAW là từ dành riêng | chạy được | engine chưa có danh sách từ dành riêng. Bài `c5-b3` đã đổi alias thành `original`, và chạy được trên Oracle thật |
| `UPDATE customers SET total_spent = (SELECT total FROM orders WHERE ...)` khi subquery ra nhiều row (bài `c10-b2`) | 18c: ORA-01427. 21c: chạy qua (`5 rows updated`) | ORA-01427 | engine theo 18c, vì 19c giống 18c; ghi vào `KNOWN` |
| `VARCHAR2()` | ORA-00910 | ORA-00936 | chưa sửa (hiếm) |
| `REAL`, `DOUBLE PRECISION`, `BLOB` | tạo được | ORA-00902 | chưa sửa (khóa học chưa dạy) |
| Số có hơn 15 chữ số có nghĩa (`1/3`, `123456789012345678901234567890`) | NUMBER có 38 chữ số | số thực 64 bit của JavaScript | chưa sửa, giới hạn của engine |

### Chỉ kiểm được qua tài liệu 19c, hoặc suy ra từ 18c và 21c

- `EXCEPT` (mục 23): 21c nhận, 18c và tài liệu 19c không có. Engine theo 18c.
- `LISTAGG` không có `WITHIN GROUP` (mục 28): 18c và 21c chạy được, tài liệu 19c cho phép ("These two clauses must be specified together or not at all").
- `LISTAGG(DISTINCT ...)`: 18c báo ORA-30482, 21c chạy được, tài liệu 19c ghi `DISTINCT` có trong cú pháp. Engine cho chạy.
- Các tính năng còn lại engine chưa dạy tới (`EXCEPT ALL`, `MINUS ALL`, `INTERSECT ALL`, `ANY_VALUE`, khung window `GROUPS`, `EXCLUDE`) đều mới sau 19c và engine báo "chưa dạy tới".

### Bảng mục 7 của `PROMPT.md` với Oracle thật

Các vế Oracle đã chạy lại trên 21c và 18c, cùng kết quả: `FROM` bắt buộc (ORA-00923), `CONCAT` ba tham số (ORA-00909), `'' IS NULL` đúng, `'Hà' = 'ha'` và `'a' = 'a '` sai, nháy kép là tên (ORA-00904), `GENERATED AS IDENTITY` mặc định ALWAYS (ORA-32795 khi gán id), `FROM orders AS o` là ORA-00933, `LIMIT` là ORA-00933, `NOW()` là ORA-00904. Không dòng nào của bảng sai so với Oracle thật.
