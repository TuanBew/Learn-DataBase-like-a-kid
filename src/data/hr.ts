import type { Database } from '../engine/types';

/**
 * Database HR rút gọn, dùng cho bài học về JOIN và NULL.
 * Nguồn: oracle-samples/db-sample-schemas, schema human_resources (phiên bản 21).
 * https://github.com/oracle-samples/db-sample-schemas
 * Giấy phép MIT, Copyright (c) 2023 Oracle. Dữ liệu được lọc từ bản gốc xuống 12 job, 5 địa điểm, 8 phòng và 25 nhân viên.
 * Giá trị tên, lương, ngày giữ nguyên như bản gốc. Mọi quản lý được nhắc tới đều nằm trong bộ rút gọn.
 */
export const hr: Database = {
  name: 'hr',
  tables: [
    {
      name: 'jobs',
      about: 'Mỗi row là một chức danh và khoảng lương cho phép.',
      columns: [
        { name: 'job_id', type: 'text', label: 'mã chức danh', pk: true },
        { name: 'job_title', type: 'text', label: 'tên chức danh' },
        { name: 'min_salary', type: 'decimal', label: 'lương thấp nhất' },
        { name: 'max_salary', type: 'decimal', label: 'lương cao nhất' },
      ],
      rows: [
        ['AD_PRES', 'President', 20080, 40000],
        ['AD_VP', 'Administration Vice President', 15000, 30000],
        ['AD_ASST', 'Administration Assistant', 3000, 6000],
        ['AC_MGR', 'Accounting Manager', 8200, 16000],
        ['AC_ACCOUNT', 'Public Accountant', 4200, 9000],
        ['SA_MAN', 'Sales Manager', 10000, 20080],
        ['SA_REP', 'Sales Representative', 6000, 12008],
        ['PU_MAN', 'Purchasing Manager', 8000, 15000],
        ['PU_CLERK', 'Purchasing Clerk', 2500, 5500],
        ['IT_PROG', 'Programmer', 4000, 10000],
        ['MK_MAN', 'Marketing Manager', 9000, 15000],
        ['MK_REP', 'Marketing Representative', 4000, 9000],
      ],
    },
    {
      name: 'locations',
      about: 'Mỗi row là một địa điểm đặt văn phòng.',
      columns: [
        { name: 'location_id', type: 'int', label: 'mã địa điểm', pk: true },
        { name: 'street_address', type: 'text', label: 'địa chỉ' },
        { name: 'postal_code', type: 'text', label: 'mã bưu chính' },
        { name: 'city', type: 'text', label: 'thành phố' },
        { name: 'state_province', type: 'text', label: 'bang hoặc tỉnh' },
        { name: 'country_id', type: 'text', label: 'mã quốc gia' },
      ],
      rows: [
        [1400, '2014 Jabberwocky Rd', '26192', 'Southlake', 'Texas', 'US'],
        [1700, '2004 Charade Rd', '98199', 'Seattle', 'Washington', 'US'],
        [1800, '147 Spadina Ave', 'M5V 2L7', 'Toronto', 'Ontario', 'CA'],
        [2400, '8204 Arthur St', null, 'London', null, 'GB'],
        [2500, 'Magdalen Centre,  The Oxford Science Park', 'OX9 9ZB', 'Oxford', 'Oxford', 'GB'],
      ],
    },
    {
      name: 'departments',
      about: 'Mỗi row là một phòng ban đặt tại một địa điểm.',
      columns: [
        { name: 'department_id', type: 'int', label: 'mã phòng', pk: true },
        { name: 'department_name', type: 'text', label: 'tên phòng' },
        { name: 'manager_id', type: 'int', label: 'mã trưởng phòng' },
        { name: 'location_id', type: 'int', label: 'địa điểm', fk: { table: 'locations', column: 'location_id' } },
      ],
      rows: [
        [10, 'Administration', 200, 1700],
        [20, 'Marketing', 201, 1800],
        [30, 'Purchasing', 114, 1700],
        [60, 'IT', 103, 1400],
        [80, 'Sales', 145, 2500],
        [90, 'Executive', 100, 1700],
        [110, 'Accounting', 205, 1700],
        [120, 'Treasury', null, 1700],
      ],
    },
    {
      name: 'employees',
      about: 'Mỗi row là một nhân viên, thuộc một phòng và giữ một chức danh.',
      columns: [
        { name: 'employee_id', type: 'int', label: 'mã nhân viên', pk: true },
        { name: 'first_name', type: 'text', label: 'tên' },
        { name: 'last_name', type: 'text', label: 'họ' },
        { name: 'email', type: 'text', label: 'email' },
        { name: 'phone_number', type: 'text', label: 'số điện thoại' },
        { name: 'hire_date', type: 'date', label: 'ngày vào làm' },
        { name: 'job_id', type: 'text', label: 'chức danh', fk: { table: 'jobs', column: 'job_id' } },
        { name: 'salary', type: 'decimal', label: 'lương' },
        { name: 'commission_pct', type: 'decimal', label: 'tỷ lệ hoa hồng' },
        { name: 'manager_id', type: 'int', label: 'mã quản lý' },
        { name: 'department_id', type: 'int', label: 'phòng ban', fk: { table: 'departments', column: 'department_id' } },
      ],
      rows: [
        [100, 'Steven', 'King', 'SKING', '1.515.555.0100', '2013-06-17', 'AD_PRES', 24000, null, null, 90],
        [101, 'Neena', 'Yang', 'NYANG', '1.515.555.0101', '2015-09-21', 'AD_VP', 17000, null, 100, 90],
        [102, 'Lex', 'Garcia', 'LGARCIA', '1.515.555.0102', '2011-01-13', 'AD_VP', 17000, null, 100, 90],
        [103, 'Alexander', 'James', 'AJAMES', '1.590.555.0103', '2016-01-03', 'IT_PROG', 9000, null, 102, 60],
        [104, 'Bruce', 'Miller', 'BMILLER', '1.590.555.0104', '2017-05-21', 'IT_PROG', 6000, null, 103, 60],
        [105, 'David', 'Williams', 'DWILLIAMS', '1.590.555.0105', '2015-06-25', 'IT_PROG', 4800, null, 103, 60],
        [106, 'Valli', 'Jackson', 'VJACKSON', '1.590.555.0106', '2016-02-05', 'IT_PROG', 4800, null, 103, 60],
        [107, 'Diana', 'Nguyen', 'DNGUYEN', '1.590.555.0107', '2017-02-07', 'IT_PROG', 4200, null, 103, 60],
        [114, 'Den', 'Li', 'DLI', '1.515.555.0114', '2012-12-07', 'PU_MAN', 11000, null, 100, 30],
        [115, 'Alexander', 'Khoo', 'AKHOO', '1.515.555.0115', '2013-05-18', 'PU_CLERK', 3100, null, 114, 30],
        [116, 'Shelli', 'Baida', 'SBAIDA', '1.515.555.0116', '2015-12-24', 'PU_CLERK', 2900, null, 114, 30],
        [145, 'John', 'Singh', 'JSINGH', '44.1632.960000', '2014-10-01', 'SA_MAN', 14000, 0.4, 100, 80],
        [146, 'Karen', 'Partners', 'KPARTNER', '44.1632.960001', '2015-01-05', 'SA_MAN', 13500, 0.3, 100, 80],
        [149, 'Eleni', 'Zlotkey', 'EZLOTKEY', '44.1632.960004', '2018-01-29', 'SA_MAN', 10500, 0.2, 100, 80],
        [150, 'Sean', 'Tucker', 'STUCKER', '44.1632.960005', '2015-01-30', 'SA_REP', 10000, 0.3, 145, 80],
        [151, 'David', 'Bernstein', 'DBERNSTE', '44.1632.960006', '2015-03-24', 'SA_REP', 9500, 0.25, 145, 80],
        [152, 'Peter', 'Hall', 'PHALL', '44.1632.960007', '2015-08-20', 'SA_REP', 9000, 0.25, 145, 80],
        [156, 'Janette', 'King', 'JKING', '44.1632.960011', '2014-01-30', 'SA_REP', 10000, 0.35, 146, 80],
        [157, 'Patrick', 'Sully', 'PSULLY', '44.1632.960012', '2014-03-04', 'SA_REP', 9500, 0.35, 146, 80],
        [178, 'Kimberely', 'Grant', 'KGRANT', '44.1632.960033', '2017-05-24', 'SA_REP', 7000, 0.15, 149, null],
        [200, 'Jennifer', 'Whalen', 'JWHALEN', '1.515.555.0165', '2013-09-17', 'AD_ASST', 4400, null, 101, 10],
        [201, 'Michael', 'Martinez', 'MMARTINE', '1.515.555.0166', '2014-02-17', 'MK_MAN', 13000, null, 100, 20],
        [202, 'Pat', 'Davis', 'PDAVIS', '1.603.555.0167', '2015-08-17', 'MK_REP', 6000, null, 201, 20],
        [205, 'Shelley', 'Higgins', 'SHIGGINS', '1.515.555.0170', '2012-06-07', 'AC_MGR', 12008, null, 101, 110],
        [206, 'William', 'Gietz', 'WGIETZ', '1.515.555.0171', '2012-06-07', 'AC_ACCOUNT', 8300, null, 205, 110],
      ],
    },
  ],
};
