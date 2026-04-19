import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';

export interface NotaRow {
  id: string;
  folio: number;
  folio_display: string | null;
  fecha: string;
  hora: string;
  cliente: string;
  vendedor: string | null;
  total: number;
  pagado: number;
  metodo_pago: string;
  notas_pago: string | null;
  pago_status: 'pendiente' | 'pagado';
  entrega_status: 'sin_entregar' | 'entregado';
  entrega_token: string;
  entregado_at: string | null;
  pagado_at: string | null;
  created_at: string;
}

export interface NotaPagoRow {
  id: string;
  nota_id: string;
  monto: number;
  metodo_pago: string;
  nota: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

const NOTAS_KEY = ['notas'] as const;
const NOTA_PAGOS_KEY = ['nota-pagos'] as const;

export function useNotas(filters?: {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  pagoStatus?: string | null;
  entregaStatus?: string | null;
}) {
  return useQuery<NotaRow[]>({
    queryKey: [...NOTAS_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('notas' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters?.fechaDesde) {
        query = query.gte('fecha', filters.fechaDesde);
      }
      if (filters?.fechaHasta) {
        query = query.lte('fecha', filters.fechaHasta);
      }
      if (filters?.pagoStatus) {
        query = query.eq('pago_status', filters.pagoStatus);
      }
      if (filters?.entregaStatus) {
        query = query.eq('entrega_status', filters.entregaStatus);
      }

      const { data, error } = (await query) as unknown as {
        data: NotaRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

/** Fetch items sold in a nota (from vtatkt by folio) */
export interface NotaItemRow {
  art: string;
  can: number;
  prec: number;
  descue: number;
}

export function useNotaItems(folio: number | null) {
  return useQuery<NotaItemRow[]>({
    queryKey: ['nota-items', folio],
    queryFn: async () => {
      if (!folio) return [];
      const { data, error } = (await supabase
        .from('vtatkt' as never)
        .select('art, can, prec, descue')
        .eq('folio' as never, folio as never)
        .neq('status' as never, 'CANCELADO' as never)) as unknown as {
        data: NotaItemRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!folio,
  });
}

/** Fetch pagos for a specific nota */
export function useNotaPagos(notaId: string | null) {
  return useQuery<NotaPagoRow[]>({
    queryKey: [...NOTA_PAGOS_KEY, notaId],
    queryFn: async () => {
      if (!notaId) return [];
      const { data, error } = (await supabase
        .from('nota_pagos' as never)
        .select('*')
        .eq('nota_id' as never, notaId as never)
        .order('created_at', { ascending: true })) as unknown as {
        data: NotaPagoRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!notaId,
  });
}

/** Register a partial payment on a nota */
export function useRegistrarPago() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      notaId: string;
      monto: number;
      metodoPago: string;
      nota?: string;
    }) => {
      // Get current nota state
      const { data: currentNota, error: fetchErr } = (await supabase
        .from('notas' as never)
        .select('total, pagado')
        .eq('id' as never, params.notaId as never)
        .single()) as unknown as {
        data: { total: number; pagado: number } | null;
        error: { message: string } | null;
      };
      if (fetchErr) throw new Error(fetchErr.message);
      if (!currentNota) throw new Error('Nota no encontrada');

      const newPagado = currentNota.pagado + params.monto;
      const isFullyPaid = newPagado >= currentNota.total - 0.01;

      // Insert payment record
      const { error: insertErr } = (await supabase
        .from('nota_pagos' as never)
        .insert({
          nota_id: params.notaId,
          monto: params.monto,
          metodo_pago: params.metodoPago,
          nota: params.nota || null,
          created_by: user?.id ?? null,
          created_by_name: user?.email?.split('@')[0] ?? null,
        })) as unknown as { error: { message: string } | null };
      if (insertErr) throw new Error(insertErr.message);

      // Update nota pagado amount and status
      const { error: updateErr } = (await supabase
        .from('notas' as never)
        .update({
          pagado: newPagado,
          pago_status: isFullyPaid ? 'pagado' : 'pendiente',
          pagado_at: isFullyPaid ? new Date().toISOString() : null,
        } as never)
        .eq('id' as never, params.notaId as never)) as unknown as {
        error: { message: string } | null;
      };
      if (updateErr) throw new Error(updateErr.message);

      return { newPagado, isFullyPaid };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTAS_KEY });
      void queryClient.invalidateQueries({ queryKey: NOTA_PAGOS_KEY });
    },
  });
}

/** Cancel a nota — marks as cancelled and reverses sale items in vtatkt */
export function useCancelNota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notaId: string) => {
      // Get the nota to find its folio
      const { data: nota, error: fetchErr } = (await supabase
        .from('notas' as never)
        .select('folio, pago_status')
        .eq('id' as never, notaId as never)
        .single()) as unknown as {
        data: { folio: number; pago_status: string } | null;
        error: { message: string } | null;
      };
      if (fetchErr) throw new Error(fetchErr.message);
      if (!nota) throw new Error('Nota no encontrada');

      // Mark nota as cancelled
      const { error: updateErr } = (await supabase
        .from('notas' as never)
        .update({
          pago_status: 'cancelado' as never,
          notas_pago: 'CANCELADA',
        } as never)
        .eq('id' as never, notaId as never)) as unknown as {
        error: { message: string } | null;
      };
      if (updateErr) throw new Error(updateErr.message);

      // Mark vtatkt items as CANCELADO
      await supabase
        .from('vtatkt' as never)
        .update({ status: 'CANCELADO' } as never)
        .eq('folio' as never, nota.folio as never);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTAS_KEY });
    },
  });
}

