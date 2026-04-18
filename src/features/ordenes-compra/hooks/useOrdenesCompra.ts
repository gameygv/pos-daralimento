import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProveedorRow {
  id: string;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  is_active: boolean;
  created_at: string;
}

export interface OrdenCompraRow {
  id: string;
  folio: number;
  proveedor_id: string | null;
  proveedor_nombre: string;
  status: string;
  almacen_destino_id: string | null;
  subtotal: number;
  impuestos: number;
  total: number;
  notas: string | null;
  fecha_esperada: string | null;
  created_by: string | null;
  created_by_name: string | null;
  received_at: string | null;
  created_at: string;
}

export interface OrdenCompraItemRow {
  id: string;
  orden_id: string;
  product_id: string;
  variant_id: string | null;
  descripcion: string;
  cantidad_ordenada: number;
  cantidad_recibida: number;
  costo_unitario: number;
  subtotal: number;
}

const PROVEEDORES_KEY = ['proveedores'] as const;
const OC_KEY = ['ordenes-compra'] as const;
const OC_ITEMS_KEY = ['oc-items'] as const;

// ─── Proveedores ───────────────────────────────────────

export function useProveedores() {
  return useQuery<ProveedorRow[]>({
    queryKey: [...PROVEEDORES_KEY],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('proveedores' as never)
        .select('*')
        .eq('is_active' as never, true as never)
        .order('nombre' as never)) as unknown as {
        data: ProveedorRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prov: Omit<ProveedorRow, 'id' | 'created_at'>) => {
      const { data, error } = (await supabase
        .from('proveedores' as never)
        .insert(prov)
        .select()
        .single()) as unknown as {
        data: ProveedorRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: PROVEEDORES_KEY }),
  });
}

// ─── Ordenes de Compra ─────────────────────────────────

export function useOrdenesCompra(status?: string) {
  return useQuery<OrdenCompraRow[]>({
    queryKey: [...OC_KEY, status],
    queryFn: async () => {
      let query = supabase
        .from('ordenes_compra' as never)
        .select('*')
        .order('created_at' as never, { ascending: false })
        .limit(200);

      if (status) query = query.eq('status' as never, status as never);

      const { data, error } = (await query) as unknown as {
        data: OrdenCompraRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useOrdenCompraItems(ordenId: string | null) {
  return useQuery<OrdenCompraItemRow[]>({
    queryKey: [...OC_ITEMS_KEY, ordenId],
    queryFn: async () => {
      if (!ordenId) return [];
      const { data, error } = (await supabase
        .from('orden_compra_items' as never)
        .select('*')
        .eq('orden_id' as never, ordenId as never)) as unknown as {
        data: OrdenCompraItemRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!ordenId,
  });
}

interface CreateOCParams {
  proveedorId: string | null;
  proveedorNombre: string;
  almacenDestinoId?: string | null;
  notas?: string;
  fechaEsperada?: string | null;
  items: Array<{
    productId: string;
    variantId?: string | null;
    descripcion: string;
    cantidadOrdenada: number;
    costoUnitario: number;
  }>;
  userId?: string;
  userName?: string;
}

export function useCreateOrdenCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateOCParams) => {
      const subtotal = params.items.reduce((s, i) => s + i.cantidadOrdenada * i.costoUnitario, 0);
      const impuestos = subtotal * 0.16;
      const total = subtotal + impuestos;

      const { data: oc, error: ocErr } = (await supabase
        .from('ordenes_compra' as never)
        .insert({
          proveedor_id: params.proveedorId,
          proveedor_nombre: params.proveedorNombre,
          status: 'borrador',
          almacen_destino_id: params.almacenDestinoId ?? null,
          subtotal,
          impuestos,
          total,
          notas: params.notas ?? null,
          fecha_esperada: params.fechaEsperada ?? null,
          created_by: params.userId ?? null,
          created_by_name: params.userName ?? null,
        })
        .select()
        .single()) as unknown as {
        data: OrdenCompraRow | null;
        error: { message: string } | null;
      };
      if (ocErr || !oc) throw new Error(ocErr?.message ?? 'Error creando orden');

      const itemInserts = params.items.map((i) => ({
        orden_id: oc.id,
        product_id: i.productId,
        variant_id: i.variantId ?? null,
        descripcion: i.descripcion,
        cantidad_ordenada: i.cantidadOrdenada,
        cantidad_recibida: 0,
        costo_unitario: i.costoUnitario,
        subtotal: i.cantidadOrdenada * i.costoUnitario,
      }));

      const { error: iErr } = (await supabase
        .from('orden_compra_items' as never)
        .insert(itemInserts)) as unknown as { error: { message: string } | null };
      if (iErr) throw new Error(iErr.message);

      return oc;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: OC_KEY });
    },
  });
}

export function useUpdateOCStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'recibida') updates.received_at = new Date().toISOString();

      const { error } = (await supabase
        .from('ordenes_compra' as never)
        .update(updates)
        .eq('id' as never, id as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: OC_KEY }),
  });
}
