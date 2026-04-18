import { Calculator, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCortes } from '../hooks/useCortes';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function CorteList() {
  const { data: cortes = [], isLoading } = useCortes();

  const today = new Date().toISOString().split('T')[0];
  const todayCortes = cortes.filter((c) => c.fecha === today);
  const todayVentas = todayCortes.reduce((s, c) => s + c.vtato, 0);
  const todayUtilidad = todayCortes.reduce((s, c) => s + c.utibr, 0);

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando cortes...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(todayVentas)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilidad de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(todayUtilidad)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cortes de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCortes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action */}
      <div className="flex items-center">
        <Button size="sm">
          <Calculator className="mr-2 h-4 w-4" />
          Nuevo Corte
        </Button>
      </div>

      {/* Table */}
      {cortes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <Receipt className="mx-auto mb-2 h-8 w-8" />
          <p>No hay cortes registrados</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corte #</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead className="text-right">Ticket Ini.</TableHead>
                <TableHead className="text-right">Ticket Fin</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Utilidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cortes.map((corte) => (
                <TableRow key={corte.id}>
                  <TableCell className="font-medium">{corte.ultcort}</TableCell>
                  <TableCell>{corte.fecha}</TableCell>
                  <TableCell>{corte.hora}</TableCell>
                  <TableCell className="text-right">{corte.initk}</TableCell>
                  <TableCell className="text-right">{corte.ulttk}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(corte.vtato)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(corte.ivare)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(corte.ctovd)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatPrice(corte.utibr)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
