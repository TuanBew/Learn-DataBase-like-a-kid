# Prompt cho Fable: website Learn DataBase like a kid

Đọc hết file này trước khi viết dòng code đầu tiên. File dài vì đây là toàn bộ yêu cầu. Trong lúc làm, quay lại đọc mục liên quan mỗi khi bắt đầu một phần mới.

Đây là dự án ưu tiên thấp và tôi muốn tiết kiệm usage. Mục 14 quy định việc nào bạn tự làm, việc nào giao cho subagent chạy Sonnet. Làm đúng mục 14 từ đầu tới cuối.

Repo: https://github.com/TuanBew/Learn-DataBase-like-a-kid.git. Repo đang trống. Tôi sẽ host trên Vercel.

Ảnh tham khảo style: `docs/reference-style.png`.

---

## 1. Việc cần làm

Dựng một website tĩnh dạy database và SQL cho một người hoàn toàn không biết gì về IT. Người học là người thân của tôi. Ở công ty, họ cần tự chạy query để lấy số liệu làm báo cáo, và công ty dùng Oracle.

Lượng nội dung vừa đủ để một người học xong trong khoảng một tuần, tính ra cỡ 4 tới 6 giờ học. Con số này chỉ để bạn ước lượng nên viết bao nhiêu nội dung. Website không chia theo ngày, không có "Ngày 1", "Ngày 2", không có lịch học hay chuỗi ngày học liên tục. Nội dung chia thành chương và bài như một khóa học bình thường, người học tự đi theo tốc độ của mình.

Người học phải hiểu database trước, sau đó mới học SQL. MySQL dùng để học nền, Oracle SQL dùng cho công việc thật.

Khóa này không đào tạo data analyst. Không dạy thống kê, window function nâng cao hay tối ưu query. Chỉ dạy phần cốt lõi, và dạy cho thật chắc.

Học xong khóa, người học làm được những việc sau:

1. Dùng lời của chính mình để giải thích database, table, row, column, primary key, foreign key và NULL.
2. Tự viết query có SELECT, WHERE, ORDER BY, GROUP BY, HAVING và JOIN để lấy số liệu cho một báo cáo.
3. Biết những chỗ MySQL và Oracle khác nhau hay gặp nhất, và đọc hiểu được các mã lỗi Oracle thường gặp.
4. Hiểu vì sao INSERT, UPDATE, DELETE nguy hiểm, và có thói quen kiểm tra WHERE trước khi chạy.
5. Biết học tiếp ở đâu.

Website thất bại nếu rơi vào một trong các trường hợp sau, dù chạy không lỗi:

* Chữ viết trên site giống sách IT hay tài liệu cho dân software engineer.
* Thuật ngữ bị dịch sang tiếng Việt, làm người học rối thêm.
* Giao diện nhìn như template có sẵn.
* Animation chỉ để trang trí, không giải thích được điều gì.
* Web nặng, tải chậm trên điện thoại.

---

## 2. Tiêu chuẩn WOW

Tôi muốn website này làm tôi WOW. Dùng hết khả năng motion graphic và óc sáng tạo của bạn. Bản "dùng được" là chưa đạt.

Ảnh tham khảo là một trang dạy system design. Nếu repo chưa có ảnh, dựa vào mô tả dưới đây. Những điểm tôi thích ở trang đó: khối isometric có chiều sâu nhẹ, nền giấy kẻ ô, chữ monospace, chip số liệu ở trên cùng, nút Phát lại và Tạm dừng, thanh các bước ở dưới, panel bên phải có ô "Ý chính" và danh sách "Bạn sẽ học". Lấy tinh thần của nó thôi, đừng chép bố cục hay nhận diện. Phải làm hay hơn nó.

Danh sách WOW bắt buộc:

1. Ngay giây đầu tiên ở trang chủ, người học có một cảnh động để chạm vào và thấy nó phản hồi. Chưa cần đọc chữ nào.
2. Mỗi khái niệm có ít nhất một cảnh motion mà người học tự điều khiển: kéo, bấm, bật tắt, kéo thanh trượt. Mỗi animation phải giải thích một điều. Animation chỉ để đẹp thì bỏ.
3. Query Theater ở mục 6 là phần WOW lớn nhất. Dành nhiều công nhất cho nó.
4. Tương tác và motion nào cũng có hiệu ứng âm thanh vui nhộn, giống tiếng trong game. Chi tiết ở mục 8.
5. Có ăn mừng khi xong mỗi chương. Xong cả khóa thì người học gõ tên và nhận giấy chứng nhận tải về dạng ảnh.
6. Tự soi: chụp screenshot từng màn hình. Màn nào nhìn như template thì làm lại.

Gợi ý cảnh motion cho từng khái niệm. Đây chỉ là điểm xuất phát, bạn có ý hay hơn thì cứ làm:

