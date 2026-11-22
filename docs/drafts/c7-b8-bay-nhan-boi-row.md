# Bài C7-B8: Bẫy nhân bội row, nối xong SUM ra số quá lớn

Bản nháp chờ duyệt. Chương 7 "Nối table", bài 8. Khoảng 18 phút. Database: `teashop`. Dạy MySQL trước, Oracle ở thẻ riêng. Mọi con số trong bài lấy từ lần chạy thật trên engine của repo.

Lead: Nối một table với hai table khác làm tổng tiền phình to, mà query không báo lỗi.

## Bạn sẽ học

- Nhận ra khi nào row bị nhân lên sau khi nối
- Phát hiện bằng cách đếm row trước và sau khi nối
- Dùng COUNT(DISTINCT) để so với số row thật
- Sửa bằng cách gom trước rồi mới nối, hoặc tách thành hai query

## Câu chuyện

Anh Long, chủ chuỗi Trà Mây, nhờ Bi làm một báo cáo nhỏ. Mỗi tiệm cần hai số: tổng lương nhân viên và số đơn đã bán.

Bi nối table stores với table staff và table orders. Bi cộng lương bằng SUM. Query chạy xong, không báo lỗi nào.

Tiệm Hoàn Kiếm ra tổng lương 82.000.000. Anh Long nhìn số đó và hỏi: "Tiệm này có hai người. Một người 12.500.000, một người 8.000.000. Sao ra 82 triệu?"

Bi cộng lại bằng tay. Hai người cộng lại đúng 20.500.000.

Query không sai cú pháp. Query sai ý. Bạn sẽ xem số liệu nở ra từ đâu.

## Tự bấm

Cảnh tên gợi ý: `row-fan`. Dữ liệu lấy từ teashop, tiệm Hoàn Kiếm (store_id 2). Tiệm này có hai nhân viên và bốn đơn.

Màn hình có ba cụm. Cụm trái là thẻ tiệm Hoàn Kiếm. Cụm giữa là hai danh sách: "Nhân viên" (Đặng Thu Phương 12.500.000, Bùi Văn Khoa 8.000.000) và "Đơn" (1003, 1009, 1014, 1018). Cụm phải là hai bộ đếm: "Số row" và "Tổng lương", cùng nút bấm theo bước.

Bước 1. Người học bấm "Nối nhân viên".
Hai thẻ nhân viên bay lại dính vào thẻ tiệm. Bộ đếm hiện: số row 2, tổng lương 20.500.000.
Bi nói: "Hai người, hai row. Tổng lương đúng."

Bước 2. Người học bấm "Nối thêm đơn".
Mỗi thẻ nhân viên tách ra thành bốn bản, mỗi bản dính với một đơn. Số bản chạy từ 2 lên 8. Tổng lương chạy từ 20.500.000 lên 82.000.000. Bộ đếm đổi màu đỏ.
Bi nói: "Mình nối đơn vào, mỗi người bị chép bốn lần. Bốn là số đơn của tiệm."

Bước 3. Người học bấm "Đếm khác nhau".
Cảnh hiện ba con số cạnh nhau: số row 8, số nhân viên khác nhau 2, số đơn khác nhau 4. Dưới đó có phép tính 2 × 4 = 8.
Bi nói: "Row nhiều hơn số người và nhiều hơn số đơn. Đó là dấu hiệu nhân bội."

Bước 4. Người học bấm lần lượt bốn thẻ tiệm ở phía trên.
Mỗi tiệm hiện phép nhân của nó: Cầu Giấy 3 × 6 = 18, Hoàn Kiếm 2 × 4 = 8, Quận 1 3 × 6 = 18, Quận 3 2 × 4 = 8. Tổng bốn tiệm là 52 row, trong khi table staff chỉ có 10 row.
Bi nói: "Tiệm nào có nhiều đơn thì lương bị nhân nhiều lần."

Bước 5. Người học bấm "Gom trước".
Danh sách nhân viên gập lại thành một thẻ "Tổng lương 20.500.000". Danh sách đơn gập lại thành một thẻ "4 đơn". Hai thẻ dính vào thẻ tiệm. Bộ đếm hiện: số row 1, tổng lương 20.500.000, số đơn 4.
Bi nói: "Mỗi bên chỉ còn một row cho tiệm. Nối một với một thì không nhân lên."

