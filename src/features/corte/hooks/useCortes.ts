import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CorteRow {
  id: number;
  ultcort: number;
  fecha: string;
  hora: string;
  initk: number;
  ulttk: number;
  vtato: number;
  ivare: number;
  ctovd: number;
  utibr: number;
}

interface SaleRow {
  folio: number;
  folio_display: string | null;
  prec: number;
  can: number;
  cost: number;
  hora: string;
  status: string;
  metodo_pago: string;
  art: string;
}

export interface PaymentBreakdown {
  method: string;
  label: string;
  tickets: number;
  total: number;
}

export interface ProductSale {
  art: string;
  descr: string;
  cantidad: number;
  precio: number;
  total: number;
}

export interface CorteData {
  empty: boolean;
  totalSales: number;
  totalProducts: number;
  totalCost: number;
  profit: number;
  initk: number;
  ulttk: number;
  initkDisplay: string;
  ulttkDisplay: string;
  ticketCount: number;
  breakdown: PaymentBreakdown[];
  productSales: ProductSale[];
  sales: SaleRow[];
}

const CORTES_KEY = ['cortes'] as const;
const TODAY_SALES_KEY = ['today-sales'] as const;

const METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  trueque: 'Trueque',
  regalo: 'Regalo',
};

const ALL_METHODS = ['efectivo', 'tarjeta', 'transferencia', 'trueque', 'regalo'];

