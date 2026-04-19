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
import { categoryFormSchema, type CategoryFormValues } from '../schemas/category.schema';
import { useCategoryList, useCreateCategory, useUpdateCategory } from '../hooks/useCategories';
import type { AdminCategoryTreeNode } from '../hooks/useCategories';
import { slugify } from '../utils/slugify';
import { ImageUpload } from '@/components/ImageUpload';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AdminCategoryTreeNode | null; // null = create mode
}

const NONE_VALUE = '__none__';

export function CategoryForm({ open, onOpenChange, category }: CategoryFormProps) {
  const isEditing = category !== null;
  const { data: parentOptions = [] } = useCategoryList();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: null,
      parent_id: null,
      sort_order: 0,
      is_active: true,
      image_url: null,
    },
  });

  // Reset form when dialog opens with different category
  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          slug: category.slug,
          description: category.description ?? null,
          parent_id: category.parent_id,
          sort_order: category.sort_order,
          is_active: category.is_active,
          image_url: category.image_url ?? null,
        });
      } else {
        form.reset({
          name: '',
          slug: '',
          description: null,
          parent_id: null,
          sort_order: 0,
          is_active: true,
          image_url: null,
        });
      }
    }
  }, [open, category, form]);

  // Auto-generate slug from name (only when creating)
  const watchName = form.watch('name');
  useEffect(() => {
    if (!isEditing && watchName) {
      const currentSlug = form.getValues('slug');
      const expectedSlug = slugify(form.getValues('name').slice(0, -1) || '');
      // Only auto-update if user hasn't manually edited the slug
      if (currentSlug === '' || currentSlug === expectedSlug) {
        form.setValue('slug', slugify(watchName));
      }
    }
  }, [watchName, isEditing, form]);

  async function onSubmit(values: CategoryFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: category.id, ...values });
      } else {
        await createMutation.mutateAsync(values);
      }
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Error al guardar';
      if (msg.includes('categories_slug_key') || msg.includes('duplicate key')) {
        form.setError('slug', { message: 'Este slug ya existe. Usa uno diferente.' });
      } else {
        form.setError('root', { message: msg });
      }
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Filter out current category from parent options (can't be own parent)
  const availableParents = parentOptions.filter((p) => p.id !== category?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {form.formState.errors.root && (
            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...form.register('name')} placeholder="Ej: Bowls de cerámica" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...form.register('slug')} placeholder="bowls-de-ceramica" />
            {form.formState.errors.slug && (
              <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Descripción opcional"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Imagen</Label>
            <ImageUpload
              value={form.watch('image_url') ?? null}
              onChange={(url) => form.setValue('image_url', url)}
              folder="categories"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_id">Categoría padre</Label>
            <Select
              value={form.watch('parent_id') ?? NONE_VALUE}
              onValueChange={(val) => form.setValue('parent_id', val === NONE_VALUE ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin padre (raíz)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Sin padre (raíz)</SelectItem>
                {availableParents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Orden</Label>
            <Input
              id="sort_order"
              type="number"
              min={0}
              {...form.register('sort_order', { valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Activa</Label>
            <Switch
              id="is_active"
              checked={form.watch('is_active')}
              onCheckedChange={(checked) => form.setValue('is_active', checked)}
            />
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
