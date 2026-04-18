import { describe, it, expect } from 'vitest';
import { filterByStock, PAGE_SIZE } from '../stock-filter';
import type { ProductSearchResult } from '@/integrations/supabase/catalog-types';

function makeProduct(overrides: Partial<ProductSearchResult> = {}): ProductSearchResult {
  return {
    id: '1',
    sku: 'TST-001',
    name: 'Test Product',
    slug: 'test-product',
    product_type: 'physical',
    base_price: 100,
    is_active: true,
    category_name: null,
    variant_count: 1,
    total_stock: 10,
    ...overrides,
  };
}

describe('filterByStock', () => {
  const products: ProductSearchResult[] = [
    makeProduct({ id: 'a', total_stock: 0 }),
    makeProduct({ id: 'b', total_stock: 1 }),
    makeProduct({ id: 'c', total_stock: 3 }),
    makeProduct({ id: 'd', total_stock: 5 }),
    makeProduct({ id: 'e', total_stock: 10 }),
    makeProduct({ id: 'f', total_stock: 50 }),
  ];

  it('returns all products when filter is "all"', () => {
    const result = filterByStock(products, 'all');
    expect(result).toHaveLength(6);
  });

  it('returns only in-stock products (total_stock > 5)', () => {
    const result = filterByStock(products, 'in_stock');
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(['e', 'f']);
  });

  it('returns only low-stock products (1 <= total_stock <= 5)', () => {
    const result = filterByStock(products, 'low_stock');
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.id)).toEqual(['b', 'c', 'd']);
  });

  it('returns only out-of-stock products (total_stock === 0)', () => {
    const result = filterByStock(products, 'out_of_stock');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('returns empty array when no products match filter', () => {
    const inStockOnly = [makeProduct({ total_stock: 20 })];
    expect(filterByStock(inStockOnly, 'out_of_stock')).toHaveLength(0);
  });

  it('handles empty array', () => {
    expect(filterByStock([], 'in_stock')).toHaveLength(0);
  });
});

describe('PAGE_SIZE', () => {
  it('is 20', () => {
    expect(PAGE_SIZE).toBe(20);
  });
});
