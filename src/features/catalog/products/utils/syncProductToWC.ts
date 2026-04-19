import { supabase } from '@/integrations/supabase/client';
import { logAction } from '@/features/logs/hooks/useLogs';

interface SyncResult {
  success: boolean;
  message: string;
  wcProductId?: number;
}

/**
 * Sync a POS product to WooCommerce.
 * - If no mapping exists: creates product in WC and saves mapping
 * - If mapping exists and WC product exists: updates it
 * - If mapping exists but WC product was deleted: re-creates and updates mapping
 */
export async function syncProductToWC(productId: string): Promise<SyncResult> {
  // 1. Get product data
  const { data: product } = (await supabase
    .from('products' as never)
    .select('name, sku, slug, description, is_active, image_url, weight_grams, track_stock')
    .eq('id', productId)
    .single()) as unknown as {
    data: {
      name: string; sku: string; slug: string; description: string | null;
      is_active: boolean; image_url: string | null; weight_grams: number | null;
      track_stock: boolean;
    } | null;
  };
  if (!product) return { success: false, message: 'Producto no encontrado' };

  // 2. Get "Página Web" almacén
  const { data: paginaWeb } = (await supabase
    .from('almacenes' as never)
    .select('id')
    .eq('nombre' as never, 'Página Web' as never)
    .single()) as unknown as { data: { id: string } | null };

  // 3. Get prices from "Página Web" almacén
  let precioPublico = 0;
  let precioProveedores = 0;
  if (paginaWeb) {
    const { data: precio } = (await supabase
      .from('almacen_precios' as never)
      .select('precio_publico, precio_proveedores')
      .eq('product_id' as never, productId as never)
      .eq('almacen_id' as never, paginaWeb.id as never)
      .single()) as unknown as {
      data: { precio_publico: number; precio_proveedores: number } | null;
    };
    precioPublico = precio?.precio_publico ?? 0;
    precioProveedores = precio?.precio_proveedores ?? 0;
  }

  // 4. Get stock from "Página Web" almacén
  let stock = 0;
  if (paginaWeb) {
    const { data: variant } = (await supabase
      .from('product_variants' as never)
      .select('id')
      .eq('product_id' as never, productId as never)
      .limit(1)
      .single()) as unknown as { data: { id: string } | null };
    if (variant) {
      const { data: almStock } = (await supabase
        .from('almacen_stock' as never)
        .select('stock')
        .eq('almacen_id' as never, paginaWeb.id as never)
        .eq('variant_id' as never, variant.id as never)
        .single()) as unknown as { data: { stock: number } | null };
      stock = almStock?.stock ?? 0;
    }
  }

  // 5. Get auth token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, message: 'No hay sesion activa' };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };

  // 6. Build WC product payload
  const wcPayload: Record<string, unknown> = {
    name: product.name,
    sku: product.sku,
    slug: product.slug,
    regular_price: String(precioPublico),
    description: product.description ?? '',
    manage_stock: product.track_stock,
    stock_quantity: stock,
    status: product.is_active ? 'publish' : 'draft',
  };

  if (product.weight_grams && product.weight_grams > 0) {
    wcPayload.weight = String(product.weight_grams / 1000);
  }

  if (product.image_url) {
    wcPayload.images = [{ src: product.image_url }];
  }

  // 7. Check existing mapping
  const { data: mapping } = (await supabase
    .from('product_wc_map' as never)
    .select('wc_product_id')
    .eq('product_id' as never, productId as never)
    .single()) as unknown as { data: { wc_product_id: number } | null };

  if (mapping) {
    // Try to update existing WC product
    const res = await fetch(`/api/wc-proxy?path=/products/${mapping.wc_product_id}`, {
      method: 'PUT', headers, body: JSON.stringify(wcPayload),
    });

    if (res.ok) {
      await supabase
        .from('product_wc_map' as never)
        .update({ synced_at: new Date().toISOString(), wc_product_name: product.name })
        .eq('product_id' as never, productId as never);

      logAction('wc_producto_sincronizado', {
        product_id: productId, wc_product_id: mapping.wc_product_id,
        nombre: product.name, accion: 'actualizado',
      });

      return { success: true, message: 'Producto actualizado en WooCommerce', wcProductId: mapping.wc_product_id };
    }

    if (res.status === 404) {
      // Product deleted from WC — remove old mapping, will re-create below
      await supabase
        .from('product_wc_map' as never)
        .delete()
        .eq('product_id' as never, productId as never);
    } else {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { success: false, message: `Error WC: ${(err as { message: string }).message}` };
    }
  }

  // 8. Create new WC product
  const createRes = await fetch('/api/wc-proxy?path=/products', {
    method: 'POST', headers, body: JSON.stringify(wcPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({ message: createRes.statusText }));
    return { success: false, message: `Error al crear en WC: ${(err as { message: string }).message}` };
  }

  const wcProduct = await createRes.json() as { id: number; name: string };

  // 9. Save new mapping
  await supabase
    .from('product_wc_map' as never)
    .insert({
      product_id: productId,
      wc_product_id: wcProduct.id,
      wc_product_name: wcProduct.name,
      synced_at: new Date().toISOString(),
    });

  logAction('wc_producto_sincronizado', {
    product_id: productId, wc_product_id: wcProduct.id,
    nombre: product.name, accion: 'creado',
  });

  return { success: true, message: `Producto creado en WooCommerce (ID: ${wcProduct.id})`, wcProductId: wcProduct.id };
}