## Lý thuyết

Một tiệm có nhiều nhân viên. Một tiệm cũng có nhiều đơn. Tiệm là phía "một" của cả hai quan hệ.

Nối tiệm với nhân viên cho ra đúng 10 row, vì mỗi nhân viên thuộc một tiệm.

Nối thêm orders thì mỗi nhân viên ghép với từng đơn của cùng tiệm. Hoàn Kiếm có 2 nhân viên và 4 đơn, nên ra 8 row.

**[[row-fan-out]]** là hiện tượng một row bị chép thành nhiều row sau khi nối. Bài này gọi tắt là nhân bội row.

Row không mất đi. Row chỉ bị chép thêm, và các column của nó lặp lại ở mỗi bản.

SUM cộng mọi bản. Lương của một người bị cộng nhiều lần.

COUNT(*) cũng đếm mọi bản. MIN và MAX không đổi, vì giá trị lớn nhất vẫn là giá trị đó.

AVG ở ví dụ này tình cờ ra đúng. Mỗi nhân viên bị chép số lần bằng nhau. Đừng dựa vào chuyện này.

Cách phát hiện thứ nhất: đếm row trước khi nối, rồi đếm sau khi nối. Table staff có 10 row, table orders có 20 row. Nối cả ba table ra 52 row. Số này lớn hơn cả hai.

Quy tắc kiểm nhanh: nối xong mà số row lớn hơn mọi table phía "nhiều", hãy dừng lại và xem lại.

Cách phát hiện thứ hai: đặt COUNT(*) cạnh COUNT(DISTINCT) của primary key từng table. Ví dụ `COUNT(DISTINCT sf.staff_id)` và `COUNT(DISTINCT o.order_id)`. Nếu COUNT(*) lớn hơn cả hai, row đã bị nhân.

Cách phát hiện thứ ba: so tổng với tổng chạy trên table gốc. `SELECT SUM(salary) FROM staff` ra 97.500.000. Query nối ra 503.000.000.

Đừng chữa bằng `SUM(DISTINCT salary)`. DISTINCT bỏ các giá trị trùng nhau, nên nhiều người cùng mức lương bị gộp thành một. Tổng cả chuỗi ra 61.500.000, còn đúng là 97.500.000.

Cách sửa thứ nhất: gom trước rồi mới nối. Mỗi table phía "nhiều" gom về một row cho mỗi tiệm bằng GROUP BY. Sau đó nối các kết quả đã gom với table stores.

Gom trước cần một subquery nằm trong FROM. Engine của khóa học sẽ thêm loại subquery này sau. Ở bài này bạn xem query và số liệu, và chạy được từng nửa của nó.

Cách sửa thứ hai: tách thành hai query. Một query tính lương, một query đếm đơn. Bạn đặt hai kết quả cạnh nhau. Cách này đơn giản và ít sai nhất.

Quy tắc thực tế: một table "một" nối với hai table "nhiều" thì hỏi ngay xem row có bị nhân không.

## Thử tay ngay

Intro: "Bấm Chạy. Query nối stores, staff, orders, rồi cộng lương mỗi tiệm. Xem tổng lương có đúng không."

Query chính:

```sql
SELECT st.store_id, st.name,
       COUNT(*) AS so_row,
       SUM(sf.salary) AS tong_luong
FROM stores AS st
INNER JOIN staff AS sf ON sf.store_id = st.store_id
INNER JOIN orders AS o ON o.store_id = st.store_id
GROUP BY st.store_id, st.name
ORDER BY st.store_id;
```

Kết quả thật: Cầu Giấy 18 row, 165.000.000. Hoàn Kiếm 8 row, 82.000.000. Quận 1 18 row, 174.000.000. Quận 3 8 row, 82.000.000.

Thử đổi:

1. Thêm hai phép đếm COUNT(DISTINCT) cạnh COUNT(*). Kết quả: so_row 18, 8, 18, 8; so_nhan_vien 3, 2, 3, 2; so_don 6, 4, 6, 4.

