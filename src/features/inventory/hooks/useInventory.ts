import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';

// Legacy type kept for backward compatibility
export interface MovartRow {
  id: number;
  numm: string;
  tipm: string;
  fechm: string;
  cantm: number;
  costo: number;
  referm: string | null;
  exisant: number;
  exisnva: number;
  folio: string | null;
}

export interface ProductStockRow {
  id: string;
  name: string;
  sku: string;
  image_url: string | null;
  variant_id: string;
  stock: number;
  min_stock: number;
}

export interface InventoryMovementRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  cost: number | null;
  reference: string | null;
  comments: string | null;
  attachment_url: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  product_name?: string;
  product_sku?: string;
}

export interface AdjustStockInput {
  productId: string;
  variantId: string;
  movementType: 'entrada' | 'salida';
  quantity: number;
  cost?: number | null;
  comments: string;
  attachmentUrl?: string | null;
}

const PRODUCT_STOCK_KEY = ['product-stock'] as const;
const INVENTORY_MOVEMENTS_KEY = ['inventory-movements'] as const;
const INVENTORY_KEY = ['inventory'] as const;

// Fetch products with track_stock=true and their variant stock
export function useProductStock() {
  return useQuery<ProductStockRow[]>({
    queryKey: [...PRODUCT_STOCK_KEY],
    queryFn: async () => {
      // Get products with track_stock = true
      const { data: products, error: prodError } = (await supabase
        .from('products' as never)
        .select('id, name, sku, image_url')
        .eq('track_stock', true)
        .eq('is_active', true)
        .order('name')) as unknown as {
        data: Array<{ id: string; name: string; sku: string; image_url: string | null }> | null;
        error: { message: string } | null;
      };
      if (prodError) throw new Error(prodError.message);
      if (!products || products.length === 0) return [];

      const productIds = products.map((p) => p.id);

      // Get variants for these products (use default variant — first one)
      const { data: variants, error: varError } = (await supabase
        .from('product_variants' as never)
        .select('id, product_id, stock, min_stock')
        .in('product_id', productIds)
        .eq('is_active', true)
        .order('created_at', { ascending: true })) as unknown as {
        data: Array<{ id: string; product_id: string; stock: number; min_stock: number }> | null;
        error: { message: string } | null;
      };
      if (varError) throw new Error(varError.message);

      // Map: one row per product using the first (default) variant
      const variantMap = new Map<string, { id: string; stock: number; min_stock: number }>();
      for (const v of variants ?? []) {
        if (!variantMap.has(v.product_id)) {
          variantMap.set(v.product_id, { id: v.id, stock: v.stock, min_stock: v.min_stock });
        }
      }

      return products
        .filter((p) => variantMap.has(p.id))
        .map((p) => {
          const v = variantMap.get(p.id)!;
          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            image_url: p.image_url,
            variant_id: v.id,
            stock: v.stock,
            min_stock: v.min_stock,
          };
        });
    },
  });
}

// Fetch inventory movements with filters
export function useInventoryMovements(filters?: {
  productId?: string | null;
  movementType?: string | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  // Legacy filters
  tipm?: string | null;
  enabled?: boolean;
}) {
  return useQuery<InventoryMovementRow[]>({
    queryKey: [...INVENTORY_MOVEMENTS_KEY, filters],
    enabled: filters?.enabled !== false,
    queryFn: async () => {
      let query = supabase
        .from('inventory_movements' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.movementType) {
        query = query.eq('movement_type', filters.movementType);
      }
      if (filters?.fechaDesde) {
        query = query.gte('created_at', filters.fechaDesde);
      }
      if (filters?.fechaHasta) {
        query = query.lte('created_at', filters.fechaHasta + 'T23:59:59');
      }

      const { data, error } = (await query) as unknown as {
        data: InventoryMovementRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);

      if (!data || data.length === 0) return [];

      // Enrich with product names
      const productIds = [...new Set(data.map((m) => m.product_id))];
      const { data: products } = (await supabase
        .from('products' as never)
        .select('id, name, sku')
        .in('id', productIds)) as unknown as {
        data: Array<{ id: string; name: string; sku: string }> | null;
      };

      const productMap = new Map<string, { name: string; sku: string }>();
      for (const p of products ?? []) {
        productMap.set(p.id, { name: p.name, sku: p.sku });
      }

      return data.map((m) => ({
        ...m,
        product_name: productMap.get(m.product_id)?.name ?? 'Desconocido',
        product_sku: productMap.get(m.product_id)?.sku ?? '',
      }));
    },
  });
}

// Mutation to adjust stock
export function useAdjustStock() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: AdjustStockInput) => {
      // 1. Get current stock
      const { data: variant, error: varError } = (await supabase
        .from('product_variants' as never)
        .select('stock')
        .eq('id', input.variantId)
        .single()) as unknown as {
        data: { stock: number } | null;
        error: { message: string } | null;
      };
      if (varError) throw new Error(varError.message);
      if (!variant) throw new Error('Variante no encontrada');

      const previousStock = variant.stock;
      const delta = input.movementType === 'entrada' ? input.quantity : -input.quantity;
      const newStock = previousStock + delta;

      if (newStock < 0) {
        throw new Error(`Stock insuficiente. Stock actual: ${previousStock}, intentando retirar: ${input.quantity}`);
      }

      // 2. Get user name from vende
      let createdByName = 'Usuario';
      if (user?.id) {
        const { data: vendeData } = (await supabase
          .from('vende' as never)
          .select('nomv')
          .eq('codven', user.id)
          .single()) as unknown as {
          data: { nomv: string } | null;
        };
        if (vendeData?.nomv) {
          createdByName = vendeData.nomv;
        }
      }

      // 3. Update variant stock
      const { error: updateError } = (await supabase
        .from('product_variants' as never)
        .update({ stock: newStock })
        .eq('id', input.variantId)) as unknown as {
        error: { message: string } | null;
      };
      if (updateError) throw new Error(updateError.message);

      // 4. Insert movement record
      const { error: insertError } = (await supabase
        .from('inventory_movements' as never)
        .insert({
          product_id: input.productId,
          variant_id: input.variantId,
          movement_type: input.movementType,
          quantity: input.quantity,
          previous_stock: previousStock,
          new_stock: newStock,
          cost: input.cost ?? null,
          comments: input.comments,
          attachment_url: input.attachmentUrl ?? null,
          created_by: user?.id ?? null,
          created_by_name: createdByName,
        })) as unknown as {
        error: { message: string } | null;
      };
      if (insertError) throw new Error(insertError.message);

      return { previousStock, newStock };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRODUCT_STOCK_KEY });
      void queryClient.invalidateQueries({ queryKey: INVENTORY_MOVEMENTS_KEY });
      void queryClient.invalidateQueries({ queryKey: INVENTORY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['product-variants'] });
    },
  });
}
