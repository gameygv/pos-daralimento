import { useState } from 'react';
import {
  DollarSign, Users, FileText, CheckCircle, Clock,
  ChevronDown, ChevronRight, Plus, Loader2,
  Banknote, CreditCard, ArrowRightLeft, Repeat, Gift,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  type NotaRow,
} from '@/features/notas/hooks/useNotas';
import { toast } from 'sonner';

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

/** Sub-component: expanded details for a nota (items + payments) */
function NotaExpandedDetails({ nota, colSpan }: { nota: NotaRow; colSpan: number }) {
  const { data: items = [], isLoading: loadingItems } = useNotaItems(nota.folio);
  const { data: pagos = [], isLoading: loadingPagos } = useNotaPagos(nota.id);
  const saldo = nota.total - nota.pagado;

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="bg-muted/20 p-0">
        <div className="px-6 py-3 space-y-3">
          {/* Artículos de la nota */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Artículos</p>
            {loadingItems ? (
              <p className="text-xs text-muted-foreground">Cargando...</p>
            ) : items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin artículos</p>
            ) : (
              <div className="rounded border bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-3 py-1 text-left font-medium">Producto</th>
                      <th className="px-3 py-1 text-center font-medium">Cant.</th>
                      <th className="px-3 py-1 text-right font-medium">Precio</th>
                      <th className="px-3 py-1 text-right font-medium">Desc.</th>
                      <th className="px-3 py-1 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item, idx) => {
                      const subtotal = (item.prec - item.descue) * item.can;
                      return (
                        <tr key={idx}>
                          <td className="px-3 py-1">{item.art}</td>
                          <td className="px-3 py-1 text-center">{item.can}</td>
                          <td className="px-3 py-1 text-right">{formatPrice(item.prec)}</td>
                          <td className="px-3 py-1 text-right">{item.descue > 0 ? formatPrice(item.descue) : '—'}</td>
                          <td className="px-3 py-1 text-right font-medium">{formatPrice(subtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resumen de saldo */}
          <div className="flex items-center justify-between rounded bg-amber-50 px-3 py-1.5 text-xs">
            <span className="font-medium">Total: {formatPrice(nota.total)}</span>
            <span className="text-green-700">Pagado: {formatPrice(nota.pagado)}</span>
            <span className="font-bold text-amber-700">Resta: {formatPrice(saldo)}</span>
          </div>

          {/* Pagos registrados */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Pagos registrados</p>
            {loadingPagos ? (
              <p className="text-xs text-muted-foreground">Cargando...</p>
            ) : pagos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin pagos</p>
            ) : (
              <div className="space-y-1">
                {pagos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded bg-white px-3 py-1 text-xs">
                    <span>{new Date(p.created_at).toLocaleDateString('es-MX')} — <span className="capitalize">{p.metodo_pago}</span></span>
                    <span className="font-semibold text-green-700">{formatPrice(p.monto)}</span>
                    {p.nota && <span className="text-muted-foreground ml-2">({p.nota})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function CxCList() {
  // Fetch notas with pending payment
  const { data: allNotas = [], isLoading } = useNotas({ pagoStatus: 'pendiente' });
  // Fetch paid notas that were CxC (have payment records = were paid later)
  const { data: paidNotas = [], isLoading: loadingPaid } = useNotas({ pagoStatus: 'pagado' });
  const [expandedNota, setExpandedNota] = useState<string | null>(null);
  const registrarPago = useRegistrarPago();
  const [showHistorial, setShowHistorial] = useState(false);

  // Pago dialog
  const [pagoDialogNota, setPagoDialogNota] = useState<NotaRow | null>(null);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoMetodo, setPagoMetodo] = useState('efectivo');
  const [pagoNotaText, setPagoNotaText] = useState('');

  // Group by client
  const byClient = new Map<string, { notas: NotaRow[]; totalSaldo: number }>();
  for (const nota of allNotas) {
    const saldo = nota.total - nota.pagado;
    if (saldo <= 0.01) continue;
    const key = nota.cliente;
    if (!byClient.has(key)) byClient.set(key, { notas: [], totalSaldo: 0 });
    const group = byClient.get(key)!;
    group.notas.push(nota);
    group.totalSaldo += saldo;
  }

  const clientList = [...byClient.entries()].sort((a, b) => b[1].totalSaldo - a[1].totalSaldo);
  const totalPorCobrar = clientList.reduce((s, [, g]) => s + g.totalSaldo, 0);
  const totalClientes = clientList.length;
  const totalNotas = clientList.reduce((s, [, g]) => s + g.notas.length, 0);

  function openPagoDialog(nota: NotaRow) {
    setPagoDialogNota(nota);
    setPagoMonto('');
    setPagoMetodo('efectivo');
    setPagoNotaText('');
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
        nota: pagoNotaText.trim() || undefined,
      });
      toast.success(result.isFullyPaid ? 'Nota liquidada' : `Pago de ${formatPrice(monto)} registrado`);
      setPagoDialogNota(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando cuentas por cobrar...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{formatPrice(totalPorCobrar)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes con Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Users className="h-6 w-6 text-muted-foreground" />
              {totalClientes}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <FileText className="h-6 w-6 text-muted-foreground" />
              {totalNotas}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client list */}
      {clientList.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-400" />
          <p className="text-lg font-medium">Sin cuentas por cobrar</p>
          <p className="text-sm">Todas las notas estan pagadas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clientList.map(([cliente, group]) => (
            <Card key={cliente} className="border-l-4 border-l-amber-400">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-amber-600" />
                    {cliente}
                  </CardTitle>
                  <div className="text-right">
                    <p className="text-xl font-bold text-amber-700">{formatPrice(group.totalSaldo)}</p>
                    <p className="text-xs text-muted-foreground">{group.notas.length} nota{group.notas.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Pagado</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="text-center">Accion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.notas.map((nota) => {
                        const saldo = nota.total - nota.pagado;
                        const isExpanded = expandedNota === nota.id;
                        return (
                          <>
                            <TableRow
                              key={nota.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setExpandedNota(isExpanded ? null : nota.id)}
                            >
                              <TableCell className="px-2">
                                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              </TableCell>
                              <TableCell className="font-mono text-sm font-semibold">
                                #{nota.folio_display || nota.folio}
                              </TableCell>
                              <TableCell className="text-sm">{nota.fecha}</TableCell>
                              <TableCell className="text-right text-sm">{formatPrice(nota.total)}</TableCell>
                              <TableCell className="text-right text-sm text-green-700">{formatPrice(nota.pagado)}</TableCell>
                              <TableCell className="text-right text-sm font-bold text-amber-700">{formatPrice(saldo)}</TableCell>
                              <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 gap-1 border-green-300 text-green-700 hover:bg-green-50"
                                  onClick={() => openPagoDialog(nota)}
                                >
                                  <DollarSign className="h-3 w-3" />
                                  Pagar
                                </Button>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <NotaExpandedDetails key={`${nota.id}-details`} nota={nota} colSpan={7} />
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Historial de CxC saldadas */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowHistorial(!showHistorial)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Historial de Cuentas Saldadas
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {paidNotas.filter((n) => n.pagado > 0).length} notas
              </span>
              {showHistorial ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </div>
        </CardHeader>
        {showHistorial && (
          <CardContent>
            {loadingPaid ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : (
              <div className="rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Pagado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidNotas
                      .filter((n) => n.pagado > 0)
                      .map((nota) => {
                        const isExp = expandedNota === nota.id;
                        return (
                          <>
                            <TableRow
                              key={nota.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setExpandedNota(isExp ? null : nota.id)}
                            >
                              <TableCell className="px-2">
                                {isExp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              </TableCell>
                              <TableCell className="font-mono text-sm">#{nota.folio_display || nota.folio}</TableCell>
                              <TableCell className="text-sm">{nota.fecha}</TableCell>
                              <TableCell className="text-sm">{nota.cliente}</TableCell>
                              <TableCell className="text-right text-sm">{formatPrice(nota.total)}</TableCell>
                              <TableCell className="text-right text-sm text-green-700">{formatPrice(nota.pagado)}</TableCell>
                            </TableRow>
                            {isExp && (
                              <NotaExpandedDetails key={`${nota.id}-hist-details`} nota={nota} colSpan={6} />
                            )}
                          </>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Registrar Pago Dialog */}
      <Dialog open={!!pagoDialogNota} onOpenChange={(open) => { if (!open) setPagoDialogNota(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          {pagoDialogNota && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between"><span>Nota:</span><span className="font-mono font-bold">#{pagoDialogNota.folio_display || pagoDialogNota.folio}</span></div>
                <div className="flex justify-between"><span>Cliente:</span><span className="font-medium">{pagoDialogNota.cliente}</span></div>
                <div className="flex justify-between"><span>Total:</span><span>{formatPrice(pagoDialogNota.total)}</span></div>
                <div className="flex justify-between"><span>Pagado:</span><span className="text-green-700">{formatPrice(pagoDialogNota.pagado)}</span></div>
                <div className="flex justify-between font-bold text-amber-700"><span>Saldo:</span><span>{formatPrice(pagoDialogNota.total - pagoDialogNota.pagado)}</span></div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Forma de Pago</label>
                <div className="grid grid-cols-5 gap-1">
                  {PAGO_METHODS.map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <button key={pm.id} onClick={() => setPagoMetodo(pm.id)}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-[10px] font-medium transition-all ${pagoMetodo === pm.id ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        <Icon className="h-4 w-4" />{pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Monto</label>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" min="0" value={pagoMonto} onChange={(e) => setPagoMonto(e.target.value)} placeholder="0.00" className="h-10 text-center text-lg font-bold" autoFocus />
                  <Button variant="outline" size="sm" className="h-10 shrink-0 text-xs" onClick={() => setPagoMonto((pagoDialogNota.total - pagoDialogNota.pagado).toFixed(2))}>Saldo</Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nota (opcional)</label>
                <Textarea value={pagoNotaText} onChange={(e) => setPagoNotaText(e.target.value)} placeholder="Referencia, detalle..." className="h-16" />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPagoDialogNota(null)}>Cancelar</Button>
                <Button onClick={handleRegistrarPago} disabled={!pagoMonto || parseFloat(pagoMonto) <= 0 || registrarPago.isPending} className="bg-green-600 hover:bg-green-700">
                  {registrarPago.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
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