```sql
SELECT st.store_id, st.name,
       COUNT(*) AS so_row,
       COUNT(DISTINCT sf.staff_id) AS so_nhan_vien,
       COUNT(DISTINCT o.order_id) AS so_don
FROM stores AS st
INNER JOIN staff AS sf ON sf.store_id = st.store_id
INNER JOIN orders AS o ON o.store_id = st.store_id
GROUP BY st.store_id, st.name
ORDER BY st.store_id;
```

2. Bỏ GROUP BY để xem tổng cả chuỗi. Kết quả: 52 row, tổng lương 503.000.000. Chạy thêm `SELECT SUM(salary) AS total FROM staff;` để thấy số đúng: 97.500.000.

```sql
SELECT COUNT(*) AS so_row, SUM(sf.salary) AS tong_luong
FROM stores AS st
INNER JOIN staff AS sf ON sf.store_id = st.store_id
INNER JOIN orders AS o ON o.store_id = st.store_id;
```

3. Thử chữa bằng DISTINCT trong SUM. Kết quả: 61.500.000, vẫn sai.

```sql
SELECT SUM(DISTINCT sf.salary) AS tong_luong
FROM stores AS st
INNER JOIN staff AS sf ON sf.store_id = st.store_id
INNER JOIN orders AS o ON o.store_id = st.store_id;
```

4. Tách thành hai query. Query A cho lương đúng: 27.500.000, 20.500.000, 29.000.000, 20.500.000. Query B cho số đơn đúng: 6, 4, 6, 4.

```sql
-- Query A
SELECT store_id, SUM(salary) AS tong_luong
FROM staff
GROUP BY store_id
ORDER BY store_id;

-- Query B
SELECT store_id, COUNT(*) AS so_don
FROM orders
GROUP BY store_id
ORDER BY store_id;
```

Bi nói: "Hai query riêng cho số đúng, vì mỗi query chỉ nối một phía nhiều. Query nối cả hai phía thì nhân row."

## Cách sửa thứ nhất: gom trước rồi nối (engine sẽ thêm)

Query sau là cách sửa chính thức. Query này cần subquery trong FROM, nên engine chưa chạy được.

```sql
SELECT st.store_id, st.name, l.tong_luong, d.so_don
FROM stores AS st
INNER JOIN (
  SELECT store_id, SUM(salary) AS tong_luong
  FROM staff
  GROUP BY store_id
) AS l ON l.store_id = st.store_id
INNER JOIN (
  SELECT store_id, COUNT(*) AS so_don
  FROM orders
  GROUP BY store_id
) AS d ON d.store_id = st.store_id
ORDER BY st.store_id;
```

Kết quả đúng, lấy từ hai query A và B ở trên: Cầu Giấy 27.500.000 và 6 đơn. Hoàn Kiếm 20.500.000 và 4 đơn. Quận 1 29.000.000 và 6 đơn. Quận 3 20.500.000 và 4 đơn.

Mỗi subquery gom về một row cho mỗi tiệm. Nối một row với một row thì không có gì để nhân.

## Oracle viết thế này

Logic của bẫy giống hệt. Oracle cũng nhân row và cũng báo 52 row, 503.000.000.

Chỗ khác nằm ở cách viết alias. Oracle không nhận AS trước alias của table. Với subquery trong FROM cũng vậy: alias viết liền sau dấu đóng ngoặc.

Oracle không cần dấu chấm phẩy cuối query trong tool của khóa học. Tên column trong kết quả hiện chữ hoa: `TONG_LUONG`, `SO_ROW`.

```sql
-- MySQL
FROM stores AS st
INNER JOIN staff AS sf ON sf.store_id = st.store_id
INNER JOIN orders AS o ON o.store_id = st.store_id

-- Oracle
FROM stores st
INNER JOIN staff sf ON sf.store_id = st.store_id
INNER JOIN orders o ON o.store_id = st.store_id
```

Query gom trước ở Oracle:

```sql
SELECT st.store_id, st.name, l.tong_luong, d.so_don
FROM stores st
INNER JOIN (
  SELECT store_id, SUM(salary) AS tong_luong
  FROM staff
  GROUP BY store_id
) l ON l.store_id = st.store_id
INNER JOIN (
  SELECT store_id, COUNT(*) AS so_don
  FROM orders
  GROUP BY store_id
) d ON d.store_id = st.store_id
ORDER BY st.store_id
```

