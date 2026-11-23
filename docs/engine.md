# Engine chạy được gì

Dùng file này khi viết query cho bài học và bài tập. Query nằm ngoài danh sách sẽ ra lỗi "khóa học chưa dạy tới".

API: `run(sql, db, dialect)` cho SELECT. `createSession(db, dialect).run(sql)` cho mọi lệnh, giữ trạng thái giữa các lần chạy (xem `src/engine/session.ts`). `session.runScript(sql)` chạy nhiều lệnh ngăn cách bằng dấu `;`, dừng ở lệnh lỗi đầu tiên. `splitStatements(sql, dialect)` chỉ tách lệnh. `session.schema()` trả cấu trúc database cho giao diện. `gradeSchema(db, spec, dialect)` chấm bài dựng table.

## SELECT

- `SELECT [DISTINCT] *`, `t.*`, column, biểu thức, alias bằng `AS` hoặc viết liền sau.
- `FROM table [alias]`, `FROM (SELECT ...) alias`. Oracle không nhận `AS` trước alias của table. `FROM DUAL`. MySQL cho `SELECT` không có FROM, kể cả khi còn `WHERE`, `ORDER BY`, `LIMIT`.
- `[INNER] JOIN ... ON ...`, `LEFT [OUTER] JOIN`, `RIGHT [OUTER] JOIN`, `CROSS JOIN`, nối nhiều table, nối kiểu cũ bằng dấu phẩy và điều kiện trong WHERE. Chi tiết ở mục "JOIN" bên dưới.
- `WHERE`: `= <> != < <= > >=`, AND, OR, NOT, `IN (danh sách)`, `IN (subquery)`, `EXISTS (subquery)`, `= ANY (subquery)`, BETWEEN, LIKE với `%` và `_`, IS NULL, IS NOT NULL.
- `GROUP BY` một hay nhiều biểu thức. `HAVING`. COUNT(*), COUNT(column), COUNT(DISTINCT column), SUM, AVG, MIN, MAX. Thêm GROUP_CONCAT, LISTAGG, ROLLUP và GROUPING: xem mục "Gom nhóm mở rộng" bên dưới.
- MySQL cho `GROUP BY` viết số thứ tự column của SELECT (`GROUP BY 1, 2`) hoặc alias (`GROUP BY thang`, khi alias không trùng tên column của table). Gom theo alias của function gom báo 1056. Oracle không cho cả hai (ORA-00904 với alias, ORA-00979 với số).
- Column đứng ngoài function gom mà không nằm trong GROUP BY: Oracle báo ORA-00979 (có GROUP BY) hoặc ORA-00937 (không có GROUP BY); MySQL báo 1055 hoặc 1140. Riêng MySQL cho chọn column khác của một table khi đã GROUP BY primary key của table đó.
- Function gom trong WHERE: MySQL 1111, Oracle ORA-00934.
- `ORDER BY` nhiều biểu thức, ASC, DESC, theo alias, theo số thứ tự column. Oracle có `NULLS FIRST`, `NULLS LAST`.
- MySQL: `LIMIT n`, `LIMIT m, n`, `LIMIT n OFFSET m`. Oracle: `FETCH FIRST n ROWS ONLY`, `OFFSET m ROWS FETCH NEXT n ROWS ONLY`, và `ROWNUM` trong WHERE (ROWNUM được gán trước ORDER BY).
- Subquery, ghép kết quả và WITH: xem các mục "Subquery", "Ghép kết quả" và "WITH" bên dưới. Window function: xem mục "Window function". Chưa có: WITH RECURSIVE.
- `CASE WHEN ... THEN ... ELSE ... END`, `CASE x WHEN ...`.
- Phép tính `+ - * /`. MySQL có `%` và `MOD`; Oracle chỉ có `MOD(a, b)`. Chia cho 0: MySQL ra NULL, Oracle báo ORA-01476.

## JOIN

Mọi kiểu dưới đây chạy ở cả hai dialect, trừ khi ghi riêng. Trace của Query Theater có cùng dạng cho mọi kiểu: một bước `join` mỗi lần nối, kèm `links` (`left` là null khi row bên phải không có row khớp, `right` là null khi row bên trái không có row khớp). Mọi kiểu nối đều xử lý từ trái sang phải.

- `RIGHT [OUTER] JOIN ... ON ...`: giữ mọi row bên phải. MySQL xếp row theo table bên phải.
- `FULL [OUTER] JOIN ... ON ...`: chỉ Oracle. Ở MySQL, chữ FULL ngay sau table bị đọc như alias (đã kiểm trên MySQL 8.0.46). `a FULL JOIN b ON ...` báo 1054 vì tên `a` không còn dùng được. `a x FULL JOIN b` và `a FULL OUTER JOIN b` báo 1064 tại chữ FULL hoặc OUTER. `a FULL JOIN b USING (c)` chạy như JOIN thường. Mọi lỗi này kèm lời giải thích: MySQL không có FULL JOIN, ghép LEFT JOIN và RIGHT JOIN bằng UNION.
- `CROSS JOIN`: ghép mọi row với mọi row. `a JOIN b` không có ON: MySQL coi là CROSS JOIN, Oracle báo ORA-00905. `CROSS JOIN ... ON`: MySQL coi là INNER JOIN, Oracle báo ORA-00933 (mã chưa có nguồn xác nhận).
- `JOIN ... USING (c1, c2)`: nối theo column cùng tên. `SELECT *` hiện column trong USING một lần, đứng đầu. MySQL xếp theo thứ tự trong table bên trái (RIGHT JOIN thì theo table bên phải, và column còn lại của bên phải đứng trước bên trái). Oracle xếp theo thứ tự viết trong USING, rồi column còn lại của bên trái, rồi bên phải (theo chuẩn SQL, chưa có nguồn xác nhận cho RIGHT JOIN). Giá trị column gộp là giá trị khác NULL đầu tiên của hai bên, nên RIGHT JOIN hiện giá trị của bên phải. `t.*` vẫn hiện đủ column của table t.
- Column trong USING và NATURAL: MySQL cho viết `alias.column`. Oracle báo ORA-25154 (USING) hoặc ORA-25155 (NATURAL).
- Column trong USING không có ở một bên: MySQL 1054 ở `from clause`, Oracle ORA-00904 (chưa có nguồn xác nhận). Column có ở nhiều table bên trái: MySQL 1052, Oracle ORA-00918.
- `NATURAL [INNER | LEFT | RIGHT] JOIN`: nối theo mọi column cùng tên. Không có column nào trùng thì thành CROSS JOIN. Oracle có thêm `NATURAL FULL JOIN`. Sau NATURAL không viết ON hay USING (MySQL 1064, Oracle ORA-00933). `NATURAL CROSS JOIN` không có ở cả hai.
- Dấu `(+)` của Oracle, trong WHERE, FROM ngăn bằng dấu phẩy: `WHERE a.x = b.x(+)` giữ mọi row của a. Điều kiện lọc có `(+)` (như `AND b.y(+) = 'x'`) nằm trong phần nối, còn điều kiện không có `(+)` lọc sau khi nối. Trace là LEFT JOIN: table có `(+)` nối sau, nên `a.x(+) = b.x` cho trace bắt đầu từ b. `SELECT *` vẫn theo thứ tự table trong FROM. Một table được nối ngoài với nhiều table kia thì chạy. MySQL báo 1064 tại dấu `)`.
- Lỗi của `(+)`: ở hai table trong một điều kiện ORA-01468; trong OR hoặc IN ORA-01719; so với subquery ORA-01799; trong SELECT, GROUP BY, HAVING, ORDER BY ORA-30563; chung query với JOIN ... ON ORA-25156; hai table nối ngoài vào nhau ORA-01416.
- Chưa có: ngoặc để đổi thứ tự nối (`a JOIN (b JOIN c)`), và độ ưu tiên của JOIN so với dấu phẩy trong FROM như MySQL (engine nối từ trái sang phải).

