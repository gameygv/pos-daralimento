import { ProductList } from '@/features/catalog/products';

export default function ProductosPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Productos</h1>
      <ProductList />
    </div>
  );
}
