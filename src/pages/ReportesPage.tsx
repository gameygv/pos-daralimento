import { useState } from 'react';
import { ReportsView, SellerReport, AdvancedReports } from '@/features/reports';

type ReportTab = 'ventas' | 'vendedores' | 'avanzado';

export default function ReportesPage() {
  const [tab, setTab] = useState<ReportTab>('avanzado');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reportes de Ventas</h1>

      {/* Tab selector */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
        <button
          onClick={() => setTab('avanzado')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'avanzado'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setTab('ventas')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'ventas'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Ventas
        </button>
        <button
          onClick={() => setTab('vendedores')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'vendedores'
              ? 'bg-background shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Por Vendedor
        </button>
      </div>

      {tab === 'avanzado' && <AdvancedReports />}
      {tab === 'ventas' && <ReportsView />}
      {tab === 'vendedores' && <SellerReport />}
    </div>
  );
}
