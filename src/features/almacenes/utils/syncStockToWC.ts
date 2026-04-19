import { supabase } from '@/integrations/supabase/client';

/**
 * Sync stock to WooCommerce for a product.
 * Looks up the WC product ID from product_wc_map and calls the wc-proxy PUT endpoint.
 * Fire-and-forget — does not block the UI.
 */
export async function syncStockToWC(productId: string, newStock: number) {
  try {
    // 1. Look up WC product mapping
    const { data: mapping } = (await supabase
      .from('product_wc_map' as never)
      .select('wc_product_id')
      .eq('product_id' as never, productId as never)
      .single()) as unknown as { data: { wc_product_id: number } | null };

    if (!mapping) return; // Product not mapped to WC — nothing to sync

    // 2. Get auth token for wc-proxy
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 3. Update WooCommerce stock via proxy
    const res = await fetch(`/api/wc-proxy?path=/products/${mapping.wc_product_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        stock_quantity: newStock,
        manage_stock: true,
      }),
    });

    if (!res.ok) {
      console.warn(`[syncStockToWC] WC update failed for product ${productId}:`, await res.text());
    }
  } catch (err) {
    console.warn('[syncStockToWC] Error:', (err as Error).message);
  }
}

/**
 * Check if an almacén is "Página Web" and sync stock to WC if so.
 * Convenience wrapper for use in hooks where almacén name is unknown.
 */
export async function maybeSyncStockToWC(almacenId: string, productId: string, newStock: number) {
  try {
    const { data: alm } = (await supabase
      .from('almacenes' as never)
      .select('nombre')
      .eq('id' as never, almacenId as never)
      .single()) as unknown as { data: { nombre: string } | null };

    if (alm?.nombre === 'Página Web') {
      await syncStockToWC(productId, newStock);
    }
  } catch {
    // silent — WC sync is best-effort
  }
}
