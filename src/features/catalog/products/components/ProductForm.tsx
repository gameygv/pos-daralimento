import { useEffect } from 'react';
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
import { productFormSchema, PRODUCT_TYPE_CONFIG, type ProductFormValues } from '../schemas/product.schema';
import { useProductById, useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { useCategoryList } from '@/features/catalog/categories';
import { slugify } from '@/features/catalog/categories/utils/slugify';
import { VariantManager } from '@/features/catalog/variants/components/VariantManager';
import { ImageUpload } from '@/components/ImageUpload';
import type { ProductType, ProductInsert } from '@/integrations/supabase/catalog-types';

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
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

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
      cost: null,
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
          cost: ((existingProduct as Record<string, unknown>).cost as number | null) ?? null,
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
          cost: null,
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

  // Margin calculation
  const watchPrice = form.watch('base_price');
  const watchCost = form.watch('cost');
  const margin =
    watchPrice > 0 && watchCost !== null && watchCost !== undefined && watchCost >= 0
      ? (((watchPrice - watchCost) / watchPrice) * 100).toFixed(1)
      : null;

  async function onSubmit(values: ProductFormValues) {
    if (isEditing && productId) {
      await updateMutation.mutateAsync({ id: productId, ...values } as { id: string } & Partial<ProductInsert>);
    } else {
      await createMutation.mutateAsync(values as ProductInsert);
    }
    onOpenChange(false);
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
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

          {/* Section 2: Type & Category */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Clasificación
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_type">Tipo de producto</Label>
                <Select
                  value={form.watch('product_type')}
                  onValueChange={(val) => form.setValue('product_type', val as ProductFormValues['product_type'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PRODUCT_TYPE_CONFIG) as [ProductType, { label: string; color: string }][]).map(
                      ([type, config]) => (
                        <SelectItem key={type} value={type}>
                          {config.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Categoría</Label>
                <Select
                  value={form.watch('category_id') ?? NONE_VALUE}
                  onValueChange={(val) => form.setValue('category_id', val === NONE_VALUE ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Sin categoría</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 3: Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Precios
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Precio base</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('base_price')}
                />
                {form.formState.errors.base_price && (
                  <p className="text-sm text-destructive">{form.formState.errors.base_price.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Costo</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('cost')}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tasa de impuesto</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  {...form.register('tax_rate')}
                />
              </div>
            </div>
            {margin !== null && (
              <p className="text-sm text-muted-foreground">
                Margen: <span className="font-medium">{margin}%</span>
              </p>
            )}
          </div>

          <Separator />

          {/* Section 4: Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Configuración
            </h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="track_stock">Rastrear inventario</Label>
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

          {/* Section 6: Variants (edit mode only) */}
          {isEditing && productId && (
            <>
              <Separator />
              <VariantManager
                productId={productId}
                productSku={form.watch('sku')}
              />
            </>
          )}

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
