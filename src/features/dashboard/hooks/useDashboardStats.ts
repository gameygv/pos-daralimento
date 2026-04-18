import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  activeProducts: number;
  lowStockCount: number;
}

const DASHBOARD_KEY = ['dashboard-stats'] as const;

async function fetchDashboardStats(): Promise<DashboardStats> {
  const [productsRes, categoriesRes, activeRes, variantsRes] = await Promise.all([
    supabase
      .from('products' as never)
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('categories' as never)
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('products' as never)
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('product_variants' as never)
      .select('id, stock, min_stock')
      .gte('stock', 0),
  ]);

  // Type the responses
  const products = productsRes as unknown as { count: number | null; error: { message: string } | null };
  const categories = categoriesRes as unknown as { count: number | null; error: { message: string } | null };
  const active = activeRes as unknown as { count: number | null; error: { message: string } | null };
  const variants = variantsRes as unknown as {
    data: Array<{ id: string; stock: number; min_stock: number }> | null;
    error: { message: string } | null;
  };

  if (products.error) throw new Error(products.error.message);
  if (categories.error) throw new Error(categories.error.message);
  if (active.error) throw new Error(active.error.message);

  // Low stock: variants where stock <= min_stock (or <= 5 if no min_stock set)
  const lowStockCount = variants.error
    ? 0
    : (variants.data ?? []).filter((v) => v.stock <= (v.min_stock || 5)).length;

  return {
    totalProducts: products.count ?? 0,
    totalCategories: categories.count ?? 0,
    activeProducts: active.count ?? 0,
    lowStockCount,
  };
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: [...DASHBOARD_KEY],
    queryFn: fetchDashboardStats,
    retry: false,
  });
}
