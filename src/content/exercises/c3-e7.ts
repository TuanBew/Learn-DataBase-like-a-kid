import type { BuildExercise } from '../types';
import { exercise as departments } from './c3-e1';
import { exercise as employees } from './c3-e3';
import { chain } from './build-util';

const mysql = `ALTER TABLE employees ADD phone VARCHAR(20);
ALTER TABLE employees ADD CONSTRAINT uq_employees_phone UNIQUE (phone);`;

const oracle = `ALTER TABLE employees ADD (phone VARCHAR2(20));
ALTER TABLE employees ADD CONSTRAINT uq_employees_phone UNIQUE (phone)`;

const emp = (d: 'mysql' | 'oracle', n: number, phone?: string) =>
  `INSERT INTO employees (full_name, email, hire_date, salary${phone ? ', phone' : ''}) VALUES ('Nhân viên ${n}', 'nv${n}@saomai.vn', ${d === 'oracle' ? "DATE '2025-01-02'" : "'2025-01-02'"}, 15000000${phone ? `, '${phone}'` : ''})`;

export const exercise: BuildExercise = {
  id: 'c3-e7',
  chapter: 3,
  title: 'Thêm số điện thoại cho nhân viên',
  kind: 'build',
  prompt:
    'Chị Hạnh muốn ghi thêm số điện thoại của nhân viên. Table employees đã có row rồi, nên bạn sửa bằng ALTER TABLE, không dựng lại. Thêm column `phone`, chữ tối đa 20 ký tự. Hai nhân viên không được trùng số. Có người chưa có số, nên cho để trống. Bạn sửa giúp chị nhé.',
  asks: [],
  start: 'mine',
  needs: ['departments', 'employees'],
  base: chain(departments, employees),
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: '-- Thêm column phone, rồi thêm UNIQUE cho nó\n',
    oracle: '-- Thêm column phone, rồi thêm UNIQUE cho nó\n',
  },
  solution: { mysql, oracle },
  save: true,
  spec: {
    tables: [
      {
        name: 'employees',
        allowExtra: true,
        columns: [{ name: 'phone', type: 'text', minLength: 20, label: '`phone`: chữ tối đa 20 ký tự' }],
      },
    ],
    probes: [
      {
        id: 'phone-unique',
        label: 'Hai nhân viên cùng một số điện thoại thì người thứ hai bị từ chối',
        setup: { mysql: [emp('mysql', 1, '0901234567')], oracle: [emp('oracle', 1, '0901234567')] },
        sql: { mysql: emp('mysql', 2, '0901234567'), oracle: emp('oracle', 2, '0901234567') },
        expect: 'error',
      },
      {
        id: 'phone-optional',
        label: 'Hai nhân viên chưa có số điện thoại thì table đều nhận',
        setup: { mysql: [emp('mysql', 1)], oracle: [emp('oracle', 1)] },
        sql: { mysql: emp('mysql', 2), oracle: emp('oracle', 2) },
        expect: 'ok',
      },
    ],
  },
  why: 'Column `phone` đã vào table employees mà không mất row nào. UNIQUE chặn hai người cùng số, và nhiều người chưa có số vẫn được, vì NULL không bị coi là trùng nhau. Mình lưu thay đổi này vào Database của bạn.',
  hints: {
    light: 'Có hai bước: thêm column mới, rồi thêm luật không trùng cho column đó. Xem lại bài ALTER TABLE.',
    specific: 'Dùng hai câu ALTER TABLE. Câu đầu thêm column `phone`. Câu sau dùng ADD CONSTRAINT với UNIQUE (phone).',
    skeleton: {
      mysql: `ALTER TABLE employees ____ phone VARCHAR(20);
ALTER TABLE employees ADD ____ uq_employees_phone ____ (phone);`,
      oracle: `ALTER TABLE employees ADD (phone ____);
ALTER TABLE employees ADD ____ uq_employees_phone ____ (phone)`,
    },
  },
  wrong: [
    {
      failed: 'employees.phone',
      hint: 'Column `phone` chưa đúng. Số điện thoại là chữ, và cần đủ chỗ cho 20 ký tự.',
    },
    {
      failed: 'phone-unique',
      hint: 'Mình thử hai nhân viên cùng số điện thoại và database nhận cả hai. Thêm UNIQUE cho `phone` bằng ADD CONSTRAINT.',
    },
    {
      failed: 'phone-optional',
      hint: 'Mình thử thêm nhân viên chưa có số điện thoại và database từ chối. Column `phone` cần cho phép để trống.',
    },
  ],
};
