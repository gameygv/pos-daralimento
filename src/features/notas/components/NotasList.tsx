import { useState } from 'react';
import { CheckCircle, Clock, Truck, Package, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotas, useTogglePagoStatus, useToggleEntregaStatus } from '../hooks/useNotas';
import { toast } from 'sonner';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function NotasList() {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filterPago, setFilterPago] = useState('');
  const [filterEntrega, setFilterEntrega] = useState('');

  const { data: notas = [], isLoading } = useNotas({
    fechaDesde: fechaDesde || null,
    fechaHasta: fechaHasta || null,
    pagoStatus: filterPago || null,
    entregaStatus: filterEntrega || null,
  });

  const togglePago = useTogglePagoStatus();
  const toggleEntrega = useToggleEntregaStatus();

  const totalPendientes = notas.filter((n) => n.pago_status === 'pendiente').length;
  const totalSinEntregar = notas.filter((n) => n.entrega_status === 'sin_entregar').length;
  const totalMonto = notas.reduce((s, n) => s + n.total, 0);

  async function handleTogglePago(id: string, current: string) {
    try {
      await togglePago.mutateAsync({ id, currentStatus: current });
      toast.success(current === 'pagado' ? 'Marcado como pendiente' : 'Marcado como pagado');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleToggleEntrega(id: string, current: string) {
    try {
      await toggleEntrega.mutateAsync({ id, currentStatus: current });
      toast.success(current === 'entregado' ? 'Marcado como sin entregar' : 'Marcado como entregado');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando notas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalMonto)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pago Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalPendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sin Entregar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalSinEntregar}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="w-[150px]"
        />
        <Input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="w-[150px]"
        />
        <Select value={filterPago} onValueChange={(v) => setFilterPago(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Pago: Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEntrega} onValueChange={(v) => setFilterEntrega(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Entrega: Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sin_entregar">Sin Entregar</SelectItem>
            <SelectItem value="entregado">Entregado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {notas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <FileText className="mx-auto mb-2 h-8 w-8" />
          <p>No hay notas de venta</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nota</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Pago</TableHead>
                <TableHead className="text-center">Entrega</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notas.map((nota) => (
                <TableRow key={nota.id}>
                  <TableCell className="font-mono font-semibold">
                    #{nota.folio_display || nota.folio}
                  </TableCell>
                  <TableCell>
                    <div>{nota.fecha}</div>
                    <div className="text-xs text-muted-foreground">{nota.hora}</div>
                  </TableCell>
                  <TableCell>{nota.cliente}</TableCell>
                  <TableCell className="text-muted-foreground">{nota.vendedor ?? '—'}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatPrice(nota.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => void handleTogglePago(nota.id, nota.pago_status)}
                      disabled={togglePago.isPending}
                    >
                      {nota.pago_status === 'pagado' ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Pagado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                          <Clock className="mr-1 h-3 w-3" />
                          Pendiente
                        </Badge>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => void handleToggleEntrega(nota.id, nota.entrega_status)}
                      disabled={toggleEntrega.isPending}
                    >
                      {nota.entrega_status === 'entregado' ? (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          <Truck className="mr-1 h-3 w-3" />
                          Entregado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                          <Package className="mr-1 h-3 w-3" />
                          Sin Entregar
                        </Badge>
                      )}
                    </Button>
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
