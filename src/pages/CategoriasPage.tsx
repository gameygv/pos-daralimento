import { CategoryTree } from '@/features/catalog/categories';

export default function CategoriasPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categorías</h1>
      <CategoryTree />
    </div>
  );
}
