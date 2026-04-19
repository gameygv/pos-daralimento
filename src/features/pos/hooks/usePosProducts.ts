import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const POS_PRODUCTS_KEY = ['pos-products'] as const;
const POS_ALMACEN_PRICES_KEY = ['pos-almacen-prices'] as const;

/** Fetch almacén-specific prices as a map productId → { precio_publico, precio_proveedores } */
export function useAlmacenPriceMap(almacenId: string | null) {
  return useQuery<Map<string, { precio_publico: number; precio_proveedores: number }>>({
    queryKey: [...POS_ALMACEN_PRICES_KEY, almacenId],
    queryFn: async () => {
      if (!almacenId) return new Map();
      const { data, error } = (await supabase
        .from('almacen_precios' as never)
        .select('product_id, precio_publico, precio_proveedores')
        .eq('almacen_id' as never, almacenId as never)) as unknown as {
        data: Array<{ product_id: string; precio_publico: number; precio_proveedores: number }> | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      const map = new Map<string, { precio_publico: number; precio_proveedores: number }>();
      for (const row of data ?? []) {
        map.set(row.product_id, { precio_publico: row.precio_publico, precio_proveedores: row.precio_proveedores });
      }
      return map;
    },
    enabled: !!almacenId,
  });
}

/** Fetch almacén-specific stock as a map productId → stock */
export function useAlmacenStockMap(almacenId: string | null) {
  return useQuery<Map<string, number>>({
    queryKey: ['pos-almacen-stock-map', almacenId],
    queryFn: async () => {
      if (!almacenId) return new Map();
      const { data, error } = (await supabase
        .from('almacen_stock' as never)
        .select('variant_id, stock, product_variants!inner(product_id)')
        .eq('almacen_id' as never, almacenId as never)) as unknown as {
        data: Array<{ variant_id: string; stock: number; product_variants: { product_id: string } }> | null;
        error: { message: string } | null;
      };
      if (error) {
        // Fallback without join
        const { data: stocks } = (await supabase
          .from('almacen_stock' as never)
          .select('variant_id, stock')
          .eq('almacen_id' as never, almacenId as never)) as unknown as {
          data: Array<{ variant_id: string; stock: number }> | null;
        };
        // Need to map variant_id to product_id
        if (!stocks || stocks.length === 0) return new Map();
        const vids = stocks.map((s) => s.variant_id);
        const { data: variants } = (await supabase
          .from('product_variants' as never)
          .select('id, product_id')
          .in('id' as never, vids as never)) as unknown as {
          data: Array<{ id: string; product_id: string }> | null;
        };
        const vidMap = new Map((variants ?? []).map((v) => [v.id, v.product_id]));
        const result = new Map<string, number>();
        for (const s of stocks) {
          const pid = vidMap.get(s.variant_id);
          if (pid) result.set(pid, (result.get(pid) ?? 0) + s.stock);
        }
        return result;
      }
      const map = new Map<string, number>();
      for (const row of data ?? []) {
        const pid = row.product_variants?.product_id;
        if (pid) map.set(pid, (map.get(pid) ?? 0) + row.stock);
      }
      return map;
    },
    enabled: !!almacenId,
  });
}

/** Apply almacén prices over PosProduct array — almacén price always wins */
export function applyAlmacenPrices(
  products: PosProduct[],
  priceMap: Map<string, { precio_publico: number; precio_proveedores: number }> | undefined,
): PosProduct[] {
  if (!priceMap || priceMap.size === 0) return products;
  return products.map((p) => {
    const override = priceMap.get(p.id);
    if (!override) return { ...p, base_price: 0, precio_mayoreo: 0 };
    return {
      ...p,
      base_price: override.precio_publico,
      precio_mayoreo: override.precio_proveedores,
    };
  });
}

export interface PosProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  product_type: string;
  base_price: number;
  precio_mayoreo: number;
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
  precio_mayoreo?: number;
  tax_rate: number;
  is_active: boolean;
  track_stock?: boolean;
  image_url: string | null;
  category_id: string | null;
}

/** Search product by exact barcode or SKU — for barcode scanner */
export async function findProductByBarcode(barcode: string): Promise<PosProduct | null> {
  const { data, error } = await supabase
    .from('products' as never)
    .select('id, sku, name, slug, product_type, base_price, precio_mayoreo, tax_rate, is_active, track_stock, image_url, category_id' as never)
    .eq('is_active' as never, true as never)
    .or(`barcode.eq.${barcode},sku.eq.${barcode}` as never)
    .limit(1) as unknown as {
    data: RawProductRow[] | null;
    error: { message: string } | null;
  };
  if (error || !data || data.length === 0) return null;
  const p = data[0];
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    product_type: p.product_type,
    base_price: p.base_price,
    precio_mayoreo: p.precio_mayoreo ?? 0,
    tax_rate: p.tax_rate ?? 0,
    is_active: p.is_active,
    track_stock: p.track_stock ?? true,
    image_url: p.image_url,
    category_id: p.category_id,
    category_name: null,
    total_stock: 0,
  };
}

export function usePosProducts(params: UsePosProductsParams = {}) {
  return useQuery<PosProduct[]>({
    queryKey: [...POS_PRODUCTS_KEY, params],
    queryFn: async () => {
      let query = supabase
        .from('products' as never)
        .select('id, sku, name, slug, product_type, base_price, precio_mayoreo, tax_rate, is_active, track_stock, image_url, category_id' as never)
        .eq('is_active' as never, true as never)
        .order('name' as never)
        .limit(500);

      if (params.categoryId) {
        // Include products from this category AND its subcategories via product_categories junction
        const { data: subCats } = (await supabase
          .from('categories' as never)
          .select('id')
          .eq('parent_id' as never, params.categoryId as never)) as unknown as {
          data: Array<{ id: string }> | null;
        };
        const catIds = [params.categoryId, ...(subCats ?? []).map((c) => c.id)];
        // Get product IDs from junction table
        const { data: pcRows } = (await supabase
          .from('product_categories' as never)
          .select('product_id')
          .in('category_id' as never, catIds as never)) as unknown as {
          data: Array<{ product_id: string }> | null;
        };
        const productIds = [...new Set((pcRows ?? []).map((r) => r.product_id))];
        if (productIds.length > 0) {
          query = query.in('id' as never, productIds as never);
        } else {
          // Fallback to old category_id field
          query = query.in('category_id' as never, catIds as never);
        }
      }

      if (params.query) {
        query = query.or(`name.ilike.%${params.query}%,sku.ilike.%${params.query}%,barcode.ilike.%${params.query}%` as never);
      }

      const { data, error } = await query as unknown as {
        data: RawProductRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);

      return (data ?? []).map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        product_type: p.product_type,
        base_price: p.base_price,
        precio_mayoreo: p.precio_mayoreo ?? 0,
        tax_rate: p.tax_rate ?? 0,
        is_active: p.is_active,
        track_stock: p.track_stock ?? true,
        image_url: p.image_url,
        category_id: p.category_id,
        category_name: null,
        total_stock: 0, // Stock comes from almacenStockMap in the POS
      }));
    },
  });
}
