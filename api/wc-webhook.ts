import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Webhook endpoint called by WooCommerce when an order is completed.
 * Updates almacen_stock for the "Página Web" almacén.
 *
 * WordPress calls: POST /api/wc-webhook
 * Body: WooCommerce order payload (standard webhook format)
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

  // Only process order.completed and order.updated
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

    // Find the "Página Web" almacén
    const { data: almacen } = await supabase
      .from('almacenes')
      .select('id')
      .eq('nombre', 'Página Web')
      .single();

    if (!almacen) {
      return res.status(200).json({ ok: false, message: 'Almacén Página Web not found' });
    }

    // Auto-sync customer: find or create POS client from WC customer
    let clienteId: string | null = null;
    const wcCustomerId = (order as Record<string, unknown>).customer_id as number | undefined;
    const billing = (order as Record<string, unknown>).billing as Record<string, string> | undefined;
    const wcName = billing
      ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim()
      : '';
    const wcEmail = billing?.email || '';

    if (wcCustomerId && wcCustomerId > 0) {
      // Check if already mapped
      const { data: existingMap } = await supabase
        .from('client_wc_map')
        .select('cliente_id')
        .eq('wc_customer_id', wcCustomerId)
        .maybeSingle();

      if (existingMap) {
        clienteId = existingMap.cliente_id;
      } else if (wcName) {
        // Check if a POS client with matching email exists
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
          // Create new POS client
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
          // Create mapping
          await supabase.from('client_wc_map').insert({
            cliente_id: posClient.id,
            wc_customer_id: wcCustomerId,
            wc_customer_name: wcName,
            wc_customer_email: wcEmail,
          });
        }
      }
    }

    // Process each line item
    const results: Array<{ wc_product_id: number; status: string }> = [];

    for (const item of order.line_items) {
      const wcProductId = item.product_id;
      const quantity = item.quantity || 1;

      // Find POS product mapping
      const { data: mapping } = await supabase
        .from('product_wc_map')
        .select('product_id')
        .eq('wc_product_id', wcProductId)
        .maybeSingle();

      if (!mapping) {
        results.push({ wc_product_id: wcProductId, status: 'not_mapped' });
        continue;
      }

      // Find variant for this product
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

      // Get current almacen stock
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
          comentario: `Orden WooCommerce #${order.number || order.id}`,
          created_by_name: 'WooCommerce',
        });

      results.push({ wc_product_id: wcProductId, status: 'stock_updated' });
    }

    // Create nota + vtatkt items for this WC order
    const orderTotal = parseFloat((order as Record<string, unknown>).total as string) || 0;
    const orderNumber = (order as Record<string, unknown>).number || (order as Record<string, unknown>).id;
    const paymentMethod = (order as Record<string, unknown>).payment_method_title as string || 'WooCommerce';
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0];
    const clienteName = wcName || 'Cliente WooCommerce';

    // Get next folio
    const { data: ctrl } = await supabase
      .from('pvcntl')
      .select('foliotkt')
      .single();
    const nextFolio = ((ctrl as Record<string, unknown>)?.foliotkt as number ?? 0) + 1;
    const folioDisplay = `WC-${orderNumber}`;

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
    const isPaid = ['completed', 'processing'].includes(order.status);
    await supabase.from('notas').insert({
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
      entrega_status: 'sin_entregar',
      notas_pago: `Orden WooCommerce #${orderNumber} — ${paymentMethod}`,
    });

    // Update folio counter
    await supabase
      .from('pvcntl')
      .update({ foliotkt: nextFolio })
      .eq('id', 1);

    return res.status(200).json({
      ok: true,
      order_id: order.id,
      order_number: order.number,
      folio: nextFolio,
      results,
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
}
