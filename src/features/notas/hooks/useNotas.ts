import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NotaRow {
  id: string;
  folio: number;
  folio_display: string | null;
  fecha: string;
  hora: string;
  cliente: string;
  vendedor: string | null;
  total: number;
  metodo_pago: string;
  pago_status: 'pendiente' | 'pagado';
  entrega_status: 'sin_entregar' | 'entregado';
  entrega_token: string;
  entregado_at: string | null;
  pagado_at: string | null;
  created_at: string;
}

const NOTAS_KEY = ['notas'] as const;

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

export function useTogglePagoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'pagado' ? 'pendiente' : 'pagado';
      const { error } = (await supabase
        .from('notas' as never)
        .update({
          pago_status: newStatus,
          pagado_at: newStatus === 'pagado' ? new Date().toISOString() : null,
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
