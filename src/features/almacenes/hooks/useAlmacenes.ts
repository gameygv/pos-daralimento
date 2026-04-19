import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logAction } from '@/features/logs/hooks/useLogs';
import { maybeSyncStockToWC } from '@/features/almacenes/utils/syncStockToWC';

export interface AlmacenRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  tienda_id: string | null;
  cliente_id: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface AlmacenStockRow {
  id: string;
  almacen_id: string;
  variant_id: string;
  stock: number;
  min_stock: number;
}

export interface KardexRow {
  id: string;
  almacen_id: string;
  variant_id: string;
  product_id: string;
  tipo: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  costo: number | null;
  referencia: string | null;
  comentario: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface TransferenciaRow {
  id: string;
  almacen_origen_id: string;
  almacen_destino_id: string;
  status: string;
  notas: string | null;
  created_by: string | null;
  created_by_name: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TransferenciaItemRow {
  id: string;
  transferencia_id: string;
  variant_id: string;
  product_id: string;
  cantidad: number;
}

const ALMACENES_KEY = ['almacenes'] as const;
const ALMACEN_STOCK_KEY = ['almacen-stock'] as const;
const KARDEX_KEY = ['kardex'] as const;
const TRANSFERENCIAS_KEY = ['transferencias'] as const;

// ─── Almacenes CRUD ────────────────────────────────────

export function useAlmacenes(includeInactive = false) {
  return useQuery<AlmacenRow[]>({
    queryKey: [...ALMACENES_KEY, includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('almacenes' as never)
        .select('*')
        .order('nombre' as never);
      if (!includeInactive) {
        query = query.eq('is_active' as never, true as never);
      }
      const { data, error } = (await query) as unknown as {
        data: AlmacenRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateAlmacen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (almacen: Omit<AlmacenRow, 'id' | 'created_at'>) => {
      const { data, error } = (await supabase
        .from('almacenes' as never)
        .insert(almacen)
        .select()
        .single()) as unknown as {
        data: AlmacenRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ALMACENES_KEY }),
  });
}

export function useUpdateAlmacen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AlmacenRow>) => {
      const { error } = (await supabase
        .from('almacenes' as never)
        .update(updates)
        .eq('id' as never, id as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ALMACENES_KEY }),
  });
}

// ─── Stock por almacén ─────────────────────────────────

export interface AlmacenStockView {
  almacen_id: string;
  almacen_nombre: string;
  variant_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  stock: number;
  min_stock: number;
}

export function useAlmacenStock(almacenId: string | null) {
  return useQuery<AlmacenStockView[]>({
    queryKey: [...ALMACEN_STOCK_KEY, almacenId],
    queryFn: async () => {
      if (!almacenId) return [];
      const { data, error } = (await supabase
        .from('almacen_stock' as never)
        .select('*, almacenes(nombre), product_variants(sku, product_id, products(name))' as never)
        .eq('almacen_id' as never, almacenId as never)) as unknown as {
        data: Array<{
          almacen_id: string;
          variant_id: string;
          stock: number;
          min_stock: number;
          almacenes: { nombre: string };
          product_variants: { sku: string; product_id: string; products: { name: string } };
        }> | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => ({
        almacen_id: r.almacen_id,
        almacen_nombre: r.almacenes?.nombre ?? '',
        variant_id: r.variant_id,
        product_id: r.product_variants?.product_id ?? '',
        product_name: r.product_variants?.products?.name ?? '',
        sku: r.product_variants?.sku ?? '',
        stock: r.stock,
        min_stock: r.min_stock,
      }));
    },
    enabled: !!almacenId,
  });
}

// ─── Precios de un producto en todos los almacenes ────────

export function useProductAlmacenPrecios(productId: string | null) {
  return useQuery<Array<{ almacen_id: string; precio_publico: number; precio_proveedores: number }>>({
    queryKey: ['product-almacen-precios', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = (await supabase
        .from('almacen_precios' as never)
        .select('almacen_id, precio_publico, precio_proveedores')
        .eq('product_id' as never, productId as never)) as unknown as {
        data: Array<{ almacen_id: string; precio_publico: number; precio_proveedores: number }> | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!productId,
  });
}

// ─── Precios por almacén ──────────────────────────────────

export interface AlmacenPrecioRow {
  id: string;
  almacen_id: string;
  product_id: string;
  precio_publico: number;
  precio_proveedores: number;
}

export interface AlmacenPrecioView extends AlmacenPrecioRow {
  product_name: string;
  sku: string;
  base_price: number;
  precio_mayoreo: number;
}

const ALMACEN_PRECIOS_KEY = ['almacen-precios'] as const;

export function useAlmacenPrecios(almacenId: string | null) {
  return useQuery<AlmacenPrecioView[]>({
    queryKey: [...ALMACEN_PRECIOS_KEY, almacenId],
    queryFn: async () => {
      if (!almacenId) return [];

      // Get all products (with their global prices)
      const { data: products, error: prodErr } = (await supabase
        .from('products' as never)
        .select('id, name, sku, base_price, precio_mayoreo')
        .eq('is_active' as never, true as never)
        .order('name' as never)) as unknown as {
        data: Array<{
          id: string;
          name: string;
          sku: string;
          base_price: number;
          precio_mayoreo: number;
        }> | null;
        error: { message: string } | null;
      };
      if (prodErr) throw new Error(prodErr.message);

      // Get existing almacen-specific prices
      const { data: precios, error: precErr } = (await supabase
        .from('almacen_precios' as never)
        .select('*')
        .eq('almacen_id' as never, almacenId as never)) as unknown as {
        data: AlmacenPrecioRow[] | null;
        error: { message: string } | null;
      };
      if (precErr) throw new Error(precErr.message);

      const precioMap = new Map((precios ?? []).map((p) => [p.product_id, p]));

      // Merge: show all products, with almacen price if exists, otherwise global
      return (products ?? []).map((prod) => {
        const ap = precioMap.get(prod.id);
        return {
          id: ap?.id ?? '',
          almacen_id: almacenId,
          product_id: prod.id,
          precio_publico: ap?.precio_publico ?? prod.base_price,
          precio_proveedores: ap?.precio_proveedores ?? prod.precio_mayoreo,
          product_name: prod.name,
          sku: prod.sku,
          base_price: prod.base_price,
          precio_mayoreo: prod.precio_mayoreo,
        };
      });
    },
    enabled: !!almacenId,
  });
}

export function useUpsertAlmacenPrecio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      almacenId: string;
      productId: string;
      precioPublico: number;
      precioProveedores: number;
    }) => {
      const { error } = (await supabase
        .from('almacen_precios' as never)
        .upsert({
          almacen_id: params.almacenId,
          product_id: params.productId,
          precio_publico: params.precioPublico,
          precio_proveedores: params.precioProveedores,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'almacen_id,product_id' } as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);

      logAction('almacen_precio_actualizado', {
        almacen_id: params.almacenId,
        product_id: params.productId,
        precio_publico: params.precioPublico,
        precio_proveedores: params.precioProveedores,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ALMACEN_PRECIOS_KEY });
    },
  });
}

