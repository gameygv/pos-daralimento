import { MovementList } from '@/features/inventory';

export default function InventarioPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventario — Kardex</h1>
      <MovementList />
    </div>
  );
}
