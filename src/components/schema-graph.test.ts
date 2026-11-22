import { describe, expect, it } from 'vitest';
import { company } from '../data/company';
import { conditionOf, edgesOf, findPath } from './schema-graph';

describe('findPath', () => {
  const edges = edgesOf(company);
  it('order_items tới customers qua orders', () => {
    const p = findPath(edges, 'order_items', 'customers')!;
    expect(p.tables).toEqual(['order_items', 'orders', 'customers']);
    expect(p.edges.map(conditionOf)).toEqual(['order_items.order_id = orders.order_id', 'orders.customer_id = customers.customer_id']);
  });
  it('employees tới regions đi qua 5 table', () => {
    expect(findPath(edges, 'employees', 'regions')!.tables).toEqual(['employees', 'departments', 'locations', 'countries', 'regions']);
  });
  it('order_items tới regions đi qua 5 table', () => {
    expect(findPath(edges, 'order_items', 'regions')!.tables).toHaveLength(5);
  });
});
