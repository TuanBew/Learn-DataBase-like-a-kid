import type { BuildExercise } from '../types';

const setupMysql = `CREATE TABLE staff (
  staff_id INT PRIMARY KEY,
  staff_name VARCHAR(50),
  branch VARCHAR(10),
  salary INT
);
INSERT INTO staff VALUES (1, 'An', 'HN', 15000000), (2, 'Bình', 'HCM', 16000000), (3, 'Chi', 'HN', 14000000), (4, 'Dũng', 'HCM', 17000000), (5, 'Em', 'HN', 13000000), (6, 'Phúc', 'HCM', 12000000);`;

const setupOracle = `CREATE TABLE staff (
  staff_id INTEGER PRIMARY KEY,
  staff_name VARCHAR2(50),
  branch VARCHAR2(10),
  salary INTEGER
);
INSERT INTO staff VALUES (1, 'An', 'HN', 15000000);
INSERT INTO staff VALUES (2, 'Bình', 'HCM', 16000000);
INSERT INTO staff VALUES (3, 'Chi', 'HN', 14000000);
INSERT INTO staff VALUES (4, 'Dũng', 'HCM', 17000000);
INSERT INTO staff VALUES (5, 'Em', 'HN', 13000000);
INSERT INTO staff VALUES (6, 'Phúc', 'HCM', 12000000);`;

const steps = `CREATE TABLE staff_bak_hcm AS
SELECT * FROM staff WHERE branch = 'HCM';
DELETE FROM staff WHERE branch = 'HCM';`;

const note = '\n-- Viết lệnh sao lưu và lệnh xóa của bạn ở dưới, bên dưới dòng này\n';

export const exercise: BuildExercise = {
  id: 'c10-e7',
  chapter: 10,
  kind: 'build',
  title: 'Sao lưu chi nhánh HCM rồi mới xóa',
  prompt:
    'Công ty đóng chi nhánh HCM, và chị Hạnh nhờ xóa nhân viên của chi nhánh này khỏi table `staff`. Chị muốn giữ bản sao lưu. Bấm Chạy để dựng table `staff`. Rồi tạo table `staff_bak_hcm` chỉ gồm nhân viên HCM bằng CREATE TABLE AS SELECT, và sau đó mới xóa họ khỏi `staff`.',
  asks: [],
  start: 'empty',
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: setupMysql + '\n' + note,
    oracle: setupOracle + '\n' + note,
  },
  solution: {
    mysql: setupMysql + '\n' + steps,
    oracle: setupOracle + '\n' + steps,
  },
  save: false,
  spec: {
    tables: [
      { name: 'staff', columns: [], allowExtra: true, minRows: 3 },
      { name: 'staff_bak_hcm', columns: [], allowExtra: true, minRows: 3 },
    ],
    probes: [
      {
        id: 'staff-no-hcm',
        label: 'Table `staff` không còn nhân viên HCM nào',
        sql: {
          mysql: "ALTER TABLE staff ADD CONSTRAINT chk_no_hcm CHECK (branch <> 'HCM')",
          oracle: "ALTER TABLE staff ADD CONSTRAINT chk_no_hcm CHECK (branch <> 'HCM')",
        },
        expect: 'ok',
      },
      {
        id: 'bak-only-hcm',
        label: 'Table sao lưu chỉ có nhân viên HCM',
        sql: {
          mysql: "ALTER TABLE staff_bak_hcm ADD CONSTRAINT chk_only_hcm CHECK (branch = 'HCM')",
          oracle: "ALTER TABLE staff_bak_hcm ADD CONSTRAINT chk_only_hcm CHECK (branch = 'HCM')",
        },
        expect: 'ok',
      },
    ],
  },
  why: 'CREATE TABLE AS SELECT chép đúng các row HCM sang table mới trước khi DELETE chạy. Giờ nếu xóa nhầm, bạn còn bản gốc để khôi phục.',
  hints: {
    light: 'Có hai bước, và thứ tự quan trọng. Sao lưu trước, xóa sau.',
    specific: "Bước một: CREATE TABLE staff_bak_hcm AS SELECT ... với điều kiện branch bằng 'HCM'. Bước hai: DELETE FROM staff với cùng điều kiện đó.",
    skeleton: {
      mysql: "CREATE TABLE staff_bak_hcm ____\nSELECT * FROM staff WHERE branch = '____';\nDELETE FROM staff WHERE branch = '____';",
      oracle: "CREATE TABLE staff_bak_hcm ____\nSELECT * FROM staff WHERE branch = '____';\nDELETE FROM staff WHERE branch = '____'",
    },
  },
  wrong: [
    {
      failed: 'table:staff_bak_hcm',
      hint: 'Chưa có table `staff_bak_hcm`. Tạo nó bằng CREATE TABLE staff_bak_hcm AS SELECT ... trước khi xóa.',
    },
    {
      failed: 'staff-no-hcm',
      hint: 'Table `staff` vẫn còn nhân viên HCM. Sau khi sao lưu xong, chạy DELETE với điều kiện branch bằng HCM.',
    },
    {
      failed: 'bak-only-hcm',
      hint: 'Bản sao lưu đang có cả nhân viên chi nhánh khác. Thêm WHERE branch bằng HCM vào câu SELECT của CREATE TABLE AS.',
    },
    {
      failed: 'staff_bak_hcm:rows',
      hint: 'Bản sao lưu đang thiếu row. Chắc bạn đã xóa trước khi sao lưu. Hãy sao lưu trước, xóa sau.',
    },
  ],
};