export function useCorteHistory() {
  return useQuery<CorteRow[]>({
    queryKey: [...CORTES_KEY],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('corte' as never)
        .select('*')
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false })
        .limit(100)) as unknown as {
        data: CorteRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

/** @deprecated Use useCorteHistory instead */
export const useCortes = useCorteHistory;

export function useCorteDetail(corteId: number | null) {
  return useQuery<CorteRow | null>({
    queryKey: ['corte-detail', corteId],
    queryFn: async () => {
      if (corteId === null) return null;
      const { data, error } = (await supabase
        .from('corte' as never)
        .select('*')
        .eq('ultcort' as never, corteId as never)
        .single()) as unknown as {
        data: CorteRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: corteId !== null,
  });
}

function buildCorteData(ventas: SaleRow[]): CorteData {
  if (ventas.length === 0) {
    return {
      empty: true,
      totalSales: 0,
      totalProducts: 0,
      totalCost: 0,
      profit: 0,
      initk: 0,
      ulttk: 0,
      initkDisplay: '',
      ulttkDisplay: '',
      ticketCount: 0,
      breakdown: [],
      productSales: [],
      sales: [],
    };
  }

  const totalSales = ventas.reduce((acc, v) => acc + v.prec * v.can, 0);
  const totalProducts = ventas.reduce((acc, v) => acc + v.can, 0);
  const totalCost = ventas.reduce((acc, v) => acc + v.cost * v.can, 0);
  const folios = ventas.map((v) => v.folio);
  const uniqueFolios = [...new Set(folios)];

  // Group by payment method
  const byMethod: Record<string, { tickets: Set<number>; total: number }> = {};
  for (const v of ventas) {
    const m = v.metodo_pago || 'efectivo';
    if (!byMethod[m]) byMethod[m] = { tickets: new Set(), total: 0 };
    byMethod[m].tickets.add(v.folio);
    byMethod[m].total += v.prec * v.can;
  }

  const breakdown: PaymentBreakdown[] = ALL_METHODS.map((m) => ({
    method: m,
    label: METHOD_LABELS[m] ?? m,
    tickets: byMethod[m]?.tickets.size ?? 0,
    total: byMethod[m]?.total ?? 0,
  }));

  // Group by product
  const byProduct: Record<string, ProductSale> = {};
  for (const v of ventas) {
    const key = v.art;
    if (!byProduct[key]) {
      byProduct[key] = {
        art: v.art,
        descr: v.art,
        cantidad: 0,
        precio: v.prec,
        total: 0,
      };
    }
    byProduct[key].cantidad += v.can;
    byProduct[key].total += v.prec * v.can;
  }

  const productSales = Object.values(byProduct).sort((a, b) =>
    a.descr.localeCompare(b.descr),
  );

  const minFolio = Math.min(...folios);
  const maxFolio = Math.max(...folios);

  // Find display strings for min/max folios
  const minFolioRow = ventas.find((v) => v.folio === minFolio);
  const maxFolioRow = ventas.find((v) => v.folio === maxFolio);
  const initkDisplay = minFolioRow?.folio_display || `${minFolio}`;
  const ulttkDisplay = maxFolioRow?.folio_display || `${maxFolio}`;

  return {
    empty: false,
    totalSales,
    totalProducts,
    totalCost,
    profit: totalSales - totalCost,
    initk: minFolio,
    ulttk: maxFolio,
    initkDisplay,
    ulttkDisplay,
    ticketCount: uniqueFolios.length,
    breakdown,
    productSales,
    sales: ventas,
  };
}

export function useTodaySales(cajaSessionId?: string | null) {
  return useQuery<CorteData>({
    queryKey: [...TODAY_SALES_KEY, cajaSessionId],
    queryFn: async () => {
      if (cajaSessionId) {
        // Filter by caja session — most accurate
        const { data: ventas, error } = (await supabase
          .from('vtatkt' as never)
          .select('folio, folio_display, prec, can, cost, hora, status, metodo_pago, art')
          .eq('caja_session_id' as never, cajaSessionId as never)
          .neq('status' as never, 'CANCELADO' as never)) as unknown as {
          data: SaleRow[] | null;
          error: { message: string } | null;
        };
        if (error) throw new Error(error.message);
        return buildCorteData(ventas ?? []);
      }

      // Fallback: get sales since last corte
      const { data: ultimoCorte } = (await supabase
        .from('corte' as never)
        .select('ulttk')
        .order('ultcort' as never, { ascending: false })
        .limit(1)
        .single()) as unknown as {
        data: { ulttk: number } | null;
      };

      const folioInicio = (ultimoCorte?.ulttk ?? 0) + 1;

      const { data: ventas, error } = (await supabase
        .from('vtatkt' as never)
        .select('folio, folio_display, prec, can, cost, hora, status, metodo_pago, art')
        .gte('folio' as never, folioInicio as never)
        .neq('status' as never, 'CANCELADO' as never)) as unknown as {
        data: SaleRow[] | null;
        error: { message: string } | null;
      };

      if (error) throw new Error(error.message);
      return buildCorteData(ventas ?? []);
    },
    refetchInterval: 30000,
  });
}

export function useCreateCorte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (corteData: CorteData & { cajaId?: string | null }) => {
      const { data: ctrl, error: ctrlErr } = (await supabase
        .from('pvcntl' as never)
        .select('foliocor')
        .single()) as unknown as {
        data: { foliocor: number } | null;
        error: { message: string } | null;
      };
      if (ctrlErr) throw new Error(ctrlErr.message);

      const nextFolioCorte = (ctrl?.foliocor ?? 0) + 1;
      const now = new Date();

      const { error } = (await supabase.from('corte' as never).insert({
        ultcort: nextFolioCorte,
        fecha: now.toISOString().split('T')[0],
        hora: now.toTimeString().split(' ')[0],
        initk: corteData.initk,
        ulttk: corteData.ulttk,
        vtato: corteData.totalSales,
        ivare: 0,
        ctovd: corteData.totalCost,
        utibr: corteData.profit,
        ...(corteData.cajaId ? { caja_id: corteData.cajaId } : {}),
      } as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);

      const { error: updateErr } = (await supabase
        .from('pvcntl' as never)
        .update({ foliocor: nextFolioCorte } as never)
        .eq('id' as never, 1 as never)) as unknown as {
        error: { message: string } | null;
      };
      if (updateErr) throw new Error(updateErr.message);

      return nextFolioCorte;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CORTES_KEY });
      void queryClient.invalidateQueries({ queryKey: TODAY_SALES_KEY });
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
