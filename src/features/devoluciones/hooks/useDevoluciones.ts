import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SaleRow {
  id: string;
  folio: number;
  folio_display: string;
  fecha: string;
  hora: string;
  art: string;
  can: number;
  prec: number;
  descue: number;
  cliente: string;
  vende: string;
  metodo_pago: string;
  status: string;
  product_id: string | null;
  caja_id: string | null;
  caja_session_id: string | null;
}

export interface TicketForReturn {
  folio: number;
  folioDisplay: string;
  fecha: string;
  hora: string;
  cliente: string;
  vendedor: string;
  metodoPago: string;
  items: TicketItemForReturn[];
}

export interface TicketItemForReturn {
  id: string;
  art: string;
  can: number;
  prec: number;
  descue: number;
  productId: string | null;
}

export function useSearchTicket(folio: string) {
  return useQuery<TicketForReturn | null>({
    queryKey: ['ticket-search', folio],
    enabled: folio.length > 0,
    queryFn: async () => {
      const folioNum = parseInt(folio, 10);
      if (isNaN(folioNum)) return null;

      const { data, error } = (await supabase
        .from('vtatkt' as never)
        .select('*')
        .eq('folio' as never, folioNum as never)
        .eq('status' as never, 'VENDIDO' as never)
        .order('id' as never)) as unknown as {
        data: SaleRow[] | null;
        error: { message: string } | null;
      };

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) return null;

      const first = data[0];
      return {
        folio: first.folio,
        folioDisplay: first.folio_display,
        fecha: first.fecha,
        hora: first.hora,
        cliente: first.cliente,
        vendedor: first.vende,
        metodoPago: first.metodo_pago,
        items: data.map((r) => ({
          id: r.id,
          art: r.art,
          can: r.can,
          prec: r.prec,
          descue: r.descue,
          productId: r.product_id,
        })),
      };
    },
  });
}

interface ProcessReturnParams {
  /** vtatkt row IDs to mark as returned */
  itemIds: string[];
  /** quantities to return per row (same order) */
  quantities: number[];
  /** reason for return */
  reason: string;
}

export function useProcessReturn() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ProcessReturnParams>({
    mutationFn: async ({ itemIds, quantities, reason }) => {
      for (let i = 0; i < itemIds.length; i++) {
        const rowId = itemIds[i];
        const qtyToReturn = quantities[i];

        // Get current row
        const { data: row } = (await supabase
          .from('vtatkt' as never)
          .select('can, product_id, status')
          .eq('id' as never, rowId as never)
          .single()) as unknown as {
          data: { can: number; product_id: string | null; status: string } | null;
        };

        if (!row || row.status !== 'VENDIDO') continue;

        if (qtyToReturn >= row.can) {
          // Full return — mark as DEVUELTO
          await supabase
            .from('vtatkt' as never)
            .update({ status: 'DEVUELTO', yareg: reason || 'DEVOLUCION' } as never)
            .eq('id' as never, rowId as never);
        } else {
          // Partial return — reduce quantity
          await supabase
            .from('vtatkt' as never)
            .update({ can: row.can - qtyToReturn } as never)
            .eq('id' as never, rowId as never);
        }

        // Restore stock
        if (row.product_id && qtyToReturn > 0) {
          const { data: variants } = (await supabase
            .from('product_variants' as never)
            .select('id, stock')
            .eq('product_id' as never, row.product_id as never)
            .limit(1)) as unknown as {
            data: { id: string; stock: number }[] | null;
          };
          if (variants && variants.length > 0) {
            const variant = variants[0];
            await supabase
              .from('product_variants' as never)
              .update({ stock: variant.stock + qtyToReturn } as never)
              .eq('id' as never, variant.id as never);
          }
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ticket-search'] });
      void queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    },
  });
}