* Database là một nhà kho có người giữ kho. Người giữ kho là DBMS. Người học đưa phiếu yêu cầu là query, người giữ kho chạy đi lấy hàng về.
* Client và server: điện thoại gửi một chấm tròn yêu cầu tới server, server hỏi database rồi gửi kết quả về. Cảnh này gần giống cảnh trong ảnh tham khảo.
* Primary key là số báo danh phát sáng. Thêm một row trùng số báo danh thì row đó bị bật ra kèm tiếng "bonk".
* Foreign key là sợi dây nối hai row ở hai table. Xóa row ở đầu dây thì dây căng đỏ và hiện cảnh báo.
* NULL là một hộp quà rỗng có dấu hỏi. So sánh NULL = NULL thì kết quả không phải TRUE, cho thấy bằng một cú lật bất ngờ.
* Index là cuộc đua giữa người lật từng trang sách và người tra mục lục cuối sách. Trong chữ vẫn gọi là index.
* Transaction là giỏ hàng: COMMIT là bấm thanh toán, ROLLBACK là trả hàng về kệ.

---

## 3. Cách viết chữ trên site và thuật ngữ

Mục này chỉ nói về chữ hiện trên màn hình: lý thuyết, hướng dẫn, lời mascot, thông báo lỗi. Site không có giọng người đọc.

### Người đọc

Dạy như dạy một học sinh tiểu học: từng bước nhỏ, ví dụ đời thường, khen đúng cái người học vừa làm được. Hướng dẫn tận tình như chỉ cho đứa trẻ lên ba. Nhưng người học là người lớn, nên không viết kiểu nói ngọng, không chê bai, không mỉa.

Website có một mascot do bạn tự thiết kế. Không dùng hay nhái bất kỳ nhân vật hoặc logo có sẵn nào, kể cả linh vật của MySQL, Oracle hay PostgreSQL. Mascot xưng "mình", gọi người học là "bạn", và giữ cặp xưng hô này trên toàn site.

### Lý thuyết viết theo STE

Phần lý thuyết viết theo Simplified Technical English, chuẩn ASD STE100, áp dụng cho tiếng Việt. Nếu có skill `ste-tieng-viet` thì load và làm theo. Tóm tắt các luật chính:

* Mỗi câu một ý. Câu lý thuyết nên dưới 20 chữ, câu hướng dẫn thao tác nên dưới 15 chữ.
* Viết câu chủ động. Người hoặc vật làm việc đứng đầu câu.
* Hướng dẫn thao tác viết dạng mệnh lệnh: "Bấm Chạy", "Gõ WHERE".
* Mỗi từ một nghĩa trên toàn site. Đã gọi là "Chạy" thì không lúc gọi "Thực thi", lúc gọi "Run".
* Điều kiện đặt trước hành động: "Nếu kết quả trống, kiểm tra lại WHERE."

### Văn phải đọc như người viết

Nếu có skill `viet-nhu-nguoi` thì load và áp cho toàn bộ chữ tiếng Việt trên site. Nếu không có skill, làm theo các luật sau:

* Vào thẳng ý. Không mở bài kiểu "Hãy cùng tìm hiểu", "Dưới đây là", không kết bằng "Tóm lại", "Hy vọng bạn thấy hữu ích".
* Không dùng mẫu "không chỉ X mà còn Y", "không phải X mà là Y". Nói thẳng Y.
* Không gom ý thành bộ ba cho tròn. Có mấy ý thì kể mấy ý.
* Không chốt đoạn bằng một câu châm ngôn ngắn.
* Tránh các từ sáo: đóng vai trò quan trọng, then chốt, hành trình, khám phá, nâng tầm, chìa khóa, mở ra cánh cửa, một cách hiệu quả, trải nghiệm liền mạch, vô cùng, cực kỳ.
* Không viết văn dịch. Tránh "được... bởi", "Điều này cho phép", "việc", "sự", "một cách", "tiến hành". Không mở câu bằng "Điều này" hay "Nó", hãy gọi đúng tên sự vật.
* Không dùng gạch ngang dài để nối ý. In đậm chỉ một hai chỗ thật cần.
* Đọc lại từng câu. Câu nào người Việt không nói như vậy thì viết lại.

### Thuật ngữ giữ nguyên tiếng Anh

Thuật ngữ kỹ thuật giữ nguyên tiếng Anh. Dịch sang tiếng Việt chỉ làm người học rối thêm. Lần đầu một thuật ngữ xuất hiện, in đậm nó, viết một câu tiếng Việt nói nó dùng để làm gì, và gắn glossary popover mở được bằng hover hoặc chạm. Lời kể và ẩn dụ thì viết bằng tiếng Việt đời thường.

Giữ tiếng Anh, ít nhất là các từ sau: database, DBMS, table, row, column, data type, primary key, foreign key, NULL, constraint, schema, index, query, clause, function, JOIN, subquery, transaction, COMMIT, ROLLBACK, client, server, dialect, và mọi từ khóa SQL.

Trên site, cấm tuyệt đối dùng từ Việt để gọi thay thuật ngữ. Các trường hợp hay gặp:

