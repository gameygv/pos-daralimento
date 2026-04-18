import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeleteCategory, useMoveProducts, useProductCountByCategory } from '../hooks/useCategories';
import type { AdminCategoryTreeNode } from '../hooks/useCategories';

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AdminCategoryTreeNode | null;
  allCategories: AdminCategoryTreeNode[];
}

/** Collect a category id and all its descendant ids. */
function getDescendantIds(
  categoryId: string,
  categories: AdminCategoryTreeNode[],
): Set<string> {
  const ids = new Set<string>([categoryId]);
  let added = true;
  while (added) {
    added = false;
    for (const cat of categories) {
      if (cat.parent_id && ids.has(cat.parent_id) && !ids.has(cat.id)) {
        ids.add(cat.id);
        added = true;
      }
    }
  }
  return ids;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  allCategories,
}: DeleteCategoryDialogProps) {
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const deleteCategory = useDeleteCategory();
  const moveProducts = useMoveProducts();
  const { data: productCount = 0 } = useProductCountByCategory(category?.id ?? null);

  if (!category) return null;

  const excludedIds = getDescendantIds(category.id, allCategories);
  const availableTargets = allCategories.filter((c) => !excludedIds.has(c.id));
  const hasProducts = productCount > 0;

  async function handleDelete() {
    if (!category) return;

    if (hasProducts && targetCategoryId) {
      await moveProducts.mutateAsync({
        fromCategoryId: category.id,
        toCategoryId: targetCategoryId,
      });
    }

    await deleteCategory.mutateAsync(category.id);
    onOpenChange(false);
    setTargetCategoryId('');
  }

  const isPending = deleteCategory.isPending || moveProducts.isPending;
  const canDelete = !hasProducts || targetCategoryId !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar Categoria
          </DialogTitle>
          <DialogDescription>
            {hasProducts
              ? `Esta categoria tiene ${productCount} producto${productCount !== 1 ? 's' : ''}. Selecciona a que categoria moverlos antes de eliminar.`
              : `Eliminar categoria "${category.name}"? Esta accion no se puede deshacer.`}
          </DialogDescription>
        </DialogHeader>

        {hasProducts && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Mover productos a:</label>
            <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoria" />
              </SelectTrigger>
              <SelectContent>
                {availableTargets.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {'  '.repeat(cat.depth)}{cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isPending}
          >
            {isPending
              ? 'Procesando...'
              : hasProducts
                ? 'Mover y Eliminar'
                : 'Eliminar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
