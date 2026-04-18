import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdvancedReportRow {
  id: number;
  fecha: string;
  hora: string;
  vende: string;
  folio: number;
  can: number;
  art: string;
  prec: number;
  cost: number;
  descue: number;
  cliente: string;
  status: string;
  metodo_pago: string;
  caja_id: string | null;
}

export function useAdvancedReport(fechaDesde: string, fechaHasta: string) {
  return useQuery<AdvancedReportRow[]>({
    queryKey: ['advanced-report', fechaDesde, fechaHasta],
    queryFn: async () => {
      let query = supabase
        .from('vtatkt' as never)
        .select('id, fecha, hora, vende, folio, can, art, prec, cost, descue, cliente, status, metodo_pago, caja_id')
        .order('fecha' as never, { ascending: false })
        .limit(10000);

      if (fechaDesde) {
        query = query.gte('fecha' as never, fechaDesde as never);
      }
      if (fechaHasta) {
        query = query.lte('fecha' as never, fechaHasta as never);
      }

      const { data, error } = (await query) as unknown as {
        data: AdvancedReportRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}
