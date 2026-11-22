import type { BuildExercise } from '../types';
import { exercise as departments } from './c3-e1';
import { exercise as employees } from './c3-e3';
import { chain } from './build-util';

const mysql = `INSERT INTO departments (department_id, name, location) VALUES
  (1, 'Kinh doanh', 'Hà Nội'),
  (2, 'Kỹ thuật', 'TP. Hồ Chí Minh');

INSERT INTO employees (employee_id, full_name, email, hire_date, salary, department_id, manager_id) VALUES
  (1, 'Trần Văn An', 'an@saomai.vn', '2024-01-08', 30000000, 1, NULL),
  (2, 'Lê Thị Bình', 'binh@saomai.vn', '2024-03-15', 18000000, 1, 1),
  (3, 'Phạm Quốc Cường', 'cuong@saomai.vn', '2024-02-01', 28000000, 2, 1);`;

const oracle = `INSERT INTO departments (department_id, name, location) VALUES (1, 'Kinh doanh', 'Hà Nội');
INSERT INTO departments (department_id, name, location) VALUES (2, 'Kỹ thuật', 'TP. Hồ Chí Minh');

INSERT INTO employees (employee_id, full_name, email, hire_date, salary, department_id, manager_id) VALUES (1, 'Trần Văn An', 'an@saomai.vn', DATE '2024-01-08', 30000000, 1, NULL);
INSERT INTO employees (employee_id, full_name, email, hire_date, salary, department_id, manager_id) VALUES (2, 'Lê Thị Bình', 'binh@saomai.vn', DATE '2024-03-15', 18000000, 1, 1);
INSERT INTO employees (employee_id, full_name, email, hire_date, salary, department_id, manager_id) VALUES (3, 'Phạm Quốc Cường', 'cuong@saomai.vn', DATE '2024-02-01', 28000000, 2, 1);

COMMIT;`;

export const exercise: BuildExercise = {
  id: 'c3-e6',
  chapter: 3,
  title: 'Nạp phòng ban và nhân viên đúng thứ tự',
  kind: 'build',
  prompt:
    'Hai table đã dựng xong nhưng còn rỗng. Chị Hạnh gửi mình danh sách thật: hai phòng ban và ba nhân viên. Table con chỉ nhận row khi table cha đã có row tương ứng. Trần Văn An là giám đốc, không có sếp, thuộc phòng Kinh doanh. Lê Thị Bình thuộc phòng Kinh doanh, sếp là An. Phạm Quốc Cường thuộc phòng Kỹ thuật, sếp là An. Bạn tìm thứ tự đúng để nạp nhé.',
  asks: [],
  start: 'mine',
  needs: ['departments', 'employees'],
  base: chain(departments, employees),
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: '-- Nạp table cha trước, rồi table con. Sếp vào trước người dưới quyền.\n',
    oracle: '-- Nạp table cha trước, rồi table con. Sếp vào trước người dưới quyền.\n-- Oracle 19c nhận một row mỗi câu INSERT.\n',
  },
  solution: { mysql, oracle },
  save: true,
  spec: {
    tables: [
      { name: 'departments', allowExtra: true, minRows: 2, columns: [] },
      { name: 'employees', allowExtra: true, minRows: 3, columns: [] },
    ],
    probes: [
      {
        id: 'staff-in-dept',
        label: 'Có nhân viên thuộc một phòng ban (xóa phòng đó bị từ chối)',
        sql: {
          mysql: 'DELETE FROM departments WHERE department_id IN (SELECT department_id FROM employees)',
          oracle: 'DELETE FROM departments WHERE department_id IN (SELECT department_id FROM employees)',
        },
        expect: 'error',
      },
      {
        id: 'has-manager',
        label: 'Có nhân viên là sếp của một người khác (xóa người không có sếp bị từ chối)',
        sql: {
          mysql: 'DELETE FROM employees WHERE manager_id IS NULL',
          oracle: 'DELETE FROM employees WHERE manager_id IS NULL',
        },
        expect: 'error',
      },
    ],
  },
  why: 'Database đã có dữ liệu thật. Table departments vào trước vì employees trỏ sang nó. Trong employees, An vào trước vì Bình và Cường trỏ tới An. Thứ tự cha trước con là thứ tự mọi lần nạp dữ liệu. Mình lưu database này vào Database của bạn.',
  hints: {
    light: 'Table con trỏ sang table cha, nên row cha phải vào trước. Với sếp cũng vậy: sếp vào trước người dưới quyền.',
    specific: 'Thứ tự là: departments, rồi employees. Trong employees, An vào đầu tiên với `manager_id` là NULL.',
    skeleton: {
      mysql: `INSERT INTO ____ (department_id, name, location) VALUES
  (1, 'Kinh doanh', 'Hà Nội'),
  (2, 'Kỹ thuật', 'TP. Hồ Chí Minh');

INSERT INTO ____ (employee_id, full_name, email, hire_date, salary, department_id, manager_id) VALUES
  (1, 'Trần Văn An', 'an@saomai.vn', '2024-01-08', 30000000, 1, ____),
  ...;`,
      oracle: `INSERT INTO ____ (department_id, name, location) VALUES (1, 'Kinh doanh', 'Hà Nội');
INSERT INTO ____ (department_id, name, location) VALUES (2, 'Kỹ thuật', 'TP. Hồ Chí Minh');

INSERT INTO ____ (employee_id, full_name, email, hire_date, salary, department_id, manager_id) VALUES (1, 'Trần Văn An', 'an@saomai.vn', DATE '2024-01-08', 30000000, 1, ____);
...`,
    },
  },
  wrong: [
    {
      failed: 'departments:rows',
      hint: 'Table departments cần ít nhất 2 row. Bạn nạp hai phòng ban trước, rồi mới tới nhân viên.',
    },
    {
      failed: 'employees:rows',
      hint: 'Table employees cần ít nhất 3 row. Nhớ nạp đủ ba nhân viên trong đề.',
    },
    {
      failed: 'staff-in-dept',
      hint: 'Mình chưa thấy nhân viên nào ghi `department_id` của một phòng có thật. Mỗi nhân viên trong đề thuộc một phòng, nên điền `department_id` cho họ.',
    },
    {
      failed: 'has-manager',
      hint: 'Mình chưa thấy ai là sếp của người khác. Bình và Cường đều có sếp là An, nên `manager_id` của họ là mã của An.',
    },
  ],
};
