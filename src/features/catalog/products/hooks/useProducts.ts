import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProductInsert, ProductSearchResult } from '@/integrations/supabase/catalog-types';
import { filterByStock, PAGE_SIZE } from './stock-filter';
import type { StockFilter } from './stock-filter';

export { filterByStock, PAGE_SIZE } from './stock-filter';
export type { StockFilter } from './stock-filter';

const PRODUCTS_KEY = ['products'] as const;

interface UseProductsParams {
  query?: string | null;
  categoryId?: string | null;
  productType?: string | null;
  stockFilter?: StockFilter;
  page?: number;
}

export interface UseProductsResult {
  products: ProductSearchResult[];
  hasNextPage: boolean;
  totalFetched: number;
}

export function useProducts(params: UseProductsParams = {}) {
  const page = params.page ?? 0;
  const stockFilter = params.stockFilter ?? 'all';

  return useQuery<UseProductsResult>({
    queryKey: [...PRODUCTS_KEY, params],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as (fn: string, args: Record<string, unknown>) => Promise<{ data: ProductSearchResult[] | null; error: { message: string } | null }>)(
        'search_products',
        {
          p_query: params.query ?? null,
          p_category_id: params.categoryId ?? null,
          p_product_type: params.productType ?? null,
          p_limit: PAGE_SIZE + 1,
          p_offset: page * PAGE_SIZE,
        },
      );
      if (error) throw error;
      const raw = data ?? [];
      const hasNextPage = raw.length > PAGE_SIZE;
      const pageItems = hasNextPage ? raw.slice(0, PAGE_SIZE) : raw;
      const filtered = filterByStock(pageItems, stockFilter);
      return {
        products: filtered,
        hasNextPage,
        totalFetched: pageItems.length,
      };
    },
  });
}

export function useProductById(id: string | null) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase
        .from('products' as never)
        .select('*')
        .eq('id', id)
        .single() as unknown as Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await (supabase
        .from('products' as never)
        .insert(product)
        .select()
        .single() as unknown as Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ProductInsert>) => {
      const { data, error } = await (supabase
        .from('products' as never)
        .update(updates)
        .eq('id', id)
        .select()
        .single() as unknown as Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase
        .from('products' as never)
        .update({ is_active })
        .eq('id', id) as unknown as Promise<{ data: unknown; error: { message: string } | null }>);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}
