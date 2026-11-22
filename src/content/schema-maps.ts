/**
 * Vị trí các hộp trên sơ đồ, xếp tay cho từng database. Khóa là `name` của database.
 * `col` và `row` đếm từ 1 trên một lưới `cols` cột. Xếp sao cho các đường nối ít cắt nhau.
 * Database không có ở đây thì không có sơ đồ.
 */
export interface SchemaMapLayout {
  cols: number;
  pos: Record<string, { col: number; row: number }>;
}

export const schemaMaps: Record<string, SchemaMapLayout> = {
  congty: {
    cols: 4,
    pos: {
      regions: { col: 1, row: 1 },
      countries: { col: 2, row: 1 },
      customers: { col: 3, row: 1 },
      products: { col: 4, row: 1 },
      locations: { col: 1, row: 2 },
      orders: { col: 3, row: 2 },
      order_items: { col: 4, row: 2 },
      departments: { col: 1, row: 3 },
      employees: { col: 2, row: 3 },
      jobs: { col: 3, row: 3 },
      job_history: { col: 2, row: 4 },
    },
  },
  trasua: {
    cols: 3,
    pos: {
      stores: { col: 1, row: 1 },
      orders: { col: 2, row: 1 },
      customers: { col: 3, row: 1 },
      staff: { col: 1, row: 2 },
      order_items: { col: 2, row: 2 },
      products: { col: 3, row: 2 },
    },
  },
  saomai: {
    cols: 3,
    pos: {
      departments: { col: 1, row: 1 },
      employees: { col: 2, row: 1 },
      leave_requests: { col: 3, row: 1 },
      assignments: { col: 2, row: 2 },
      projects: { col: 3, row: 2 },
    },
  },
};
