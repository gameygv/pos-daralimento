import { LogList } from '@/features/logs';

export default function LogsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Logs de Auditoría</h1>
      <LogList />
    </div>
  );
}
