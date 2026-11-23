import type { GlossaryEntry } from '../types';

export const entries: Record<string, GlossaryEntry> = {
  savepoint: {
    term: 'SAVEPOINT',
    short: 'Một điểm đánh dấu trong transaction. ROLLBACK TO quay về điểm này mà không bỏ cả transaction.',
    example: 'Giống đặt một bookmark giữa cuốn sách. Bạn lật lại tới bookmark, không đọc lại từ trang đầu.',
  },
  'window-function': {
    term: 'window function',
    short: 'Một function tính trên một nhóm row quanh row hiện tại, mà không gộp các row lại.',
    example: 'RANK() xếp hạng từng nhân viên trong phòng của họ. Mỗi nhân viên vẫn giữ một row.',
  },
};
