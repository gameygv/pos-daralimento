import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Percent,
  CreditCard,
  Package,
  Calendar,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAdvancedReport } from '../hooks/useAdvancedReport';
import { useAlmacenes } from '@/features/almacenes/hooks/useAlmacenes';
import { useNotaItems } from '@/features/notas/hooks/useNotas';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

const PIE_COLORS = ['#0d9488', '#f59e0b', '#6366f1', '#ec4899', '#84cc16', '#8b5cf6'];

const METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  trueque: 'Trueque',
  regalo: 'Regalo',
};

function getWeekLabel(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00');
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return `Sem ${start.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`;
}

export function AdvancedReports() {
  const today = new Date().toISOString().split('T')[0];
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  const [fechaDesde, setFechaDesde] = useState(ninetyDaysAgo);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  const [metodoPagoFilter, setMetodoPagoFilter] = useState<string>('all');
  const [entregaFilter, setEntregaFilter] = useState<string>('all');
  const [almacenFilter, setAlmacenFilter] = useState<string>('all');

  const { data: rows = [], isLoading } = useAdvancedReport(fechaDesde, fechaHasta);
  const { data: almacenes = [] } = useAlmacenes();
  const [expandedNotaFolio, setExpandedNotaFolio] = useState<number | null>(null);
  const { data: expandedItems = [] } = useNotaItems(expandedNotaFolio);

  // Extract unique clients for filters
  const uniqueClientes = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.cliente) set.add(r.cliente);
    return [...set].sort();
  }, [rows]);

  // Filter rows
  const active = useMemo(() => {
    return rows.filter((r) => {
      if (r.status === 'CANCELADO' || r.status === 'DEVUELTO') return false;
      if (clienteFilter !== 'all' && r.cliente !== clienteFilter) return false;
      if (almacenFilter !== 'all' && r.almacen_id !== almacenFilter) return false;
      if (entregaFilter !== 'all' && r.entrega_status !== entregaFilter) return false;
      if (metodoPagoFilter !== 'all') {
        const raw = r.metodo_pago;
        if (raw.includes('|')) {
          if (!raw.split(',').some((p) => p.split('|')[0].trim() === metodoPagoFilter)) return false;
        } else if (raw !== metodoPagoFilter) return false;
      }
      return true;
    });
  }, [rows, clienteFilter, almacenFilter, metodoPagoFilter, entregaFilter]);

  // --- KPIs ---
  const kpis = useMemo(() => {
    const totalVentas = active.reduce((s, r) => s + (r.prec - r.descue) * r.can, 0);
    const totalCosto = active.reduce((s, r) => s + r.cost * r.can, 0);
    const ganancia = totalVentas - totalCosto;
    const folios = new Set(active.map((r) => r.folio));
    const ticketPromedio = folios.size > 0 ? totalVentas / folios.size : 0;
    const totalDescuento = active.reduce((s, r) => s + r.descue * r.can, 0);
    const totalPagado = active.reduce((s, r) => s + r.pagado, 0);
    const totalSaldo = active.reduce((s, r) => s + r.saldo, 0);
    const sinEntregar = active.filter((r) => r.entrega_status === 'sin_entregar').length;
    const entregados = active.filter((r) => r.entrega_status === 'entregado').length;
    return { totalVentas, totalCosto, ganancia, tickets: folios.size, ticketPromedio, totalDescuento, totalPagado, totalSaldo, sinEntregar, entregados };
  }, [active]);

  // --- Daily trend (line chart) ---
  const dailyTrend = useMemo(() => {
    const map = new Map<string, { ventas: number; ganancia: number; tickets: Set<number> }>();
    for (const r of active) {
      const line = (r.prec - r.descue) * r.can;
      const profit = line - r.cost * r.can;
      const ex = map.get(r.fecha);
      if (ex) {
        ex.ventas += line;
        ex.ganancia += profit;
        ex.tickets.add(r.folio);
      } else {
        map.set(r.fecha, { ventas: line, ganancia: profit, tickets: new Set([r.folio]) });
      }
    }
    return Array.from(map.entries())
      .map(([fecha, d]) => ({
        fecha: fecha.slice(5),
        ventas: Math.round(d.ventas * 100) / 100,
        ganancia: Math.round(d.ganancia * 100) / 100,
        tickets: d.tickets.size,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [active]);

  // --- Payment methods (pie chart) ---
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of active) {
      // Handle split payments: "efectivo|200,tarjeta|150"
      const raw = r.metodo_pago;
      if (raw.includes('|')) {
        for (const part of raw.split(',')) {
          const [method, amt] = part.split('|');
          const key = method.trim();
          map.set(key, (map.get(key) ?? 0) + (parseFloat(amt) || 0));
        }
      } else {
        const line = (r.prec - r.descue) * r.can;
        map.set(raw, (map.get(raw) ?? 0) + line);
      }
    }
    return Array.from(map.entries())
      .map(([method, total]) => ({ name: METHOD_LABELS[method] ?? method, value: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [active]);

  // --- Top products ---
  const topProducts = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number; profit: number }>();
    for (const r of active) {
      const ex = map.get(r.art);
      const rev = (r.prec - r.descue) * r.can;
      const prof = rev - r.cost * r.can;
      if (ex) {
        ex.qty += r.can;
        ex.revenue += rev;
        ex.profit += prof;
      } else {
        map.set(r.art, { qty: r.can, revenue: rev, profit: prof });
      }
    }
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);
  }, [active]);

  // --- Hourly distribution (bar chart) ---
  const hourlyDist = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hora: `${i.toString().padStart(2, '0')}:00`,
      ventas: 0,
      tickets: new Set<number>(),
    }));
    for (const r of active) {
      const h = parseInt(r.hora?.split(':')[0] ?? '0', 10);
      hours[h].ventas += (r.prec - r.descue) * r.can;
      hours[h].tickets.add(r.folio);
    }
    return hours
      .map((h) => ({ hora: h.hora, ventas: Math.round(h.ventas * 100) / 100, tickets: h.tickets.size }))
      .filter((h) => h.ventas > 0 || h.tickets > 0);
  }, [active]);

  // --- Weekly comparison ---
  const weeklyComp = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of active) {
      const wk = getWeekLabel(r.fecha);
      map.set(wk, (map.get(wk) ?? 0) + (r.prec - r.descue) * r.can);
    }
    return Array.from(map.entries()).map(([semana, total]) => ({
      semana,
      total: Math.round(total * 100) / 100,
    }));
  }, [active]);

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando informes avanzados...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-[150px]" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-[150px]" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Cliente</label>
          <Select value={clienteFilter} onValueChange={setClienteFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {uniqueClientes.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Punto de Venta</label>
          <Select value={almacenFilter} onValueChange={setAlmacenFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {almacenes.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Entrega</label>
          <Select value={entregaFilter} onValueChange={setEntregaFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="entregado">Entregados</SelectItem>
              <SelectItem value="sin_entregar">Sin Entregar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Forma de Pago</label>
          <Select value={metodoPagoFilter} onValueChange={setMetodoPagoFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(METHOD_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {active.length} registros
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" /> Ventas
            </div>
            <p className="mt-1 text-xl font-bold">{formatPrice(kpis.totalVentas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-600" /> Cobrado
            </div>
            <p className="mt-1 text-xl font-bold text-green-700">{formatPrice(kpis.totalPagado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 text-amber-500" /> Por Cobrar
            </div>
            <p className="mt-1 text-xl font-bold text-amber-600">{formatPrice(kpis.totalSaldo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-red-500" /> Costo
            </div>
            <p className="mt-1 text-xl font-bold text-red-600">{formatPrice(kpis.totalCosto)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingBag className="h-4 w-4" /> Tickets
            </div>
            <p className="mt-1 text-xl font-bold">{kpis.tickets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingBag className="h-4 w-4" /> Promedio
            </div>
            <p className="mt-1 text-xl font-bold">{formatPrice(kpis.ticketPromedio)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4 text-blue-500" /> Entregados
            </div>
            <p className="mt-1 text-xl font-bold text-blue-600">{kpis.entregados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4 text-red-500" /> Sin Entregar
            </div>
            <p className="mt-1 text-xl font-bold text-red-600">{kpis.sinEntregar}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1: Daily trend + Payment breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5" /> Tendencia Diaria (Ventas vs Ganancia)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatPrice(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="ventas" stroke="#0d9488" strokeWidth={2} name="Ventas" dot={false} />
                  <Line type="monotone" dataKey="ganancia" stroke="#22c55e" strokeWidth={2} name="Ganancia" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin datos</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5" /> Metodos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={paymentBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {paymentBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatPrice(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {paymentBreakdown.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {p.name}
                      </div>
                      <span className="font-semibold">{formatPrice(p.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin datos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2: Hourly + Weekly */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventas por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            {hourlyDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourlyDist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatPrice(v)} />
                  <Bar dataKey="ventas" fill="#0d9488" radius={[3, 3, 0, 0]} name="Ventas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin datos</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparativa Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyComp.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyComp}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatPrice(v)} />
                  <Bar dataKey="total" fill="#6366f1" radius={[3, 3, 0, 0]} name="Ventas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin datos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 15 Productos</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p, i) => {
                    const margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
                    return (
                      <TableRow key={p.name}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{p.qty}</TableCell>
                        <TableCell className="text-right font-semibold">{formatPrice(p.revenue)}</TableCell>
                        <TableCell className={`text-right font-semibold ${p.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {formatPrice(p.profit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            margin >= 50 ? 'bg-green-100 text-green-800' :
                            margin >= 25 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {margin.toFixed(0)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell />
                    <TableCell className="font-bold">TOTAL</TableCell>
                    <TableCell className="text-right font-bold">{topProducts.reduce((s, p) => s + p.qty, 0)}</TableCell>
                    <TableCell className="text-right font-bold">{formatPrice(topProducts.reduce((s, p) => s + p.revenue, 0))}</TableCell>
                    <TableCell className="text-right font-bold">{formatPrice(topProducts.reduce((s, p) => s + p.profit, 0))}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">Sin datos</p>
          )}
        </CardContent>
      </Card>
      {/* Notas del período */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Notas del Período</CardTitle>
        </CardHeader>
        <CardContent>
          {active.filter((r) => r.source === 'nota').length === 0 && active.filter((r) => r.source === 'venta').length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sin notas en este período</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nota</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Entrega</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...new Map(active.map((r) => [r.folio, r])).values()]
                    .sort((a, b) => b.fecha.localeCompare(a.fecha))
                    .slice(0, 50)
                    .map((r) => {
                      const isExp = expandedNotaFolio === r.folio;
                      return (
                      <React.Fragment key={r.folio}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedNotaFolio(isExp ? null : r.folio)}
                      >
                        <TableCell className="font-mono text-sm">
                          <span className="inline-flex items-center gap-1">
                            {isExp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            #{r.source === 'nota' ? r.art : r.folio}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{r.fecha}</TableCell>
                        <TableCell className="text-sm">{r.cliente}</TableCell>
                        <TableCell className="text-right text-sm">{formatPrice(r.total)}</TableCell>
                        <TableCell className="text-right text-sm text-green-700">{formatPrice(r.pagado)}</TableCell>
                        <TableCell className={`text-right text-sm font-semibold ${r.saldo > 0.01 ? 'text-amber-700' : 'text-green-700'}`}>
                          {formatPrice(r.saldo)}
                        </TableCell>
                        <TableCell>
                          {r.entrega_status === 'entregado' ? (
                            <span className="text-xs text-blue-700">Entregado</span>
                          ) : r.entrega_status === 'sin_entregar' ? (
                            <span className="text-xs text-red-600">Sin entregar</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExp && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-0">
                            <div className="px-6 py-2">
                              {expandedItems.length > 0 ? (
                                <table className="w-full text-xs">
                                  <thead><tr>
                                    <th className="px-2 py-1 text-left font-medium">Producto</th>
                                    <th className="px-2 py-1 text-right font-medium">Cant</th>
                                    <th className="px-2 py-1 text-right font-medium">Precio</th>
                                    <th className="px-2 py-1 text-right font-medium">Total</th>
                                  </tr></thead>
                                  <tbody>
                                    {expandedItems.map((item, i) => (
                                      <tr key={i}>
                                        <td className="px-2 py-0.5">{item.art}</td>
                                        <td className="px-2 py-0.5 text-right">{item.can}</td>
                                        <td className="px-2 py-0.5 text-right">{formatPrice(item.prec)}</td>
                                        <td className="px-2 py-0.5 text-right font-semibold">{formatPrice((item.prec - item.descue) * item.can)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-xs text-muted-foreground">Nota importada — Total: {formatPrice(r.total)}</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      </React.Fragment>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