| Viết | Cấm viết |
|---|---|
| database | cơ sở dữ liệu |
| DBMS | hệ quản trị cơ sở dữ liệu |
| table | bảng |
| row | hàng, bản ghi |
| column | cột, trường |
| primary key | khóa chính |
| foreign key | khóa ngoại |
| index | chỉ mục, chỉ số |
| query | truy vấn |
| schema | lược đồ |
| constraint | ràng buộc |
| transaction | giao dịch |
| clause | mệnh đề |
| data type | kiểu dữ liệu |
| limit, ceiling | trần |

Luật này áp cho mọi kiểu dịch tương tự, kể cả từ không có trong danh sách. Từ đời thường thì vẫn dùng bình thường, ví dụ "khách hàng", "trường học", "giao dịch ngân hàng". Không viết kiểu chêm ngoặc như "khóa chính (primary key)".

Ví dụ văn nên tránh:

> Primary key đóng vai trò quan trọng trong việc định danh duy nhất mỗi bản ghi trong bảng.

Ví dụ văn nên viết:

> Mỗi row cần một mã riêng. Mã này không được trùng với row nào khác. Người ta gọi nó là primary key. Ở lớp học, số báo danh chính là primary key: hai bạn có thể trùng tên, nhưng không bao giờ trùng số báo danh.

---

## 4. Nội dung khóa học

Mỗi bài nên học xong trong 10 tới 20 phút. Mỗi bài đi theo nhịp sau:

1. Mở bằng một chuyện ngoài đời.
2. Cảnh motion giải thích khái niệm.
3. Thử tay ngay.
4. Bài tập.
5. Thẻ "Ngoài đời" kể database đang có mặt ở đâu.
6. Ô "Ý chính".
7. Dòng nguồn tham khảo ở cuối bài.

Mỗi bài dạy MySQL trước. Chỗ nào Oracle viết khác thì có thẻ "Oracle viết thế này" ngay cạnh, và editor có nút đổi dialect.

**Chương 1. Database là gì**
* Dữ liệu ở quanh ta: app mua sắm lưu đơn hàng, app gọi xe lưu chuyến đi, ngân hàng lưu giao dịch, trường học lưu điểm.
* Excel khác database ở chỗ nào: nhiều người ghi cùng lúc, có luật giữ dữ liệu đúng, dữ liệu rất lớn.
* table, row, column, data type cơ bản.
* DBMS là người giữ kho. MySQL, Oracle, PostgreSQL là các DBMS khác nhau. SQL là ngôn ngữ để nói chuyện với DBMS. Mỗi DBMS nói SQL hơi khác nhau, gọi là dialect.
* client và server.
* Thử tay đầu tiên: bấm chạy `SELECT * FROM products;`. Chưa cần hiểu hết câu này.

**Chương 2. Table được thiết kế ra sao**
* primary key, foreign key, quan hệ một với nhiều.
* Vì sao phải tách table: một thông tin bị chép ở nhiều chỗ thì sửa một chỗ sẽ sai ở chỗ khác.
* NULL.
* constraint: NOT NULL, UNIQUE, CHECK.
* Đọc ERD của database mẫu.
* Đọc hiểu CREATE TABLE.

**Chương 3. Hỏi database bằng SELECT**
* SELECT, FROM, chọn column, dấu `*`, đặt tên mới bằng AS.
* WHERE với `=`, `<>`, `>`, `<`, AND, OR, NOT, IN, BETWEEN, LIKE, IS NULL.
* ORDER BY, DISTINCT.
* Lấy n row đầu tiên: MySQL dùng LIMIT, Oracle dùng FETCH FIRST. Nhắc qua ROWNUM vì code Oracle cũ ở công ty hay dùng.
* Thứ tự query chạy thật: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, rồi LIMIT hoặc FETCH FIRST. Đây là xương sống của Query Theater.

**Chương 4. Tính toán và làm sạch dữ liệu**
* Phép tính ngay trong SELECT.
* function chuỗi: UPPER, LOWER, LENGTH, SUBSTR, nối chuỗi.
* function ngày giờ, định dạng ngày. Nhấn mạnh: DATE của Oracle có cả giờ, nên lọc theo ngày rất dễ sót row.
* Xử lý NULL bằng COALESCE, IFNULL, NVL.
* CASE WHEN.

**Chương 5. Gom nhóm để làm báo cáo**
* COUNT, SUM, AVG, MIN, MAX.
* GROUP BY, HAVING. WHERE lọc row trước khi gom, HAVING lọc nhóm sau khi gom.
* Làm báo cáo doanh thu theo ngày, theo món, theo cửa hàng.

**Chương 6. Nối table bằng JOIN**
* INNER JOIN, LEFT JOIN, nối ba table.
* subquery đơn giản dùng IN.
* Alias của table. Oracle báo lỗi nếu viết AS trước alias của table.

**Chương 7. Sửa dữ liệu an toàn, rồi mang về Oracle**
* INSERT, UPDATE, DELETE. Bài nào cũng có cảnh báo, và có bài tập "UPDATE quên WHERE" ở mục 6.
* transaction, COMMIT, ROLLBACK. MySQL tự commit, còn tool Oracle thường chờ người dùng gõ COMMIT.
* index và vì sao có index thì query nhanh hơn.
* Ôn lại mọi chỗ MySQL và Oracle khác nhau, cùng các mã lỗi Oracle hay gặp.
* Nhiệm vụ cuối: làm một báo cáo hoàn chỉnh bằng Oracle SQL trên dataset văn phòng ở mục 5.
* Trang "Học tiếp" ở mục 12.

