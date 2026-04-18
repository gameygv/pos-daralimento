import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Maximize,
  LogOut,
  Store,
  User,
  ShoppingCart,
  Monitor,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { ProductGrid } from './ProductGrid';
import { Cart } from './Cart';
import { PaymentDialog } from './PaymentDialog';
import { useCart } from '../hooks/useCart';
import { CajaSelectionModal } from '@/features/cajas/components/CajaSelectionModal';
import { ForceCorteDialog } from '@/components/ForceCorteDialog';
import {
  useMyActiveSession,
  useActiveCajas,
  type CajaSession,
} from '@/features/cajas/hooks/useCajas';
import type { PosProduct } from '../hooks/usePosProducts';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { findProductByBarcode } from '../hooks/usePosProducts';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { usePosSounds } from '../hooks/usePosSounds';

export function PosScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: role } = useUserRole();
  const { items, totals, selectedClient, setSelectedClient, globalDiscountPct, setGlobalDiscountPct, addItem, removeItem, updateQuantity, setItemDiscount, clearCart, heldCarts, holdCart, restoreCart, deleteHeldCart, appliedCoupon, setAppliedCoupon, shippingFee, setShippingFee, setItemNote } =
    useCart();
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCorteDialog, setShowCorteDialog] = useState(false);

  const { data: activeSession, isLoading: loadingSession } = useMyActiveSession();
  const { data: cajas = [] } = useActiveCajas();
  const [localSession, setLocalSession] = useState<CajaSession | null>(null);

  const { data: posConfig } = useSettings();
  const isAdmin = role === 'admin';
  const { play: playSound, toggle: toggleSound, enabled: soundEnabled } = usePosSounds();

  // Use the session from the DB query, or the one just created locally
  const session = activeSession ?? localSession;
  const caja = cajas.find((c) => c.id === session?.caja_id);
  const cajaName = caja?.nombre ?? '';
  const cajaPrefix = caja?.prefijo_folio ?? '';
  const needsSession = !loadingSession && !session;

  // Barcode scanner: auto-add scanned product to cart
  useBarcodeScanner(async (barcode) => {
    const product = await findProductByBarcode(barcode);
    if (product) {
      handleProductSelect(product);
      playSound('scan');
      toast.success(`Escaneado: ${product.name}`);
    } else {
      playSound('error');
      toast.error(`Producto no encontrado: ${barcode}`);
    }
  });

  function handleSessionSelected(newSession: CajaSession) {
    setLocalSession(newSession);
  }

  function handleProductSelect(product: PosProduct) {
    addItem({
      id: product.id,
      name: product.name,
      sku: product.sku,
      base_price: product.base_price,
      cost: null,
      tax_rate: product.tax_rate,
      image_url: product.image_url,
    });
    playSound('addItem');
  }

  // QR scanner dialog callback (only for camera-based scanning, not hardware barcode scanner)
  async function handleQrScan(barcode: string) {
    const product = await findProductByBarcode(barcode);
    if (product) {
      handleProductSelect(product);
      playSound('scan');
      toast.success(`Escaneado: ${product.name}`);
    } else {
      playSound('error');
      toast.error(`Producto no encontrado: ${barcode}`);
    }
  }

  function handleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function handleLogout() {
    // Vendedores must do corte before logging out
    if (!isAdmin && session) {
      setShowCorteDialog(true);
      return;
    }
    void signOut();
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Caja selection modal - blocks POS until a caja is selected */}
      <CajaSelectionModal
        open={needsSession}
        onCajaSelected={handleSessionSelected}
      />

      {/* Force corte dialog */}
      <ForceCorteDialog
        open={showCorteDialog}
        onOpenChange={setShowCorteDialog}
        cajaName={cajaName}
      />

      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between bg-gray-900 px-4 text-white">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800 hover:text-white"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Admin
          </Button>
          <div className="hidden items-center gap-2 sm:flex">
            {posConfig?.logoemp ? (
              <img src={posConfig.logoemp} alt="" className="h-6 w-6 rounded object-contain" />
            ) : (
              <Store className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">{posConfig?.empresa || 'POS'}</span>
            {session && (
              <>
                <span className="text-sm text-gray-400">|</span>
                <div className="flex items-center gap-1">
                  <Monitor className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-medium text-teal-400">
                    {cajaName}
                    {cajaPrefix ? ` (${cajaPrefix})` : ''}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile cart toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-white hover:bg-gray-800 hover:text-white sm:hidden"
            onClick={() => setShowMobileCart(!showMobileCart)}
          >
            <ShoppingCart className="h-5 w-5" />
            {totals.itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                {totals.itemCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-white hover:bg-gray-800 hover:text-white sm:flex"
            onClick={toggleSound}
            title={soundEnabled ? 'Sonidos ON' : 'Sonidos OFF'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-gray-500" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-white hover:bg-gray-800 hover:text-white sm:flex"
            onClick={handleFullscreen}
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm">{user?.email?.split('@')[0] ?? 'Usuario'}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesion</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left side: product grid */}
        <div
          className={`flex-1 overflow-hidden ${showMobileCart ? 'hidden sm:flex' : 'flex'}`}
        >
          <div className="flex-1 overflow-hidden p-3">
            <ProductGrid onProductSelect={handleProductSelect} onBarcodeScan={handleQrScan} />
          </div>
        </div>

        {/* Right side: cart */}
        <div
          className={`w-full sm:w-[380px] lg:w-[420px] xl:w-[440px] shrink-0 ${
            showMobileCart ? 'flex' : 'hidden sm:flex'
          }`}
        >
          <Cart
            items={items}
            totals={totals}
            selectedClient={selectedClient}
            globalDiscountPct={globalDiscountPct}
            heldCarts={heldCarts}
            appliedCoupon={appliedCoupon}
            onSelectClient={setSelectedClient}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onSetItemDiscount={setItemDiscount}
            onSetGlobalDiscount={setGlobalDiscountPct}
            onApplyCoupon={setAppliedCoupon}
            onSetItemNote={setItemNote}
            shippingFee={shippingFee}
            onSetShippingFee={setShippingFee}
            onClear={clearCart}
            onHoldCart={holdCart}
            onRestoreCart={restoreCart}
            onDeleteHeldCart={deleteHeldCart}
            onPay={() => setShowPayment(true)}
            onBack={() => setShowMobileCart(false)}
            showBackButton={showMobileCart}
          />
        </div>
      </div>

      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        items={items}
        totals={totals}
        globalDiscountPct={globalDiscountPct}
        couponId={appliedCoupon?.id ?? null}
        clienteName={selectedClient?.nombre ?? 'Mostrador'}
        clienteId={selectedClient?.id ?? null}
        cajaId={session?.caja_id ?? null}
        cajaSessionId={session?.id ?? null}
        onPaymentComplete={() => {
          clearCart();
          playSound('payment');
          toast.success('Venta registrada exitosamente');
        }}
      />
    </div>
  );
}
