import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const POS_PRODUCTS_KEY = ['pos-products'] as const;

export interface PosProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  product_type: string;
  base_price: number;
  tax_rate: number;
  is_active: boolean;
  track_stock: boolean;
  image_url: string | null;
  category_id: string | null;
  category_name: string | null;
  total_stock: number;
}

interface UsePosProductsParams {
  query?: string | null;
  categoryId?: string | null;
}

interface RawProductRow {
  id: string;
  sku: string;
  name: string;
  slug: string;
  product_type: string;
  base_price: number;
  tax_rate: number;
  is_active: boolean;
  track_stock?: boolean;
  image_url: string | null;
  category_id: string | null;
  categories: { name: string } | null;
  product_variants: { stock: number }[];
}

/** Search product by exact barcode or SKU — for barcode scanner */
export async function findProductByBarcode(barcode: string): Promise<PosProduct | null> {
  const { data, error } = await supabase
    .from('products' as never)
    .select('id, sku, name, slug, product_type, base_price, tax_rate, is_active, track_stock, image_url, category_id, categories(name), product_variants(stock)' as never)
    .eq('is_active' as never, true as never)
    .or(`barcode.eq.${barcode},sku.eq.${barcode}` as never)
    .limit(1) as unknown as {
    data: RawProductRow[] | null;
    error: { message: string } | null;
  };
  if (error || !data || data.length === 0) return null;
  const p = data[0];
  const variants = p.product_variants ?? [];
  const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    product_type: p.product_type,
    base_price: p.base_price,
    tax_rate: p.tax_rate ?? 0.16,
    is_active: p.is_active,
    track_stock: p.track_stock ?? true,
    image_url: p.image_url,
    category_id: p.category_id,
    category_name: p.categories?.name ?? null,
    total_stock: totalStock,
  };
}

export function usePosProducts(params: UsePosProductsParams = {}) {
  return useQuery<PosProduct[]>({
    queryKey: [...POS_PRODUCTS_KEY, params],
    queryFn: async () => {
      let query = supabase
        .from('products' as never)
        .select('id, sku, name, slug, product_type, base_price, tax_rate, is_active, track_stock, image_url, category_id, categories(name), product_variants(stock)' as never)
        .eq('is_active' as never, true as never)
        .order('name' as never)
        .limit(100);

      if (params.categoryId) {
        query = query.eq('category_id' as never, params.categoryId as never);
      }

      if (params.query) {
        query = query.or(`name.ilike.%${params.query}%,sku.ilike.%${params.query}%,barcode.ilike.%${params.query}%` as never);
      }

      const { data, error } = await query as unknown as {
        data: RawProductRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);

      return (data ?? []).map((p) => {
        const variants = p.product_variants ?? [];
        const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          slug: p.slug,
          product_type: p.product_type,
          base_price: p.base_price,
          tax_rate: p.tax_rate ?? 0.16,
          is_active: p.is_active,
          track_stock: p.track_stock ?? true,
          image_url: p.image_url,
          category_id: p.category_id,
          category_name: p.categories?.name ?? null,
          total_stock: totalStock,
        };
      });
    },
  });
}