## Subquery

Chạy ở cả hai dialect, trừ khi ghi riêng. Mã MySQL đã kiểm trên MySQL 8.0.46. Mã Oracle theo tài liệu 19c.

- Scalar subquery ở mọi chỗ nhận biểu thức: danh sách SELECT, WHERE, HAVING, ORDER BY, vế phải của `SET`. Không ra row nào thì là NULL. Ra hơn một row: MySQL 1242, Oracle ORA-01427. Ra hơn một column: MySQL 1241, Oracle ORA-00913 (cũng áp cho IN, ANY, ALL). Tên column trong danh sách SELECT: MySQL giữ nguyên chữ trong query (kể cả ngoặc), Oracle in hoa và bỏ dấu cách.
- Subquery trong FROM: `FROM (SELECT ...) t`. Nối được với table và subquery khác, lồng nhiều tầng. MySQL bắt buộc có alias (1248) và báo 1060 khi hai column trùng tên. Oracle không bắt buộc alias, và hai column trùng tên chỉ báo ORA-00918 khi gọi tên chúng (chưa có nguồn xác nhận). Subquery trong FROM không nhìn thấy table cùng cấp (không có LATERAL).
- Subquery phụ thuộc: nhắc tới column của query ngoài, ở WHERE, danh sách SELECT, HAVING, ORDER BY, lồng nhiều tầng (nhắc tới cả query ngoài cùng). Tên column ở subquery thắng tên cùng chữ ở query ngoài. Engine chạy lại subquery cho từng row ngoài, và nhớ kết quả theo giá trị của các column ngoài mà nó dùng.
- `EXISTS (subquery)`, `NOT EXISTS (subquery)`. Subquery chọn gì cũng được (kể cả NULL hay nhiều column). Ở MySQL, EXISTS trong danh sách SELECT ra 1 hoặc 0. Oracle không cho đặt điều kiện trong danh sách SELECT (dùng CASE WHEN).
- `IN`, `NOT IN` đúng luật NULL: `NOT IN` gặp một NULL trong danh sách thì không row nào qua. Subquery rỗng: IN sai, NOT IN đúng, kể cả với vế trái NULL.
- `= ANY`, `= SOME`, `> ALL`, `<> ALL` và mọi phép so sánh với ANY, SOME, ALL. Subquery rỗng: ANY sai, ALL đúng. Có NULL trong danh sách thì kết quả có thể là "chưa biết" (NULL).
- MySQL: `LIMIT` trong subquery của IN, ANY, SOME, ALL báo 1235 (scalar subquery và FROM thì được). Oracle nhận `FETCH FIRST`.
- UPDATE và DELETE: subquery ở WHERE và ở vế phải của `SET` chạy bình thường, kể cả phụ thuộc row đang xét. MySQL báo 1093 khi subquery đọc chính table đang sửa (gọi theo alias nếu có); bọc phần đọc trong FROM của một subquery khác thì qua. Oracle không có luật này.
- Trace: subquery không phụ thuộc vẫn có bước `subquery` như cũ. Subquery phụ thuộc không có bước riêng, và trace mang `partial: true`. Subquery trong FROM là một màn riêng (`acts`, xem mục "Trace nhiều màn").

## Ghép kết quả

- `UNION`, `UNION ALL`, `INTERSECT`, và `MINUS` (Oracle) hoặc `EXCEPT` (MySQL). Chữ của dialect kia báo lỗi kèm lời chỉ sang chữ đúng: Oracle gặp EXCEPT báo ORA-00933 (chỉ sang MINUS); MySQL gặp MINUS báo 1064 ở chữ sau MINUS (chỉ sang EXCEPT). MySQL nhận thêm `UNION DISTINCT`. `INTERSECT ALL` và `EXCEPT ALL` chưa dạy.
- Ghép nhiều hơn hai query, có ngoặc. Độ ưu tiên: MySQL 8 cho INTERSECT cao hơn UNION và EXCEPT; Oracle xếp mọi phép ngang hàng, chạy từ trái sang phải. Query trong ngoặc có ORDER BY và LIMIT riêng.
- Tên column lấy từ query đầu. Row trùng bỏ theo collation của dialect (MySQL không phân biệt hoa thường). Không có ORDER BY thì engine giữ thứ tự gặp (Oracle thật không bảo đảm thứ tự).
- `ORDER BY` đứng cuối áp cho cả kết quả, theo tên hoặc alias column của query đầu, hoặc theo số thứ tự. MySQL nhận cả biểu thức tính từ các tên đó (`ORDER BY d + 1`); Oracle chỉ nhận tên, alias, số thứ tự (ORA-01785). Tên không có: MySQL 1054, Oracle ORA-00904. Tên table đứng trước column: MySQL 1250, Oracle ORA-00904 (chưa có nguồn xác nhận). `ORDER BY` hay `LIMIT` đứng giữa chuỗi ghép mà không trong ngoặc: MySQL 1064, Oracle ORA-00933.
- `LIMIT`, `FETCH FIRST`, `OFFSET` đứng cuối áp cho cả kết quả.
- Lệch số column: MySQL 1222, Oracle ORA-01789. Lệch nhóm data type (số, chữ, ngày): Oracle ORA-01790; MySQL tự đổi cả hai vế sang chữ. NULL không làm lệch.
- Trace: mỗi vế là một màn `branch` trong `acts`, có trace đầy đủ của riêng nó. Màn chính mở bằng bước `setop` (mỗi toán tử một bước, từ trái sang phải), rồi `order` và `limit` nếu có. Không có bước `from`.

## WITH