Bạn được gộp hoặc tách chương, đổi số bài trong mỗi chương, miễn tổng nội dung vẫn cỡ một tuần học. Chỉ cần giữ đúng thứ tự: hiểu database trước, SQL sau, sửa dữ liệu ở cuối.

---

## 5. Database mẫu

Dataset chính là một chuỗi tiệm trà sữa, gồm các table `stores`, `staff`, `customers`, `products`, `orders`, `order_items`. Tên người và tên món bằng tiếng Việt có dấu, giá tính bằng đồng, ngày tháng trong năm 2026. Tên table và column viết tiếng Anh, kiểu snake_case.

Bài học dùng table nhỏ, tối đa khoảng 20 row, để Query Theater hiện được từng row. Bài báo cáo cần nhiều dữ liệu hơn thì dùng tới khoảng 200 row, và Theater chuyển sang chế độ gọn: gom row thành khối, hiện số đếm.

Dataset văn phòng cho chương cuối lấy cấu trúc theo schema HR trong repo `oracle-samples/db-sample-schemas`, giấy phép MIT: `employees`, `departments`, `jobs`, `locations`, rút gọn số row. Oracle FreeSQL có sẵn schema HR, nên học xong người học chạy lại đúng các query này trên Oracle thật được. Nói rõ điều này với người học ở cuối khóa.

---

## 6. Bài tập và Query Theater

### Editor

Chọn một editor nhẹ, ví dụ CodeMirror 6. Editor cần có tô màu cú pháp, gợi ý tên table và column, nút đổi dialect MySQL và Oracle, nút Chạy, phím tắt Ctrl+Enter, nút làm lại từ đầu. Trên điện thoại editor vẫn phải dùng được, nhưng không cần bàn phím riêng.

### Query Theater

Khi người học bấm Chạy, query được diễn lại từng bước ngay trên dữ liệu thật của bài:

1. Câu query tách thành từng clause. Các clause tự bay về xếp lại theo đúng thứ tự chạy thật, mỗi clause có số thứ tự. Khoảnh khắc này phải làm người học thốt lên "à, ra thế".
2. FROM: table bay vào sân khấu. Nếu có JOIN, hai table ghép vào nhau theo key, row khớp thì dính lại.
3. WHERE: từng row đi qua máy soi. Row không đạt rơi xuống, kèm lý do ngắn ngay trên row, ví dụ "giá 25.000 < 30.000".
4. GROUP BY: row bay vào các hộp theo nhóm. Có aggregate thì mỗi hộp thu lại thành một row, con số đếm chạy lên.
5. HAVING: hộp không đạt bị loại.
6. SELECT: column không được chọn mờ đi rồi biến mất, column tính toán hiện ra.
7. ORDER BY: row đổi chỗ cho nhau.
8. LIMIT hoặc FETCH FIRST: cánh cổng đóng lại sau row thứ n.
9. Kết quả cuối hiện cạnh expected result.

Bộ điều khiển gồm: Phát, Tạm dừng, Lùi một bước, Tới một bước, Phát lại, tốc độ 0.5x, 1x, 2x, và Bỏ qua animation. Mỗi bước có một câu giải thích ngắn viết theo STE ở panel bên cạnh. Mỗi nhịp có âm thanh.

Bước nào query không có thì bỏ qua. Query lỗi thì không diễn, chuyển sang phần báo lỗi bên dưới.

### Khi đúng

Ăn mừng ngắn, nói vì sao đúng, cho phép xem lại Theater.

### Khi kết quả sai

Đặt hai kết quả cạnh nhau. Tô màu row thiếu, row thừa, column sai. Mascot gợi ý theo bốn bậc, người học bấm mới mở bậc tiếp:

1. Gợi ý nhẹ: nhắc lại khái niệm cần dùng.
2. Gợi ý cụ thể: chỉ ra clause có vấn đề.
3. Khung query có chỗ trống để điền.
4. Lời giải đầy đủ, chạy trong Theater.

Sai là chuyện bình thường. Lời mascot luôn động viên, không bao giờ làm người học thấy mình kém.

### Khi lỗi cú pháp

Gạch chân đúng chỗ sai, có mũi tên chỉ vào. Nói lỗi bằng lời dễ hiểu, kèm mã lỗi thật của dialect đang chọn, ví dụ gõ LIMIT ở chế độ Oracle thì hiện ORA-00933 và giải thích Oracle dùng FETCH FIRST. Gõ sai tên table hay column thì gợi ý tên gần đúng nhất. Người học sẽ gặp đúng các mã lỗi này ở công ty, nên phần này rất có ích.

### Các dạng bài tập

