import { useState } from 'react';
import {
  CheckCircle, Clock, Truck, Package, FileText,
  DollarSign, Plus, ChevronDown, ChevronRight, Loader2,
  Banknote, CreditCard, ArrowRightLeft, Repeat, Gift,
  Printer, XCircle, Trash2, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useNotas,
  useNotaPagos,
  useNotaItems,
  useRegistrarPago,
  useToggleEntregaStatus,
  useCancelNota,
  useDeleteNota,
  type NotaRow,
} from '../hooks/useNotas';
import { toast } from 'sonner';
import { useWhatsAppConfig } from '@/features/whatsapp/WhatsAppSettings';
import { sendWhatsAppMessage } from '@/features/whatsapp/sendWhatsApp';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

const PAGO_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'transferencia', label: 'Transferencia', icon: ArrowRightLeft },
  { id: 'trueque', label: 'Trueque', icon: Repeat },
  { id: 'regalo', label: 'Regalo', icon: Gift },
];

export function NotasList() {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filterPago, setFilterPago] = useState('');
  const [filterEntrega, setFilterEntrega] = useState('');

  // Expanded nota for viewing pagos
  const [expandedNota, setExpandedNota] = useState<string | null>(null);

  // Pago dialog
  const [pagoDialogNota, setPagoDialogNota] = useState<NotaRow | null>(null);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoMetodo, setPagoMetodo] = useState('efectivo');
  const [pagoNota, setPagoNota] = useState('');

  const { data: notas = [], isLoading } = useNotas({
    fechaDesde: fechaDesde || null,
    fechaHasta: fechaHasta || null,
    pagoStatus: filterPago || null,
    entregaStatus: filterEntrega || null,
  });

  const { data: expandedPagos = [] } = useNotaPagos(expandedNota);
  const expandedNotaFolio = notas.find((n) => n.id === expandedNota)?.folio ?? null;
  const { data: expandedItems = [] } = useNotaItems(expandedNotaFolio);
  const toggleEntrega = useToggleEntregaStatus();
  const registrarPago = useRegistrarPago();
  const cancelNota = useCancelNota();
  const deleteNota = useDeleteNota();
  const { data: waConfig } = useWhatsAppConfig();
  const [sendingWA, setSendingWA] = useState<string | null>(null);

  const totalPendientes = notas.filter((n) => n.pago_status === 'pendiente').length;
  const totalSinEntregar = notas.filter((n) => n.entrega_status === 'sin_entregar').length;
  const montoPendiente = notas
    .filter((n) => n.pago_status === 'pendiente')
    .reduce((s, n) => s + (n.total - n.pagado), 0);
  const totalMonto = notas.reduce((s, n) => s + n.total, 0);

  async function handleToggleEntrega(id: string, current: string) {
    try {
      await toggleEntrega.mutateAsync({ id, currentStatus: current });
      toast.success(current === 'entregado' ? 'Marcado como sin entregar' : 'Marcado como entregado');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleDeleteNota(notaId: string, folio: string) {
    try {
      await deleteNota.mutateAsync(notaId);
      toast.success(`Nota #${folio} eliminada y stock revertido`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleCancelNota(notaId: string) {
    try {
      await cancelNota.mutateAsync(notaId);
      toast.success('Nota cancelada');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleSendWhatsApp(nota: NotaRow) {
    if (!waConfig?.chat_id) {
      toast.error('Configura un destino en Configuracion → WhatsApp');
      return;
    }
    setSendingWA(nota.id);
    try {
      const entregaUrl = `${window.location.origin}/entrega/${nota.entrega_token}`;
      const folio = nota.folio_display || String(nota.folio);
      const totalFormatted = formatPrice(nota.total);

      // Fetch items for this nota
      const items = expandedNota === nota.id ? expandedItems : [];
      let itemLines = '';
      if (items.length > 0) {
        itemLines = items.map((i) => `  • ${i.can}x ${i.art} — ${formatPrice(i.prec * i.can)}`).join('\n');
      }

      const message = [
        `🛒 *Nueva orden - Nota #${folio}*`,
        '',
        `👤 Cliente: ${nota.cliente}`,
        `📅 Fecha: ${nota.fecha} ${nota.hora}`,
        ...(nota.vendedor ? [`🧑‍💼 Vendedor: ${nota.vendedor}`] : []),
        '',
        ...(itemLines ? ['📦 *Productos:*', itemLines, ''] : []),
        `💰 *Total: ${totalFormatted}*`,
        `💳 Pago: ${nota.pago_status === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}`,
        `📦 Entrega: ${nota.entrega_status === 'entregado' ? '✅ Entregado' : '⏳ Sin entregar'}`,
        '',
        `📋 *Confirmar entrega:*`,
        entregaUrl,
      ].join('\n');

      const result = await sendWhatsAppMessage({ chatId: waConfig.chat_id, message });
      if (result.success) {
        toast.success('Notificacion enviada por WhatsApp');
      } else {
        toast.error(`Error WhatsApp: ${result.message}`);
      }
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    }
    setSendingWA(null);
  }

  function openPagoDialog(nota: NotaRow) {
    setPagoDialogNota(nota);
    setPagoMonto('');
    setPagoMetodo('efectivo');
    setPagoNota('');
  }

  async function handleRegistrarPago() {
    if (!pagoDialogNota) return;
    const monto = parseFloat(pagoMonto) || 0;
    if (monto <= 0) return;

    try {
      const result = await registrarPago.mutateAsync({
        notaId: pagoDialogNota.id,
        monto,
        metodoPago: pagoMetodo,
        nota: pagoNota.trim() || undefined,
      });
      toast.success(result.isFullyPaid ? 'Nota liquidada' : `Pago de ${formatPrice(monto)} registrado`);
      setPagoDialogNota(null);
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatPrice(montoPendiente)}</div>
            <p className="text-xs text-muted-foreground">{totalPendientes} nota{totalPendientes !== 1 ? 's' : ''}</p>
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
        <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-[150px]" />
        <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-[150px]" />
        <Select value={filterPago} onValueChange={(v) => setFilterPago(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Pago: Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEntrega} onValueChange={(v) => setFilterEntrega(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Entrega: Todos" /></SelectTrigger>
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
                <TableHead className="w-8"></TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-center">Pago</TableHead>
                <TableHead className="text-center">Entrega</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notas.map((nota) => {
                const saldo = nota.total - nota.pagado;
                const isExpanded = expandedNota === nota.id;
                return (
                  <>
                    <TableRow
                      key={nota.id}
                      className={`cursor-pointer hover:bg-muted/50 ${saldo > 0.01 ? 'bg-amber-50/50' : ''}`}
                      onClick={() => setExpandedNota(isExpanded ? null : nota.id)}
                    >
                      <TableCell className="px-2">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        #{nota.folio_display || nota.folio}
                      </TableCell>
                      <TableCell>
                        <div>{nota.fecha}</div>
                        <div className="text-xs text-muted-foreground">{nota.hora}</div>
                      </TableCell>
                      <TableCell>{nota.cliente}</TableCell>
                      <TableCell className="text-right font-semibold">{formatPrice(nota.total)}</TableCell>
                      <TableCell className="text-right text-green-700">{formatPrice(nota.pagado)}</TableCell>
                      <TableCell className={`text-right font-semibold ${saldo > 0.01 ? 'text-amber-700' : 'text-green-700'}`}>
                        {formatPrice(saldo)}
                      </TableCell>
                      <TableCell className="text-center">
                        {nota.pago_status === 'pagado' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Pagado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-300 text-amber-700">
                            <Clock className="mr-1 h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={(e) => { e.stopPropagation(); void handleToggleEntrega(nota.id, nota.entrega_status); }}
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
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {saldo > 0.01 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => openPagoDialog(nota)}
                            >
                              <DollarSign className="h-3 w-3" />
                              Pagar
                            </Button>
                          )}
                          {waConfig?.chat_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:text-green-800"
                              title="Enviar por WhatsApp"
                              disabled={sendingWA === nota.id}
                              onClick={() => void handleSendWhatsApp(nota)}
                            >
                              {sendingWA === nota.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <MessageSquare className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Ver nota / Reimprimir"
                            onClick={() => {
                              const url = `${window.location.origin}/entrega/${nota.entrega_token}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-amber-500 hover:text-amber-700"
                            title="Cancelar nota"
                            onClick={() => {
                              if (confirm(`¿Cancelar nota #${nota.folio_display || nota.folio}?`)) {
                                void handleCancelNota(nota.id);
                              }
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                            title="Eliminar nota (revierte inventario)"
                            onClick={() => {
                              if (confirm(`¿ELIMINAR nota #${nota.folio_display || nota.folio}? Se revertira el inventario y se borrara permanentemente.`)) {
                                void handleDeleteNota(nota.id, nota.folio_display || String(nota.folio));
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded: payment history */}
                    {isExpanded && (
                      <TableRow key={`${nota.id}-detail`}>
                        <TableCell colSpan={10} className="bg-muted/30 p-0">
                          <div className="px-8 py-3 space-y-3">
                            {nota.notas_pago && (
                              <p className="text-xs text-muted-foreground italic">{nota.notas_pago}</p>
                            )}

                            {/* Items sold */}
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Artículos
                              </p>
                              {expandedItems.length > 0 ? (
                                <div className="rounded border bg-white">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted/40">
                                      <tr>
                                        <th className="px-3 py-1 text-left text-xs font-medium">Producto</th>
                                        <th className="px-3 py-1 text-right text-xs font-medium">Cant</th>
                                        <th className="px-3 py-1 text-right text-xs font-medium">Precio</th>
                                        <th className="px-3 py-1 text-right text-xs font-medium">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {expandedItems.map((item, idx) => (
                                        <tr key={idx}>
                                          <td className="px-3 py-1 text-xs">{item.art}</td>
                                          <td className="px-3 py-1 text-right text-xs">{item.can}</td>
                                          <td className="px-3 py-1 text-right text-xs">{formatPrice(item.prec)}</td>
                                          <td className="px-3 py-1 text-right text-xs font-semibold">{formatPrice((item.prec - item.descue) * item.can)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="rounded border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                                  Nota importada — Total: <span className="font-semibold text-foreground">{formatPrice(nota.total)}</span>
                                  <span className="ml-2 capitalize">({nota.metodo_pago})</span>
                                </div>
                              )}
                            </div>

                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Historial de Pagos
                            </p>
                            {expandedPagos.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
                            ) : (
                              <div className="rounded border bg-white">
                                <table className="w-full text-sm">
                                  <thead className="bg-muted/40">
                                    <tr>
                                      <th className="px-3 py-1.5 text-left text-xs font-medium">Fecha</th>
                                      <th className="px-3 py-1.5 text-left text-xs font-medium">Metodo</th>
                                      <th className="px-3 py-1.5 text-right text-xs font-medium">Monto</th>
                                      <th className="px-3 py-1.5 text-left text-xs font-medium">Nota</th>
                                      <th className="px-3 py-1.5 text-left text-xs font-medium">Registrado por</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {expandedPagos.map((p) => (
                                      <tr key={p.id}>
                                        <td className="px-3 py-1.5 text-xs">
                                          {new Date(p.created_at).toLocaleDateString('es-MX')} {new Date(p.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-3 py-1.5 text-xs capitalize">{p.metodo_pago}</td>
                                        <td className="px-3 py-1.5 text-right font-semibold text-green-700">{formatPrice(p.monto)}</td>
                                        <td className="px-3 py-1.5 text-xs text-muted-foreground">{p.nota || '—'}</td>
                                        <td className="px-3 py-1.5 text-xs text-muted-foreground">{p.created_by_name || '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Registrar Pago Dialog */}
      <Dialog open={!!pagoDialogNota} onOpenChange={(open) => { if (!open) setPagoDialogNota(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          {pagoDialogNota && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Nota:</span>
                  <span className="font-mono font-bold">#{pagoDialogNota.folio_display || pagoDialogNota.folio}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-medium">{pagoDialogNota.cliente}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{formatPrice(pagoDialogNota.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pagado:</span>
                  <span className="text-green-700">{formatPrice(pagoDialogNota.pagado)}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-700">
                  <span>Saldo:</span>
                  <span>{formatPrice(pagoDialogNota.total - pagoDialogNota.pagado)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Forma de Pago</label>
                <div className="grid grid-cols-5 gap-1">
                  {PAGO_METHODS.map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        onClick={() => setPagoMetodo(pm.id)}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-[10px] font-medium transition-all ${
                          pagoMetodo === pm.id
                            ? 'border-teal-600 bg-teal-50 text-teal-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Monto</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pagoMonto}
                    onChange={(e) => setPagoMonto(e.target.value)}
                    placeholder="0.00"
                    className="h-10 text-center text-lg font-bold"
                    autoFocus
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 shrink-0 text-xs"
                    onClick={() => setPagoMonto((pagoDialogNota.total - pagoDialogNota.pagado).toFixed(2))}
                  >
                    Saldo completo
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nota (opcional)</label>
                <Textarea
                  value={pagoNota}
                  onChange={(e) => setPagoNota(e.target.value)}
                  placeholder="Referencia de transferencia, detalle de trueque, etc."
                  className="h-16"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPagoDialogNota(null)}>Cancelar</Button>
                <Button
                  onClick={handleRegistrarPago}
                  disabled={!pagoMonto || parseFloat(pagoMonto) <= 0 || registrarPago.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {registrarPago.isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-1 h-4 w-4" />
                  )}
                  Registrar Pago
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
