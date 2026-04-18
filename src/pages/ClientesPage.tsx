import { CustomerList } from '@/features/customers';

export default function ClientesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <CustomerList />
    </div>
  );
}