// ─── All product variants (for stock adjustment dropdown) ─────

export interface ProductVariantOption {
  variant_id: string;
  product_id: string;
  product_name: string;
  sku: string;
}

const PRODUCT_VARIANTS_KEY = ['product-variants-all'] as const;

export function useAllProductVariants() {
  return useQuery<ProductVariantOption[]>({
    queryKey: [...PRODUCT_VARIANTS_KEY],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('product_variants' as never)
        .select('id, sku, product_id, products(name)' as never)
        .order('sku' as never)) as unknown as {
        data: Array<{
          id: string;
          sku: string;
          product_id: string;
          products: { name: string };
        }> | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => ({
        variant_id: r.id,
        product_id: r.product_id,
        product_name: r.products?.name ?? '',
        sku: r.sku,
      }));
    },
  });
}

// ─── Kardex ────────────────────────────────────────────

export interface KardexFilter {
  almacenId?: string | null;
  productId?: string | null;
  tipo?: string | null;
  desde?: string | null;
  hasta?: string | null;
}

export function useKardex(filter: KardexFilter = {}) {
  return useQuery<KardexRow[]>({
    queryKey: [...KARDEX_KEY, filter],
    queryFn: async () => {
      let query = supabase
        .from('kardex' as never)
        .select('*')
        .order('created_at' as never, { ascending: false })
        .limit(500);

      if (filter.almacenId) query = query.eq('almacen_id' as never, filter.almacenId as never);
      if (filter.productId) query = query.eq('product_id' as never, filter.productId as never);
      if (filter.tipo) query = query.eq('tipo' as never, filter.tipo as never);
      if (filter.desde) query = query.gte('created_at' as never, filter.desde as never);
      if (filter.hasta) query = query.lte('created_at' as never, filter.hasta as never);

      const { data, error } = (await query) as unknown as {
        data: KardexRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

// ─── Ajuste de stock con Kardex ────────────────────────

interface AdjustStockParams {
  almacenId: string;
  variantId: string;
  productId: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  costo?: number | null;
  comentario?: string;
  userId?: string;
  userName?: string;
}

export function useAdjustAlmacenStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: AdjustStockParams) => {
      // 1. Get current stock
      const { data: current } = (await supabase
        .from('almacen_stock' as never)
        .select('stock')
        .eq('almacen_id' as never, params.almacenId as never)
        .eq('variant_id' as never, params.variantId as never)
        .single()) as unknown as { data: { stock: number } | null };

      const prevStock = current?.stock ?? 0;
      let newStock: number;

      if (params.tipo === 'entrada') newStock = prevStock + params.cantidad;
      else if (params.tipo === 'salida') newStock = prevStock - params.cantidad;
      else newStock = params.cantidad; // ajuste = set absolute

      if (newStock < 0) throw new Error('El stock no puede quedar negativo');

      // 2. Upsert almacen_stock
      const { error: stockError } = (await supabase
        .from('almacen_stock' as never)
        .upsert({
          almacen_id: params.almacenId,
          variant_id: params.variantId,
          stock: newStock,
        }, { onConflict: 'almacen_id,variant_id' } as never)) as unknown as {
        error: { message: string } | null;
      };
      if (stockError) throw new Error(stockError.message);

      // 3. Record Kardex
      const { error: kardexError } = (await supabase
        .from('kardex' as never)
        .insert({
          almacen_id: params.almacenId,
          variant_id: params.variantId,
          product_id: params.productId,
          tipo: params.tipo,
          cantidad: params.tipo === 'ajuste' ? newStock - prevStock : params.cantidad,
          stock_anterior: prevStock,
          stock_nuevo: newStock,
          costo: params.costo ?? null,
          comentario: params.comentario ?? null,
          created_by: params.userId ?? null,
          created_by_name: params.userName ?? null,
        })) as unknown as { error: { message: string } | null };
      if (kardexError) throw new Error(kardexError.message);

      // 4. Also update product_variants.stock with total across all almacenes
      const { data: allStocks } = (await supabase
        .from('almacen_stock' as never)
        .select('stock')
        .eq('variant_id' as never, params.variantId as never)) as unknown as {
        data: { stock: number }[] | null;
      };
      const totalStock = (allStocks ?? []).reduce((s, r) => s + r.stock, 0);
      await supabase
        .from('product_variants' as never)
        .update({ stock: totalStock })
        .eq('id' as never, params.variantId as never);

      // Log and sync to WC
      logAction('stock_ajustado', {
        almacen_id: params.almacenId,
        product_id: params.productId,
        tipo: params.tipo,
        cantidad: params.cantidad,
        stock_anterior: prevStock,
        stock_nuevo: newStock,
        usuario: params.userName ?? null,
      });
      maybeSyncStockToWC(params.almacenId, params.productId, newStock);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ALMACEN_STOCK_KEY });
      void qc.invalidateQueries({ queryKey: KARDEX_KEY });
    },
  });
}

