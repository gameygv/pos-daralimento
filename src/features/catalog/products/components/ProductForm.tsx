import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { productFormSchema, type ProductFormValues } from '../schemas/product.schema';
import { useProductById, useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { useCategoryList } from '@/features/catalog/categories';
import { slugify } from '@/features/catalog/categories/utils/slugify';
import { ImageUpload } from '@/components/ImageUpload';
import type { ProductInsert } from '@/integrations/supabase/catalog-types';
import { useAlmacenes, useProductAlmacenPrecios, useUpsertAlmacenPrecio, useAdjustAlmacenStock } from '@/features/almacenes/hooks/useAlmacenes';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from 'sonner';
import { logAction } from '@/features/logs/hooks/useLogs';
import { syncStockToWC } from '@/features/almacenes/utils/syncStockToWC';
import { syncProductToWC } from '../utils/syncProductToWC';
import { RefreshCw } from 'lucide-react';

function useProductAlmacenStock(productId: string | null) {
  return useQuery<Array<{ almacen_id: string; stock: number }>>({
    queryKey: ['product-almacen-stock', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = (await supabase
        .from('almacen_stock' as never)
        .select('almacen_id, stock, product_variants!inner(product_id)')
        .eq('product_variants.product_id' as never, productId as never)) as unknown as {
        data: Array<{ almacen_id: string; stock: number }> | null;
        error: { message: string } | null;
      };
      if (error) {
        // Fallback: query via variant
        const { data: variant } = (await supabase
          .from('product_variants' as never)
          .select('id')
          .eq('product_id' as never, productId as never)
          .limit(1)
          .single()) as unknown as { data: { id: string } | null };
        if (!variant) return [];
        const { data: stocks } = (await supabase
          .from('almacen_stock' as never)
          .select('almacen_id, stock')
          .eq('variant_id' as never, variant.id as never)) as unknown as {
          data: Array<{ almacen_id: string; stock: number }> | null;
        };
        return stocks ?? [];
      }
      return data ?? [];
    },
    enabled: !!productId,
  });
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null; // null = create mode
}

const NONE_VALUE = '__none__';

function skuFromName(name: string): string {
  return slugify(name).toUpperCase().replace(/-/g, '-').slice(0, 20);
}

export function ProductForm({ open, onOpenChange, productId }: ProductFormProps) {
  const isEditing = productId !== null;
  const { data: existingProduct } = useProductById(isEditing ? productId : null);
  const { data: categories = [] } = useCategoryList();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: almacenes = [] } = useAlmacenes();
  const { data: productPrecios = [] } = useProductAlmacenPrecios(isEditing ? productId : null);
  const { data: productStocks = [] } = useProductAlmacenStock(isEditing ? productId : null);
  const upsertPrecio = useUpsertAlmacenPrecio();
  const adjustStock = useAdjustAlmacenStock();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const [isSyncingWC, setIsSyncingWC] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      sku: '',
      slug: '',
      barcode: null,
      product_type: 'physical',
      category_id: null,
      base_price: 0,
      precio_mayoreo: 0,
      cost: null,
      weight_grams: null,
      tax_rate: 0.16,
      description: null,
      is_active: true,
      track_stock: true,
      image_url: null,
      metadata: null,
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (isEditing && existingProduct) {
        form.reset({
          name: (existingProduct as Record<string, unknown>).name as string,
          sku: (existingProduct as Record<string, unknown>).sku as string,
          slug: (existingProduct as Record<string, unknown>).slug as string,
          barcode: ((existingProduct as Record<string, unknown>).barcode as string | null) ?? null,
          product_type: (existingProduct as Record<string, unknown>).product_type as ProductFormValues['product_type'],
          category_id: ((existingProduct as Record<string, unknown>).category_id as string | null) ?? null,
          base_price: (existingProduct as Record<string, unknown>).base_price as number,
          precio_mayoreo: ((existingProduct as Record<string, unknown>).precio_mayoreo as number) ?? 0,
          cost: ((existingProduct as Record<string, unknown>).cost as number | null) ?? null,
          weight_grams: ((existingProduct as Record<string, unknown>).weight_grams as number | null) ?? null,
          tax_rate: (existingProduct as Record<string, unknown>).tax_rate as number,
          description: ((existingProduct as Record<string, unknown>).description as string | null) ?? null,
          is_active: (existingProduct as Record<string, unknown>).is_active as boolean,
          track_stock: (existingProduct as Record<string, unknown>).track_stock as boolean,
          image_url: ((existingProduct as Record<string, unknown>).image_url as string | null) ?? null,
          metadata: ((existingProduct as Record<string, unknown>).metadata as Record<string, unknown> | null) ?? null,
        });
      } else if (!isEditing) {
        form.reset({
          name: '',
          sku: '',
          slug: '',
          barcode: null,
          product_type: 'physical',
          category_id: null,
          base_price: 0,
          precio_mayoreo: 0,
          cost: null,
          weight_grams: null,
          tax_rate: 0.16,
          description: null,
          is_active: true,
          track_stock: true,
          image_url: null,
          metadata: null,
        });
      }
    }
  }, [open, isEditing, existingProduct, form]);

  // Multi-category state
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(new Set());

  // Load existing product categories on edit
  useEffect(() => {
    if (open && isEditing && productId) {
      supabase
        .from('product_categories' as never)
        .select('category_id')
        .eq('product_id' as never, productId as never)
        .then(({ data }) => {
          const rows = (data ?? []) as Array<{ category_id: string }>;
          setSelectedCatIds(new Set(rows.map((r) => r.category_id)));
        });
    } else if (open && !isEditing) {
      setSelectedCatIds(new Set());
    }
  }, [open, isEditing, productId]);

  function toggleCategory(catId: string) {
    setSelectedCatIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  // Auto-generate slug and SKU from name (only when creating)
  const watchName = form.watch('name');
  useEffect(() => {
    if (!isEditing && watchName) {
      const currentSlug = form.getValues('slug');
      const expectedSlug = slugify(watchName);
      // Only auto-update if user hasn't manually edited the slug
      if (currentSlug === '' || currentSlug === slugify(watchName.slice(0, -1) || '')) {
        form.setValue('slug', expectedSlug);
      }
      const currentSku = form.getValues('sku');
      if (currentSku === '' || currentSku === skuFromName(watchName.slice(0, -1) || '')) {
        form.setValue('sku', skuFromName(watchName));
      }
    }
  }, [watchName, isEditing, form]);


  async function onSubmit(values: ProductFormValues) {
    try {
      // Set primary category_id to first selected category (for backwards compat)
      const catArray = [...selectedCatIds];
      values.category_id = catArray[0] ?? null;

      let savedProductId = productId;
      if (isEditing && productId) {
        await updateMutation.mutateAsync({ id: productId, ...values } as { id: string } & Partial<ProductInsert>);
        logAction('producto_actualizado', {
          product_id: productId,
          nombre: values.name,
          base_price: values.base_price,
          precio_mayoreo: values.precio_mayoreo,
          cost: values.cost,
        });
      } else {
        const result = await createMutation.mutateAsync(values as ProductInsert);
        savedProductId = (result as { id: string } | null)?.id ?? null;
        logAction('producto_creado', {
          product_id: savedProductId,
          nombre: values.name,
          base_price: values.base_price,
        });
      }

      // Save multi-categories
      if (savedProductId) {
        // Delete existing and re-insert
        await supabase.from('product_categories' as never).delete().eq('product_id' as never, savedProductId as never);
        if (catArray.length > 0) {
          await supabase.from('product_categories' as never).insert(
            catArray.map((cid) => ({ product_id: savedProductId, category_id: cid }))
          );
        }
      }

      toast.success(isEditing ? 'Producto actualizado' : 'Producto creado');
      onOpenChange(false);
    } catch (err) {
      toast.error(`Error al guardar: ${(err as Error).message}`);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            {isEditing && productId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSyncingWC}
                onClick={async () => {
                  setIsSyncingWC(true);
                  try {
                    const result = await syncProductToWC(productId);
                    if (result.success) {
                      toast.success(result.message);
                    } else {
                      toast.error(result.message);
                    }
                  } catch (err) {
                    toast.error(`Error: ${(err as Error).message}`);
                  }
                  setIsSyncingWC(false);
                }}
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSyncingWC ? 'animate-spin' : ''}`} />
                {isSyncingWC ? 'Sincronizando...' : 'Sincronizar con WooCommerce'}
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Información básica
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" {...form.register('name')} placeholder="Ej: Cuenco rústico" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" {...form.register('sku')} placeholder="CNC-001" />
                {form.formState.errors.sku && (
                  <p className="text-sm text-destructive">{form.formState.errors.sku.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...form.register('slug')} placeholder="cuenco-rustico" />
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de barras</Label>
                <Input id="barcode" {...form.register('barcode')} placeholder="Opcional" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 2: Categories (multi-select) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Categorías
            </h3>
            <div className="max-h-[200px] overflow-y-auto rounded border p-2 space-y-1">
              {categories
                .filter((c) => !c.parent_id)
                .map((parent) => (
                  <div key={parent.id}>
                    <label className="flex items-center gap-2 rounded px-2 py-1 text-sm font-semibold hover:bg-muted/50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-teal-600"
                        checked={selectedCatIds.has(parent.id)}
                        onChange={() => toggleCategory(parent.id)}
                      />
                      {parent.name}
                    </label>
                    {categories
                      .filter((c) => c.parent_id === parent.id)
                      .map((child) => (
                        <label key={child.id} className="flex items-center gap-2 rounded px-2 py-1 pl-7 text-sm hover:bg-muted/50 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-teal-600"
                            checked={selectedCatIds.has(child.id)}
                            onChange={() => toggleCategory(child.id)}
                          />
                          {child.name}
                        </label>
                      ))}
                  </div>
                ))}
            </div>
            {selectedCatIds.size > 0 && (
              <p className="text-xs text-muted-foreground">{selectedCatIds.size} categoría{selectedCatIds.size !== 1 ? 's' : ''} seleccionada{selectedCatIds.size !== 1 ? 's' : ''}</p>
            )}
          </div>

          <Separator />

          {/* Section 3: Weight */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Peso
            </h3>
            <div className="space-y-2">
              <Label htmlFor="weight_grams">Peso (gramos)</Label>
              <Input
                id="weight_grams"
                type="number"
                step="1"
                min="0"
                {...form.register('weight_grams')}
                placeholder="Ej: 500"
              />
            </div>
            {!isEditing && (
              <p className="text-xs text-muted-foreground">
                Los precios se configuran por Punto de Venta despues de crear el producto.
              </p>
            )}
          </div>

          {/* Section: Precios por Punto de Venta (edit mode only) */}
          {isEditing && productId && almacenes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Inventario y Precios por Punto de Venta
                </h3>
                <div className="rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-1.5 text-left text-xs font-medium">Punto de Venta</th>
                        <th className="px-3 py-1.5 text-center text-xs font-medium">Stock</th>
                        <th className="px-3 py-1.5 text-right text-xs font-medium">P. Publico</th>
                        <th className="px-3 py-1.5 text-right text-xs font-medium">P. Proveedores</th>
                        <th className="px-3 py-1.5 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {almacenes.map((alm) => {
                        const existingPrecio = productPrecios.find((p) => p.almacen_id === alm.id);
                        const existingStock = productStocks.find((s) => s.almacen_id === alm.id);
                        // Key includes data to force re-render when async data arrives
                        const rowKey = `${alm.id}-${existingStock?.stock ?? 'x'}-${existingPrecio?.precio_publico ?? 'x'}`;
                        return (
                          <tr key={rowKey}>
                            <td className="px-3 py-1.5 font-medium text-xs">{alm.nombre}</td>
                            <td className="px-3 py-1.5 text-center">
                              <Input
                                type="number"
                                min="0"
                                className="mx-auto h-7 w-16 text-center text-xs"
                                defaultValue={existingStock?.stock ?? 0}
                                id={`alm-stock-${alm.id}`}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="ml-auto h-7 w-24 text-right text-xs"
                                defaultValue={existingPrecio?.precio_publico ?? 0}
                                id={`alm-pub-${alm.id}`}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="ml-auto h-7 w-24 text-right text-xs"
                                defaultValue={existingPrecio?.precio_proveedores ?? 0}
                                id={`alm-prov-${alm.id}`}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-teal-700"
                                onClick={async () => {
                                  const pubEl = document.getElementById(`alm-pub-${alm.id}`) as HTMLInputElement;
                                  const provEl = document.getElementById(`alm-prov-${alm.id}`) as HTMLInputElement;
                                  const stockEl = document.getElementById(`alm-stock-${alm.id}`) as HTMLInputElement;
                                  try {
                                    // Save prices
                                    await upsertPrecio.mutateAsync({
                                      almacenId: alm.id,
                                      productId: productId!,
                                      precioPublico: parseFloat(pubEl?.value) || 0,
                                      precioProveedores: parseFloat(provEl?.value) || 0,
                                    });
                                    // Save stock: get variant, upsert almacen_stock
                                    const newStock = parseInt(stockEl?.value) || 0;
                                    const { data: variant } = await supabase
                                      .from('product_variants' as never)
                                      .select('id')
                                      .eq('product_id' as never, productId as never)
                                      .limit(1)
                                      .single() as unknown as { data: { id: string } | null };
                                    if (variant) {
                                      await supabase
                                        .from('almacen_stock' as never)
                                        .upsert({
                                          almacen_id: alm.id,
                                          variant_id: variant.id,
                                          stock: newStock,
                                        }, { onConflict: 'almacen_id,variant_id' } as never);
                                      // Update total variant stock
                                      const { data: allStocks } = await supabase
                                        .from('almacen_stock' as never)
                                        .select('stock')
                                        .eq('variant_id' as never, variant.id as never) as unknown as { data: { stock: number }[] | null };
                                      const totalStock = (allStocks ?? []).reduce((s, r) => s + r.stock, 0);
                                      await supabase
                                        .from('product_variants' as never)
                                        .update({ stock: totalStock })
                                        .eq('id' as never, variant.id as never);
                                    }
                                    void queryClient.invalidateQueries({ queryKey: ['product-almacen-stock'] });
                                    void queryClient.invalidateQueries({ queryKey: ['product-stock'] });
                                    logAction('almacen_precio_stock_guardado', {
                                      almacen: alm.nombre,
                                      product_id: productId,
                                      precio_publico: parseFloat(pubEl?.value) || 0,
                                      precio_proveedores: parseFloat(provEl?.value) || 0,
                                      stock: newStock,
                                    });
                                    // Sync stock to WooCommerce if this is "Página Web"
                                    if (alm.nombre === 'Página Web' && productId) {
                                      syncStockToWC(productId, newStock);
                                    }
                                    toast.success(`${alm.nombre}: stock y precios guardados`);
                                  } catch (err) {
                                    toast.error((err as Error).message);
                                  }
                                }}
                              >
                                Guardar
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Section 4: Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Configuración
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="track_stock">Usar inventario</Label>
                <p className="text-xs text-muted-foreground">Si esta apagado, se puede vender sin existencia</p>
              </div>
              <Switch
                id="track_stock"
                checked={form.watch('track_stock')}
                onCheckedChange={(checked) => form.setValue('track_stock', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Activo</Label>
              <Switch
                id="is_active"
                checked={form.watch('is_active')}
                onCheckedChange={(checked) => form.setValue('is_active', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Section 5: Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Detalles
            </h3>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Descripción del producto (opcional)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Imagen</Label>
              <ImageUpload
                value={form.watch('image_url') ?? null}
                onChange={(url) => form.setValue('image_url', url)}
                folder="products"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