/** Delete a nota completely — reverses stock and removes all records */
export function useDeleteNota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notaId: string) => {
      const { data: nota } = (await supabase
        .from('notas' as never)
        .select('folio')
        .eq('id' as never, notaId as never)
        .maybeSingle()) as unknown as { data: { folio: number } | null };
      if (!nota) throw new Error('Nota no encontrada');

      // Get items to reverse stock
      const { data: items } = (await supabase
        .from('vtatkt' as never)
        .select('product_id, can')
        .eq('folio' as never, nota.folio as never)
        .neq('status' as never, 'CANCELADO' as never)) as unknown as {
        data: Array<{ product_id: string | null; can: number }> | null;
      };

      // Reverse stock for each item
      for (const item of items ?? []) {
        if (!item.product_id) continue;
        const { data: variant } = (await supabase
          .from('product_variants' as never)
          .select('id, stock')
          .eq('product_id' as never, item.product_id as never)
          .maybeSingle()) as unknown as { data: { id: string; stock: number } | null };
        if (variant) {
          await supabase
            .from('product_variants' as never)
            .update({ stock: variant.stock + item.can } as never)
            .eq('id' as never, variant.id as never);
        }
      }

      // Delete vtatkt items
      await supabase.from('vtatkt' as never).delete().eq('folio' as never, nota.folio as never);
      // Delete nota_pagos
      await supabase.from('nota_pagos' as never).delete().eq('nota_id' as never, notaId as never);
      // Delete nota
      await supabase.from('notas' as never).delete().eq('id' as never, notaId as never);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTAS_KEY });
    },
  });
}

export function useToggleEntregaStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'entregado' ? 'sin_entregar' : 'entregado';
      const { error } = (await supabase
        .from('notas' as never)
        .update({
          entrega_status: newStatus,
          entregado_at: newStatus === 'entregado' ? new Date().toISOString() : null,
        } as never)
        .eq('id' as never, id as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTAS_KEY });
    },
  });
}

// For public delivery confirmation (no auth required)
export function useConfirmDelivery() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = (await supabase
        .from('notas' as never)
        .update({
          entrega_status: 'entregado',
          entregado_at: new Date().toISOString(),
        } as never)
        .eq('entrega_token' as never, token as never)
        .select('folio_display, cliente, total')
        .single()) as unknown as {
        data: { folio_display: string; cliente: string; total: number } | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
  });
}
