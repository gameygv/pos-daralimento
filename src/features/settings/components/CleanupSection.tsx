import { useState } from 'react';
import { Trash2, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logAction } from '@/features/logs/hooks/useLogs';

interface InactiveProduct {
  id: string;
  name: string;
  sku: string;
  has_sales: boolean;
}

function useInactiveProducts() {
  return useQuery<InactiveProduct[]>({
    queryKey: ['inactive-products-cleanup'],
    queryFn: async () => {
      // Get all inactive products
      const { data: products, error } = (await supabase
        .from('products' as never)
        .select('id, name, sku')
        .eq('is_active' as never, false as never)
        .order('name' as never)) as unknown as {
        data: Array<{ id: string; name: string; sku: string }> | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      if (!products || products.length === 0) return [];

      // Check which ones have sales in vtatkt
      const productIds = products.map((p) => p.id);
      const { data: salesData } = (await supabase
        .from('vtatkt' as never)
        .select('product_id')
        .in('product_id' as never, productIds as never)) as unknown as {
        data: Array<{ product_id: string }> | null;
      };
      const productsWithSales = new Set((salesData ?? []).map((s) => s.product_id));

      return products.map((p) => ({
        ...p,
        has_sales: productsWithSales.has(p.id),
      }));
    },
  });
}

export function CleanupSection() {
  const queryClient = useQueryClient();
  const { data: inactiveProducts = [], isLoading } = useInactiveProducts();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deletable = inactiveProducts.filter((p) => !p.has_sales);
  const protected_ = inactiveProducts.filter((p) => p.has_sales);

  async function handlePurge() {
    setConfirmOpen(false);
    if (deletable.length === 0) return;
    setIsDeleting(true);

    let deleted = 0;
    let errors = 0;

    for (const product of deletable) {
      try {
        // Get variant IDs for this product
        const { data: variants } = (await supabase
          .from('product_variants' as never)
          .select('id')
          .eq('product_id' as never, product.id as never)) as unknown as {
          data: Array<{ id: string }> | null;
        };
        const variantIds = (variants ?? []).map((v) => v.id);

        // Delete related data in order (no FK cascade, manual cleanup)
        if (variantIds.length > 0) {
          await supabase.from('almacen_stock' as never).delete().in('variant_id' as never, variantIds as never);
        }
        await supabase.from('inventory_movements' as never).delete().eq('product_id' as never, product.id as never);
        await supabase.from('kardex' as never).delete().eq('product_id' as never, product.id as never);
        await supabase.from('transferencia_items' as never).delete().eq('product_id' as never, product.id as never);
        await supabase.from('almacen_precios' as never).delete().eq('product_id' as never, product.id as never);
        await supabase.from('product_wc_map' as never).delete().eq('product_id' as never, product.id as never);
        await supabase.from('product_categories' as never).delete().eq('product_id' as never, product.id as never);
        await supabase.from('product_attributes' as never).delete().eq('product_id' as never, product.id as never);
        await supabase.from('product_option_groups' as never).delete().eq('product_id' as never, product.id as never);
        await supabase.from('orden_compra_items' as never).delete().eq('product_id' as never, product.id as never);

        // Delete variants
        if (variantIds.length > 0) {
          await supabase.from('product_variants' as never).delete().eq('product_id' as never, product.id as never);
        }

        // Delete product
        const { error } = await supabase.from('products' as never).delete().eq('id' as never, product.id as never);
        if (error) throw error;

        deleted++;
      } catch (err) {
        console.error(`Error eliminando ${product.name}:`, err);
        errors++;
      }
    }

    logAction('depuracion_productos', {
      eliminados: deleted,
      errores: errors,
      productos: deletable.map((p) => p.name),
    });

    // Invalidate all relevant queries
    void queryClient.invalidateQueries({ queryKey: ['products'] });
    void queryClient.invalidateQueries({ queryKey: ['product-stock'] });
    void queryClient.invalidateQueries({ queryKey: ['all-almacen-stock'] });
    void queryClient.invalidateQueries({ queryKey: ['almacen-stock'] });
    void queryClient.invalidateQueries({ queryKey: ['almacen-precios'] });
    void queryClient.invalidateQueries({ queryKey: ['all-almacen-precios'] });
    void queryClient.invalidateQueries({ queryKey: ['product-wc-map'] });
    void queryClient.invalidateQueries({ queryKey: ['inactive-products-cleanup'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

    if (errors > 0) {
      toast.warning(`${deleted} eliminados, ${errors} con error`);
    } else {
      toast.success(`${deleted} producto${deleted !== 1 ? 's' : ''} eliminado${deleted !== 1 ? 's' : ''} permanentemente`);
    }
    setIsDeleting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          Depuracion de productos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Los productos desactivados ocupan espacio y pueden causar confusión.
          Aquí puedes eliminar permanentemente los que ya no necesitas.
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analizando productos...
          </div>
        ) : inactiveProducts.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            No hay productos desactivados. Todo limpio.
          </div>
        ) : (
          <>
            {/* Deletable products */}
            {deletable.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Se pueden eliminar ({deletable.length}):
                </p>
                <div className="max-h-48 overflow-y-auto rounded border divide-y">
                  {deletable.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{p.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{p.sku}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Protected products */}
            {protected_.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Protegidos — tienen ventas registradas ({protected_.length}):
                </p>
                <div className="max-h-48 overflow-y-auto rounded border divide-y">
                  {protected_.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{p.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        <AlertTriangle className="mr-0.5 h-3 w-3" />
                        Con ventas
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Estos productos no se eliminan para preservar el historial de ventas y reportes.
                </p>
              </div>
            )}

            {deletable.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Eliminar {deletable.length} producto{deletable.length !== 1 ? 's' : ''} permanentemente
              </Button>
            )}
          </>
        )}

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar productos permanentemente</DialogTitle>
              <DialogDescription>
                Se eliminaran {deletable.length} producto{deletable.length !== 1 ? 's' : ''} desactivado{deletable.length !== 1 ? 's' : ''} junto
                con su stock, precios, kardex y datos relacionados.
                Esta accion no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={handlePurge}
              >
                Eliminar permanentemente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
