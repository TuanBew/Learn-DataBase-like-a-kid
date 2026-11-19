# Hướng dẫn dựng một cảnh motion

Một cảnh là một hình động nhỏ nằm trong bài học, để người học tự bấm và tự thấy một ý. Đọc ba cảnh mẫu trước khi viết: `src/scenes/lesson/data-street.tsx`, `src/scenes/lesson/order-phone.tsx`, `src/scenes/HomeFlow.tsx`, kèm file `.css` cùng tên.

## Quy ước file

- Component: `src/scenes/lesson/<id>.tsx`, `export default function`, không nhận props. Tên file là `scene` ghi trong bài. File tự có mặt trong danh mục, không sửa `src/scenes/index.ts`.
- CSS: `src/scenes/lesson/<id>.css`, import trong component. Mọi class bắt đầu bằng một tiền tố riêng của cảnh.
- Chữ và dữ liệu của cảnh: `src/content/scenes/<id>.ts`, `export const copy = { ... } as const`. Component không chứa chuỗi tiếng Việt viết thẳng.

## Luật

1. Người học phải tự điều khiển: bấm, chạm, kéo thanh trượt, bật tắt. Cảnh không tự chạy.
2. Mỗi animation giải thích đúng một điều. Animation chỉ để đẹp thì bỏ.
3. Mỗi lần người học làm một việc, Bi nói một câu về điều vừa xảy ra, bằng `<Says>` từ `src/components/Mascot`. Mood: `idle`, `happy`, `think`, `wow`, `panic`, `cheer`.
4. Mỗi tương tác có tiếng: `play(...)` từ `src/sfx/sfx`. Tên tiếng: `tap` bấm nút, `pop` hiện ra, `fly` bay vào, `ting` xong, `bonk` bị từ chối, `drop` rơi, `whoosh` đổi chỗ, `gate` đóng cổng, `ok` đúng, `bad` sai, `alarm` báo động.
5. Motion: `import * as m from 'motion/react-m'` và `import { AnimatePresence, useReducedMotion } from 'motion/react'`. Không import `motion` kiểu khác. Hiệu ứng nhỏ thì dùng CSS transition hoặc keyframes.
6. Reduced motion: `useReducedMotion()` trả true thì bỏ chuyển động bay, kết quả hiện ngay, lời Bi vẫn đủ.
7. Dùng được bằng bàn phím. Mọi thứ bấm được là `<button type="button">`, vùng chạm từ 44px, có `aria-pressed` hoặc `aria-label` khi cần. Focus dùng outline mặc định của site.
8. Rộng tối đa khoảng 780px, và phải gọn trong 330px (điện thoại 390px). Không tràn ngang. Chữ trong dữ liệu dùng `var(--font-mono)`.
9. Chỉ dùng biến trong `src/styles/tokens.css` và class nền trong `src/styles/base.css` (`.sheet`, `.btn`, `.btn--sm`, `.btn--paper`, `.chip`, `.pen`). Khối có viền mực 2px và mặt bên cứng (`box-shadow: 0 Npx 0`). Không bóng mờ, không gradient trang trí, không emoji, không nhãn in hoa toàn bộ.
10. Hình minh họa vẽ bằng SVG ngay trong component, nét `var(--ink)`, cùng kiểu với các tòa nhà trong `data-street.tsx`.
11. Chữ theo luật ở `CLAUDE.md`: thuật ngữ giữ tiếng Anh, không dùng từ cấm, câu ngắn, Bi xưng "mình" và gọi "bạn".
12. Có nút "Làm lại" khi cảnh có trạng thái cuối.