- `WITH ten AS (SELECT ...) [, ten2 AS (...)] query`. Nhiều khối, khối sau dùng được khối trước. Dùng trong FROM, JOIN, subquery và UNION của query chính. Khối che table cùng tên.
- `WITH ten (c1, c2) AS (...)`. Số tên không khớp SELECT: MySQL 1353, Oracle ORA-32038. Hai khối trùng tên: MySQL 1066, Oracle ORA-00955 (chưa có nguồn xác nhận).
- `WITH RECURSIVE` (MySQL) và khối WITH gọi lại chính nó (Oracle): báo "khóa học chưa dạy tới". `WITH` đứng trước UPDATE, DELETE, INSERT cũng chưa dạy.
- Trace: mỗi khối là một màn `cte` trong `acts`, có trace đầy đủ. Query dùng khối đó có bước `from` hay `join` mang `source: 'cte'`. Khối dùng hai lần vẫn là một màn.

## Trace nhiều màn

Kiểu `Trace` nằm ở `src/engine/trace.ts`. Mọi thứ dưới đây chỉ thêm vào các step cũ, không đổi hình dạng của chúng.

- `trace.acts` là danh sách `TraceAct` `{ kind: 'cte' | 'derived' | 'branch'; name; sql; trace }`: các màn chạy trước màn chính, theo thứ tự chạy. `trace` là một Trace đầy đủ và có thể lại có `acts` (subquery lồng nhau). Thứ tự trong một `acts`: khối WITH, rồi subquery trong FROM, rồi các vế của query ghép. `name` là tên khối WITH, alias subquery (rỗng nếu Oracle không có alias) hay `vế 1`, `vế 2`. Khối WITH dùng nhiều lần chỉ có một màn.
- `execSelect` giữ một sổ màn riêng (`actSink`). `withTables` và `resolveRef` ghi màn vào sổ đó. Subquery trong WHERE, HAVING, SELECT chạy bằng một `execSelect` khác nên không đẩy màn lên query ngoài.
- Step `from` và `join` có thêm `source?: 'cte' | 'derived'` khi table là kết quả của một màn trước. View không có `source`: view vẫn là table đã có row.
- Step `setop`: `{ op, word, columns, left, right, rows, removed }`. `left` và `right` là row đầu vào, `rows` là row sau khi ghép, `removed` là `{ id, why }` với `why` là `dup` (trùng row đứng trước), `absent` (INTERSECT: không có ở vế phải) hay `present` (EXCEPT, MINUS: có ở vế phải). id row không đổi qua các step; row của vế phải lấy id mới. Chuỗi `(A op B) op C` đi thành hai step `setop` nối nhau và ba màn `branch`. Vế trái có WITH, ORDER BY hay LIMIT riêng thì là một màn (có `acts` riêng). Clause `FROM` của query ghép có chữ `FROM vế 1 UNION vế 2`.
- Step `window`: `{ fns, partitionBy, orderBy, parts, columns, added, rows }`, đứng sau `having` và trước `select`. Mỗi cụm OVER (...) khác nhau một step, column cộng dồn: `columns` gồm column cũ rồi `w0`, `w1`... `added` là khóa các column mới của step này. `parts` là các phần, mỗi phần có id row theo thứ tự trong phần. `rows` theo thứ tự mà engine giữ cho SELECT. Step `select` coi `wN` là column đã có: không nằm trong `computed`, và nằm trong `dropped` nếu không được chọn.
- `trace.partial` chỉ còn `true` khi query có subquery phụ thuộc query ngoài (WHERE, SELECT, HAVING, ORDER BY, EXISTS): `steps` chỉ diễn query ngoài. `result` vẫn đúng. Theater hiện dòng báo nếu màn nào có `partial`.
- Theater: `buildFrames` lấy `screensOf(trace)` (màn phụ trước, màn chính cuối) và dựng khung cho từng màn. Màn phụ mở bằng khung tiêu đề `Màn n trên N: ...` (phase `written`) và đóng bằng khung `stash` (kết quả cất thành table có tên). Mỗi `Frame` mang `screen`, `clauses`, `focus` của màn nó.

## Function

`functionCatalog(dialect)` (export từ `src/engine/index.ts`) trả `{ name, min, max, kind }[]` cho mọi function chạy được ở dialect đó, kể cả function gom (`kind: 'aggregate'`). `max` là null khi không giới hạn số tham số. Test `functions-catalog.test.ts` gọi thử từng tên trong danh mục, nên thêm function mới thì phải thêm mẫu gọi vào test đó.

Function chỉ có ở một dialect: dialect kia báo lỗi kèm lời chỉ sang function tương đương (MySQL 1305, Oracle ORA-00904). Sai số tham số: MySQL 1582 (hầu hết function) hoặc 1064 (function nằm trong cú pháp: REVERSE, REPEAT, ASCII, CHAR, TRUNCATE, FORMAT, IF, QUARTER, SUBSTR, MOD, COALESCE ít hơn 1 tham số...); Oracle ORA-00909.

