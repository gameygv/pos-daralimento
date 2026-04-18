import { useState, useMemo } from 'react';
import { BarChart3, Receipt, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSalesReport, useDailySales } from '../hooks/useReports';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  VENDIDO: { label: 'Vendido', color: 'bg-green-100 text-green-800' },
  CANCELACION_SOLICITADA: {
    label: 'Canc. Solicitada',
    color: 'bg-yellow-100 text-yellow-800',
  },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function ReportsView() {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const { data: tickets = [], isLoading } = useSalesReport({
    fechaDesde: fechaDesde || null,
    fechaHasta: fechaHasta || null,
  });

  const dailySales = useDailySales(tickets);

  const summary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTickets = tickets.filter(
      (t) => t.fecha === today && t.status !== 'CANCELADO',
    );
    const todayFolios = new Set(todayTickets.map((t) => t.folio));
    const todayTotal = todayTickets.reduce(
      (s, t) => s + t.prec * t.can - t.descue,
      0,
    );
    const avgTicket =
      todayFolios.size > 0 ? todayTotal / todayFolios.size : 0;

    return {
      todayTotal,
      todayTickets: todayFolios.size,
      avgTicket,
    };
  }, [tickets]);

  // Group ticket lines by folio for display
  const ticketGroups = useMemo(() => {
    const groups = new Map<
      number,
      {
        folio: number;
        fecha: string;
        hora: string;
        vende: string | null;
        items: number;
        total: number;
        status: string;
      }
    >();

    for (const t of tickets) {
      const existing = groups.get(t.folio);
      const lineTotal = t.prec * t.can - t.descue;
      if (existing) {
        existing.items += 1;
        existing.total += lineTotal;
      } else {
        groups.set(t.folio, {
          folio: t.folio,
          fecha: t.fecha,
          hora: t.hora,
          vende: t.vende,
          items: 1,
          total: lineTotal,
          status: t.status,
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => {
      const dateComp = b.fecha.localeCompare(a.fecha);
      if (dateComp !== 0) return dateComp;
      return b.folio - a.folio;
    });
  }, [tickets]);

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando reportes...</div>;
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
            <div className="text-2xl font-bold">
              {formatPrice(summary.todayTotal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tickets de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.todayTickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(summary.avgTicket)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {dailySales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" />
              Ventas Diarias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => formatPrice(value)}
                  labelFormatter={(label: string) => `Fecha: ${label}`}
                />
                <Bar
                  dataKey="total"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Ventas"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters + Export */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="w-[160px]"
          placeholder="Desde"
        />
        <Input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="w-[160px]"
          placeholder="Hasta"
        />
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={ticketGroups.length === 0}
            onClick={() => {
              exportToCSV(
                ticketGroups.map((t) => ({
                  folio: t.folio,
                  fecha: t.fecha,
                  hora: t.hora,
                  vendedor: t.vende ?? '',
                  articulos: t.items,
                  total: t.total.toFixed(2),
                  estado: t.status,
                })),
                [
                  { key: 'folio', label: 'Folio' },
                  { key: 'fecha', label: 'Fecha' },
                  { key: 'hora', label: 'Hora' },
                  { key: 'vendedor', label: 'Vendedor' },
                  { key: 'articulos', label: 'Articulos' },
                  { key: 'total', label: 'Total' },
                  { key: 'estado', label: 'Estado' },
                ],
                `ventas_${fechaDesde || 'todas'}`,
              );
            }}
          >
            <Download className="mr-1 h-4 w-4" /> Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={ticketGroups.length === 0}
            onClick={() => {
              exportToPDF(
                'Reporte de Ventas',
                ticketGroups.map((t) => ({
                  folio: String(t.folio),
                  fecha: t.fecha,
                  hora: t.hora,
                  vendedor: t.vende ?? '',
                  articulos: String(t.items),
                  total: formatPrice(t.total),
                  estado: t.status,
                })),
                [
                  { key: 'folio', label: 'Folio' },
                  { key: 'fecha', label: 'Fecha' },
                  { key: 'hora', label: 'Hora' },
                  { key: 'vendedor', label: 'Vendedor' },
                  { key: 'articulos', label: 'Arts.', align: 'right' },
                  { key: 'total', label: 'Total', align: 'right' },
                  { key: 'estado', label: 'Estado' },
                ],
                { subtitle: `Periodo: ${fechaDesde || 'inicio'} - ${fechaHasta || 'hoy'}` },
              );
            }}
          >
            <FileText className="mr-1 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Sales table */}
      {ticketGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <Receipt className="mx-auto mb-2 h-8 w-8" />
          <p>No hay ventas</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Artículos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketGroups.map((ticket) => {
                const statusConfig = STATUS_CONFIG[ticket.status] ?? {
                  label: ticket.status,
                  color: 'bg-gray-100 text-gray-800',
                };
                return (
                  <TableRow key={ticket.folio}>
                    <TableCell className="font-medium">
                      #{ticket.folio}
                    </TableCell>
                    <TableCell>{ticket.fecha}</TableCell>
                    <TableCell>{ticket.hora}</TableCell>
                    <TableCell>{ticket.vende ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      {ticket.items}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatPrice(ticket.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusConfig.color}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
