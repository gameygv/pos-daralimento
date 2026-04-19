import { useState } from 'react';
import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Repeat,
  Gift,
  CheckCircle,
  Printer,
  Split,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { useCreateSale, type MetodoPago } from '../hooks/useSale';
import { printTicketWithTemplate, type TicketTemplate, type FullTicketData, type TicketConfig } from '@/utils/ticketTemplates';
import { supabase } from '@/integrations/supabase/client';
import type { CartItem, CartTotals } from '../types';
import { incrementCouponUsage } from '@/features/cupones/hooks/useCupones';
import { useLealtadConfig, useAcumularPuntos } from '@/features/lealtad/hooks/useLealtad';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

const PAYMENT_METHODS: { id: MetodoPago; label: string; icon: React.ReactNode }[] = [
  { id: 'efectivo', label: 'Efectivo', icon: <Banknote className="h-5 w-5" /> },
  { id: 'tarjeta', label: 'Tarjeta', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'transferencia', label: 'Transferencia', icon: <ArrowRightLeft className="h-5 w-5" /> },
  { id: 'trueque', label: 'Trueque', icon: <Repeat className="h-5 w-5" /> },
  { id: 'regalo', label: 'Regalo', icon: <Gift className="h-5 w-5" /> },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

interface SplitPayment {
  id: string;
  method: MetodoPago;
  amount: number;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  totals: CartTotals;
  globalDiscountPct?: number;
  couponId?: string | null;
  onPaymentComplete: () => void;
  clienteName?: string;
  clienteId?: string | null;
  cajaId?: string | null;
  cajaSessionId?: string | null;
}

type DialogStep = 'payment' | 'success';

export function PaymentDialog({
  open,
  onOpenChange,
  items,
  totals,
  globalDiscountPct = 0,
  couponId,
  onPaymentComplete,
  clienteName,
  clienteId,
  cajaId,
  cajaSessionId,
}: PaymentDialogProps) {
  const { user } = useAuth();
  const createSale = useCreateSale();

  // Get seller full name from vende table
  const { data: sellerName } = useQuery({
    queryKey: ['seller-name', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = (await supabase
        .from('vende' as never)
        .select('nomv')
        .eq('codven' as never, user.id as never)
        .maybeSingle()) as unknown as { data: { nomv: string } | null };
      return data?.nomv ?? user.email?.split('@')[0] ?? 'Vendedor';
    },
    enabled: !!user,
  });
  const { data: lealtadConfig } = useLealtadConfig();
  const acumularPuntos = useAcumularPuntos();

  const [step, setStep] = useState<DialogStep>('payment');
  // Single payment mode
  const [method, setMethod] = useState<MetodoPago>('efectivo');
  const [amountReceived, setAmountReceived] = useState<string>('');
  // Notes for trueque/regalo
  const [truequeNote, setTruequeNote] = useState('');
  const [regaloMotivo, setRegaloMotivo] = useState('');
  const [splitTruequeNote, setSplitTruequeNote] = useState('');
  const [splitRegaloMotivo, setSplitRegaloMotivo] = useState('');
  // Split payment mode
  const [splitMode, setSplitMode] = useState(false);
  const [splits, setSplits] = useState<SplitPayment[]>([]);
  const [splitMethod, setSplitMethod] = useState<MetodoPago>('efectivo');
  const [splitAmount, setSplitAmount] = useState<string>('');
  // Result
  const [resultFolio, setResultFolio] = useState<number>(0);
  const [resultFolioDisplay, setResultFolioDisplay] = useState<string>('');
  const [resultEntregaToken, setResultEntregaToken] = useState<string>('');
  const [usedPayments, setUsedPayments] = useState<SplitPayment[]>([]);

  const total = totals.total;
  const received = parseFloat(amountReceived) || 0;
  const change = received - total;

  // Split calculations
  const splitPaid = splits.reduce((s, p) => s + p.amount, 0);
  const splitRemaining = total - splitPaid;

  // Can confirm logic
  const canConfirmSingle =
    (method === 'regalo' && regaloMotivo.trim().length > 0) ||
    (method === 'trueque' && truequeNote.trim().length > 0) ||
    (method !== 'efectivo' && method !== 'regalo' && method !== 'trueque') ||
    (method === 'efectivo' && received >= total);
  const canConfirmSplit = splitRemaining <= 0.01; // allow rounding

  function resetState() {
    setStep('payment');
    setMethod('efectivo');
    setAmountReceived('');
    setTruequeNote('');
    setRegaloMotivo('');
    setSplitTruequeNote('');
    setSplitRegaloMotivo('');
    setSplitMode(false);
    setSplits([]);
    setSplitMethod('efectivo');
    setSplitAmount('');
    setResultFolio(0);
    setResultFolioDisplay('');
    setResultEntregaToken('');
    setUsedPayments([]);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      if (step === 'success') {
        onPaymentComplete();
      }
      resetState();
    }
    onOpenChange(isOpen);
  }

  function handleAddSplit() {
    const amt = parseFloat(splitAmount) || 0;
    if (amt <= 0) return;
    const capped = Math.min(amt, splitRemaining);
    setSplits((prev) => [
      ...prev,
      { id: crypto.randomUUID(), method: splitMethod, amount: capped },
    ]);
    setSplitAmount('');
  }

  function handleRemoveSplit(id: string) {
    setSplits((prev) => prev.filter((s) => s.id !== id));
  }

  function handleToggleSplit() {
    if (!splitMode) {
      setSplitMode(true);
      setSplits([]);
      setSplitAmount('');
    } else {
      setSplitMode(false);
      setSplits([]);
    }
  }

  async function handleConfirm() {
    if (splitMode && !canConfirmSplit) return;
    if (!splitMode && !canConfirmSingle) return;

    const seller = sellerName ?? 'Vendedor';
    const cliente = clienteName || 'Mostrador';

    // Determine primary method for DB storage
    // For split: use the method with the highest amount
    const primaryMethod = splitMode
      ? [...splits].sort((a, b) => b.amount - a.amount)[0]?.method ?? 'efectivo'
      : method;

    const paymentsForRecord = splitMode
      ? splits
      : [{ id: '1', method, amount: method === 'regalo' ? 0 : total }];

    // Build payment notes
    const paymentNotes: string[] = [];
    if (!splitMode) {
      if (method === 'trueque' && truequeNote.trim()) paymentNotes.push(`Trueque: ${truequeNote.trim()}`);
      if (method === 'regalo' && regaloMotivo.trim()) paymentNotes.push(`Regalo: ${regaloMotivo.trim()}`);
    } else {
      if (splits.some((s) => s.method === 'trueque') && splitTruequeNote.trim()) paymentNotes.push(`Trueque: ${splitTruequeNote.trim()}`);
      if (splits.some((s) => s.method === 'regalo') && splitRegaloMotivo.trim()) paymentNotes.push(`Regalo: ${splitRegaloMotivo.trim()}`);
    }

    const result = await createSale.mutateAsync({
      items,
      metodoPago: primaryMethod,
      seller,
      cliente,
      cajaId,
      cajaSessionId,
      globalDiscountPct,
      splitPayments: splitMode ? splits.map((s) => ({ method: s.method, amount: s.amount })) : undefined,
      paymentNote: paymentNotes.length > 0 ? paymentNotes.join(' | ') : undefined,
    });

    // Increment coupon usage if one was applied
    if (couponId) {
      void incrementCouponUsage(couponId);
    }

    // Accumulate loyalty points
    if (clienteId && lealtadConfig?.activo) {
      try {
        await acumularPuntos.mutateAsync({
          clienteId,
          montoVenta: total,
          puntosPorPeso: lealtadConfig.puntos_por_peso,
          referencia: result.folioDisplay ?? String(result.folio),
        });
      } catch {
        // Non-blocking: don't fail the sale if points fail
      }
    }

    setResultFolio(result.folio);
    setResultFolioDisplay(result.folioDisplay ?? '');
    setResultEntregaToken(result.entregaToken ?? '');
    setUsedPayments(paymentsForRecord);
    setStep('success');
  }

  async function handlePrint(template: TicketTemplate = 'standard') {
    const now = new Date();
    const seller = sellerName ?? 'Vendedor';
    const primaryMethod = usedPayments.length > 0
      ? [...usedPayments].sort((a, b) => b.amount - a.amount)[0]?.method ?? 'efectivo'
      : method;

    // Load config
    const { data: rawConfig } = (await supabase
      .from('pvcntl' as never)
      .select('*')
      .single()) as unknown as { data: Record<string, unknown> | null };

    const config: TicketConfig = {
      empresa: (rawConfig?.empresa as string) || 'POS',
      logoemp: (rawConfig?.logoemp as string) || null,
      lines: [1, 2, 3].map((n) => rawConfig?.[`lin${n}`] as string).filter(Boolean),
      footerLines: [4, 5, 6, 7].map((n) => rawConfig?.[`lin${n}`] as string).filter(Boolean),
    };

    const ticketData: FullTicketData = {
      folio: resultFolio,
      folioDisplay: resultFolioDisplay || `${resultFolio}`,
      fecha: now.toLocaleDateString('es-MX'),
      hora: now.toLocaleTimeString('es-MX'),
      cliente: clienteName || 'Mostrador',
      items: items.map((item) => ({
        cantidad: item.quantity,
        descrip: item.name,
        precio: item.price,
        note: item.note || undefined,
        discountPct: item.discountPct || undefined,
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      metodo_pago: primaryMethod,
      vendedor: seller,
      entregaToken: resultEntregaToken || undefined,
    };

    try {
      await printTicketWithTemplate(ticketData, config, template);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al imprimir';
      toast.error(msg);
    }
  }

  function handleDone() {
    // onPaymentComplete is called via handleOpenChange when step==='success' and dialog closes
    resetState();
    onOpenChange(false);
  }

  const methodLabel = (m: MetodoPago) =>
    PAYMENT_METHODS.find((pm) => pm.id === m)?.label ?? m;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        {step === 'payment' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Cobrar Venta</DialogTitle>
              <DialogDescription className="sr-only">
                Selecciona el metodo de pago
              </DialogDescription>
            </DialogHeader>

            {/* Total */}
            <div className="rounded-xl bg-teal-50 p-4 text-center">
              <p className="text-sm font-medium text-teal-600">Total a Cobrar</p>
              <p className="text-4xl font-black text-teal-800">{formatPrice(total)}</p>
              <p className="text-xs text-teal-600">
                {totals.itemCount} producto{totals.itemCount !== 1 ? 's' : ''}
                {totals.discount > 0 && (
                  <span className="ml-1 text-orange-600">
                    (desc. -{formatPrice(totals.discount)})
                  </span>
                )}
              </p>
            </div>

            {/* Split toggle */}
            <button
              onClick={handleToggleSplit}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                splitMode
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Split className="h-4 w-4" />
              {splitMode ? 'Pago Dividido Activo' : 'Dividir Pago'}
            </button>

            {!splitMode ? (
              /* ===== SINGLE PAYMENT MODE ===== */
              <>
                {/* Payment method selector */}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Forma de Pago</p>
                  <div className="grid grid-cols-5 gap-1">
                    {PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => {
                          setMethod(pm.id);
                          if (pm.id !== 'efectivo') setAmountReceived('');
                        }}
                        className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 text-xs font-medium transition-all ${
                          method === pm.id
                            ? 'border-teal-600 bg-teal-50 text-teal-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {pm.icon}
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trueque note */}
                {method === 'trueque' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Descripcion del trueque</p>
                    <Textarea
                      placeholder="Describe que se recibio a cambio..."
                      value={truequeNote}
                      onChange={(e) => setTruequeNote(e.target.value)}
                      className="h-20"
                    />
                  </div>
                )}

                {/* Regalo motivo */}
                {method === 'regalo' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Motivo del regalo</p>
                    <Textarea
                      placeholder="Indica el motivo del regalo..."
                      value={regaloMotivo}
                      onChange={(e) => setRegaloMotivo(e.target.value)}
                      className="h-20"
                    />
                  </div>
                )}

                {/* Cash payment details */}
                {method === 'efectivo' && (
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1 text-sm font-medium text-gray-700">Monto Recibido</p>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="h-12 text-center text-2xl font-bold"
                        min={0}
                        step={0.01}
                        autoFocus
                      />
                    </div>

                    {/* Quick amounts */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setAmountReceived(total.toFixed(2))}
                        className="rounded-lg border-2 border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700 hover:bg-teal-100 active:bg-teal-200"
                      >
                        Exacto
                      </button>
                      {QUICK_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setAmountReceived(amt.toString())}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>

                    {/* Change */}
                    {received > 0 && (
                      <div
                        className={`rounded-lg p-3 text-center ${
                          change >= 0
                            ? 'bg-green-50 text-green-800'
                            : 'bg-red-50 text-red-800'
                        }`}
                      >
                        <p className="text-sm font-medium">
                          {change >= 0 ? 'Cambio' : 'Falta'}
                        </p>
                        <p className="text-2xl font-black">
                          {formatPrice(Math.abs(change))}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Confirm button */}
                <Button
                  className="h-14 w-full rounded-lg bg-teal-600 text-lg font-bold text-white shadow-md hover:bg-teal-700 active:bg-teal-800"
                  disabled={!canConfirmSingle || createSale.isPending}
                  onClick={handleConfirm}
                >
                  {createSale.isPending ? (
                    'Procesando...'
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Confirmar Pago
                    </>
                  )}
                </Button>
                {/* CxC button — register sale, paid amount = what was received (or 0) */}
                <Button
                  variant="outline"
                  className="h-10 w-full rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50"
                  disabled={createSale.isPending}
                  onClick={async () => {
                    const seller = sellerName ?? 'Vendedor';
                    const cliente = clienteName || 'Mostrador';
                    // If user entered a partial amount, register it; otherwise 0
                    const partialPaid = method === 'efectivo' ? (parseFloat(amountReceived) || 0) : 0;
                    const actualMethod = partialPaid > 0 ? method : 'efectivo';
                    try {
                      const result = await createSale.mutateAsync({
                        items,
                        metodoPago: actualMethod,
                        seller,
                        cliente,
                        cajaId,
                        cajaSessionId,
                        globalDiscountPct,
                        paymentNote: partialPaid > 0
                          ? `Cuenta por cobrar (pago parcial ${formatPrice(partialPaid)})`
                          : 'Cuenta por cobrar',
                      });
                      // Register partial payment in nota_pagos if amount > 0
                      if (partialPaid > 0 && result.notaId) {
                        const supabaseModule = await import('@/integrations/supabase/client');
                        await supabaseModule.supabase.from('nota_pagos' as never).insert({
                          nota_id: result.notaId,
                          monto: partialPaid,
                          metodo_pago: actualMethod,
                          nota: 'Pago parcial al registrar venta',
                          created_by_name: seller,
                        });
                        await supabaseModule.supabase.from('notas' as never)
                          .update({ pagado: partialPaid } as never)
                          .eq('id' as never, result.notaId as never);
                      }
                      setResultFolio(result.folio);
                      setResultFolioDisplay(result.folioDisplay ?? '');
                      setResultEntregaToken(result.entregaToken ?? '');
                      setUsedPayments([{ id: '1', method: actualMethod, amount: partialPaid }]);
                      setStep('success');
                    } catch (err) {
                      toast.error((err as Error).message);
                    }
                  }}
                >
                  {received > 0 && received < total
                    ? `Cobrar ${formatPrice(received)} y dejar resto en CxC`
                    : 'Dejar como Cuenta por Cobrar'}
                </Button>
              </>
            ) : (
              /* ===== SPLIT PAYMENT MODE ===== */
              <>
                {/* Remaining indicator */}
                <div className={`rounded-lg p-3 text-center ${
                  splitRemaining <= 0.01 ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
                }`}>
                  <p className="text-sm font-medium">
                    {splitRemaining <= 0.01 ? 'Cubierto' : 'Restante'}
                  </p>
                  <p className="text-2xl font-black">
                    {formatPrice(Math.max(0, splitRemaining))}
                  </p>
                </div>

                {/* Added splits */}
                {splits.length > 0 && (
                  <div className="space-y-1">
                    {splits.map((sp) => (
                      <div
                        key={sp.id}
                        className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{methodLabel(sp.method)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{formatPrice(sp.amount)}</span>
                          <button
                            onClick={() => handleRemoveSplit(sp.id)}
                            className="rounded p-1 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add split form */}
                {splitRemaining > 0.01 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Agregar Pago</p>
                    <div className="grid grid-cols-5 gap-1">
                      {PAYMENT_METHODS.map((pm) => (
                        <button
                          key={pm.id}
                          onClick={() => setSplitMethod(pm.id)}
                          className={`flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-lg border-2 p-1.5 text-[10px] font-medium transition-all ${
                            splitMethod === pm.id
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {pm.icon}
                          {pm.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Monto"
                        value={splitAmount}
                        onChange={(e) => setSplitAmount(e.target.value)}
                        className="h-10 flex-1 text-center font-bold"
                        min={0}
                        step={0.01}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs"
                        onClick={() => setSplitAmount(splitRemaining.toFixed(2))}
                      >
                        Resto
                      </Button>
                      <Button
                        size="sm"
                        className="h-10 bg-purple-600 hover:bg-purple-700"
                        onClick={handleAddSplit}
                        disabled={!splitAmount || parseFloat(splitAmount) <= 0}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Trueque/Regalo notes for split mode */}
                {splits.some((s) => s.method === 'trueque') && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700">Descripcion del trueque</p>
                    <Textarea
                      placeholder="Describe que se recibio a cambio..."
                      value={splitTruequeNote}
                      onChange={(e) => setSplitTruequeNote(e.target.value)}
                      className="h-16 text-sm"
                    />
                  </div>
                )}
                {splits.some((s) => s.method === 'regalo') && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700">Motivo del regalo</p>
                    <Textarea
                      placeholder="Indica el motivo del regalo..."
                      value={splitRegaloMotivo}
                      onChange={(e) => setSplitRegaloMotivo(e.target.value)}
                      className="h-16 text-sm"
                    />
                  </div>
                )}

                {/* Confirm split */}
                <Button
                  className="h-14 w-full rounded-lg bg-purple-600 text-lg font-bold text-white shadow-md hover:bg-purple-700 active:bg-purple-800"
                  disabled={!canConfirmSplit || createSale.isPending}
                  onClick={handleConfirm}
                >
                  {createSale.isPending ? (
                    'Procesando...'
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Confirmar Pago Dividido
                    </>
                  )}
                </Button>
              </>
            )}

            {createSale.isError && (
              <p className="text-center text-sm text-red-600">
                Error: {createSale.error.message}
              </p>
            )}
          </>
        ) : (
          /* Success step */
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Venta completada</DialogTitle>
              <DialogDescription className="sr-only">
                Resumen del ticket
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Venta Completada</h3>

              {/* Ticket summary */}
              <div className="rounded-lg border bg-gray-50 p-4 text-left text-sm print-ticket">
                <p className="text-center font-bold">DAR Alimento</p>
                <p className="text-center text-xs text-gray-500">
                  {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX')}
                </p>
                <div className="my-2 border-t border-dashed" />
                <p className="font-semibold">Ticket #{resultFolioDisplay || resultFolio}</p>
                {usedPayments.length === 1 ? (
                  <p className="text-xs text-gray-500">
                    Metodo: {methodLabel(usedPayments[0].method)}
                  </p>
                ) : (
                  <div className="text-xs text-gray-500">
                    <p>Pago dividido:</p>
                    {usedPayments.map((p) => (
                      <p key={p.id} className="ml-2">
                        {methodLabel(p.method)}: {formatPrice(p.amount)}
                      </p>
                    ))}
                  </div>
                )}
                <div className="my-2 border-t border-dashed" />
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="my-2 border-t border-dashed" />
                {totals.discount > 0 && (
                  <div className="flex justify-between text-xs text-orange-600">
                    <span>Descuento</span>
                    <span>-{formatPrice(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>TOTAL</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {!splitMode && method === 'efectivo' && received > 0 && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span>Recibido</span>
                      <span>{formatPrice(received)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Cambio</span>
                      <span>{formatPrice(change)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={() => handlePrint('standard')}
                >
                  <Printer className="mr-1 h-4 w-4" />
                  Ticket
                </Button>
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={() => handlePrint('detailed')}
                >
                  <Printer className="mr-1 h-4 w-4" />
                  Detallado
                </Button>
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={() => handlePrint('courtesy')}
                >
                  <Printer className="mr-1 h-4 w-4" />
                  Cortesia
                </Button>
              </div>
              <Button
                className="h-12 w-full bg-teal-600 hover:bg-teal-700"
                onClick={handleDone}
              >
                Listo
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
