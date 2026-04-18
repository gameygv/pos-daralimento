import { CxCList } from '@/features/cxc';

export default function CxCPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cuentas por Cobrar</h1>
      <CxCList />
    </div>
  );
}