* Viết query từ đầu.
* Điền chỗ trống trong query.
* Kéo thả để xếp các clause đúng thứ tự.
* Đoán trước row nào còn lại, rồi chạy để kiểm.
* Tìm lỗi trong một query viết sai.
* Viết lại một query MySQL thành Oracle.
* Diễn tập an toàn cho UPDATE và DELETE: chạy trên bản sao dữ liệu. Có WHERE thì chỉ các row bị nhắm tới nháy lên rồi đổi. Quên WHERE thì mọi row đỏ rực, còi báo vang, mascot hốt hoảng, rồi chỉ cách ROLLBACK cứu dữ liệu.

Mỗi chương có ít nhất 6 bài tập và một bài boss cuối chương.

### Cách chấm

* So sánh tập kết quả. Thứ tự row chỉ tính khi đề bài yêu cầu ORDER BY.
* So column theo thứ tự. Tên column so không phân biệt hoa thường. Bỏ qua alias, trừ khi đề bài bắt đặt tên.
* Số thập phân cho sai lệch nhỏ.
* Chấm xong luôn chỉ ra khác ở đâu, không chỉ báo "sai".
* Mỗi bài tập khai báo sẵn vài đáp án sai hay gặp, mỗi đáp án sai có gợi ý riêng. Ví dụ quên WHERE, dùng WHERE thay cho HAVING, JOIN thiếu điều kiện ON.

---

## 7. SQL engine

Engine tự viết bằng TypeScript. Thứ tự xử lý: tokenizer, parser, AST, executor. Executor vừa trả kết quả vừa ghi trace từng bước để Query Theater đọc. Animation chỉ được dựng từ trace, nên query nào người học gõ cũng được diễn lại đúng như nó chạy, kể cả khi người học giải khác lời giải mẫu.

Không đưa sql.js hay database thật nào lên web. Toàn bộ dữ liệu nằm trong bộ nhớ, mỗi bài tập bắt đầu từ dữ liệu gốc.

### Phạm vi hỗ trợ

* SELECT, DISTINCT, `*`, biểu thức, alias.
* FROM, INNER JOIN, LEFT JOIN, alias của table.
* WHERE với so sánh, AND, OR, NOT, IN với danh sách hoặc subquery, BETWEEN, LIKE với `%` và `_`, IS NULL, IS NOT NULL.
* GROUP BY, HAVING, COUNT gồm cả `COUNT(*)` và `COUNT(DISTINCT ...)`, SUM, AVG, MIN, MAX.
* ORDER BY nhiều column, ASC, DESC, NULLS FIRST, NULLS LAST cho Oracle.
* LIMIT và OFFSET cho MySQL. FETCH FIRST, OFFSET ... ROWS và ROWNUM cơ bản cho Oracle.
* CASE WHEN, phép tính, function chuỗi, function ngày giờ, COALESCE, IFNULL, NVL.
* Scalar subquery đơn giản.
* INSERT, UPDATE, DELETE, COMMIT, ROLLBACK.
* CREATE TABLE với các constraint cơ bản.
* table DUAL cho Oracle.

Query ngoài phạm vi trên thì báo vui rằng khóa học chưa dạy tới, và chỉ sang trang Học tiếp. Không được crash, không được trả kết quả sai.

### Phiên bản mục tiêu

MySQL 8. Oracle 19c, vì code chạy được trên 19c thì chạy được trên bản mới hơn. Các bản mới như Oracle 26ai nới vài luật, ví dụ cho SELECT mà không cần FROM DUAL. Nhắc qua điều này, nhưng dạy theo 19c.

### Hai dialect khác nhau ở đâu

Engine phải mô phỏng đúng các khác biệt sau, và bài học phải dạy chúng:

| Chủ đề | MySQL | Oracle |
|---|---|---|
| Lấy n row đầu | `LIMIT n OFFSET m` | `FETCH FIRST n ROWS ONLY`, `OFFSET m ROWS FETCH NEXT n ROWS ONLY`. Code cũ dùng ROWNUM |
| Nối chuỗi | `CONCAT(a, b, c)`. Mặc định `\|\|` là OR | `a \|\| b`. Ở 19c, CONCAT chỉ nhận 2 tham số |
| Thay NULL | `IFNULL`, `COALESCE` | `NVL`, `COALESCE` |
| Ngày giờ hiện tại | `NOW()`, `CURDATE()` | `SYSDATE`, `CURRENT_DATE` |
| Định dạng ngày | `DATE_FORMAT(d, '%Y-%m')` | `TO_CHAR(d, 'YYYY-MM')` |
| Chuỗi thành ngày | `STR_TO_DATE` | `TO_DATE`, `DATE '2026-01-31'` |
| SELECT không cần table | `SELECT 1 + 1` | `SELECT 1 + 1 FROM DUAL`, thiếu FROM thì báo ORA-00923 |
| Chuỗi rỗng | `''` khác NULL | `''` bị coi là NULL |
| So sánh chữ | Collation mặc định không phân biệt hoa thường, không phân biệt dấu: `'Hà' = 'ha'` đúng | Phân biệt hoa thường và dấu |
| Dấu nháy | Chuỗi dùng nháy đơn, nháy kép vẫn chạy. Tên dùng backtick | Chuỗi chỉ dùng nháy đơn. Nháy kép dành cho tên |
| Tên table và column | Giữ như lúc viết | Không có nháy kép thì thành chữ hoa, tiêu đề kết quả in hoa |
| Alias của table | `FROM orders AS o` hoặc `FROM orders o` | Chỉ `FROM orders o`. Viết AS là lỗi |
| NULL khi sắp xếp tăng dần | NULL đứng đầu | NULL đứng cuối |
| data type hay gặp | INT, DECIMAL, VARCHAR, DATE, DATETIME | NUMBER, VARCHAR2, DATE có cả giờ, TIMESTAMP |
| Tự tăng id | `AUTO_INCREMENT` | `GENERATED AS IDENTITY` |
| Lưu thay đổi | autocommit bật sẵn | Tool thường chờ COMMIT |
| Mã lỗi hay gặp | 1064 sai cú pháp, 1146 không có table, 1054 không có column | ORA-00933, ORA-00942, ORA-00904, ORA-00923, ORA-00936, ORA-00979, ORA-01722 |