// ─── Transferencias ────────────────────────────────────

interface CreateTransferParams {
  almacenOrigenId: string;
  almacenDestinoId: string;
  items: Array<{ variantId: string; productId: string; cantidad: number }>;
  notas?: string;
  userId?: string;
  userName?: string;
}

export function useTransferencias() {
  return useQuery<TransferenciaRow[]>({
    queryKey: [...TRANSFERENCIAS_KEY],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('transferencias' as never)
        .select('*')
        .order('created_at' as never, { ascending: false })
        .limit(100)) as unknown as {
        data: TransferenciaRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateTransferencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateTransferParams) => {
      // 1. Create transferencia header
      const { data: transfer, error: tErr } = (await supabase
        .from('transferencias' as never)
        .insert({
          almacen_origen_id: params.almacenOrigenId,
          almacen_destino_id: params.almacenDestinoId,
          status: 'completada',
          notas: params.notas ?? null,
          created_by: params.userId ?? null,
          created_by_name: params.userName ?? null,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()) as unknown as {
        data: { id: string } | null;
        error: { message: string } | null;
      };
      if (tErr || !transfer) throw new Error(tErr?.message ?? 'Error creando transferencia');

      // 2. Insert items
      const itemInserts = params.items.map((it) => ({
        transferencia_id: transfer.id,
        variant_id: it.variantId,
        product_id: it.productId,
        cantidad: it.cantidad,
      }));
      const { error: iErr } = (await supabase
        .from('transferencia_items' as never)
        .insert(itemInserts)) as unknown as { error: { message: string } | null };
      if (iErr) throw new Error(iErr.message);

      // 3. Move stock: subtract from origin, add to destination + kardex
      for (const item of params.items) {
        // Origin: subtract
        const { data: originStock } = (await supabase
          .from('almacen_stock' as never)
          .select('stock')
          .eq('almacen_id' as never, params.almacenOrigenId as never)
          .eq('variant_id' as never, item.variantId as never)
          .single()) as unknown as { data: { stock: number } | null };

        const prevOrigen = originStock?.stock ?? 0;
        const newOrigen = prevOrigen - item.cantidad;
        if (newOrigen < 0) throw new Error('Stock insuficiente en almacen origen');

        await supabase
          .from('almacen_stock' as never)
          .upsert({ almacen_id: params.almacenOrigenId, variant_id: item.variantId, stock: newOrigen }, { onConflict: 'almacen_id,variant_id' } as never);

        // Kardex: salida del origen
        await supabase.from('kardex' as never).insert({
          almacen_id: params.almacenOrigenId,
          variant_id: item.variantId,
          product_id: item.productId,
          tipo: 'transferencia_salida',
          cantidad: item.cantidad,
          stock_anterior: prevOrigen,
          stock_nuevo: newOrigen,
          referencia: transfer.id,
          comentario: `Transferencia a ${params.almacenDestinoId}`,
          created_by: params.userId ?? null,
          created_by_name: params.userName ?? null,
        });

        // Destination: add
        const { data: destStock } = (await supabase
          .from('almacen_stock' as never)
          .select('stock')
          .eq('almacen_id' as never, params.almacenDestinoId as never)
          .eq('variant_id' as never, item.variantId as never)
          .single()) as unknown as { data: { stock: number } | null };

        const prevDest = destStock?.stock ?? 0;
        const newDest = prevDest + item.cantidad;

        await supabase
          .from('almacen_stock' as never)
          .upsert({ almacen_id: params.almacenDestinoId, variant_id: item.variantId, stock: newDest }, { onConflict: 'almacen_id,variant_id' } as never);

        // Kardex: entrada al destino
        await supabase.from('kardex' as never).insert({
          almacen_id: params.almacenDestinoId,
          variant_id: item.variantId,
          product_id: item.productId,
          tipo: 'transferencia_entrada',
          cantidad: item.cantidad,
          stock_anterior: prevDest,
          stock_nuevo: newDest,
          referencia: transfer.id,
          comentario: `Transferencia desde ${params.almacenOrigenId}`,
          created_by: params.userId ?? null,
          created_by_name: params.userName ?? null,
        });

        // Sync to WC if origin or destination is "Página Web"
        maybeSyncStockToWC(params.almacenOrigenId, item.productId, newOrigen);
        maybeSyncStockToWC(params.almacenDestinoId, item.productId, newDest);
      }

      logAction('transferencia_creada', {
        transferencia_id: transfer.id,
        origen: params.almacenOrigenId,
        destino: params.almacenDestinoId,
        items: params.items.length,
        usuario: params.userName ?? null,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: TRANSFERENCIAS_KEY });
      void qc.invalidateQueries({ queryKey: ALMACEN_STOCK_KEY });
      void qc.invalidateQueries({ queryKey: KARDEX_KEY });
    },
  });
}
