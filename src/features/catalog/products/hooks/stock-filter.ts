import type { ProductSearchResult } from '@/integrations/supabase/catalog-types';

export const PAGE_SIZE = 20;

export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export function filterByStock(
  products: ProductSearchResult[],
  stockFilter: StockFilter,
): ProductSearchResult[] {
  switch (stockFilter) {
    case 'in_stock':
      return products.filter((p) => p.total_stock > 5);
    case 'low_stock':
      return products.filter((p) => p.total_stock >= 1 && p.total_stock <= 5);
    case 'out_of_stock':
      return products.filter((p) => p.total_stock === 0);
    default:
      return products;
  }
}