Kiểm lại từng dòng trong bảng với tài liệu chính thức của MySQL 8 và Oracle 19c trước khi code. Dòng nào sai thì sửa theo tài liệu và ghi vào `docs/decisions.md`.

### Test

* Dùng Vitest.
* sql.js chỉ nằm trong devDependencies, làm trọng tài: với query viết được giống nhau ở mọi dialect, so kết quả của engine với SQLite.
* Mỗi khác biệt trong bảng trên có test riêng, kết quả mong đợi viết tay theo tài liệu chính thức.
* Mỗi lời giải mẫu phải chạy đúng. Mỗi lỗi sai hay gặp phải ra đúng gợi ý.

---

## 8. Hiệu ứng âm thanh

Âm thanh trên site chỉ là hiệu ứng vui nhộn đi kèm tương tác và motion, giống tiếng trong game: tiếng "pop", "bonk", "whoosh", "ting". Không có giọng người đọc, không có text to speech.

* Tạo âm thanh bằng Web Audio, không cần file hoặc chỉ vài file rất nhỏ.
* Cần có tiếng cho: bấm nút, row rơi, row bay vào hộp, cổng đóng, chạy đúng, chạy sai, mở gợi ý, xong bài, xong chương, còi báo động khi UPDATE quên WHERE.
* Âm lượng mặc định nhỏ. Có nút tắt tiếng, và site nhớ lựa chọn đó.
* Chỉ phát tiếng sau lần tương tác đầu tiên của người học, đúng luật autoplay của browser.

---

## 9. Yêu cầu kỹ thuật

* Vite, React, TypeScript, build ra web tĩnh. Không backend, không đăng nhập, không đăng ký.
* Thư viện animation: chọn thứ bạn làm giỏi nhất. Giấy phép phải miễn phí cho dự án này, và tree shaking được.
* Tiến trình lưu trong localStorage. Bọc mọi lần đọc ghi bằng try/catch. Dữ liệu lưu có số phiên bản để sau này đổi cấu trúc không mất tiến trình.
* localStorage nằm riêng trên từng máy, mà người học sẽ dùng cả laptop lẫn điện thoại. Vì vậy cần tính năng xuất tiến trình thành một mã để sao chép, rồi dán mã đó vào máy kia.
* Responsive cho desktop và điện thoại. Query Theater phải xem rõ trên màn hình 390px.
* Font phải có đủ dấu tiếng Việt. Tự host font. Kiểm từng font bằng chuỗi "Nguyễn Thị Hường, ỷ ỹ ự ữ ẵ".
* Lần tải đầu tiên dưới khoảng 250 KB JavaScript sau gzip. Mỗi chương tải riêng khi cần.
* Lighthouse mobile: Performance từ 90, Accessibility từ 95.
* Dùng được bằng bàn phím, có focus rõ ràng, độ tương phản đạt AA. Khi bật prefers-reduced-motion, animation thay bằng các bước tĩnh nhưng vẫn giải thích đủ.
* Nội dung bài học tách khỏi component, để tôi sửa chữ mà không phải đụng vào code giao diện.
* Có `vercel.json` nếu routing cần.
* Dark mode nếu làm kịp, không bắt buộc.

---

## 10. Công cụ cho bạn

Trước khi code, tự tìm và cài các skill, plugin, MCP server hợp với việc dựng giao diện và animation. Vài ví dụ để bắt đầu: skill `frontend-design` và `webapp-testing` trong repo `anthropics/skills`, một MCP server điều khiển browser như Playwright MCP để mở trang, chụp screenshot và tự kiểm, một MCP server tra tài liệu thư viện. Tìm thêm trong các plugin marketplace.

Chỉ cài từ nguồn có uy tín. Không đưa secret nào vào repo. Báo lại tôi đã cài những gì ở Mốc 1.

---

## 11. Nguồn lý thuyết

Không soạn lý thuyết theo trí nhớ. Mỗi bài dựa trên ít nhất một nguồn dưới đây. Viết lại bằng lời của mình theo cách viết ở mục 3, không chép nguyên văn. Cuối bài ghi tên nguồn kèm link.

