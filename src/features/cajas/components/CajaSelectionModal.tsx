import { useState, useMemo } from 'react';
import { Monitor, Loader2, Lock, Hash, Store, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useUserCajas,
  useActiveSessions,
  useOpenCaja,
  type CajaRow,
  type CajaSession,
} from '../hooks/useCajas';
import { useVisibleTiendas, type TiendaRow } from '@/features/tiendas/hooks/useTiendas';
import { useAuth } from '@/features/auth/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

interface CajaSelectionModalProps {
  open: boolean;
  onCajaSelected: (session: CajaSession) => void;
}

type Step = 'tienda' | 'caja';

export function CajaSelectionModal({ open, onCajaSelected }: CajaSelectionModalProps) {
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const isAdmin = role === 'admin';
  const { data: tiendas = [], isLoading: loadingTiendas } = useVisibleTiendas();
  const { data: cajas = [], isLoading: loadingCajas } = useUserCajas();
  const { data: sessions = [], isLoading: loadingSessions } = useActiveSessions();
  const openCaja = useOpenCaja();

  const [step, setStep] = useState<Step>('tienda');
  const [selectedTienda, setSelectedTienda] = useState<TiendaRow | null>(null);
  const [selectedCaja, setSelectedCaja] = useState<CajaRow | null>(null);

  // Auto-skip tienda step if only 1 tienda
  const effectiveTiendas = tiendas;
  const autoSkip = effectiveTiendas.length === 1;

  // If only 1 tienda, auto-select it
  const activeTienda = autoSkip ? effectiveTiendas[0] : selectedTienda;

  // Filter cajas by selected tienda
  const filteredCajas = useMemo(() => {
    if (!activeTienda) return cajas;
    return cajas.filter(
      (c) => c.tienda_id === activeTienda.id || !c.tienda_id,
    );
  }, [cajas, activeTienda]);

  // Determine effective step
  const effectiveStep = autoSkip ? 'caja' : step;

  function getSessionForCaja(cajaId: string) {
    return sessions.find((s) => s.caja_id === cajaId);
  }

  function handleSelectTienda(tienda: TiendaRow) {
    setSelectedTienda(tienda);
    setSelectedCaja(null);
    setStep('caja');
  }

  function handleBack() {
    setStep('tienda');
    setSelectedTienda(null);
    setSelectedCaja(null);
  }

  async function handleOpen() {
    if (!selectedCaja || !user) return;
    try {
      const session = await openCaja.mutateAsync({
        cajaId: selectedCaja.id,
        userId: user.id,
        userName: user.email?.split('@')[0] ?? 'Usuario',
        montoApertura: 0,
      });
      toast.success(`Caja "${selectedCaja.nombre}" abierta`);
      onCajaSelected(session);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al abrir caja';
      toast.error(msg);
    }
  }

  const isLoading = loadingTiendas || loadingCajas || loadingSessions;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : effectiveStep === 'tienda' ? (
          /* ===== STEP 1: Select Punto de Venta ===== */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Store className="h-5 w-5" />
                Seleccionar Punto de Venta
              </DialogTitle>
              <DialogDescription>
                Selecciona el punto de venta donde vas a trabajar
              </DialogDescription>
            </DialogHeader>

            {effectiveTiendas.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <Store className="mx-auto mb-2 h-8 w-8" />
                <p>No hay puntos de venta disponibles para tu usuario.</p>
                <p className="text-sm">Contacta al administrador.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {effectiveTiendas.map((tienda) => {
                  const tiendaCajas = cajas.filter((c) => c.tienda_id === tienda.id);
                  return (
                    <button
                      key={tienda.id}
                      onClick={() => handleSelectTienda(tienda)}
                      className="flex items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-teal-400 hover:bg-teal-50 active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <Store className="h-5 w-5 text-teal-600" />
                        <div>
                          <p className="font-medium">{tienda.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {tienda.direccion || 'Sin direccion'}
                            {' · '}
                            {tiendaCajas.length} caja{tiendaCajas.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ===== STEP 2: Select Caja ===== */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                {!autoSkip && (
                  <button onClick={handleBack} className="rounded p-1 hover:bg-gray-100">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <Monitor className="h-5 w-5" />
                Seleccionar Caja
              </DialogTitle>
              <DialogDescription>
                {activeTienda?.nombre ?? 'Punto de Venta'} — {isAdmin
                  ? 'Selecciona una caja registradora'
                  : 'Debes seleccionar una caja para continuar'}
              </DialogDescription>
            </DialogHeader>

            {filteredCajas.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <Monitor className="mx-auto mb-2 h-8 w-8" />
                <p>No hay cajas disponibles en este punto de venta.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2">
                  {filteredCajas.map((caja) => {
                    const session = getSessionForCaja(caja.id);
                    const inUse = !!session;
                    const isMySession = session?.user_id === user?.id;
                    const isSelected = selectedCaja?.id === caja.id;

                    return (
                      <button
                        key={caja.id}
                        disabled={inUse && !isMySession}
                        onClick={() => setSelectedCaja(isSelected ? null : caja)}
                        className={`flex items-center justify-between rounded-lg border-2 p-4 text-left transition-all min-h-[56px] ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50'
                            : inUse && !isMySession
                              ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Monitor className={`h-5 w-5 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-medium">{caja.nombre}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {caja.prefijo_folio && (
                                <>
                                  <span className="flex items-center gap-0.5">
                                    <Hash className="h-3 w-3" />
                                    {caja.prefijo_folio}
                                  </span>
                                  <span>|</span>
                                </>
                              )}
                              <span>Folio actual: {caja.folio_actual}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {inUse ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Lock className="h-3 w-3" />
                              <span className={isMySession ? 'text-amber-600' : 'text-red-500'}>
                                {isMySession ? 'Tu sesion' : `En uso por ${session.user_name}`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-green-600">Disponible</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  className="h-12 w-full bg-teal-600 text-lg font-bold hover:bg-teal-700"
                  disabled={!selectedCaja || openCaja.isPending}
                  onClick={handleOpen}
                >
                  {openCaja.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Monitor className="mr-2 h-5 w-5" />
                  )}
                  Abrir Caja
                </Button>

                {openCaja.isError && (
                  <p className="text-center text-sm text-red-600">
                    Error: {openCaja.error.message}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
