import { Package, FolderTree, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import { AdvancedReports } from '@/features/reports';

function StatCard({
  title,
  value,
  icon,
  colorClass,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white">
      <CardContent className="flex items-center gap-4 p-6">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats();

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground capitalize">{today}</p>
      </div>

      {isError ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            No se pudieron cargar las estadísticas.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Productos"
            value={isLoading ? '...' : String(data?.totalProducts ?? 0)}
            icon={<Package className="h-5 w-5 text-indigo-600" />}
            colorClass="bg-indigo-50"
          />
          <StatCard
            title="Categorías"
            value={isLoading ? '...' : String(data?.totalCategories ?? 0)}
            icon={<FolderTree className="h-5 w-5 text-emerald-600" />}
            colorClass="bg-emerald-50"
          />
          <StatCard
            title="Productos Activos"
            value={isLoading ? '...' : String(data?.activeProducts ?? 0)}
            icon={<CheckCircle className="h-5 w-5 text-blue-600" />}
            colorClass="bg-blue-50"
          />
          <StatCard
            title="Bajo Stock"
            value={isLoading ? '...' : String(data?.lowStockCount ?? 0)}
            icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
            colorClass="bg-rose-50"
          />
        </div>
      )}

      <AdvancedReports />
    </div>
  );
}
