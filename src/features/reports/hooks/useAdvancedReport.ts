import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdvancedReportRow {
  id: number | string;
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
  source: 'venta' | 'nota';
  pagado: number;
  total: number;
  saldo: number;
  entrega_status: string;
}

export function useAdvancedReport(fechaDesde: string, fechaHasta: string) {
  return useQuery<AdvancedReportRow[]>({
    queryKey: ['advanced-report', fechaDesde, fechaHasta],
    queryFn: async () => {
      const results: AdvancedReportRow[] = [];

      // 1. Fetch from vtatkt (POS sales)
      let vtaQuery = supabase
        .from('vtatkt' as never)
        .select('id, fecha, hora, vende, folio, can, art, prec, cost, descue, cliente, status, metodo_pago, caja_id')
        .order('fecha' as never, { ascending: false })
        .limit(10000);

      if (fechaDesde) vtaQuery = vtaQuery.gte('fecha' as never, fechaDesde as never);
      if (fechaHasta) vtaQuery = vtaQuery.lte('fecha' as never, fechaHasta as never);

      const { data: vtaData } = (await vtaQuery) as unknown as {
        data: Array<{
          id: number; fecha: string; hora: string; vende: string; folio: number;
          can: number; art: string; prec: number; cost: number; descue: number;
          cliente: string; status: string; metodo_pago: string; caja_id: string | null;
        }> | null;
      };

      for (const r of vtaData ?? []) {
        results.push({
          ...r,
          source: 'venta',
          pagado: r.prec * r.can,
          total: r.prec * r.can,
          saldo: 0,
          entrega_status: '',
        });
      }

      // 2. Fetch from notas (imported + POS notes)
      let notaQuery = supabase
        .from('notas' as never)
        .select('id, fecha, hora, vendedor, folio, folio_display, cliente, total, pagado, metodo_pago, pago_status, entrega_status, notas_pago')
        .order('fecha' as never, { ascending: false })
        .limit(5000);

      if (fechaDesde) notaQuery = notaQuery.gte('fecha' as never, fechaDesde as never);
      if (fechaHasta) notaQuery = notaQuery.lte('fecha' as never, fechaHasta as never);

      const { data: notaData } = (await notaQuery) as unknown as {
        data: Array<{
          id: string; fecha: string; hora: string; vendedor: string | null;
          folio: number; folio_display: string | null; cliente: string;
          total: number; pagado: number; metodo_pago: string;
          pago_status: string; entrega_status: string; notas_pago: string | null;
        }> | null;
      };

      // Only include notas that don't already have vtatkt entries (avoid double-counting)
      const vtaFolios = new Set((vtaData ?? []).map((r) => r.folio));

      for (const n of notaData ?? []) {
        if (vtaFolios.has(n.folio)) continue; // Already counted from vtatkt
        if (n.pago_status === 'cancelado') continue;

        results.push({
          id: n.id,
          fecha: n.fecha,
          hora: n.hora,
          vende: n.vendedor ?? 'Importacion',
          folio: n.folio,
          can: 1,
          art: n.folio_display || `Nota #${n.folio}`,
          prec: n.total,
          cost: 0,
          descue: 0,
          cliente: n.cliente,
          status: n.pago_status === 'cancelado' ? 'CANCELADO' : 'VENDIDO',
          metodo_pago: n.metodo_pago,
          caja_id: null,
          source: 'nota',
          pagado: n.pagado,
          total: n.total,
          saldo: n.total - n.pagado,
          entrega_status: n.entrega_status,
        });
      }

      return results;
    },
  });
}