| Việc | MySQL | Oracle |
|---|---|---|
| Chữ hoa, chữ thường | UPPER, LOWER | UPPER, LOWER, INITCAP |
| Độ dài | LENGTH (đếm byte), CHAR_LENGTH (đếm ký tự) | LENGTH (đếm ký tự) |
| Cắt chuỗi | SUBSTR, SUBSTRING, LEFT, RIGHT | SUBSTR |
| Bỏ dấu cách, thay chữ | TRIM, LTRIM, RTRIM, REPLACE(s, x, y). `TRIM(LEADING \| TRAILING \| BOTH 'x' FROM s)`: x có thể dài nhiều ký tự (cắt cả cụm). LTRIM, RTRIM một tham số (hai tham số là 1582) | TRIM, REPLACE(s, x, y). `REPLACE(s, x)` và `REPLACE(s, x, '')` xóa x khỏi s, kết quả rỗng là NULL. `LTRIM(s, set)`, `RTRIM(s, set)` cắt mọi ký tự nằm trong set. `TRIM(LEADING \| TRAILING \| BOTH 'x' FROM s)`: x phải dài đúng 1 ký tự (ORA-30001) |
| Nối chuỗi | CONCAT(a, b, c...), CONCAT_WS(sep, a, b...). CONCAT có NULL thì ra NULL, CONCAT_WS bỏ qua NULL. `\|\|` là OR | `a \|\| b`. CONCAT chỉ nhận 2 tham số. NULL coi như chuỗi rỗng |
| Tìm chuỗi con | INSTR(s, sub), LOCATE(sub, s [, vị trí]), POSITION(sub IN s). Không phân biệt hoa thường, có phân biệt dấu (`INSTR('á', 'a')` ra 0) | INSTR(s, sub [, vị trí [, lần thứ]]), phân biệt hoa thường. Vị trí âm là tìm ngược |
| Đệm chuỗi | LPAD(s, n, pad), RPAD (cần đủ 3 tham số). n âm ra NULL | LPAD(s, n [, pad]), RPAD. Pad rỗng hay n = 0 ra NULL |
| Lật, lặp | REVERSE, REPEAT | không có |
| Mã ký tự | ASCII (byte đầu của chữ: `ASCII('đ')` ra 196), CHAR(n, ...) | ASCII (mã của chữ đầu trong database UTF-8: `ASCII('đ')` ra 50321), CHR(n) |
| Số | ABS, ROUND, FLOOR, CEIL, CEILING, TRUNCATE, MOD, POWER, POW, SQRT, SIGN | ABS, ROUND, FLOOR, CEIL, TRUNC, MOD, POWER, SQRT, SIGN |
| Làm tròn, cắt số | ROUND(n, d), TRUNCATE(n, d). d âm làm tròn tới chục, trăm. Số .5 làm tròn ra xa số 0 | ROUND(n, d), TRUNC(n, d), cùng luật |
| So lớn nhỏ | GREATEST, LEAST (từ 2 tham số). Có NULL thì ra NULL. Có một chuỗi thì so tất cả như chuỗi (`GREATEST(10, '9')` ra '9') | GREATEST, LEAST. Có NULL thì ra NULL. Kiểu tham số đầu quyết định cách so |
| Định dạng số | FORMAT(n, d): `FORMAT(1234567.891, 2)` ra `1,234,567.89` | TO_CHAR(n, 'mẫu'): 9, 0, dấu phẩy, G, dấu chấm, D, FM. `TO_CHAR(1234, '999,999,999')` ra `'       1,234'` (có ô dấu và đệm trái), `'FM999,999,999'` ra `'1,234'`. Số dài hơn mẫu ra `####`. Mẫu lạ: ORA-01481 |
| Thay NULL | IFNULL, COALESCE, NULLIF, IF(dk, a, b) | NVL (số kèm chữ không phải số: ORA-01722; chữ kèm số không lỗi, theo tài liệu 19c), NVL2(x, a, b), COALESCE (từ 2 tham số), NULLIF, DECODE(x, v1, r1, ..., mặc định) |
| Đổi data type | CAST(x AS SIGNED, UNSIGNED, DECIMAL(p,s), CHAR(n), DATE, DATETIME, DOUBLE), CONVERT(x, type). Type khác (INT, NUMBER, VARCHAR) báo 1064 | CAST(x AS NUMBER, NUMBER(p,s), INTEGER, VARCHAR2(n), DATE, TIMESTAMP), TO_NUMBER(s). Type của MySQL báo ORA-00902 |
| Đổi chuỗi sang số, ngầm | Dễ tính: `'12abc'` thành 12 kèm cảnh báo 1292, `'abc'` thành 0, `'1e2'` thành 100 | Chặt: ORA-01722 khi chuỗi không phải số |
| Bây giờ | NOW(), CURDATE(), CURRENT_DATE | SYSDATE, SYSTIMESTAMP, CURRENT_DATE (viết không ngoặc). SYSTIMESTAMP chỉ có ngày giờ như SYSDATE, không có phần lẻ giây và múi giờ |
| Định dạng ngày | DATE_FORMAT(d, '%Y-%m-%d %H:%i'): %Y %y %m %c %d %e %D %j %w %H %k %h %I %l %i %s %f %p %r %T %M %b %W %a. Chưa có %U %u %V %v %X %x | TO_CHAR(d, 'YYYY-MM-DD HH24:MI'): YYYY RRRR YY RR MM DD DDD Q HH HH12 HH24 MI SS AM PM A.M. P.M. MON MONTH DY DAY FM. MONTH và DAY đệm cho đủ 9 chữ, trừ khi có FM (FM bật rồi tắt mỗi lần gặp) |
| Chuỗi thành ngày | STR_TO_DATE(s, '%d/%m/%Y'), hoặc so thẳng với chuỗi ISO. Chuỗi ngày dễ tính: `'2026-3-9'`, `'20260309'`. Ngày không có thật (30 tháng 2) hay chuỗi lạ ra NULL kèm cảnh báo | TO_DATE(s, 'DD/MM/YYYY'), `DATE '2026-03-02'`, TO_DATE(s) với `'09-MAR-26'`. So ngày với chuỗi báo ORA-01861 |
| Cắt phần giờ | DATE(d) | TRUNC(d), TRUNC(d, 'DD' \| 'MM' \| 'MON' \| 'MONTH' \| 'YYYY' \| 'YEAR' \| 'Q' \| 'HH' \| 'MI' \| 'DAY'). Mẫu lạ: ORA-01899. 'DAY' cắt về Chủ nhật đầu tuần (kiểu Mỹ, NLS_TERRITORY mặc định) |
| Lấy một phần | YEAR, MONTH, DAY, HOUR, EXTRACT(YEAR FROM d), DAYNAME, MONTHNAME, DAYOFWEEK (Chủ nhật là 1), WEEKDAY (thứ Hai là 0), QUARTER | EXTRACT(YEAR FROM d), TO_CHAR |
| Cộng trừ ngày | DATE_ADD(d, INTERVAL n unit), DATE_SUB, `d + INTERVAL n unit`, `d - INTERVAL n unit`, `INTERVAL n unit + d`. unit: SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, QUARTER, YEAR. Cộng tháng vào ngày 31 lùi về cuối tháng. Unit lạ: 1064 | `d + 7`, `d - 7`, ADD_MONTHS(d, n) (ngày cuối tháng giữ là ngày cuối tháng), `d1 - d2` ra số ngày. `d1 + d2` báo ORA-00975 |
| Khoảng cách | DATEDIFF(a, b) ra số ngày, TIMESTAMPDIFF(unit, a, b) ra số đơn vị trọn vẹn | `a - b` ra số ngày, MONTHS_BETWEEN(a, b) (phần lẻ tính trên tháng 31 ngày) |
| Cuối tháng, thứ kế | LAST_DAY(d) (ra ngày thuần) | LAST_DAY(d) (giữ giờ), NEXT_DAY(d, 'MONDAY' hay 'MON'). Tên thứ lạ: ORA-01846 |

"Bây giờ" của engine cố định là 2026-03-09 10:30:00. Chuỗi rỗng `''` là NULL ở Oracle. MySQL so chữ không phân biệt hoa thường và dấu; Oracle có phân biệt.

Giới hạn vì engine dùng số của JavaScript: `CAST(12 AS DECIMAL(5,2))` ra 12 chứ không ra `12.00`; `CAST(12.50 AS CHAR)` ra `12.5`; MONTHS_BETWEEN ra khoảng 10 chữ số thập phân thay vì 38. `CAST('-5' AS UNSIGNED)` ra chuỗi `'18446744073709551611'`.

### Cảnh báo của MySQL

`result.warnings` (kiểu `Warning[]`: `{ code, message }`) chỉ có ở MySQL, khi kết quả đi kèm cảnh báo như `SHOW WARNINGS`. Mỗi câu chỉ ghi một lần, tối đa 20. Có: 1292 (`Truncated incorrect DOUBLE value: '12abc'` khi đổi chuỗi sang số, `Truncated incorrect INTEGER value`, `Truncated incorrect DECIMAL value`, `Incorrect datetime value: 'abc'`, `Truncated incorrect CHAR(n) value`), 1264 (số vượt DECIMAL(p,s) trong CAST), 1105 (CAST âm sang UNSIGNED), 1260 (GROUP_CONCAT bị cắt). Oracle không có cảnh báo: gặp chuỗi không phải số là báo lỗi.

