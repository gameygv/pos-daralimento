import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  PlusCircle,
  Ticket,
  Truck,
  Pause,
  ArrowLeft,
  MapPin,
  User,
  Percent,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import type { CartItem, CartTotals } from '../types';
import { ClientSelector } from './ClientSelector';
import type { SelectedClient, HeldCart, AppliedCoupon } from '../hooks/useCart';
import { validateCoupon } from '@/features/cupones/hooks/useCupones';
import { toast } from 'sonner';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

type CartTab = 'cart' | 'client' | 'address';

const QUICK_DISCOUNTS = [5, 10, 15, 20, 25, 50];

interface CartProps {
  items: CartItem[];
  totals: CartTotals;
  selectedClient: SelectedClient | null;
  globalDiscountPct: number;
  heldCarts: HeldCart[];
  appliedCoupon: AppliedCoupon | null;
  onSelectClient: (client: SelectedClient | null) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSetItemDiscount: (itemId: string, pct: number) => void;
  onSetGlobalDiscount: (pct: number) => void;
  onApplyCoupon: (coupon: AppliedCoupon | null) => void;
  onSetItemNote: (itemId: string, note: string) => void;
  shippingFee: number;
  onSetShippingFee: (fee: number) => void;
  onClear: () => void;
  onHoldCart: () => void;
  onRestoreCart: (cartId: string) => void;
  onDeleteHeldCart: (cartId: string) => void;
  onPay: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function Cart({
  items,
  totals,
  selectedClient,
  globalDiscountPct,
  heldCarts,
  appliedCoupon,
  onSelectClient,
  onUpdateQuantity,
  onRemoveItem,
  onSetItemDiscount,
  onSetGlobalDiscount,
  onApplyCoupon,
  onSetItemNote,
  shippingFee,
  onSetShippingFee,
  onClear,
  onHoldCart,
  onRestoreCart,
  onDeleteHeldCart,
  onPay,
  onBack,
  showBackButton,
}: CartProps) {
  const [activeTab, setActiveTab] = useState<CartTab>('cart');
  const [discountItemId, setDiscountItemId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const result = await validateCoupon(couponCode, totals.subtotal);
    setCouponLoading(false);
    if (result.valid) {
      onApplyCoupon({
        id: result.cupon.id,
        codigo: result.cupon.codigo,
        tipo: result.cupon.tipo,
        valor: result.cupon.valor,
        discountAmount: result.discount,
      });
      setCouponCode('');
      toast.success(`Cupon ${result.cupon.codigo} aplicado: -$${result.discount.toFixed(2)}`);
    } else {
      toast.error(result.reason);
    }
  }

  return (
    <div className="flex h-full w-full flex-col border-l bg-white">
      {/* Tab header */}
      <div className="flex shrink-0 border-b">
        {showBackButton && (
          <button
            onClick={onBack}
            className="flex items-center px-3 text-gray-500 hover:text-gray-700 sm:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'cart'
              ? 'border-b-2 border-teal-600 text-teal-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          Carrito
          {totals.itemCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal-600 px-1 text-xs font-bold text-white">
              {totals.itemCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('client')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'client'
              ? 'border-b-2 border-teal-600 text-teal-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="h-4 w-4" />
          Cliente
        </button>
        <button
          onClick={() => setActiveTab('address')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'address'
              ? 'border-b-2 border-teal-600 text-teal-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin className="h-4 w-4" />
          Direccion
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'cart' ? (
        <>
          {/* Cart items */}
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
              <ShoppingCart className="h-16 w-16" />
              <p className="text-base font-medium">Carrito vacio</p>
              <p className="text-sm">Agrega el primer producto al carrito</p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPrice(item.price)} c/u
                          {item.discountPct > 0 && (
                            <span className="ml-1 text-orange-600 font-semibold">
                              -{item.discountPct}%
                            </span>
                          )}
                        </p>
                        {item.note && (
                          <p className="text-[10px] italic text-blue-600 truncate">
                            {item.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="w-20 text-right text-sm font-semibold text-gray-900">
                        {formatPrice(item.price * item.quantity * (1 - item.discountPct / 100))}
                      </div>
                      {/* Per-item discount button */}
                      <Popover
                        open={discountItemId === item.id}
                        onOpenChange={(o) => setDiscountItemId(o ? item.id : null)}
                      >
                        <PopoverTrigger asChild>
                          <button
                            className={`flex h-8 w-8 items-center justify-center rounded-md ${
                              item.discountPct > 0
                                ? 'bg-orange-100 text-orange-600'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            <Percent className="h-3.5 w-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3" align="end">
                          <p className="mb-2 text-xs font-semibold text-gray-700">
                            Descuento para {item.name}
                          </p>
                          <div className="grid grid-cols-3 gap-1 mb-2">
                            {QUICK_DISCOUNTS.map((d) => (
                              <button
                                key={d}
                                onClick={() => {
                                  onSetItemDiscount(item.id, item.discountPct === d ? 0 : d);
                                  setDiscountItemId(null);
                                }}
                                className={`rounded border px-2 py-1.5 text-xs font-semibold ${
                                  item.discountPct === d
                                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {d}%
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              placeholder="Otro %"
                              className="h-8 text-xs"
                              defaultValue={item.discountPct || ''}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                                  onSetItemDiscount(item.id, val);
                                  setDiscountItemId(null);
                                }
                              }}
                            />
                            <button
                              className="text-xs text-red-500 hover:underline whitespace-nowrap"
                              onClick={() => {
                                onSetItemDiscount(item.id, 0);
                                setDiscountItemId(null);
                              }}
                            >
                              Quitar
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Totals and actions */}
          <div className="shrink-0 border-t">
            {/* Subtotal / Discount / Total */}
            <div className="space-y-1 px-4 py-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatPrice(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600">
                    Descuento
                    {appliedCoupon ? ` + ${appliedCoupon.codigo}` : ''}
                  </span>
                  <span className="font-medium text-orange-600">-{formatPrice(totals.discount)}</span>
                </div>
              )}
              {totals.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-600">Envio</span>
                  <span className="font-medium text-indigo-600">+{formatPrice(totals.shipping)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IVA</span>
                <span className="font-medium">{formatPrice(totals.tax)}</span>
              </div>
              <div className="flex justify-between pt-1 text-lg font-bold text-teal-700">
                <span>TOTAL</span>
                <span>{formatPrice(totals.total)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-1 border-t px-2 py-2 sm:grid-cols-5">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-md px-1 py-2 ${
                      items.some((i) => i.note)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                    disabled={items.length === 0}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-[10px] font-medium leading-tight">Nota</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <p className="mb-2 text-xs font-semibold text-gray-700">
                    Notas por articulo
                  </p>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id}>
                        <label className="text-[10px] font-medium text-gray-500">{item.name}</label>
                        <Input
                          placeholder="Nota..."
                          className="h-7 text-xs"
                          value={item.note}
                          onChange={(e) => onSetItemNote(item.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Global discount button */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-md px-1 py-2 ${
                      globalDiscountPct > 0
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span className="text-[10px] font-medium leading-tight">
                      {globalDiscountPct > 0 ? `Desc ${globalDiscountPct}%` : 'Descuento'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <p className="mb-2 text-xs font-semibold text-gray-700">
                    Descuento global (toda la venta)
                  </p>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {QUICK_DISCOUNTS.map((d) => (
                      <button
                        key={d}
                        onClick={() => onSetGlobalDiscount(globalDiscountPct === d ? 0 : d)}
                        className={`rounded border px-2 py-1.5 text-xs font-semibold ${
                          globalDiscountPct === d
                            ? 'border-orange-400 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {d}%
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Otro %"
                      className="h-8 text-xs"
                      defaultValue={globalDiscountPct || ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                          onSetGlobalDiscount(Math.max(0, Math.min(100, val)));
                        }
                      }}
                    />
                    <button
                      className="text-xs text-red-500 hover:underline whitespace-nowrap"
                      onClick={() => onSetGlobalDiscount(0)}
                    >
                      Quitar
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-md px-1 py-2 ${
                      appliedCoupon
                        ? 'bg-green-50 text-green-600'
                        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <Ticket className="h-4 w-4" />
                    <span className="text-[10px] font-medium leading-tight">
                      {appliedCoupon ? appliedCoupon.codigo : 'Cupon'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="center">
                  {appliedCoupon ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-green-700">
                        Cupon aplicado: {appliedCoupon.codigo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appliedCoupon.tipo === 'porcentaje'
                          ? `${appliedCoupon.valor}% descuento`
                          : `$${appliedCoupon.valor} descuento`}
                      </p>
                      <button
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => onApplyCoupon(null)}
                      >
                        Quitar cupon
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700">Aplicar cupon</p>
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="CODIGO..."
                        className="h-8 font-mono text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <Button
                        size="sm"
                        className="h-8 w-full text-xs"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                      >
                        {couponLoading ? 'Validando...' : 'Aplicar'}
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-md px-1 py-2 ${
                      shippingFee > 0
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    <span className="text-[10px] font-medium leading-tight">
                      {shippingFee > 0 ? `$${shippingFee}` : 'Envio'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-3" align="center">
                  <p className="mb-2 text-xs font-semibold text-gray-700">Cargo de envio</p>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {[50, 100, 150].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => onSetShippingFee(shippingFee === amt ? 0 : amt)}
                        className={`rounded border px-2 py-1.5 text-xs font-semibold ${
                          shippingFee === amt
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Otro $"
                      className="h-8 text-xs"
                      defaultValue={shippingFee || ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                          onSetShippingFee(Math.max(0, val));
                        }
                      }}
                    />
                    <button
                      className="text-xs text-red-500 hover:underline whitespace-nowrap"
                      onClick={() => onSetShippingFee(0)}
                    >
                      Quitar
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              <button
                className={`relative flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-md px-1 py-2 ${
                  items.length === 0
                    ? 'text-gray-300'
                    : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                }`}
                onClick={onHoldCart}
                disabled={items.length === 0}
              >
                <Pause className="h-4 w-4" />
                <span className="text-[10px] font-medium leading-tight">Suspender</span>
                {heldCarts.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-600 px-0.5 text-[9px] font-bold text-white">
                    {heldCarts.length}
                  </span>
                )}
              </button>
            </div>

            {/* Held carts */}
            {heldCarts.length > 0 && (
              <div className="border-t px-2 py-2">
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-purple-600">
                  En espera ({heldCarts.length})
                </p>
                <div className="space-y-1">
                  {heldCarts.map((hc) => {
                    const count = hc.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <div
                        key={hc.id}
                        className="flex items-center justify-between rounded-md border border-purple-200 bg-purple-50 px-2 py-1.5"
                      >
                        <button
                          className="flex-1 text-left text-xs font-medium text-purple-800 hover:underline"
                          onClick={() => onRestoreCart(hc.id)}
                        >
                          {count} prod. {hc.client ? `- ${hc.client.nombre}` : ''}{' '}
                          <span className="text-purple-500">({hc.heldAt})</span>
                        </button>
                        <button
                          onClick={() => onDeleteHeldCart(hc.id)}
                          className="ml-2 rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PAGAR button */}
            <div className="px-2 pb-3 pt-1">
              <Button
                className="h-14 w-full rounded-lg bg-amber-500 text-lg font-bold text-white shadow-md hover:bg-amber-600 active:bg-amber-700"
                disabled={items.length === 0}
                onClick={onPay}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                PAGAR {items.length > 0 && formatPrice(totals.total)}
              </Button>
            </div>
          </div>
        </>
      ) : activeTab === 'client' ? (
        <ClientSelector
          selectedClient={selectedClient}
          onSelectClient={onSelectClient}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-gray-400">
          {selectedClient ? (
            selectedClient.direccion ? (
              <div className="w-full space-y-4 text-left">
                <div className="flex items-start gap-3 rounded-lg bg-teal-50 p-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-teal-600">Direccion de envio</p>
                    <p className="mt-1 text-sm font-semibold text-teal-800">
                      {selectedClient.nombre}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-700">{selectedClient.direccion}</p>
                    {selectedClient.telefono && (
                      <p className="mt-1 text-xs text-gray-500">Tel: {selectedClient.telefono}</p>
                    )}
                    {selectedClient.telefono2 && (
                      <p className="text-xs text-gray-500">Tel 2: {selectedClient.telefono2}</p>
                    )}
                    {selectedClient.rfc && (
                      <p className="text-xs text-gray-500">RFC: {selectedClient.rfc}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <MapPin className="h-16 w-16" />
                <p className="text-base font-medium">Sin direccion</p>
                <p className="text-sm text-center">
                  El cliente <span className="font-semibold">{selectedClient.nombre}</span> no tiene direccion registrada
                </p>
              </>
            )
          ) : (
            <>
              <MapPin className="h-16 w-16" />
              <p className="text-base font-medium">Sin direccion</p>
              <p className="text-sm">Selecciona un cliente primero</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
