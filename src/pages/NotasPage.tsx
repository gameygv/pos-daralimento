import { NotasList } from '@/features/notas';

export default function NotasPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notas de Venta</h1>
      <NotasList />
    </div>
  );
}
