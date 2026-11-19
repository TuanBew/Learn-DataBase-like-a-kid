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

Kết quả: 33 bài học, 49 bài tập (mỗi chương 6 bài và một bài boss), 17 cảnh motion, 1094 test qua. JS tải lần đầu của trang chủ khoảng 135 KB gzip. Lượt quét 164 trang (bài học và bài tập ở 1440px và 390px) không còn lỗi console hay tràn ngang.

1. Engine: JOIN, GROUP BY, HAVING, aggregate, subquery, function chuỗi và ngày giờ, ROWNUM, INSERT, UPDATE, DELETE, COMMIT, ROLLBACK, CREATE TABLE.
2. Theater: bước JOIN, GROUP BY, HAVING, chế độ gọn cho 200 row, diễn tập UPDATE và DELETE.
3. Cảnh motion cho từng khái niệm: nhà kho và người giữ kho, client và server, primary key, foreign key, NULL, index, transaction.
4. Đủ 7 chương, mỗi chương ít nhất 6 bài tập và một bài boss. Dataset 200 row và dataset HR.
5. Trang Học tiếp, Nguồn và ghi công, giấy chứng nhận, xuất và nhập mã tiến trình.

## Mốc 3

Đánh bóng, kiểm theo danh sách ở mục 13 của `docs/PROMPT.md`, dark mode nếu kịp, hướng dẫn deploy Vercel.
