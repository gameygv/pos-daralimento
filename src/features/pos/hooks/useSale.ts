import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getNextCajaFolio } from '@/features/cajas/hooks/useCajas';
import { logAction } from '@/features/logs/hooks/useLogs';
import { sendWhatsAppMessage } from '@/features/whatsapp/sendWhatsApp';
import type { CartItem } from '../types';

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'trueque' | 'regalo';

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
  paymentNote?: string;
  almacenId?: string | null;
}

interface SaleResult {
  folio: number;
  folioDisplay: string;
  total: number;
  items: number;
  notaId: string;
  entregaToken: string;
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation<SaleResult, Error, CreateSaleParams>({
    mutationFn: async ({ items, metodoPago, seller, cliente, cajaId, cajaSessionId, globalDiscountPct = 0, splitPayments, paymentNote, almacenId }) => {
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

      // Check stock for products that track inventory
      for (const item of items) {
        if (!item.id) continue;
        const { data: prod } = (await supabase
          .from('products' as never)
          .select('track_stock, name')
          .eq('id' as never, item.id as never)
          .maybeSingle()) as unknown as { data: { track_stock: boolean; name: string } | null };
        if (prod && prod.track_stock) {
          const { data: variant } = (await supabase
            .from('product_variants' as never)
            .select('stock')
            .eq('product_id' as never, item.id as never)
            .maybeSingle()) as unknown as { data: { stock: number } | null };
          if (variant && variant.stock < item.quantity) {
            throw new Error(`Sin existencia de "${prod.name}". Stock: ${variant.stock}, solicitado: ${item.quantity}`);
          }
        }
      }

      // Validate product IDs exist before inserting
      const productIds = items.map((i) => i.id).filter(Boolean);
      const { data: validProducts } = productIds.length > 0
        ? (await supabase
            .from('products' as never)
            .select('id')
            .in('id' as never, productIds as never)) as unknown as { data: Array<{ id: string }> | null }
        : { data: [] as Array<{ id: string }> };
      const validProductIds = new Set((validProducts ?? []).map((p) => p.id));

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
        art: item.name || item.sku,
        prec: item.price,
        cost: item.cost ?? 0,
        descue: Math.round(totalDiscountPerUnit * 100) / 100,
        comici: 0,
        yareg: 'S',
        cliente,
        status: 'VENDIDO',
        metodo_pago: metodoPagoStr,
        product_id: (item.id && validProductIds.has(item.id)) ? item.id : null,
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

      const roundedTotal = Math.round(total * 100) / 100;

      // Determine if this sale is paid (has splitPayments or is not a CxC)
      const isCxC = paymentNote?.includes('Cuenta por cobrar');
      const isPaid = !isCxC && (splitPayments ? splitPayments.reduce((s, p) => s + p.amount, 0) >= roundedTotal - 0.01 : true);

      // Create nota de venta
      const { data: nota, error: notaErr } = (await supabase
        .from('notas' as never)
        .insert({
          folio: nextFolio,
          folio_display: folioDisplay,
          fecha,
          hora,
          cliente,
          vendedor: seller,
          total: roundedTotal,
          metodo_pago: metodoPagoStr,
          pago_status: isPaid ? 'pagado' : 'pendiente',
          pagado: isPaid ? roundedTotal : 0,
          pagado_at: isPaid ? new Date().toISOString() : null,
          entrega_status: 'sin_entregar',
          ...(paymentNote ? { notas_pago: paymentNote } : {}),
          ...(almacenId ? { almacen_id: almacenId } : {}),
          ...(cajaId ? { caja_id: cajaId } : {}),
          ...(cajaSessionId ? { caja_session_id: cajaSessionId } : {}),
        } as never)
        .select('id, entrega_token')
        .single()) as unknown as {
        data: { id: string; entrega_token: string } | null;
        error: { message: string } | null;
      };
      if (notaErr) throw new Error(notaErr.message);

      // Register payment(s) in nota_pagos
      if (nota?.id && isPaid) {
        if (splitPayments && splitPayments.length > 0) {
          // Split payments — one record per method
          for (const sp of splitPayments) {
            await supabase.from('nota_pagos' as never).insert({
              nota_id: nota.id,
              monto: sp.amount,
              metodo_pago: sp.method,
              nota: null,
              created_by_name: seller,
            });
          }
        } else {
          // Single payment
          await supabase.from('nota_pagos' as never).insert({
            nota_id: nota.id,
            monto: roundedTotal,
            metodo_pago: metodoPago,
            nota: null,
            created_by_name: seller,
          });
        }
      }

      // Fire-and-forget: send WhatsApp notification if enabled
      if (nota?.id) {
        sendWhatsAppSaleNotification({
          folioDisplay,
          cliente,
          seller,
          total: roundedTotal,
          isPaid,
          entregaToken: nota.entrega_token,
          items: items.map((i) => ({ name: i.name || i.sku, quantity: i.quantity, price: i.price })),
        }).catch(() => {}); // never block the sale
      }

      return {
        folio: nextFolio,
        folioDisplay,
        total: roundedTotal,
        items: items.reduce((sum, i) => sum + i.quantity, 0),
        notaId: nota?.id ?? '',
        entregaToken: nota?.entrega_token ?? '',
      };
    },
    onSuccess: (result) => {
      logAction('venta', { folio: result.folio, folioDisplay: result.folioDisplay, total: result.total, items: result.items });
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      void queryClient.invalidateQueries({ queryKey: ['notas'] });
    },
  });
}

// ─── WhatsApp auto-notification (fire-and-forget) ─────

async function sendWhatsAppSaleNotification(params: {
  folioDisplay: string;
  cliente: string;
  seller: string;
  total: number;
  isPaid: boolean;
  entregaToken: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}) {
  // Check if WhatsApp notifications are enabled
  const { data: waConfig } = (await supabase
    .from('whatsapp_config' as never)
    .select('enabled, chat_id')
    .eq('id', 1)
    .single()) as unknown as { data: { enabled: boolean; chat_id: string | null } | null };

  if (!waConfig?.enabled || !waConfig.chat_id) {
    console.log('[WhatsApp] Notificacion desactivada o sin destino', { enabled: waConfig?.enabled, chatId: waConfig?.chat_id });
    return;
  }

  const entregaUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://pos.daralimento.com'}/entrega/${params.entregaToken}`;
  const totalFormatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(params.total);

  const itemLines = params.items
    .map((i) => `  • ${i.quantity}x ${i.name} — $${(i.price * i.quantity).toFixed(2)}`)
    .join('\n');

  const message = [
    `🛒 *Nueva venta - Nota #${params.folioDisplay}*`,
    '',
    `👤 Cliente: ${params.cliente}`,
    `🧑‍💼 Vendedor: ${params.seller}`,
    '',
    ...(itemLines ? ['📦 *Productos:*', itemLines, ''] : []),
    `💰 *Total: ${totalFormatted}*`,
    `💳 Pago: ${params.isPaid ? '✅ Pagado' : '⏳ Pendiente'}`,
    '',
    `📋 *Confirmar entrega:*`,
    entregaUrl,
  ].join('\n');

  await sendWhatsAppMessage({ chatId: waConfig.chat_id, message });
}