### Lỗi mới

Mọi lỗi dưới đây có lời tiếng Việt trong `messages.vi.ts`. MySQL: 1690 (POWER vượt trần), 1064 (CAST sang data type lạ, INTERVAL sai, dạng gọi sai, ROLLUP(...) kiểu Oracle), 1056 (GROUP BY alias của function gom), 3602 (GROUPING nhận column ngoài GROUP BY), 1111 (GROUPING không có GROUP BY). Oracle: ORA-01428 (SQRT số âm, INSTR lần thứ < 1, POWER không tính được), ORA-01426, ORA-01481, ORA-01846, ORA-01899, ORA-00932 (CAST số sang DATE), ORA-00975, ORA-01438 (CAST NUMBER(p,s) tràn), ORA-01489 (LISTAGG dài hơn 4000 byte), ORA-00902 (CAST sang data type của MySQL), ORA-00905 (LISTAGG thiếu WITHIN GROUP, chưa có nguồn xác nhận), ORA-00933 (`WITH ROLLUP`, chưa có nguồn xác nhận).

## Window function

- `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `LAG(x [, n [, mặc định]])`, `LEAD(...)`, và `SUM`, `AVG`, `COUNT` (kể cả `COUNT(*)`), `MIN`, `MAX`, kèm `OVER ([PARTITION BY ...] [ORDER BY ...])`. Dùng được trong danh sách SELECT, trong ORDER BY, và trong biểu thức (`salary - AVG(salary) OVER (PARTITION BY dept)`). Tính sau WHERE, GROUP BY và HAVING, nên đọc được kết quả gom nhóm (`RANK() OVER (ORDER BY SUM(salary) DESC)`).
- Có ORDER BY trong OVER thì SUM, AVG, COUNT, MIN, MAX tính cộng dồn theo khung mặc định của SQL: các row có cùng giá trị ORDER BY nhận cùng kết quả. Không có ORDER BY thì tính trên cả partition. Khung viết rõ chỉ nhận đúng một dạng: `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` (cộng từng row một). `RANGE`, `GROUPS`, `ROWS` dạng khác, `DISTINCT` trong window, window đặt tên (`OVER w`), GROUP_CONCAT và LISTAGG kèm OVER: "khóa học chưa dạy tới".
- NULL khi sắp: nhỏ nhất ở MySQL, lớn nhất ở Oracle (như ORDER BY). NULL trong PARTITION BY là một nhóm riêng.
- Query không có ORDER BY ngoài thì row ra theo thứ tự sắp của window đứng cuối trong SELECT, như MySQL 8.0.46. Oracle không hứa thứ tự này (CHỜ KIỂM TÀI LIỆU). Bài tập nên luôn có ORDER BY.
- Dùng trong WHERE, ON, GROUP BY, HAVING: MySQL 3593, Oracle ORA-30483. Lời giải thích chỉ cách tính trong subquery ở FROM rồi lọc ở query ngoài.
- ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD không có OVER: MySQL 1064 (ở chữ sau dấu `)`), Oracle ORA-30484. Function thường kèm OVER: MySQL 1064, Oracle ORA-30484. Oracle: ranking, LAG, LEAD thiếu ORDER BY trong OVER là ORA-30485 (MySQL cho qua). MySQL: số row của LAG, LEAD phải là số nguyên không âm viết thẳng, sai là 1064.
- Tiêu đề column của MySQL giữ nguyên chữ viết, gồm cả phần `OVER (...)`.
- Trace của query có window function có bước `window` (xem "Trace nhiều màn"). Không còn `partial`.
- `COUNT(DISTINCT a, b)`: MySQL đếm các cặp khác nhau (bỏ cặp có NULL). Oracle báo ORA-00909.

## Gom nhóm mở rộng

- `GROUP_CONCAT([DISTINCT] a [, b...] [ORDER BY x [ASC|DESC], ...] [SEPARATOR 'chuỗi'])` (MySQL). Chuỗi nối mặc định là dấu phẩy. Row có NULL ở bất kỳ tham số nào bị bỏ. Không còn row nào thì ra NULL. Kết quả dài hơn 1024 byte bị cắt kèm cảnh báo 1260.
- `LISTAGG([DISTINCT] a [, 'chuỗi nối']) WITHIN GROUP (ORDER BY x, ...)` (Oracle 19c). Chuỗi nối mặc định là rỗng. Bỏ NULL. Dài hơn 4000 byte: ORA-01489. Thiếu `WITHIN GROUP`: lỗi cú pháp.
- `GROUP BY a, b WITH ROLLUP` (MySQL) và `GROUP BY ROLLUP(a, b)` hoặc `GROUP BY x, ROLLUP(a, b)` (Oracle, ROLLUP đứng cuối). Mỗi nhóm có thêm row tổng: cuộn lần lượt key cuối thành NULL, cuối cùng là row tổng cộng. Chưa có CUBE và GROUPING SETS.
- `GROUPING(col [, col...])` (cả hai): 1 khi col là NULL do cuộn lên ở row tổng, 0 trong các trường hợp khác (kể cả NULL thật của dữ liệu). Nhiều col cho số nhị phân, col đầu là bit cao nhất. Dùng được trong SELECT, HAVING, ORDER BY.
- Thứ tự row: engine xếp các nhóm theo key tăng dần, row tổng đứng ngay sau các row chi tiết của nó (MySQL cho đúng như vậy, đã kiểm). Key NULL đứng đầu ở MySQL, đứng cuối ở Oracle (chưa có nguồn xác nhận cho Oracle: nên viết ORDER BY).
- Trace: bước `group` mang `rollup: n` (số key được cuộn). Một row gốc có thể nằm trong nhiều nhóm (nhóm chi tiết và các row tổng), nên `rowIds` của các nhóm không còn rời nhau.
- Đã kiểm GROUP BY theo biểu thức (`DATE_FORMAT(d, '%Y-%m')`, `TO_CHAR(d, 'YYYY-MM')`, `TRUNC(d, 'MM')`), nhiều column, function gom bọc CASE (`SUM(CASE ...)`, `COUNT(CASE ...)`), HAVING với biểu thức gom và ORDER BY theo function gom. Chưa có `COUNT(DISTINCT a, b)` nhiều column.

## Sửa dữ liệu (chỉ qua `createSession`)

- `INSERT INTO t [(columns)] VALUES (...)`. MySQL nhận nhiều row trong một câu; Oracle 19c thì không (ORA-00933). `INSERT INTO t [(columns)] SELECT ...` chép row từ một câu SELECT. Từ khóa `DEFAULT` đứng thay một giá trị trong VALUES và trong `UPDATE ... SET c = DEFAULT`.
- `UPDATE t SET c = biểu thức [, ...] [WHERE ...]`, `DELETE FROM t [WHERE ...]`. DELETE làm theo `ON DELETE CASCADE` và `ON DELETE SET NULL` của foreign key. Không ghi gì thì chặn.
- `INSERT ... ON DUPLICATE KEY UPDATE c = VALUES(c)` và dạng alias `INSERT ... VALUES (...) AS new ON DUPLICATE KEY UPDATE c = new.c` (MySQL, cả với INSERT ... SELECT). Row mới trùng primary key hoặc UNIQUE với một row đang có thì sửa row đó. Có alias mà viết column không kèm tên, trùng tên giữa table và alias, thì 1052. Chưa có: danh sách column sau alias (`AS new(a, b)`), cảnh báo 1287 của `VALUES()`. Oracle gặp ON DUPLICATE: ORA-00933 ở chữ ON, lời giải thích chỉ sang MERGE.
- `MERGE INTO t [alias] USING (table hoặc subquery) [alias] ON (...) WHEN MATCHED THEN UPDATE SET ... WHEN NOT MATCHED THEN INSERT [(columns)] VALUES (...)` (Oracle). Được chỉ viết một trong hai nhánh, hai thứ tự đều nhận. Hai row nguồn cùng khớp một row đích: ORA-30926. Sửa column nằm trong ON: ORA-38104. `WHERE` và `DELETE` trong MERGE, `DEFAULT` trong SET hay VALUES: "khóa học chưa dạy tới". `DmlTrace.op` là `'merge'`, `touched` gồm cả row sửa lẫn row thêm. MySQL gặp MERGE: 1064 ở chữ MERGE, lời giải thích chỉ sang INSERT ... ON DUPLICATE KEY UPDATE.
- `SAVEPOINT ten`, `ROLLBACK TO [SAVEPOINT] ten`. `ROLLBACK TO` đưa dữ liệu về lúc đặt savepoint, giữ savepoint đó, bỏ savepoint đặt sau nó, và transaction vẫn mở. Đặt lại savepoint cùng tên thì savepoint cũ mất. COMMIT, ROLLBACK, lệnh DDL (tự COMMIT) xóa mọi savepoint. MySQL: chỉ có nghĩa sau `START TRANSACTION` (ngoài đó SAVEPOINT không báo lỗi nhưng không giữ lại). Oracle: dùng ngay được, không cần lệnh mở transaction. Savepoint không có: 1305 (MySQL), ORA-01086 (Oracle). Kết quả là `{ kind: 'tx', op: 'savepoint' | 'rollback-to' }`.
- INSERT, UPDATE, DELETE, MERGE trên view: "khóa học chưa dạy tới".
- `COMMIT`, `ROLLBACK`. MySQL tự lưu sau mỗi lệnh, trừ khi đã `START TRANSACTION` hoặc `BEGIN`. Oracle giữ thay đổi ở trạng thái chờ tới khi COMMIT.
- Lỗi constraint: trùng primary key hoặc UNIQUE (1062, ORA-00001), NULL vào column NOT NULL (1048, ORA-01400, ORA-01407), INSERT bỏ qua column NOT NULL không có DEFAULT (MySQL 1364, Oracle ORA-01400), sai CHECK (3819, ORA-02290), foreign key trỏ vào row không có (1452, ORA-02291), xóa row đang có row khác trỏ tới (1451, ORA-02292), sai số giá trị (1136, ORA-00947, ORA-00913).
- Độ dài và độ chính xác: chữ dài quá VARCHAR(n) là 1406 (MySQL, đếm ký tự) và ORA-12899 (Oracle, đếm byte, trừ khi viết `VARCHAR2(n CHAR)`). Số vượt DECIMAL(p,s), TINYINT, SMALLINT, INT là 1264; vượt NUMBER(p,s) là ORA-01438. Số lẻ vào column số nguyên hoặc vượt scale thì làm tròn.
- Bộ đếm AUTO_INCREMENT (MySQL), identity (Oracle) và sequence nằm trong `Database`. DELETE và ROLLBACK không làm số lùi lại. `TRUNCATE` đặt lại AUTO_INCREMENT của MySQL, không đặt lại identity của Oracle.

## Tạo và sửa cấu trúc table (DDL)

Mọi lệnh dưới đây chạy qua `createSession`. Chúng tự COMMIT các thay đổi đang chờ trước khi chạy, ở cả hai dialect. ROLLBACK sau đó không hoàn lại được. Lệnh sai cú pháp thì chưa commit gì. Lệnh đúng cú pháp mà lỗi lúc chạy (table không có, trùng tên...) thì đã commit. Lệnh lỗi giữa chừng không để lại thay đổi nửa vời.

Kết quả là `{ ok: true, kind: 'ddl', op, object, table, columns }`. `op` là `create`, `alter`, `drop`, `truncate` hoặc `sequence` (kèm `verb: 'create' | 'drop'`). `columns` có `name`, `typeName` và `declared` (viết đủ như `VARCHAR(20)`).

### CREATE TABLE

- MySQL: INT, INTEGER, BIGINT, SMALLINT, TINYINT, DECIMAL(p,s), NUMERIC(p,s), VARCHAR(n) (bắt buộc có n), CHAR(n), TEXT, DATE, DATETIME, TIMESTAMP. `IF NOT EXISTS`. Đọc và bỏ qua `ENGINE=`, `DEFAULT CHARSET=`, `COMMENT`, `KEY`, `INDEX`. `AUTO_INCREMENT=n` đặt số bắt đầu.
- Oracle: NUMBER, NUMBER(p), NUMBER(p,s), INTEGER, INT, VARCHAR2(n), VARCHAR2(n CHAR), VARCHAR(n), CHAR(n), CLOB, DATE, TIMESTAMP. Không có `IF NOT EXISTS`.
- Data type của dialect kia: MySQL báo 1064, Oracle báo ORA-00902. Độ dài hoặc độ chính xác vượt limit: MySQL 1074, 1426, 1427; Oracle ORA-00910, ORA-01727, ORA-01728.
- `DEFAULT giá trị` (MySQL chỉ nhận một giá trị, `CURRENT_TIMESTAMP` hoặc biểu thức trong ngoặc; Oracle nhận biểu thức, và `DEFAULT` phải đứng trước `NOT NULL`). DEFAULT sai data type: MySQL 1067.
- Constraint mức column và mức table: `PRIMARY KEY (a, b)`, `UNIQUE (a, b)`, `FOREIGN KEY (a) REFERENCES t(b)`, `CHECK (...)`, đặt tên bằng `CONSTRAINT ten ...`. Foreign key được trỏ về chính table đang tạo.
- Tên constraint hiện trong lỗi như DBMS thật. Không đặt tên thì MySQL dùng `PRIMARY`, tên column, `t_ibfk_n`, `t_chk_n`; Oracle dùng `SYS_C00nnnn`.
- `ON DELETE CASCADE`, `ON DELETE SET NULL`. MySQL còn nhận `RESTRICT` và `NO ACTION` (bằng mặc định). Chưa có `ON UPDATE CASCADE`.
- Lỗi lúc tạo: tên column trùng (1060, ORA-00957), hai primary key (1068, ORA-02260), column không có trong constraint (1072, ORA-00904), tên constraint trùng (1826, 3822, 1061, ORA-02264), foreign key sai (MySQL 1824, 3734, 1822, 3780, 1239, 1830; Oracle ORA-00942, ORA-00904, ORA-02270, ORA-02267, ORA-02256), AUTO_INCREMENT không phải key (1075).
- Table mẫu viết constraint bằng cờ `pk`, `unique`, `fk`, `checks`. Session tự dựng danh sách `constraints` từ các cờ đó, nên ALTER và DROP chạy được trên cả table mẫu.
- `CREATE TABLE t AS SELECT ...` (MySQL còn nhận `CREATE TABLE t SELECT ...`): chép column (data type, NOT NULL) và row. Không chép primary key, foreign key, UNIQUE, CHECK, AUTO_INCREMENT, identity, DEFAULT. Column NOT NULL kiểu số ở MySQL nhận `DEFAULT 0`, như MySQL thật. Column là biểu thức: data type suy từ giá trị (số nguyên là INT hoặc NUMBER, số lẻ là DECIMAL(20,s) hoặc NUMBER, chữ là VARCHAR(255) hoặc VARCHAR2(4000)), chỉ gần đúng so với DBMS thật. Hai column trùng tên: 1060, ORA-00957. Oracle: biểu thức không có alias là ORA-00998. Chưa có: `CREATE TABLE t (a, b) AS SELECT`. Tự COMMIT như mọi DDL.
- Chưa có: CREATE INDEX, thêm column AUTO_INCREMENT hoặc IDENTITY bằng ALTER, `ALTER TABLE ... CHANGE`, `FIRST` và `AFTER`.

### VIEW

- `CREATE [OR REPLACE] VIEW v AS SELECT ...`, `DROP VIEW [IF EXISTS] v` (Oracle 19c không có IF EXISTS). Cả hai tự COMMIT. View chỉ lưu câu SELECT (`Database.views: { name, sql }[]`) và chạy lại mỗi lần đọc, nên luôn thấy dữ liệu mới. `SELECT *` trong view cũng bung lại mỗi lần (DBMS thật bung một lần lúc tạo).
- SELECT và JOIN trên view như một table. Trace của query dùng view không có màn riêng: view như một table đã có row. Tạo view thì chạy thử câu SELECT, nên lỗi table, column hiện ngay lúc tạo.
- Tên view và tên table dùng chung một chỗ: trùng thì 1050 (MySQL), ORA-00955 (Oracle). View đã có mà không viết OR REPLACE: cùng mã đó. DROP VIEW trên table: 1347 (MySQL), ORA-00942 (Oracle). DROP TABLE trên view và DROP VIEW không có: 1051, ORA-00942.
- View mất table nền: 1356 (MySQL), ORA-04063 (Oracle).
- Chưa có: danh sách column sau tên view, `WITH CHECK OPTION`, `WITH READ ONLY`, `DESC view`, `SHOW CREATE VIEW`.

### Tên đầy đủ schema.table

- Mỗi database có một tên schema: tên database (`congty` ở MySQL, `CONGTY` ở Oracle). Viết `schema.table` ở SELECT (FROM, JOIN, subquery), INSERT, UPDATE, DELETE, MERGE, CREATE TABLE, CREATE VIEW, ALTER, DROP, TRUNCATE, DESC. Đúng schema thì chạy như thường. Chưa có `schema.table.column`.
- MySQL phân biệt hoa thường ở tên schema (`CONGTY.employees` là 1049). Oracle không phân biệt, trừ khi nằm trong nháy kép.
- Schema khác: MySQL 1049 (`Unknown database`), riêng DROP TABLE và DROP VIEW là 1051, TRUNCATE là 1146. Oracle ORA-00942, riêng CREATE là ORA-01918 (CHỜ KIỂM TÀI LIỆU) và DESC là ORA-04043.
- Oracle: `SELECT USER FROM DUAL` trả tên schema. `ALL_TABLES`, `ALL_TAB_COLUMNS`, `ALL_VIEWS` có column `OWNER` bằng tên đó. `USER_VIEWS` có `VIEW_NAME`, `TEXT`. MySQL: `SHOW TABLES` gồm cả view, `SHOW FULL TABLES` thêm column `Table_type` (`BASE TABLE` hay `VIEW`).

### ALTER TABLE

- `ADD [COLUMN] ...` (Oracle cả dạng `ADD (a ..., b ...)`; MySQL cả `ADD COLUMN (a ..., b ...)`). Oracle không viết chữ COLUMN. MySQL cho nối nhiều việc bằng dấu phẩy.
- `MODIFY [COLUMN] a ...` (MySQL, thay cả định nghĩa), `MODIFY a ...` hoặc `MODIFY (a ..., b ...)` (Oracle, chỉ đổi phần viết ra).
- `DROP COLUMN a` (Oracle cả `DROP (a, b)`), `RENAME COLUMN a TO b`, `RENAME TO ten_moi`.
- `ADD CONSTRAINT ten PRIMARY KEY | UNIQUE | CHECK | FOREIGN KEY ...` kiểm luôn row đang có. `DROP CONSTRAINT ten`. MySQL thêm `DROP PRIMARY KEY`, `DROP FOREIGN KEY ten`, `DROP CHECK ten`. Oracle có `DROP PRIMARY KEY`.
- Row đang có phạm luật mới: trùng (MySQL 1062, Oracle ORA-02299), NULL vào primary key (1138, ORA-01449), sai CHECK (3819, ORA-02293), foreign key trỏ vào chỗ trống (1452, ORA-02298).
- Thêm column NOT NULL không có DEFAULT vào table đang có row: MySQL tự điền 0 hoặc chuỗi rỗng (DATE và DATETIME thì 1292); Oracle ORA-01758.
- Giảm độ dài column khi dữ liệu dài hơn: MySQL 1265, Oracle ORA-01441. Đổi data type khi có dữ liệu: MySQL đổi giá trị theo (lỗi 1366, 1265), Oracle ORA-01439.
- Xóa hay đổi tên column đang dùng trong foreign key, CHECK, key ghép: MySQL 1828, 1829, 3959; Oracle ORA-12991, ORA-12992.
- Bỏ constraint không có: MySQL 3940, 1091, 3821; Oracle ORA-02443, ORA-02441. Bỏ key mà foreign key đang dựa vào: MySQL 1553, Oracle ORA-02273.

### DROP TABLE, TRUNCATE TABLE

- `DROP TABLE t`. MySQL có `IF EXISTS`. Oracle 19c không có (ORA-00933) nhưng có `CASCADE CONSTRAINTS` và `PURGE`. Table không có: MySQL 1051, Oracle ORA-00942. Table đang bị foreign key trỏ tới: MySQL 3730, Oracle ORA-02449.
- `TRUNCATE TABLE t` (MySQL cho bỏ chữ TABLE, Oracle không: ORA-03290). Table đang bị foreign key trỏ tới: MySQL 1701, Oracle ORA-02266.

### Sequence (chỉ Oracle)

- `CREATE SEQUENCE s [START WITH n] [INCREMENT BY m]`, `DROP SEQUENCE s`. Chấp nhận và bỏ qua `CACHE`, `NOCACHE`, `NOCYCLE`, `ORDER`, `NOORDER`. Chưa có MINVALUE, MAXVALUE, CYCLE.
- `s.NEXTVAL`, `s.CURRVAL` dùng được trong VALUES của INSERT, trong `SELECT ... FROM DUAL` và trong DEFAULT. NEXTVAL chỉ tăng một lần trong mỗi lệnh. Lỗi: ORA-02289 (không có sequence), ORA-08002 (CURRVAL trước NEXTVAL), ORA-04002 (INCREMENT BY 0), ORA-00955 (trùng tên).
- MySQL không có sequence: `CREATE SEQUENCE` báo 1064.

## Xem cấu trúc database

Các lệnh này chạy qua `createSession` và trả `kind: 'select'`, nên giao diện hiện như kết quả SELECT thường.

### MySQL

- `SHOW TABLES` (một column `Tables_in_<tên database>`, xếp theo tên).
- `DESCRIBE t`, `DESC t`, `SHOW COLUMNS FROM t` (cũng `FIELDS`, `IN`). Sáu column: `Field`, `Type`, `Null`, `Key`, `Default`, `Extra`. Data type viết thường: `int`, `varchar(50)`, `decimal(12,2)`. `Key` là `PRI`, `UNI` hoặc `MUL`. `Extra` là `auto_increment` hoặc `DEFAULT_GENERATED`. Column không có DEFAULT thì `Default` là NULL.
- `SHOW CREATE TABLE t`: hai column `Table` và `Create Table`. Câu CREATE TABLE chạy lại được trên database trống. CHECK in trong hai cặp ngoặc, nhưng không có tiền tố `_utf8mb4` như MySQL thật.
- Table không có: lỗi 1146. Chưa có: `SHOW COLUMNS ... LIKE`, `SHOW FULL COLUMNS`, `DESCRIBE t column`, `SHOW TABLES LIKE`, `tên_db.table`.

### Oracle

- `DESC t`, `DESCRIBE t`. Ba column: `Name`, `Null?`, `Type`. `Null?` là `NOT NULL` hoặc NULL (ô trống). Data type viết như Oracle: `NUMBER(38)` cho INTEGER, `VARCHAR2(50)`, `TIMESTAMP(6)`. Kết quả có cờ `tool: true`: DESC là lệnh của SQL*Plus, không phải SQL, để giao diện nói rõ điều đó. Table không có: ORA-04043. `DESC` đọc được cả các view bên dưới.
- Data dictionary, đọc bằng SELECT thường (WHERE, ORDER BY, JOIN đều chạy). Tên view, tên column và dữ liệu trong view là chữ hoa.

| View | Column |
|---|---|
| `USER_TABLES` | TABLE_NAME |
| `USER_TAB_COLUMNS` | TABLE_NAME, COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE, COLUMN_ID, DATA_DEFAULT |
| `USER_CONSTRAINTS` | CONSTRAINT_NAME, CONSTRAINT_TYPE (P, U, R, C), TABLE_NAME, SEARCH_CONDITION, R_CONSTRAINT_NAME, DELETE_RULE |
| `USER_CONS_COLUMNS` | CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, POSITION |
| `USER_SEQUENCES` | SEQUENCE_NAME, INCREMENT_BY, LAST_NUMBER |
| `ALL_TABLES`, `ALL_TAB_COLUMNS` | như bản `USER_`, thêm OWNER ở đầu (tên database viết hoa) |

- NOT NULL không hiện thành dòng `C` trong `USER_CONSTRAINTS` (Oracle thật có). Table của người học trùng tên view thì che view. LAST_NUMBER tính như sequence NOCACHE.
- Ở MySQL, các tên này là table không có (1146).
- `SHOW TABLES` ở Oracle báo ORA-00900, lời giải thích chỉ sang `USER_TABLES`.

### `session.schema()`

Trả `SchemaView` cho giao diện vẽ khung cấu trúc: `{ dialect, tables, sequences, views }`. Mỗi view có `name` và `sql` (câu SELECT nguyên văn). Mỗi table có `name`, `rows` (số row), `columns` (`name`, `type`, `nullable`, `pk`, `unique`, `identity`, `default?`, `fk?`), `checks` (`name?`, `expr`) và `primaryKey?` (chỉ khi gồm từ hai column). `type` viết theo dialect của session: `VARCHAR(50)` ở MySQL, `VARCHAR2(50)` ở Oracle. Cùng một database nạp vào session khác dialect thì data type đổi cách viết.

## Lưu và nạp database

`session.db()` là JSON thuần, gồm cả thay đổi chưa COMMIT. Lưu bằng `JSON.stringify`, nạp lại bằng `createSession(JSON.parse(text), dialect)`. Table, row, constraint có tên, DEFAULT, bộ đếm AUTO_INCREMENT và identity, sequence, độ dài column đều giữ nguyên. Database tạo ở dialect này nạp vào session dialect kia vẫn chạy SELECT và INSERT, vì data type lưu theo nhóm chung (`int`, `decimal`, `text`, `date`, `datetime`). Tên constraint tự đặt giữ nguyên kiểu của dialect đã tạo ra nó. `db()` đổi theo từng lệnh, nên lưu ngay khi cần.

## Chấm bài dựng table

`gradeSchema(db, spec, dialect)` trả `{ ok, checks }`. Kiểu `SchemaSpec` nằm ở `src/engine/schema-spec.ts`.

- Mỗi table trong spec sinh một check "có table". Mỗi column sinh một check dùng `label` của nó: đúng khi column có và khớp mọi điều spec ghi (nhóm data type, `minLength`, `pk`, `identity`, `notNull`, `unique`, `default`, `fk`). Điều spec không ghi thì không chấm. Primary key luôn kéo theo NOT NULL.
- `primaryKey` ghép sinh một check, so không phân biệt thứ tự. Column thừa sinh một check riêng, trừ khi `allowExtra`.
- `default` so theo giá trị: `0` khớp `0.0`, `'Hue'` khớp `'Hue'`, không so cách viết.
- Mỗi `Probe` chạy `setup` rồi `sql` trên bản sao của database. Dialect không có `sql` thì probe bị bỏ qua. `setup` lỗi thì check sai, kèm lời "Chưa thử được".
- Tên table và column không phân biệt hoa thường. Table thiếu thì mọi check của nó sai. `note` viết tiếng Việt ngắn.

## Chú thích

`-- ...`, `/* ... */` ở cả hai dialect. MySQL thêm `# ...`, và chỉ coi `--` là chú thích khi sau nó có dấu cách (`SELECT 4--5` ra 9).