| Nguồn | Dùng cho | Ghi chú |
|---|---|---|
| Harvard CS50 SQL, https://cs50.harvard.edu/sql | Khung kiến thức chính từ cơ bản tới CRUD | Giấy phép CC BY-NC-SA 4.0: ghi công, phi thương mại, chia sẻ cùng giấy phép |
| Stanford, Jennifer Widom, khóa "Databases: Relational Databases and SQL" trên edX | Relational model, cách nghĩ về table và quan hệ | Học miễn phí |
| MIT OpenCourseWare 6.830 Database Systems, https://ocw.mit.edu/courses/6-830-database-systems-fall-2010 | Kiểm lại khái niệm DBMS và relational model ở bài 1 và bài 2 | Mức cao học. Chỉ dùng để kiểm khái niệm, không bắt chước cách viết. Giấy phép CC BY-NC-SA |
| Khan Academy, Intro to SQL | Nhịp dạy chậm, thân thiện cho người mới | Miễn phí |
| SQLBolt, https://sqlbolt.com | Cách mỗi bài đi kèm một bài tập | Miễn phí |
| Julia Evans, "SQL queries don't start with SELECT", https://jvns.ca/blog/2019/10/03/sql-queries-don-t-start-with-select/ | Thứ tự chạy của query, nền của Query Theater | Không dùng hình trong zine của tác giả |
| Oracle Dev Gym, "Databases for Developers: Foundations", https://devgym.oracle.com/devgym/database-for-developers.html | Phần Oracle | Miễn phí |
| Oracle Database 19c SQL Language Reference và MySQL 8 Reference Manual | Kiểm cú pháp và bảng khác biệt ở mục 7 | Tài liệu chính thức |
| oracle-samples/db-sample-schemas, https://github.com/oracle-samples/db-sample-schemas | Cấu trúc dataset văn phòng | Giấy phép MIT |

Ví dụ về công ty thật chỉ được dùng khi có link nguồn chính thức. Đây là ba ví dụ đã kiểm, dùng cho các thẻ "Ngoài đời":

* GitHub dùng MySQL làm kho dữ liệu chính cho mọi thứ ngoài git, gồm cả website, API và phần đăng nhập. Nguồn: https://github.blog/engineering/infrastructure/mysql-high-availability-at-github/
* YouTube từng tạo ra Vitess vào năm 2010 khi MySQL của họ sắp quá tải vì lượng người dùng. Nguồn: https://vitess.io/docs/overview/history/
* Instagram dùng PostgreSQL làm database chính và chia dữ liệu ra nhiều máy khi lớn lên. Nguồn: https://instagram-engineering.com/1cf5a71e5a5c

Các ví dụ không gắn tên công ty, như app mua sắm, app gọi xe, ngân hàng, trường học, thì cứ dùng thoải mái, miễn đừng khẳng định công ty cụ thể nào dùng công nghệ gì.

Tạo trang "Nguồn và ghi công" liệt kê mọi nguồn. Nội dung nào phỏng theo CS50 SQL hoặc MIT OCW thì phải theo giấy phép CC BY-NC-SA, ghi rõ điều này trong README.

---

## 12. Trang Học tiếp

Sắp từ dễ tới khó. Mỗi link có một câu nói khi nào nên tới đó:

* SQLBolt, https://sqlbolt.com: luyện lại phần cơ bản, bài ngắn, có bài tập ngay.
* Mode SQL Tutorial, https://mode.com/sql-tutorial: dùng SQL để phân tích dữ liệu, có phần cơ bản, trung cấp, nâng cao.
* DataLemur, https://datalemur.com: luyện đề SQL thật từ các công ty lớn, khi đã vững nền.
* Oracle FreeSQL, https://freesql.com: chạy Oracle SQL thật ngay trong browser, miễn phí, có sẵn schema HR, chọn được bản 19c hoặc 26ai.
* Oracle Dev Gym, khóa Databases for Developers: học tiếp Oracle bài bản.
* SQL Murder Mystery, https://mystery.knightlab.com: phá án bằng SQL, ôn JOIN và WHERE cho vui.
* Harvard CS50 SQL, https://cs50.harvard.edu/sql: muốn hiểu sâu hơn về thiết kế database.
* Khan Academy, Intro to SQL: muốn học thêm qua video chậm rãi.

---

## 13. Cách làm việc và các mốc dừng

**Bước 0.** Lưu file này vào `docs/PROMPT.md` nếu repo chưa có. Tạo `CLAUDE.md` ngắn gọn chứa các luật không được quên: cách viết chữ, danh sách từ cấm, phạm vi khóa học, các mốc dừng, cách chia việc ở mục 14. Phiên làm việc sau đọc `CLAUDE.md` là nhớ lại đủ. Tạo luôn các subagent ở mục 14 trong `.claude/agents/`.

