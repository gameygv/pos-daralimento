import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Webhook endpoint called by WooCommerce when an order is completed/processing.
 *
 * Flow:
 * 1. Validate & deduplicate (skip if nota with same folio_display exists)
 * 2. Auto-create/find POS customer from WC customer
 * 3. Reduce stock in almacen_stock for "Página Web"
 * 4. Record kardex entries
 * 5. Recalculate product_variants.stock totals
 * 6. Create vtatkt items + nota + nota_pagos
 * 7. Send WhatsApp notification (if enabled)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // WooCommerce sends a ping on webhook creation — acknowledge it
  const wcWebhookTopic = req.headers['x-wc-webhook-topic'] as string;
  if (!wcWebhookTopic) {
    return res.status(200).json({ ok: true, message: 'pong' });
  }

  // Only process order events
  if (!['order.completed', 'order.updated', 'order.created'].includes(wcWebhookTopic)) {
    return res.status(200).json({ ok: true, message: `Ignored topic: ${wcWebhookTopic}` });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const order = req.body;
    if (!order || !order.line_items) {
      return res.status(200).json({ ok: true, message: 'No line items' });
    }

    // Only process completed/processing orders
    if (!['completed', 'processing'].includes(order.status)) {
      return res.status(200).json({ ok: true, message: `Order status ${order.status} ignored` });
    }

    const orderNumber = order.number || order.id;
    const folioDisplay = `WC-${orderNumber}`;

    // ── Idempotency: skip if this order was already processed ──
    const { data: existingNota } = await supabase
      .from('notas')
      .select('id')
      .eq('folio_display', folioDisplay)
      .maybeSingle();

    if (existingNota) {
      return res.status(200).json({ ok: true, message: `Order ${orderNumber} already processed`, nota_id: existingNota.id });
    }

    // ── Find the "Página Web" almacén ──
    const { data: almacen } = await supabase
      .from('almacenes')
      .select('id')
      .eq('nombre', 'Página Web')
      .single();

    if (!almacen) {
      return res.status(200).json({ ok: false, message: 'Almacén Página Web not found' });
    }

    // ── Auto-sync customer ──
    let clienteId: string | null = null;
    const wcCustomerId = order.customer_id as number | undefined;
    const billing = order.billing as Record<string, string> | undefined;
    const wcName = billing
      ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim()
      : '';
    const wcEmail = billing?.email || '';
    const clienteName = wcName || 'Cliente WooCommerce';

    if (wcCustomerId && wcCustomerId > 0) {
      const { data: existingMap } = await supabase
        .from('client_wc_map')
        .select('cliente_id')
        .eq('wc_customer_id', wcCustomerId)
        .maybeSingle();

      if (existingMap) {
        clienteId = existingMap.cliente_id;
      } else if (wcName) {
        let posClient = null;
        if (wcEmail) {
          const { data: byEmail } = await supabase
            .from('clientes')
            .select('id')
            .eq('email', wcEmail)
            .limit(1)
            .maybeSingle();
          posClient = byEmail;
        }

        if (!posClient) {
          const { data: newClient } = await supabase
            .from('clientes')
            .insert({
              nombre: wcName,
              email: wcEmail || null,
              telefono: billing?.phone || null,
            })
            .select('id')
            .single();
          posClient = newClient;
        }

        if (posClient) {
          clienteId = posClient.id;
          await supabase.from('client_wc_map').insert({
            cliente_id: posClient.id,
            wc_customer_id: wcCustomerId,
            wc_customer_name: wcName,
            wc_customer_email: wcEmail,
          });
        }
      }
    }

    // ── Process each line item: reduce stock + kardex ──
    const results: Array<{ wc_product_id: number; status: string }> = [];
    const variantsToRecalc: string[] = [];

    for (const item of order.line_items) {
      const wcProductId = item.product_id;
      const quantity = item.quantity || 1;

      const { data: mapping } = await supabase
        .from('product_wc_map')
        .select('product_id')
        .eq('wc_product_id', wcProductId)
        .maybeSingle();

      if (!mapping) {
        results.push({ wc_product_id: wcProductId, status: 'not_mapped' });
        continue;
      }

      const { data: variant } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', mapping.product_id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!variant) {
        results.push({ wc_product_id: wcProductId, status: 'no_variant' });
        continue;
      }

      // Get current stock
      const { data: currentStock } = await supabase
        .from('almacen_stock')
        .select('stock')
        .eq('almacen_id', almacen.id)
        .eq('variant_id', variant.id)
        .maybeSingle();

      const prevStock = currentStock?.stock ?? 0;
      const newStock = Math.max(0, prevStock - quantity);

      // Upsert almacen_stock
      await supabase
        .from('almacen_stock')
        .upsert({
          almacen_id: almacen.id,
          variant_id: variant.id,
          stock: newStock,
        }, { onConflict: 'almacen_id,variant_id' });

      // Record in kardex
      await supabase
        .from('kardex')
        .insert({
          almacen_id: almacen.id,
          variant_id: variant.id,
          product_id: mapping.product_id,
          tipo: 'venta',
          cantidad: quantity,
          stock_anterior: prevStock,
          stock_nuevo: newStock,
          comentario: `Orden WooCommerce #${orderNumber}`,
          created_by_name: 'WooCommerce',
        });

      variantsToRecalc.push(variant.id);
      results.push({ wc_product_id: wcProductId, status: 'stock_updated' });
    }

    // ── Recalculate product_variants.stock totals ──
    for (const variantId of [...new Set(variantsToRecalc)]) {
      const { data: allStocks } = await supabase
        .from('almacen_stock')
        .select('stock')
        .eq('variant_id', variantId);
      const totalStock = (allStocks ?? []).reduce((s: number, r: { stock: number }) => s + r.stock, 0);
      await supabase
        .from('product_variants')
        .update({ stock: totalStock })
        .eq('id', variantId);
    }

    // ── Create nota + vtatkt ──
    const orderTotal = parseFloat(order.total as string) || 0;
    const paymentMethod = (order.payment_method_title as string) || 'WooCommerce';
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0];
    const isPaid = ['completed', 'processing'].includes(order.status);
    const now = new Date().toISOString();

    // Get next folio
    const { data: ctrl } = await supabase
      .from('pvcntl')
      .select('foliotkt')
      .single();
    const nextFolio = ((ctrl as Record<string, unknown>)?.foliotkt as number ?? 0) + 1;

    // Insert vtatkt items
    const vtaRows = [];
    for (const item of order.line_items) {
      const wcProductId = item.product_id;
      const { data: mapping } = await supabase
        .from('product_wc_map')
        .select('product_id')
        .eq('wc_product_id', wcProductId)
        .maybeSingle();

      vtaRows.push({
        fecha,
        hora,
        vende: 'WooCommerce',
        folio: nextFolio,
        folio_display: folioDisplay,
        can: item.quantity || 1,
        art: item.name || `WC Product ${wcProductId}`,
        prec: parseFloat(item.price) || 0,
        cost: 0,
        descue: 0,
        comici: 0,
        cliente: clienteName,
        status: 'VENDIDO',
        metodo_pago: 'transferencia',
        product_id: mapping?.product_id || null,
      });
    }

    if (vtaRows.length > 0) {
      await supabase.from('vtatkt').insert(vtaRows);
    }

    // Create nota
    const { data: newNota } = await supabase.from('notas').insert({
      folio: nextFolio,
      folio_display: folioDisplay,
      fecha,
      hora,
      cliente: clienteName,
      vendedor: 'WooCommerce',
      total: orderTotal,
      pagado: isPaid ? orderTotal : 0,
      metodo_pago: 'transferencia',
      pago_status: isPaid ? 'pagado' : 'pendiente',
      pagado_at: isPaid ? now : null,
      entrega_status: 'sin_entregar',
      notas_pago: `Orden WooCommerce #${orderNumber} — ${paymentMethod}`,
      almacen_id: almacen.id,
    }).select('id, entrega_token').single();

    // Create nota_pagos record if paid
    if (isPaid && newNota) {
      await supabase.from('nota_pagos').insert({
        nota_id: newNota.id,
        monto: orderTotal,
        metodo_pago: 'transferencia',
        referencia: `WC #${orderNumber}`,
      });
    }

    // Update folio counter
    await supabase
      .from('pvcntl')
      .update({ foliotkt: nextFolio })
      .eq('id', 1);

    // ── Send WhatsApp notification (server-side, direct to Green API) ──
    try {
      const { data: waConfig } = await supabase
        .from('whatsapp_config')
        .select('enabled, chat_id')
        .eq('id', 1)
        .single();

      if (waConfig?.enabled && waConfig.chat_id) {
        const GREEN_API_URL = process.env.GREEN_API_URL;
        const GREEN_INSTANCE = process.env.GREEN_API_INSTANCE;
        const GREEN_TOKEN = process.env.GREEN_API_TOKEN;

        if (GREEN_API_URL && GREEN_INSTANCE && GREEN_TOKEN) {
          const entregaUrl = `https://pos.daralimento.com/entrega/${newNota?.entrega_token ?? ''}`;
          const totalFormatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(orderTotal);

          const itemLines = order.line_items
            .map((i: { quantity: number; name: string; price: string }) =>
              `  • ${i.quantity || 1}x ${i.name} — $${(parseFloat(i.price) * (i.quantity || 1)).toFixed(2)}`
            )
            .join('\n');

          const message = [
            `🛒 *Nueva venta WooCommerce - Nota #${folioDisplay}*`,
            '',
            `👤 Cliente: ${clienteName}`,
            `🌐 Origen: Página Web`,
            '',
            ...(itemLines ? ['📦 *Productos:*', itemLines, ''] : []),
            `💰 *Total: ${totalFormatted}*`,
            `💳 Pago: ${isPaid ? '✅ Pagado' : '⏳ Pendiente'} (${paymentMethod})`,
            '',
            `📋 *Confirmar entrega:*`,
            entregaUrl,
          ].join('\n');

          await fetch(`${GREEN_API_URL}/waInstance${GREEN_INSTANCE}/sendMessage/${GREEN_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: waConfig.chat_id, message }),
          });
        }
      }
    } catch {
      // WhatsApp is fire-and-forget — never block the webhook response
    }

    // ── Audit log ──
    await supabase.from('audit_log').insert({
      action: 'wc_orden_recibida',
      details: JSON.stringify({
        order_number: orderNumber,
        folio: nextFolio,
        total: orderTotal,
        cliente: clienteName,
        items: results.length,
        status: order.status,
      }),
    }).then(() => {});

    return res.status(200).json({
      ok: true,
      order_id: order.id,
      order_number: orderNumber,
      folio: nextFolio,
      nota_id: newNota?.id,
      results,
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
}
