# Kế hoạch và hướng visual

## Hướng visual: vở ô ly, mực tím, bút đỏ

Người học bắt đầu từ con số không, nên site trông như cuốn vở của học sinh tiểu học Việt Nam.

- Nền là giấy ô ly: ô nhỏ 8px, cứ 5 ô có một đường đậm, màu xanh ngọc nhạt.
- Chữ và viền dùng màu mực tím (`--ink`). Mọi khối có viền mực 2px và một mặt bên cứng, không dùng bóng mờ. Đây là cách site lấy tinh thần "khối có chiều sâu" của ảnh tham khảo.
- Bút đỏ của cô giáo chỉ dùng cho lời phê: lý do một row bị loại, điểm 10 khi làm đúng, số chương trong mục lục, lề đỏ của trang vở.
- Màu khối lấy từ quầy trà sữa: trà sữa, matcha, khoai môn, xoài, đào, trân châu. Mỗi clause của query có một màu riêng và giữ màu đó ở mọi nơi: FROM xanh da trời, WHERE xoài, SELECT khoai môn, ORDER BY matcha, LIMIT và FETCH FIRST đào.
- Chữ: Baloo 2 cho tiêu đề, Be Vietnam Pro cho chữ đọc, JetBrains Mono cho dữ liệu và SQL, Patrick Hand cho lời phê bút đỏ. Cả bốn font tự host, chỉ lấy bộ latin và vietnamese.
- Mascot là Bi, một chú robot nhỏ có thân là khối trụ database. Bi là người giữ kho, tức hình ảnh của DBMS ở Chương 1.

Điểm lấy từ ảnh tham khảo: nền giấy kẻ ô, chữ mono cho dữ liệu, chip số liệu, nút Phát lại và Tạm dừng, dãy bước, ô "Ý chính" và "Bạn sẽ học". Điểm cố ý làm khác: không chép bố cục ba cột, dãy bước nằm trên sân khấu và chính là các clause của query, lời giải thích do mascot nói.

## Kiến trúc

```
src/engine     SQL engine thuần TypeScript: tokenizer, parser, executor ghi trace, grader
src/theater    Query Theater: trace -> khung hình (frames.ts) -> sân khấu (Stage.tsx)
src/scenes     Cảnh motion của từng bài
src/content    Toàn bộ chữ và nội dung bài học, bài tập, glossary
src/data       Database mẫu
src/sfx        Âm thanh Web Audio
src/components Component nền dùng lại
src/pages      Trang chủ, trang bài học, trang bài tập
```

- Theater không tự diễn theo kịch bản. `buildFrames(trace)` là hàm thuần, biến trace của engine thành danh sách khung hình. Vị trí của từng row trên sân khấu chỉ phụ thuộc vào khung hình, nên lùi, tới, tua nhanh đều ra đúng một cảnh.
- Trang chủ tải engine, motion và cảnh đầu trang. Trang bài học, trang bài tập, CodeMirror, từng bài và từng database tải riêng khi cần.

## Mốc 1 (bản này)

- Engine: SELECT, WHERE, ORDER BY, LIMIT, FETCH FIRST ở hai dialect, có mã lỗi thật.
- Bài 1 Chương 1 trọn vẹn, có hai cảnh motion và âm thanh.
- Bài tập `c3-e6` có Query Theater đầy đủ ở MySQL và Oracle.
- Trang chủ dạy database trước: ứng dụng gửi dữ liệu qua server vào database, rồi table, row, column, sau cùng mới nhắc tới SQL.

## Mốc 2 (đã xong)

Kết quả: 33 bài học, 49 bài tập (mỗi chương 6 bài và một bài boss), 17 cảnh motion, 1094 test qua. JS tải lần đầu khoảng 88 KB gzip. Lighthouse mobile trên sáu trang mẫu: Performance 99 tới 100, Accessibility 100. Lượt quét 164 trang (bài học và bài tập ở 1440px và 390px) không còn lỗi console hay tràn ngang.

1. Engine: JOIN, GROUP BY, HAVING, aggregate, subquery, function chuỗi và ngày giờ, ROWNUM, INSERT, UPDATE, DELETE, COMMIT, ROLLBACK, CREATE TABLE.
2. Theater: bước JOIN, GROUP BY, HAVING, chế độ gọn cho 200 row, diễn tập UPDATE và DELETE.
3. Cảnh motion cho từng khái niệm: nhà kho và người giữ kho, client và server, primary key, foreign key, NULL, index, transaction.
4. Đủ 7 chương, mỗi chương ít nhất 6 bài tập và một bài boss. Dataset 200 row và dataset HR.
5. Trang Học tiếp, Nguồn và ghi công, giấy chứng nhận, xuất và nhập mã tiến trình.

## Mốc 3 (đã xong)

Kết quả kiểm cuối ngày 21/11/2026: 1094 test qua, lượt quét 164 trang không lỗi, axe-core 0 vi phạm ở cả giao diện sáng và tối, 81 lượt giải bài tập trong giao diện thật đều qua. Lighthouse mobile trên 13 trang: Performance từ 94 tới 100, Accessibility 100. Con số đầy đủ ở mục "Trạng thái" của `README.md`.

1. Đánh bóng: con dấu bút đỏ cuối chương, nút Học tiếp ở trang chủ, kéo thả ở bài xếp clause, Theater trên điện thoại, tiêu đề tab riêng cho từng trang.
2. Giao diện tối "bảng đen, phấn màu", bật bằng công tắc ở đầu trang. Mọi màu đi qua token.
3. Đọc lại toàn bộ chữ trên site theo luật viết. Có thêm `scripts/qa/copy-scan.cjs` làm lưới đỡ.
4. Chụp 87 trang ở 1440px và 390px, cắt thành 428 mảnh để soi, sửa rồi soi lại một mẫu 133 mảnh.
5. Kiểm theo danh sách "Chỉ được báo xong khi": build, test, console, lời giải mẫu ở từng dialect, tiến trình và mã tiến trình, nút tắt tiếng, reduced motion, bàn phím.
6. `README.md` có hướng dẫn deploy Vercel và danh sách script kiểm.

Chưa kiểm được: nghe âm thanh bằng tai, và vài điểm dialect cần MySQL và Oracle thật (ghi ở `README.md` và `docs/dialect-verification.md`). Trang bài tập mở thẳng tải 306 KB JS gzip, cao hơn mức 250 KB; trang chủ và bài học nằm dưới mức này.
