import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c12-b2',
  chapter: 12,
  order: 2,
  title: 'Nhiệm vụ 2: báo cáo bán hàng theo tháng, có xếp hạng',
  lead: 'Bạn chia một báo cáo doanh thu lớn thành các bước nhỏ, rồi viết từng bước bằng WITH.',
  minutes: 10,
  goals: [
    'Đọc sơ đồ để tìm table cần dùng',
    'Viết query nhiều bước bằng WITH',
    'Kiểm con số ở từng bước',
    'Xếp hạng và lấy top N mỗi nhóm bằng window function',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Họp đầu tháng',
      paragraphs: [
        'Anh Hùng là trưởng phòng kinh doanh. Sáng đầu tháng, anh nhắn bạn: "Cho anh doanh thu từng tháng của năm ngoái."',
        'Anh nhắn tiếp: "Kèm danh sách xếp hạng nhân viên bán quý 4, và ba khách lớn nhất mỗi khu vực."',
        'Ba yêu cầu này đều lấy từ database công ty. Bạn không viết một query khổng lồ. Bạn làm từng bước, và Bi giúp bạn kiểm.',
      ],
    },
    {
      type: 'text',
      title: 'Chia báo cáo thành bước nhỏ',
      paragraphs: [
        'Một báo cáo lớn là nhiều query nhỏ xếp chồng nhau. Viết từng bước, kiểm xong mới sang bước sau.',
        'Bước một: đọc sơ đồ để tìm table. Tiền nằm ở hai nơi. Table `orders` giữ ngày đặt, trạng thái và nhân viên bán. Table `order_items` giữ `quantity` và `unit_price`.',
        'Doanh thu của một đơn là tổng `quantity * unit_price` của các món trong đơn. Hai table nối với nhau bằng `order_id`.',
        'Bước hai: viết từng bước bằng WITH. Mỗi bước nhận một tên, và bước sau dùng tên đó như một table. Phần này gọi là **[[cte]]**.',
        'Ví dụ: bước `rep_rev` cộng doanh thu mỗi nhân viên. Query ngoài nối `rep_rev` với `employees` để lấy tên.',
        'Bước ba: kiểm số ở từng bước. Chạy riêng phần trong WITH trước. Nếu kết quả lạ, bạn biết lỗi nằm ở bước nào.',
        'Có một phép kiểm dễ làm. Cộng doanh thu của mười hai tháng. Con số này phải bằng doanh thu cả năm tính một lần.',
      ],
    },
    {
      type: 'text',
      title: 'Ba bẫy của báo cáo doanh thu',
      paragraphs: [
        "Bẫy một: đơn hủy. Đơn có `status` là 'cancelled' không tính doanh thu. Nhớ lọc chúng trong WHERE.",
        'Bẫy hai: khoảng thời gian. Ngày đặt có cả giờ và phút. Viết `order_date >= DATE '2025-01-01' AND order_date < DATE '2026-01-01'` để không bỏ sót ngày cuối năm.',
        'Bẫy ba: đơn chưa ghi nhân viên bán. Column `sales_rep_id` của các đơn này là NULL. INNER JOIN với `employees` bỏ chúng đi, nên tổng của hai báo cáo có thể lệch nhau.',
      ],
    },
    {
      type: 'text',
      title: 'Xếp hạng và top N mỗi nhóm',
      paragraphs: [
        'RANK xếp hạng từng row theo một thứ tự. RANK thuộc nhóm **[[window-function]]**.',
        '`RANK() OVER (ORDER BY revenue DESC)` cho doanh thu cao nhất hạng 1. Hai row bằng nhau cùng hạng.',
        'Thêm `PARTITION BY` thì mỗi nhóm có thứ hạng riêng, bắt đầu lại từ 1. Ví dụ: `RANK() OVER (PARTITION BY region_id ORDER BY revenue DESC)`.',
        'Muốn lấy top 3, đừng lọc hạng ở cùng SELECT. Tính hạng trong một bước WITH. Query ngoài mới lọc `WHERE pos <= 3`.',
        'Oracle và MySQL viết giống nhau ở phần này. Chỉ khác cách nối tên và cách lấy tháng: MySQL dùng `CONCAT` và `DATE_FORMAT`, Oracle dùng `||` và `TO_CHAR`.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Chia báo cáo lớn thành các bước WITH. Kiểm từng bước trước khi viết bước sau.',
        'Doanh thu của đơn là tổng `quantity * unit_price`. Nhớ bỏ đơn cancelled.',
        'Lọc ngày bằng `>=` ngày đầu và `<` ngày đầu của kỳ sau.',
        'RANK xếp hạng. PARTITION BY cho mỗi nhóm một thứ hạng riêng.',
        'Muốn top N mỗi nhóm, tính hạng trong WITH rồi lọc hạng ở query ngoài.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Oracle Database 19c SQL Language Reference, RANK', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/RANK.html' },
        { name: 'MySQL 8.0 Reference Manual, Window Function Descriptions', url: 'https://dev.mysql.com/doc/refman/8.0/en/window-function-descriptions.html' },
      ],
    },
  ],
};