**Mốc 1. Dừng lại chờ tôi duyệt.** Mốc này phải đủ để làm tôi WOW ngay lần mở đầu tiên.
* Kế hoạch ngắn và hướng visual.
* Engine chạy được SELECT, WHERE, ORDER BY, LIMIT, FETCH FIRST, kèm test.
* Bài đầu tiên của Chương 1, làm trọn vẹn với cảnh motion và âm thanh.
* Một bài tập của Chương 3 có Query Theater đầy đủ, cả hai dialect.
* Chạy dev server, chụp screenshot ở 1440px và 390px, gửi tôi kèm danh sách skill, plugin, MCP đã dùng.
* Liệt kê các việc đã giao cho subagent, mỗi việc chạy model nào.

**Mốc 2.** Làm hết engine, đủ mọi chương và toàn bộ bài tập. Gặp quyết định lớn thì dừng lại hỏi.

**Mốc 3.** Đánh bóng, kiểm tra theo danh sách dưới đây, viết hướng dẫn deploy Vercel ngắn trong README.

Chỉ hỏi tôi khi gặp quyết định không đảo ngược được, hoặc khi phải đổi phạm vi. Những việc khác tự quyết, ghi lý do vào `docs/decisions.md`. Commit nhỏ, message rõ ràng.

### Chỉ được báo xong khi

* `npm run build` chạy qua, toàn bộ test qua, console không có lỗi.
* Lời giải mẫu của mọi bài tập chạy đúng ở mọi dialect mà bài đó dùng.
* Đã chụp screenshot mọi màn hình ở 1440px và 390px, và đã tự soi bằng mắt.
* Đã đọc lại toàn bộ chữ trên site: không còn từ cấm ở mục 3, không còn dấu hiệu văn AI.
* Đạt các con số Lighthouse ở mục 9.
* Tải lại trang không mất tiến trình. Xuất và nhập mã tiến trình chạy đúng.
* Nút tắt tiếng và chế độ reduced motion chạy đúng.
* Mở lại site như một người lần đầu vào, và vẫn thấy WOW. Nếu chưa thấy, làm tiếp.

---

## 14. Chia việc để tiết kiệm usage

Bạn là Fable, chạy ở phiên chính. Phiên chính tốn usage nhiều nhất, nên chỉ giữ ở đây những việc cần sức của Fable. Việc nhẹ hơn thì giao cho subagent chạy Sonnet.

### Fable tự làm

* Kiến trúc tổng thể và cấu trúc thư mục.
* Phần lõi của SQL engine: parser, executor, định dạng trace.
* Query Theater và các cảnh motion chính.
* Hướng visual, design token, component nền mà các phần khác dùng lại.
* Duyệt kết quả subagent gửi về. Duyệt theo mẫu: đọc kỹ vài phần, không đọc lại toàn bộ.
* Các quyết định khó và phần kiểm tra cuối ở mỗi mốc.

### Giao cho subagent chạy Sonnet

* Tạo dữ liệu mẫu theo spec ở mục 5.
* Viết nháp nội dung bài học theo dàn ý và nguồn ở mục 11, đúng luật viết ở mục 3.
* Soạn bài tập theo một khuôn có sẵn: đề bài, dữ liệu, lời giải mẫu, các đáp án sai hay gặp kèm gợi ý.
* Viết test cho từng dòng trong bảng khác biệt ở mục 7, và tra tài liệu chính thức để kiểm từng dòng.
* Glossary, trang Nguồn và ghi công, trang Học tiếp, README, hướng dẫn deploy.
* Chạy build, test, Lighthouse, chụp screenshot hàng loạt. Chỉ báo về lỗi và con số, không gửi nguyên log.
* Quét toàn bộ chữ trên site để tìm từ cấm và dấu hiệu văn AI.
* Component đơn giản dựng theo design token đã có. Sửa lint, đổi tên hàng loạt.

### Cách gọi subagent

* Ở Bước 0, tạo sẵn các subagent trong `.claude/agents/`, mỗi file có `model: sonnet` trong frontmatter. Ví dụ: `content-writer`, `exercise-author`, `test-writer`, `qa-runner`, `copy-checker`. Mỗi subagent chỉ được cấp những tool nó cần.
* Khi tạo subagent tạm thời bằng Agent tool, luôn truyền `model: "sonnet"`. Không được bỏ trống model, vì bỏ trống thì subagent sẽ chạy bằng model của phiên chính, tức là Fable.
* Chỉ dùng subagent Fable khi một việc nặng thật sự cần context riêng. Ghi lý do vào `docs/decisions.md`.

### Giữ cho phiên chính gọn

* Lời giao việc ngắn nhưng đủ: mục tiêu, đường dẫn file, luật cần theo, tiêu chí xong. Subagent không thấy cuộc trò chuyện của bạn, nên đừng giả định nó biết gì.
* Yêu cầu subagent trả về bản tóm tắt dưới 200 chữ kèm danh sách file đã đổi, không dán lại nội dung file.
* Các việc không phụ thuộc nhau thì giao song song.
* Việc chỉ cần vài thao tác thì tự làm luôn. Gọi subagent cho việc đó còn tốn hơn.
* Không đọc lại cả file lớn. Dùng tìm kiếm và đọc đúng đoạn cần.
* Không kéo log dài vào phiên chính. Để `qa-runner` chạy và báo lại chỗ lỗi.