## Kiểm tra nhanh

**Câu 1.** Tiệm 1 (Cầu Giấy) có 3 nhân viên và 6 đơn. Bạn nối stores với staff và orders, chỉ lấy tiệm 1. Có bao nhiêu row?

- A. 9. Phản hồi: "9 là 3 cộng 6. Nối là ghép từng cặp, nên phải nhân, không cộng."
- B. 18. [đúng] Phản hồi: "Đúng. Mỗi nhân viên ghép với cả 6 đơn, nên ra 3 × 6 = 18."
- C. 6. Phản hồi: "6 là số đơn. Nhưng mỗi đơn ghép với cả 3 nhân viên, nên row nhiều hơn 6."
- D. 3. Phản hồi: "3 là số nhân viên. Nối thêm orders làm mỗi nhân viên bị chép thêm."

**Câu 2.** Bạn nối orders với order_items, rồi COUNT(*) ra 48. COUNT(DISTINCT o.order_id) ra 20. Số đơn thật là bao nhiêu?

- A. 48. Phản hồi: "48 là số món đã gọi. Mỗi đơn có nhiều món nên đơn bị đếm nhiều lần."
- B. 20. [đúng] Phản hồi: "Đúng. COUNT(DISTINCT) đếm mỗi đơn một lần, và table orders có 20 row."
- C. 68. Phản hồi: "Không cộng hai số này. 48 đếm cả các bản bị chép, 20 đếm đơn khác nhau."

**Câu 3.** Bạn chữa query lương bằng `SUM(DISTINCT sf.salary)` cho cả chuỗi và ra 61.500.000. Tổng đúng là 97.500.000. Vì sao số thấp hơn?

- A. Table staff thiếu row. Phản hồi: "Table staff có đủ 10 row. Số thấp hơn vì DISTINCT bỏ giá trị trùng."
- B. Nhiều người cùng mức lương, và DISTINCT gộp họ thành một. [đúng] Phản hồi: "Đúng. Ba người cùng lương 8.000.000 chỉ được tính một lần."
- C. Do nối sai điều kiện. Phản hồi: "Điều kiện nối vẫn đúng. Lỗi nằm ở DISTINCT bỏ các giá trị trùng."

## Bài tập của bài

1. Query chính của bài ra tổng lương mỗi tiệm quá lớn. Sửa cho ra 27.500.000, 20.500.000, 29.000.000, 20.500.000. (Dạng sửa query lỗi. Lời giải: bỏ JOIN orders.)
2. Nối orders với order_items, rồi đếm số đơn mỗi tiệm bằng COUNT(DISTINCT). Kết quả phải là 6, 4, 6, 4. (Query nối stores, orders, order_items, GROUP BY tiệm. Nếu viết COUNT(*) thì ra 12, 8, 18, 10, là số món đã gọi.)
3. Viết hai query riêng: tổng lương mỗi tiệm, và số đơn mỗi tiệm. Viết cho cả MySQL và Oracle. Máy chấm chạy từng query và so với kết quả đúng.

## Ngoài đời

Một bạn phân tích dữ liệu nối table khách với table đơn và table phiếu hỗ trợ. Bạn cộng doanh thu mỗi khách.

Doanh thu cả công ty ra gấp ba lần số của phòng kế toán. Khách nào có nhiều phiếu hỗ trợ thì doanh thu bị cộng nhiều lần.

Bạn đếm row trước và sau mỗi lần nối, rồi thấy chỗ row phình ra. Bạn tách doanh thu và phiếu thành hai query, và số khớp với kế toán.

## Ý chính

- Nối một table "một" với hai table "nhiều" thì row ghép chéo nhau và bị nhân lên.
- SUM và COUNT(*) cộng cả các bản bị chép nên ra số quá lớn.
- Phát hiện: đếm row trước và sau khi nối, so với COUNT(DISTINCT) và với tổng trên table gốc.
- Sửa: gom trước rồi mới nối, hoặc tách thành hai query. SUM(DISTINCT) không sửa được.
