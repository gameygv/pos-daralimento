import { GastosList } from '@/features/gastos';

export default function GastosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Gastos</h1>
      <GastosList />
    </div>
  );
}
