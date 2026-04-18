import { useState } from 'react';
import { Pencil, FolderTree, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useCategories, useToggleCategoryActive } from '../hooks/useCategories';
import type { AdminCategoryTreeNode } from '../hooks/useCategories';
import { CategoryForm } from './CategoryForm';
import { DeleteCategoryDialog } from './DeleteCategoryDialog';

export function CategoryTree() {
  const { data: categories = [], isLoading, error } = useCategories();
  const toggleActive = useToggleCategoryActive();
  const [editingCategory, setEditingCategory] = useState<AdminCategoryTreeNode | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<AdminCategoryTreeNode | null>(null);

  function handleCreate() {
    setEditingCategory(null);
    setIsFormOpen(true);
  }

  function handleEdit(category: AdminCategoryTreeNode) {
    setEditingCategory(category);
    setIsFormOpen(true);
  }

  function handleToggleActive(id: string, currentActive: boolean) {
    toggleActive.mutate({ id, is_active: !currentActive });
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando categorías...</div>;
  }

  if (error) {
    return <div className="text-destructive">Error al cargar categorías: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categorías</h2>
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <FolderTree className="mx-auto mb-2 h-8 w-8" />
          <p>No hay categorías. Crea la primera.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between border-b px-4 py-3 last:border-b-0 hover:bg-muted/50"
              style={{ paddingLeft: `${1 + category.depth * 1.5}rem` }}
            >
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-muted-foreground" />
                <span className={!category.is_active ? 'text-muted-foreground line-through' : ''}>
                  {category.name}
                </span>
                <span className="text-xs text-muted-foreground">/{category.slug}</span>
                {!category.is_active && (
                  <Badge variant="secondary" className="text-xs">Inactiva</Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={category.is_active}
                  onCheckedChange={() => handleToggleActive(category.id, category.is_active)}
                  aria-label={`${category.is_active ? 'Desactivar' : 'Activar'} ${category.name}`}
                />
                <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeletingCategory(category)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        category={editingCategory}
      />

      <DeleteCategoryDialog
        open={deletingCategory !== null}
        onOpenChange={(open) => { if (!open) setDeletingCategory(null); }}
        category={deletingCategory}
        allCategories={categories}
      />
    </div>
  );
}
