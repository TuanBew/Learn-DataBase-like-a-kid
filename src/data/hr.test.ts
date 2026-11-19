import { describe, expect, it } from 'vitest';
import { hr } from './hr';

const rows = (name: string) => hr.tables.find((x) => x.name === name)!.rows;
const jobs = rows('jobs');
const locations = rows('locations');
const departments = rows('departments');
const employees = rows('employees');

describe('hr', () => {
  it('đúng tên và column như schema gốc', () => {
    expect(hr.name).toBe('hr');
    const cols = (n: string) => hr.tables.find((x) => x.name === n)!.columns.map((c) => c.name);
    expect(cols('jobs')).toEqual(['job_id', 'job_title', 'min_salary', 'max_salary']);
    expect(cols('locations')).toEqual(['location_id', 'street_address', 'postal_code', 'city', 'state_province', 'country_id']);
    expect(cols('departments')).toEqual(['department_id', 'department_name', 'manager_id', 'location_id']);
    expect(cols('employees')).toEqual(['employee_id', 'first_name', 'last_name', 'email', 'phone_number', 'hire_date', 'job_id', 'salary', 'commission_pct', 'manager_id', 'department_id']);
    for (const tb of hr.tables) {
      expect(tb.about).toBeTruthy();
      for (const c of tb.columns) expect(c.label).toBeTruthy();
      for (const r of tb.rows) expect(r).toHaveLength(tb.columns.length);
    }
  });

  it('số row và pk không trùng', () => {
    expect(locations).toHaveLength(5);
    expect(departments).toHaveLength(8);
    expect(employees).toHaveLength(25);
    expect(jobs.length).toBeGreaterThanOrEqual(8);
    for (const r of [jobs, locations, departments, employees]) {
      expect(new Set(r.map((x) => x[0])).size).toBe(r.length);
    }
  });

  it('foreign key trỏ tới row có thật', () => {
    const jobIds = new Set(jobs.map((r) => r[0]));
    const locIds = new Set(locations.map((r) => r[0]));
    const depIds = new Set(departments.map((r) => r[0]));
    const empIds = new Set(employees.map((r) => r[0]));
    for (const d of departments) {
      expect(locIds.has(d[3])).toBe(true);
      if (d[2] !== null) expect(empIds.has(d[2])).toBe(true);
    }
    for (const e of employees) {
      expect(jobIds.has(e[6])).toBe(true);
      if (e[10] !== null) expect(depIds.has(e[10])).toBe(true);
      if (e[9] !== null) expect(empIds.has(e[9])).toBe(true);
    }
  });

  it('có NULL và trường hợp biên đúng yêu cầu', () => {
    expect(locations.some((r) => r[4] === null)).toBe(true);
    expect(departments.some((r) => r[2] === null)).toBe(true);
    expect(employees.filter((e) => e[10] === null)).toHaveLength(1);
    expect(employees.filter((e) => e[9] === null).length).toBeGreaterThanOrEqual(1);
    const nullComm = employees.filter((e) => e[8] === null).length;
    expect(nullComm).toBeGreaterThan(employees.length / 2);
    expect(nullComm).toBeLessThan(employees.length);
    const used = new Set(employees.map((e) => e[10]));
    expect(departments.filter((d) => !used.has(d[0])).length).toBeGreaterThanOrEqual(1);
  });

  it('lương nằm trong khoảng của chức danh, ngày hợp lệ', () => {
    const range = new Map(jobs.map((j) => [j[0], [j[2] as number, j[3] as number]]));
    for (const e of employees) {
      const [lo, hi] = range.get(e[6])!;
      expect(e[7] as number).toBeGreaterThanOrEqual(lo);
      expect(e[7] as number).toBeLessThanOrEqual(hi);
      expect(e[5]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
