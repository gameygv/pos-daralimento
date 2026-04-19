import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Maximize,
  LogOut,
  Store,
  User,
  ShoppingCart,
  Volume2,
  VolumeX,
  Warehouse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from 'sonner';
import { ProductGrid } from './ProductGrid';
import { Cart } from './Cart';
import { PaymentDialog } from './PaymentDialog';
import { PriceSelectDialog } from './PriceSelectDialog';
import { useCart } from '../hooks/useCart';
import { useAutoSession } from '@/features/cajas/hooks/useCajas';
import type { PosProduct } from '../hooks/usePosProducts';
import { useAlmacenPriceMap, useAlmacenStockMap, applyAlmacenPrices, findProductByBarcode } from '../hooks/usePosProducts';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { useAlmacenes } from '@/features/almacenes/hooks/useAlmacenes';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { usePosSounds } from '../hooks/usePosSounds';

export function PosScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { items, totals, selectedClient, setSelectedClient, globalDiscountPct, setGlobalDiscountPct, addItem, removeItem, updateQuantity, setItemDiscount, clearCart, heldCarts, holdCart, restoreCart, deleteHeldCart, setItemNote } =
    useCart();
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedAlmacen, setSelectedAlmacen] = useState<string>('');

  // Price selection dialog
  const [priceDialogProduct, setPriceDialogProduct] = useState<PosProduct | null>(null);
  const [priceDialogPub, setPriceDialogPub] = useState(0);
  const [priceDialogProv, setPriceDialogProv] = useState(0);

  const { data: session } = useAutoSession();
  const { data: almacenes = [] } = useAlmacenes();
  const { data: almacenPriceMap } = useAlmacenPriceMap(selectedAlmacen || null);
  const { data: almacenStockMap } = useAlmacenStockMap(selectedAlmacen || null);

  const { data: posConfig } = useSettings();
  const { play: playSound, toggle: toggleSound, enabled: soundEnabled } = usePosSounds();

  // Auto-select "Página Web" almacen on load
  useEffect(() => {
    if (almacenes.length > 0 && !selectedAlmacen) {
      const webAlm = almacenes.find((a) => a.nombre.toLowerCase().includes('web') || a.nombre.toLowerCase().includes('gina'));
      if (webAlm) {
        setSelectedAlmacen(webAlm.id);
      }
    }
  }, [almacenes, selectedAlmacen]);

  // Auto-select linked client when almacen changes
  useEffect(() => {
    if (!selectedAlmacen || almacenes.length === 0) return;
    const alm = almacenes.find((a) => a.id === selectedAlmacen);
    if (alm?.cliente_id) {
      // Fetch client data
      supabase
        .from('clientes' as never)
        .select('id, nombre, direccion, telefono, email')
        .eq('id' as never, alm.cliente_id as never)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const c = data as { id: string; nombre: string; direccion: string | null; telefono: string | null; email: string | null };
            setSelectedClient({ id: c.id, nombre: c.nombre, direccion: c.direccion, telefono: c.telefono, email: c.email });
          }
        });
    } else {
      setSelectedClient(null);
    }
  }, [selectedAlmacen, almacenes, setSelectedClient]);

  // Barcode scanner
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

  const addProductToCart = useCallback((product: PosProduct, price: number) => {
    addItem({
      id: product.id,
      name: product.name,
      sku: product.sku,
      base_price: price,
      cost: null,
      tax_rate: product.tax_rate,
      image_url: product.image_url,
    });
    playSound('addItem');
  }, [addItem, playSound]);

  function handleProductSelect(product: PosProduct) {
    const [pricedProduct] = applyAlmacenPrices([product], almacenPriceMap);
    const hasPub = pricedProduct.base_price > 0;
    const hasProv = pricedProduct.precio_mayoreo > 0;

    if (hasPub && hasProv && pricedProduct.base_price !== pricedProduct.precio_mayoreo) {
      // Both prices exist and are different — ask user
      setPriceDialogProduct(pricedProduct);
      setPriceDialogPub(pricedProduct.base_price);
      setPriceDialogProv(pricedProduct.precio_mayoreo);
    } else {
      // Only one price or same price — use whichever is available
      const price = hasPub ? pricedProduct.base_price : pricedProduct.precio_mayoreo;
      addProductToCart(pricedProduct, price);
    }
  }

  function handlePriceSelected(price: number) {
    if (priceDialogProduct) {
      addProductToCart(priceDialogProduct, price);
      setPriceDialogProduct(null);
    }
  }

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

  return (
    <div className="flex h-screen flex-col bg-gray-100">
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
            <span className="text-sm text-gray-400">|</span>
            <div className="flex items-center gap-1">
              <Warehouse className="h-4 w-4 text-amber-400" />
              <select
                value={selectedAlmacen}
                onChange={(e) => setSelectedAlmacen(e.target.value)}
                className="h-7 rounded border-0 bg-gray-800 px-2 text-sm font-medium text-amber-400 outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="">Punto de Venta...</option>
                {almacenes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="ghost" size="icon" className="hidden text-white hover:bg-gray-800 hover:text-white sm:flex" onClick={toggleSound} title={soundEnabled ? 'Sonidos ON' : 'Sonidos OFF'}>
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-gray-500" />}
          </Button>
          <Button variant="ghost" size="icon" className="hidden text-white hover:bg-gray-800 hover:text-white sm:flex" onClick={handleFullscreen}>
            <Maximize className="h-4 w-4" />
          </Button>
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm">{user?.email?.split('@')[0] ?? 'Usuario'}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800 hover:text-white" onClick={() => void signOut()}>
            <LogOut className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesion</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 overflow-hidden ${showMobileCart ? 'hidden sm:flex' : 'flex'}`}>
          <div className="flex-1 overflow-hidden p-3">
            <ProductGrid
              onProductSelect={handleProductSelect}
              onBarcodeScan={handleQrScan}
              almacenPriceMap={almacenPriceMap}
              almacenStockMap={almacenStockMap}
            />
          </div>
        </div>
        <div className={`w-full sm:w-[380px] lg:w-[420px] xl:w-[440px] shrink-0 ${showMobileCart ? 'flex' : 'hidden sm:flex'}`}>
          <Cart
            items={items}
            totals={totals}
            selectedClient={selectedClient}
            globalDiscountPct={globalDiscountPct}
            heldCarts={heldCarts}
            onSelectClient={setSelectedClient}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onSetItemDiscount={setItemDiscount}
            onSetGlobalDiscount={setGlobalDiscountPct}
            onSetItemNote={setItemNote}
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
        couponId={null}
        clienteName={selectedClient?.nombre ?? 'Mostrador'}
        clienteId={selectedClient?.id ?? null}
        cajaId={session?.caja_id ?? null}
        cajaSessionId={session?.id ?? null}
        almacenId={selectedAlmacen || null}
        onPaymentComplete={() => {
          clearCart();
          playSound('payment');
          toast.success('Venta registrada exitosamente');
        }}
      />

      {/* Price selection dialog */}
      <PriceSelectDialog
        open={!!priceDialogProduct}
        onOpenChange={(open) => { if (!open) setPriceDialogProduct(null); }}
        productName={priceDialogProduct?.name ?? ''}
        precioPublico={priceDialogPub}
        precioProveedores={priceDialogProv}
        onSelect={handlePriceSelected}
      />
    </div>
  );
}
