import { useState, useRef } from 'react';
import {
  Calculator,
  Receipt,
  Printer,
  DollarSign,
  Package,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/features/auth/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { useTodaySales, useCorteHistory, useCreateCorte } from '../hooks/useCortes';
import type { CorteRow } from '../hooks/useCortes';
import { CortePrint } from './CortePrint';
import { useMyActiveSession, useCloseCaja, useActiveCajas } from '@/features/cajas/hooks/useCajas';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function CorteView() {
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const { data: activeSession } = useMyActiveSession();
  const { data: corteData, isLoading: loadingSales } = useTodaySales(activeSession?.id);
  const { data: cortes = [], isLoading: loadingCortes } = useCorteHistory();
  const createCorte = useCreateCorte();
  const closeCaja = useCloseCaja();
  const { data: cajas = [] } = useActiveCajas();
  const activeCaja = cajas.find((c) => c.id === activeSession?.caja_id);
  const activeCajaName = activeCaja?.nombre;
  const activeCajaPrefix = activeCaja?.prefijo_folio;

  const [showPrint, setShowPrint] = useState(false);
  const [printFolio, setPrintFolio] = useState(0);
  const [viewingCorte, setViewingCorte] = useState<CorteRow | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const isAdmin = role === 'admin';
  const cajero = user?.email?.split('@')[0] ?? 'Cajero';
  const today = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const now = new Date().toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  async function handleCorte() {
    if (!corteData) return;

    try {
      const folio = await createCorte.mutateAsync({
        ...corteData,
        cajaId: activeSession?.caja_id ?? undefined,
      });
      setPrintFolio(folio);
      setShowPrint(true);

      // Close the caja session if one is active
      if (activeSession) {
        try {
          await closeCaja.mutateAsync({
            sessionId: activeSession.id,
            montoCierre: corteData.totalSales,
            corteId: folio,
          });
          toast.success(`Corte #${folio} registrado y caja cerrada`);
        } catch {
          toast.success(`Corte #${folio} registrado (no se pudo cerrar la sesion de caja)`);
        }
      } else {
        toast.success(`Corte #${folio} registrado exitosamente`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al realizar corte: ${msg}`);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleReprint(corte: CorteRow) {
    setViewingCorte(corte);
    setPrintFolio(corte.ultcort);
    setShowPrint(true);
    // Delay print to allow React to re-render the print area with historical data
    setTimeout(() => window.print(), 500);
  }

  if (loadingSales || loadingCortes) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Verification: compare total sales vs sum of payment methods
  const totalPayments = corteData?.breakdown.reduce((acc, b) => acc + b.total, 0) ?? 0;
  const totalSales = corteData?.totalSales ?? 0;
  const difference = totalSales - totalPayments;
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <div className="space-y-6">
      {/* Print area (hidden on screen, visible on print) */}
      <div ref={printRef} className="hidden print:block">
        <CortePrint
          folioCorte={printFolio}
          fecha={viewingCorte ? viewingCorte.fecha : today}
          hora={viewingCorte ? viewingCorte.hora : now}
          cajero={cajero}
          ticketCount={viewingCorte ? (viewingCorte.ulttk - viewingCorte.initk + 1) : (corteData?.ticketCount ?? 0)}
          totalProducts={viewingCorte ? 0 : (corteData?.totalProducts ?? 0)}
          breakdown={viewingCorte ? [] : (corteData?.breakdown ?? [])}
          productSales={viewingCorte ? [] : (corteData?.productSales ?? [])}
          totalSales={viewingCorte ? viewingCorte.vtato : (corteData?.totalSales ?? 0)}
          cajaName={activeCajaName}
          cajaPrefix={activeCajaPrefix}
          folioInicial={viewingCorte ? String(viewingCorte.initk) : corteData?.initkDisplay}
          folioFinal={viewingCorte ? String(viewingCorte.ulttk) : corteData?.ulttkDisplay}
        />
      </div>

      {/* Screen content (hidden on print) */}
      <div className="print:hidden">
        {/* Active session info */}
        {activeSession && activeCajaName && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
            <Monitor className="h-4 w-4" />
            <span>
              Corte para la caja <strong>{activeCajaName}</strong>
              {activeCajaPrefix ? ` (${activeCajaPrefix})` : ''} — sesion abierta por{' '}
              <strong>{activeSession.user_name}</strong> desde las{' '}
              {new Date(activeSession.opened_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Per-caja folio range */}
        {corteData && !corteData.empty && corteData.initkDisplay && (
          <div className="mb-4 flex items-center gap-4 rounded-lg border bg-muted/30 p-3 text-sm">
            <span>
              <strong>Folio inicial:</strong> {corteData.initkDisplay}
            </span>
            <span className="text-muted-foreground">|</span>
            <span>
              <strong>Folio final:</strong> {corteData.ulttkDisplay}
            </span>
          </div>
        )}

        {/* A. Summary cards */}
        <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Total Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(corteData?.totalSales ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Receipt className="h-4 w-4" />
                Total Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {corteData?.ticketCount ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Package className="h-4 w-4" />
                Total Productos Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {corteData?.totalProducts ?? 0}
              </div>
            </CardContent>
          </Card>
          {isAdmin && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  Utilidad Bruta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(corteData?.profit ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Costo: {formatPrice(corteData?.totalCost ?? 0)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* B. Product Detail Table */}
        {corteData && !corteData.empty && corteData.productSales.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Productos Vendidos Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-right">Cant</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corteData.productSales.map((p) => (
                    <TableRow key={p.art}>
                      <TableCell className="text-right">{p.cantidad}</TableCell>
                      <TableCell className="font-mono text-xs">{p.art}</TableCell>
                      <TableCell>{p.descr}</TableCell>
                      <TableCell className="text-right">{formatPrice(p.precio)}</TableCell>
                      <TableCell className="text-right">{formatPrice(p.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="text-right font-bold">
                      {corteData.totalProducts}
                    </TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right font-bold">TOTAL:</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatPrice(corteData.totalSales)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* C. Payment Method Breakdown */}
        {corteData && !corteData.empty && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Desglose por Forma de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Forma de Pago</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corteData.breakdown.map((b) => (
                    <TableRow key={b.method}>
                      <TableCell className="font-medium">{b.label}</TableCell>
                      <TableCell className="text-right">{b.tickets}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(b.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">TOTAL</TableCell>
                    <TableCell className="text-right font-bold">
                      {corteData.ticketCount}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatPrice(corteData.totalSales)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* D. Verification Section */}
        {corteData && !corteData.empty && (
          <Card className={isBalanced ? 'border-green-200' : 'border-red-200'}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                {isBalanced ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                Verificación de Cuadre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Ventas:</span>
                  <span className="font-bold">{formatPrice(totalSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Suma Formas de Pago:</span>
                  <span className="font-bold">{formatPrice(totalPayments)}</span>
                </div>
                <hr className="my-1" />
                <div className="flex justify-between">
                  <span>Diferencia:</span>
                  <span
                    className={`font-bold ${
                      isBalanced ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPrice(difference)}
                  </span>
                </div>
                {isBalanced ? (
                  <p className="mt-1 text-green-600 text-xs">Los totales cuadran correctamente.</p>
                ) : (
                  <p className="mt-1 text-red-600 text-xs font-medium">
                    Hay una diferencia de {formatPrice(Math.abs(difference))}. Revisa los datos.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {corteData?.empty && (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <Receipt className="mx-auto mb-2 h-8 w-8" />
            <p>No hay ventas pendientes de corte</p>
          </div>
        )}

        {/* E. Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            disabled={!corteData || createCorte.isPending}
            onClick={handleCorte}
          >
            {createCorte.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="mr-2 h-4 w-4" />
            )}
            Hacer Corte del Día
          </Button>
          {showPrint && (
            <Button variant="outline" size="lg" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Corte
            </Button>
          )}
        </div>

        {/* F. Corte History */}
        {cortes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Historial de Cortes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Corte #</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cortes.slice(0, 20).map((corte) => (
                    <TableRow key={corte.id}>
                      <TableCell className="font-medium">#{corte.ultcort}</TableCell>
                      <TableCell>{corte.fecha}</TableCell>
                      <TableCell>{corte.hora}</TableCell>
                      <TableCell className="text-right">
                        {corte.initk}-{corte.ulttk}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(corte.vtato)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingCorte(viewingCorte?.id === corte.id ? null : corte)}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            Ver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReprint(corte)}
                          >
                            <Printer className="mr-1 h-3 w-3" />
                            Reimprimir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Detail view for selected corte */}
              {viewingCorte && (
                <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                  <h4 className="mb-2 font-semibold">
                    Detalle Corte #{viewingCorte.ultcort}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground">Fecha:</span>{' '}
                      {viewingCorte.fecha}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hora:</span>{' '}
                      {viewingCorte.hora}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tickets:</span>{' '}
                      {viewingCorte.initk} - {viewingCorte.ulttk}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Ventas:</span>{' '}
                      {formatPrice(viewingCorte.vtato)}
                    </div>
                    {isAdmin && (
                      <>
                        <div>
                          <span className="text-muted-foreground">Costo:</span>{' '}
                          {formatPrice(viewingCorte.ctovd)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Utilidad:</span>{' '}
                          <span className="text-green-600 font-medium">
                            {formatPrice(viewingCorte.utibr)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
