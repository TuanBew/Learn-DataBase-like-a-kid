# Dàn ý khóa học (Mốc 2)

File này là bản giao việc chung cho người viết bài và người dựng cảnh. Luật viết chữ ở `CLAUDE.md`. Khuôn dữ liệu ở `src/content/types.ts`. Bài mẫu: `src/content/lessons/c1-b1.ts`. Bài tập mẫu: `src/content/exercises/c3-e6.ts`.

## Khuôn của một bài

Mỗi bài là một file `src/content/lessons/<id>.ts` export `lesson: Lesson`, và phải được khai báo trong `src/content/lessons/index.ts`. Thứ tự block:

1. `story`: một chuyện ngoài đời, 3 tới 5 đoạn ngắn, dẫn tới câu hỏi của bài.
2. `scene` hoặc `playground`: người học tự bấm. Bài nào có cảnh riêng thì ghi ở bảng dưới.
3. `text`: lý thuyết, mỗi đoạn một ý. Thuật ngữ xuất hiện lần đầu trong bài viết `**[[id]]**` và phải có trong `src/content/glossary.ts`.
4. `playground` ("Thử tay ngay") nếu bài dạy SQL. Query phải chạy được trên engine ở mọi dialect đã khai.
5. `oracle`: thẻ "Oracle viết thế này", chỉ khi Oracle viết khác MySQL.
6. `quiz`: 2 tới 3 câu hỏi nhanh.
7. `exercise`: danh sách id bài tập của bài này (nếu có).
8. `realworld`: thẻ "Ngoài đời". Chỉ dùng ba ví dụ công ty đã kiểm ở mục 11 của `docs/PROMPT.md`, hoặc ví dụ không gắn tên công ty.
9. `keypoints`: 3 hoặc 4 ý.
10. `sources`: nguồn thật sự đã dùng, kèm link.

Mỗi bài 10 tới 20 phút. Dạy MySQL trước. Database mẫu: `teashop` (table `stores`, `staff`, `customers`, `products`, `orders`, `order_items`, xem `src/data/teashop.ts`), `teashop-big` (cùng cấu trúc, khoảng 200 đơn), `hr` (cho chương 7).

## Danh sách bài

