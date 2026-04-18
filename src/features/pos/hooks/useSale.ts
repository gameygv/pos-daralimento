import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getNextCajaFolio } from '@/features/cajas/hooks/useCajas';
import type { CartItem } from '../types';

export type MetodoPago = 'efectivo' | 'tarjeta' | 'credito' | 'transferencia' | 'otros' | 'regalo';

interface SplitPaymentEntry {
  method: MetodoPago;
  amount: number;
}

interface CreateSaleParams {
  items: CartItem[];
  metodoPago: MetodoPago;
  seller: string;
  cliente: string;
  cajaId?: string | null;
  cajaSessionId?: string | null;
  globalDiscountPct?: number;
  splitPayments?: SplitPaymentEntry[];
}

interface SaleResult {
  folio: number;
  folioDisplay: string;
  total: number;
  items: number;
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation<SaleResult, Error, CreateSaleParams>({
    mutationFn: async ({ items, metodoPago, seller, cliente, cajaId, cajaSessionId, globalDiscountPct = 0, splitPayments }) => {
      let nextFolio: number;
      let folioDisplay: string;

      if (cajaId) {
        // Per-caja folio numbering
        const cajaFolio = await getNextCajaFolio(cajaId);
        nextFolio = cajaFolio.folio;
        folioDisplay = cajaFolio.folioDisplay;
      } else {
        // Fallback: legacy global folio from pvcntl
        const { data: ctrl, error: ctrlErr } = (await supabase
          .from('pvcntl' as never)
          .select('foliotkt')
          .limit(1)
          .single()) as unknown as {
          data: { foliotkt: number } | null;
          error: { message: string } | null;
        };
        if (ctrlErr) throw new Error(ctrlErr.message);
        nextFolio = (ctrl?.foliotkt ?? 0) + 1;
        folioDisplay = `${nextFolio}`;

        // Update pvcntl.foliotkt
        const { error: updateErr } = (await supabase
          .from('pvcntl' as never)
          .update({ foliotkt: nextFolio } as never)
          .eq('id' as never, 1 as never)) as unknown as {
          error: { message: string } | null;
        };
        if (updateErr) throw new Error(updateErr.message);
      }

      const now = new Date();
      const fecha = now.toISOString().split('T')[0];
      const hora = now.toTimeString().split(' ')[0];

      // Build metodo_pago string: single method or split format "efectivo|200,tarjeta|150"
      const metodoPagoStr = splitPayments
        ? splitPayments.map((sp) => `${sp.method}|${sp.amount.toFixed(2)}`).join(',')
        : metodoPago;

      // Insert all cart items into vtatkt
      const rows = items.map((item) => {
        const lineGross = item.price * item.quantity;
        const itemDiscountAmt = lineGross * (item.discountPct / 100);
        const afterItem = lineGross - itemDiscountAmt;
        const globalDiscountAmt = afterItem * (globalDiscountPct / 100);
        const totalDiscountPerUnit =
          item.quantity > 0
            ? (itemDiscountAmt + globalDiscountAmt) / item.quantity
            : 0;
        return {
        fecha,
        hora,
        vende: seller,
        folio: nextFolio,
        folio_display: folioDisplay,
        can: item.quantity,
        art: item.sku || item.name,
        prec: item.price,
        cost: item.cost ?? 0,
        descue: Math.round(totalDiscountPerUnit * 100) / 100,
        comici: 0,
        yareg: 'S',
        cliente,
        status: 'VENDIDO',
        metodo_pago: metodoPagoStr,
        product_id: item.id || null,
        ...(cajaId ? { caja_id: cajaId } : {}),
        ...(cajaSessionId ? { caja_session_id: cajaSessionId } : {}),
      };
      });

      const { error: insertErr } = (await supabase
        .from('vtatkt' as never)
        .insert(rows as never)) as unknown as {
        error: { message: string } | null;
      };
      if (insertErr) throw new Error(insertErr.message);

      // Discount stock from product_variants for products that track stock
      for (const item of items) {
        if (!item.id) continue;
        const { data: variants } = (await supabase
          .from('product_variants' as never)
          .select('id, stock')
          .eq('product_id' as never, item.id as never)
          .limit(1)) as unknown as {
          data: { id: string; stock: number }[] | null;
        };
        if (variants && variants.length > 0) {
          const variant = variants[0];
          const newStock = Math.max(0, variant.stock - item.quantity);
          await supabase
            .from('product_variants' as never)
            .update({ stock: newStock } as never)
            .eq('id' as never, variant.id as never);
        }
      }

      const total = items.reduce((sum, i) => {
        const lineGross = i.price * i.quantity;
        const itemDisc = lineGross * (i.discountPct / 100);
        const afterItem = lineGross - itemDisc;
        const globalDisc = afterItem * (globalDiscountPct / 100);
        return sum + afterItem - globalDisc;
      }, 0);

      return {
        folio: nextFolio,
        folioDisplay,
        total,
        items: items.reduce((sum, i) => sum + i.quantity, 0),
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
