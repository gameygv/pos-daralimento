import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VtatktRow {
  id: number;
  fecha: string;
  hora: string;
  vende: string | null;
  folio: number;
  can: number;
  art: string | null;
  prec: number;
  cost: number;
  descue: number;
  comici: number;
  yareg: string | null;
  cliente: string | null;
  status: string;
}

export interface DailySales {
  fecha: string;
  total: number;
  tickets: number;
}

const REPORTS_KEY = ['reports'] as const;

export function useSalesReport(filters?: {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
}) {
  return useQuery<VtatktRow[]>({
    queryKey: [...REPORTS_KEY, 'sales', filters],
    queryFn: async () => {
      let query = supabase
        .from('vtatkt' as never)
        .select('*')
        .order('fecha', { ascending: false })
        .order('folio', { ascending: false })
        .limit(500);

      if (filters?.fechaDesde) {
        query = query.gte('fecha', filters.fechaDesde);
      }
      if (filters?.fechaHasta) {
        query = query.lte('fecha', filters.fechaHasta);
      }

      const { data, error } = (await query) as unknown as {
        data: VtatktRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useDailySales(tickets: VtatktRow[]): DailySales[] {
  const dailyMap = new Map<string, { total: number; folios: Set<number> }>();

  for (const t of tickets) {
    if (t.status === 'CANCELADO') continue;
    const existing = dailyMap.get(t.fecha);
    const lineTotal = t.prec * t.can - t.descue;
    if (existing) {
      existing.total += lineTotal;
      existing.folios.add(t.folio);
    } else {
      dailyMap.set(t.fecha, {
        total: lineTotal,
        folios: new Set([t.folio]),
      });
    }
  }

  return Array.from(dailyMap.entries())
    .map(([fecha, data]) => ({
      fecha,
      total: data.total,
      tickets: data.folios.size,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