| Bài | Tên | Cảnh hoặc phần tự bấm | Ý phải có | Nguồn chính |
|---|---|---|---|---|
| c1-b1 | Dữ liệu ở quanh ta | `data-street`, `order-phone` | (đã xong) | CS50 SQL L0 |
| c1-b2 | Excel và database | `excel-vs-db` | Ba khác biệt: nhiều người ghi cùng lúc, có luật giữ dữ liệu đúng, dữ liệu rất lớn. Excel vẫn tốt cho việc nhỏ. | CS50 SQL L0 |
| c1-b3 | table, row, column | `table-anatomy` | table, row, column, ô; data type cơ bản: số, chữ, ngày. Mỗi column chỉ nhận một data type. | CS50 SQL L0, L2 |
| c1-b4 | DBMS và SQL | `warehouse` | DBMS là người giữ kho. MySQL, Oracle, PostgreSQL là các DBMS. SQL là ngôn ngữ nói với DBMS. Mỗi DBMS nói hơi khác nhau: dialect. Khóa này học MySQL trước, Oracle sau. | CS50 SQL L0, MIT 6.830 |
| c1-b5 | client, server và câu SELECT đầu tiên | `client-server`, playground `SELECT * FROM products;` | client gửi yêu cầu, server nhận, DBMS trả kết quả. Bấm Chạy câu SELECT đầu tiên, chưa cần hiểu hết. | CS50 SQL L0, Oracle Dev Gym |
| c2-b1 | primary key | `pk-bonk` | Mỗi row cần một mã riêng, không trùng, không để trống. Ví dụ số báo danh. | CS50 SQL L1, L2 |
| c2-b2 | foreign key | `fk-rope` | foreign key trỏ sang primary key của table khác. Quan hệ một với nhiều: một khách nhiều đơn. Xóa row đang có row khác trỏ tới thì database chặn. | CS50 SQL L1 |
| c2-b3 | Vì sao phải tách table | `split-table` | Một thông tin chép ở nhiều chỗ thì sửa một chỗ sẽ sai ở chỗ khác. Tách table, nối lại bằng key. | CS50 SQL L1, L2 |
| c2-b4 | NULL | `null-box` | NULL là "chưa có thông tin", khác 0 và khác chuỗi rỗng. So sánh với NULL không ra đúng cũng không ra sai. Dùng IS NULL. | CS50 SQL L0, tài liệu MySQL, Oracle |
| c2-b5 | constraint | `constraint-gate` | NOT NULL, UNIQUE, CHECK, và primary key, foreign key cũng là constraint. Database từ chối row phạm luật. | CS50 SQL L2 |
| c2-b6 | Đọc ERD và CREATE TABLE | `erd`, block `code` | Đọc sơ đồ 6 table của tiệm trà sữa. Đọc hiểu một câu CREATE TABLE: tên column, data type, constraint. Thẻ Oracle: NUMBER, VARCHAR2, DATE có cả giờ, GENERATED AS IDENTITY; MySQL: INT, VARCHAR, DATETIME, AUTO_INCREMENT. Lệnh DDL ở Oracle tự COMMIT. | CS50 SQL L2, tài liệu Oracle |
| c3-b1 | SELECT và FROM | playground | Chọn column, dấu `*`, đặt tên mới bằng AS. Oracle in hoa tiêu đề column. | CS50 SQL L0, SQLBolt 1 |
| c3-b2 | Lọc row bằng WHERE | playground | `=`, `<>`, `>`, `<`, AND, OR, NOT, IN, BETWEEN, LIKE với `%` và `_`, IS NULL. Chuỗi trong nháy đơn. MySQL không phân biệt hoa thường và dấu khi so chữ, Oracle có. | CS50 SQL L0, SQLBolt 2, 3 |
| c3-b3 | ORDER BY và DISTINCT | playground | ASC, DESC, sắp theo nhiều column, DISTINCT. NULL đứng đầu ở MySQL, đứng cuối ở Oracle khi sắp tăng dần. | CS50 SQL L0, SQLBolt 4 |
| c3-b4 | LIMIT và FETCH FIRST | playground | MySQL: LIMIT, OFFSET. Oracle: FETCH FIRST n ROWS ONLY, OFFSET m ROWS. Nhắc ROWNUM trong code Oracle cũ, và bẫy ROWNUM chạy trước ORDER BY. | tài liệu MySQL, Oracle |
| c3-b5 | Thứ tự query chạy thật | `clause-order`, playground | FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, rồi LIMIT hoặc FETCH FIRST. Vì sao WHERE không dùng được alias đặt ở SELECT. | Julia Evans |
| c4-b1 | Phép tính trong SELECT | playground | `+ - * /`, đặt tên column tính toán bằng AS, ROUND. | SQLBolt 9, CS50 SQL L0 |
| c4-b2 | function chuỗi | playground | UPPER, LOWER, LENGTH, SUBSTR, nối chuỗi: CONCAT ở MySQL, `\|\|` ở Oracle. Oracle coi chuỗi rỗng là NULL. | tài liệu MySQL, Oracle |
| c4-b3 | Ngày giờ | playground trên `orders` | Ngày hiện tại, định dạng ngày (DATE_FORMAT, TO_CHAR), chuỗi thành ngày (STR_TO_DATE, TO_DATE, DATE '...'). DATE của Oracle có cả giờ, nên lọc theo ngày dễ sót row: dùng khoảng `>=` và `<`, hoặc TRUNC. | tài liệu MySQL, Oracle, Oracle Dev Gym |
| c4-b4 | Xử lý NULL và CASE WHEN | playground | COALESCE, IFNULL, NVL. CASE WHEN để chia nhóm. | SQLBolt, tài liệu |
| c5-b1 | COUNT, SUM, AVG, MIN, MAX | playground | Năm function gom. `COUNT(*)` khác `COUNT(column)` khi có NULL. COUNT(DISTINCT). | CS50 SQL L0, SQLBolt 10 |
| c5-b2 | GROUP BY | playground | Gom row theo nhóm, mỗi nhóm ra một row. Column trong SELECT phải nằm trong GROUP BY hoặc trong function gom (ORA-00979). | CS50 SQL L0, SQLBolt 10 |
| c5-b3 | HAVING | playground | WHERE lọc row trước khi gom, HAVING lọc nhóm sau khi gom. | SQLBolt 11 |
| c5-b4 | Báo cáo doanh thu | playground trên `teashop-big` | Doanh thu theo ngày, theo món, theo tiệm. Bỏ đơn cancelled. | Mode SQL Tutorial (ý tưởng) |
| c6-b1 | INNER JOIN | playground | Nối hai table bằng key, viết ON. Alias của table. Oracle báo lỗi nếu viết AS trước alias của table. | CS50 SQL L1, SQLBolt 6 |
| c6-b2 | LEFT JOIN | playground | Giữ mọi row của table bên trái, bên phải không khớp thì ra NULL. Tìm món chưa từng bán. | CS50 SQL L1, SQLBolt 7 |
| c6-b3 | Nối ba table | playground | orders, order_items, products. Nối rồi mới gom nhóm. | SQLBolt 7 |
| c6-b4 | subquery với IN | playground | subquery trả một danh sách cho IN. Scalar subquery so với giá trung bình. | CS50 SQL L1 |
| c7-b1 | INSERT, UPDATE, DELETE | `dml-rehearsal` | Ba lệnh sửa dữ liệu. UPDATE và DELETE không có WHERE sẽ đổi mọi row. Luôn chạy SELECT với cùng WHERE trước. | CS50 SQL L3 |
| c7-b2 | transaction, COMMIT, ROLLBACK | `tx-cart` | transaction là một giỏ thay đổi. COMMIT lưu, ROLLBACK bỏ. MySQL tự commit, tool Oracle thường chờ COMMIT. | CS50 SQL L3, tài liệu Oracle |
| c7-b3 | index | `index-race` | Có index thì database tìm nhanh hơn, giống tra mục lục cuối sách. Bù lại ghi chậm hơn một chút. | CS50 SQL L5 |
| c7-b4 | MySQL và Oracle khác nhau ở đâu | `dialect-table` | Ôn mọi khác biệt đã gặp, theo `docs/dialect-verification.md`. Các mã lỗi Oracle hay gặp và cách đọc. | tài liệu MySQL, Oracle |
| c7-b5 | Nhiệm vụ cuối: báo cáo bằng Oracle SQL | bài tập trên `hr` | Một báo cáo hoàn chỉnh bằng Oracle SQL. Nói rõ: schema HR có sẵn trên Oracle FreeSQL, chạy lại đúng các query này trên Oracle thật được. Dẫn sang trang Học tiếp. | oracle-samples/db-sample-schemas |

## Bài tập

Mỗi chương 6 bài tập (`c<N>-e1` tới `c<N>-e6`) và một bài boss (`c<N>-boss`). Mỗi bài là một file trong `src/content/exercises/`, khai báo trong `index.ts`. Đủ các dạng trong `ExerciseKind`, mỗi chương ít nhất ba dạng khác nhau. Chương 1 và 2 chủ yếu dùng dạng `quiz`, `order`, `predict`. Bài `c3-e6` đã có.
