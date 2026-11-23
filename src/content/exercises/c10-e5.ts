import type { BuildExercise } from '../types';

const setupMysql = `CREATE TABLE teams (
  team_id INT PRIMARY KEY,
  team_name VARCHAR(50),
  status VARCHAR(10)
);
CREATE TABLE members (
  member_id INT PRIMARY KEY,
  member_name VARCHAR(50),
  team_id INT,
  FOREIGN KEY (team_id) REFERENCES teams(team_id)
);
INSERT INTO teams VALUES (1, 'Bán lẻ', 'open'), (2, 'Sự kiện cũ', 'closed'), (3, 'Kho', 'open'), (4, 'Quầy tạm', 'closed');
INSERT INTO members VALUES (1, 'An', 1), (2, 'Bình', 1), (3, 'Chi', 2), (4, 'Dũng', 2), (5, 'Em', 3), (6, 'Phúc', 4), (7, 'Giang', 3);`;

const setupOracle = `CREATE TABLE teams (
  team_id INTEGER PRIMARY KEY,
  team_name VARCHAR2(50),
  status VARCHAR2(10)
);
CREATE TABLE members (
  member_id INTEGER PRIMARY KEY,
  member_name VARCHAR2(50),
  team_id INTEGER,
  FOREIGN KEY (team_id) REFERENCES teams(team_id)
);
INSERT INTO teams VALUES (1, 'Bán lẻ', 'open');
INSERT INTO teams VALUES (2, 'Sự kiện cũ', 'closed');
INSERT INTO teams VALUES (3, 'Kho', 'open');
INSERT INTO teams VALUES (4, 'Quầy tạm', 'closed');
INSERT INTO members VALUES (1, 'An', 1);
INSERT INTO members VALUES (2, 'Bình', 1);
INSERT INTO members VALUES (3, 'Chi', 2);
INSERT INTO members VALUES (4, 'Dũng', 2);
INSERT INTO members VALUES (5, 'Em', 3);
INSERT INTO members VALUES (6, 'Phúc', 4);
INSERT INTO members VALUES (7, 'Giang', 3);`;

const del = `DELETE FROM members
WHERE team_id IN (SELECT team_id FROM teams WHERE status = 'closed');`;

const note = '\n-- Viết lệnh DELETE của bạn bên dưới dòng này\n';

export const exercise: BuildExercise = {
  id: 'c10-e5',
  chapter: 10,
  kind: 'build',
  title: 'Dọn member của các team đã đóng',
  prompt:
    'Chị Hạnh báo hai team đã đóng, `status` của chúng là `closed`. Chị muốn xóa team đó, nhưng database từ chối vì còn member trỏ tới. Bấm Chạy để dựng hai table nhỏ. Rồi viết một DELETE dùng subquery, xóa member của mọi team đã đóng. Member của team đang mở phải còn nguyên.',
  asks: [],
  start: 'empty',
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: setupMysql + '\n' + note,
    oracle: setupOracle + '\n' + note,
  },
  solution: {
    mysql: setupMysql + '\n' + del,
    oracle: setupOracle + '\n' + del.replace(/;$/, ''),
  },
  save: false,
  spec: {
    tables: [
      { name: 'teams', columns: [], allowExtra: true },
      { name: 'members', columns: [], allowExtra: true, minRows: 4 },
    ],
    probes: [
      {
        id: 'close-teams',
        label: 'Xóa được các team đã đóng, vì không còn member nào trỏ tới chúng',
        sql: {
          mysql: "DELETE FROM teams WHERE status = 'closed'",
          oracle: "DELETE FROM teams WHERE status = 'closed'",
        },
        expect: 'ok',
      },
      {
        id: 'keep-open',
        label: 'Team đang mở vẫn còn member, nên database chặn lệnh xóa chúng',
        sql: {
          mysql: "DELETE FROM teams WHERE status = 'open'",
          oracle: "DELETE FROM teams WHERE status = 'open'",
        },
        expect: 'error',
      },
    ],
  },
  why: 'Subquery tìm các `team_id` đã đóng, và DELETE chỉ xóa member có `team_id` nằm trong danh sách đó. Trước khi xóa, bạn nên chạy SELECT với cùng điều kiện để đếm row.',
  hints: {
    light: 'DELETE ở table `members`, nhưng điều kiện nằm ở table `teams`. Lấy danh sách `team_id` của team đã đóng bằng một subquery.',
    specific: "Viết `DELETE FROM members WHERE team_id IN (SELECT ...)`. Subquery chọn `team_id` từ `teams` có `status` bằng 'closed'.",
    skeleton: {
      mysql: "DELETE FROM members\nWHERE team_id IN (SELECT ____ FROM teams WHERE status = '____');",
      oracle: "DELETE FROM members\nWHERE team_id IN (SELECT ____ FROM teams WHERE status = '____')",
    },
  },
  wrong: [
    {
      failed: 'close-teams',
      hint: 'Mình thử xóa team đã đóng và database vẫn từ chối, vì còn member trỏ tới. Hãy chạy DELETE xóa member của các team đó trước.',
    },
    {
      failed: 'keep-open',
      hint: 'Mình thử xóa team đang mở và database cho xóa, nghĩa là member của team đó đã mất. Thêm điều kiện để DELETE chỉ chạm vào member của team `closed`.',
    },
    {
      failed: 'members:rows',
      hint: 'Table `members` còn quá ít row, nên bạn đã xóa cả member của team đang mở. Kiểm lại điều kiện của subquery.',
    },
  ],
};
