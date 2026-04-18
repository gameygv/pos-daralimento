import { useCallback, useState } from 'react';
import type { CartItem, CartTotals } from '../types';

export interface SelectedClient {
  id: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  telefono2?: string | null;
  email?: string | null;
  rfc?: string | null;
}

export interface HeldCart {
  id: string;
  items: CartItem[];
  client: SelectedClient | null;
  globalDiscountPct: number;
  heldAt: string;
}

export interface AppliedCoupon {
  id: string;
  codigo: string;
  tipo: 'porcentaje' | 'monto';
  valor: number;
  /** Calculated discount amount in $ */
  discountAmount: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  /** Global discount applied on top of per-item discounts (0-100 %) */
  const [globalDiscountPct, setGlobalDiscountPct] = useState(0);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [shippingFee, setShippingFee] = useState(0);

  const addItem = useCallback(
    (product: {
      id: string;
      name: string;
      sku: string;
      base_price: number;
      cost: number | null;
      tax_rate: number;
      image_url: string | null;
    }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          );
        }
        const newItem: CartItem = {
          id: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: product.base_price,
          cost: product.cost,
          taxRate: product.tax_rate,
          quantity: 1,
          imageUrl: product.image_url,
          discountPct: 0,
          note: '',
        };
        return [...prev, newItem];
      });
    },
    [],
  );

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
    );
  }, []);

  const setItemDiscount = useCallback((itemId: string, pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, discountPct: clamped } : i)),
    );
  }, []);

  const setItemNote = useCallback((itemId: string, note: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, note } : i)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setSelectedClient(null);
    setGlobalDiscountPct(0);
    setAppliedCoupon(null);
    setShippingFee(0);
  }, []);

  /** Park the current cart and start a new one */
  const holdCart = useCallback(() => {
    setHeldCarts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        items,
        client: selectedClient,
        globalDiscountPct,
        heldAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setItems([]);
    setSelectedClient(null);
    setGlobalDiscountPct(0);
  }, [items, selectedClient, globalDiscountPct]);

  /** Restore a held cart (replaces current cart) */
  const restoreCart = useCallback((cartId: string) => {
    setHeldCarts((prev) => {
      const cart = prev.find((c) => c.id === cartId);
      if (!cart) return prev;
      setItems(cart.items);
      setSelectedClient(cart.client);
      setGlobalDiscountPct(cart.globalDiscountPct);
      return prev.filter((c) => c.id !== cartId);
    });
  }, []);

  /** Delete a held cart without restoring */
  const deleteHeldCart = useCallback((cartId: string) => {
    setHeldCarts((prev) => prev.filter((c) => c.id !== cartId));
  }, []);

  const totals: CartTotals = (() => {
    const base = items.reduce(
      (acc, item) => {
        const lineGross = item.price * item.quantity;
        const itemDiscountAmt = lineGross * (item.discountPct / 100);
        const afterItemDiscount = lineGross - itemDiscountAmt;
        const globalDiscountAmt = afterItemDiscount * (globalDiscountPct / 100);
        const afterAllDiscounts = afterItemDiscount - globalDiscountAmt;
        const lineTax = afterAllDiscounts * item.taxRate;
        return {
          subtotal: acc.subtotal + lineGross,
          discount: acc.discount + itemDiscountAmt + globalDiscountAmt,
          tax: acc.tax + lineTax,
          total: acc.total + afterAllDiscounts + lineTax,
          itemCount: acc.itemCount + item.quantity,
        };
      },
      { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, itemCount: 0 },
    );

    // Apply coupon on top
    if (appliedCoupon) {
      const couponAmt = appliedCoupon.discountAmount;
      base.discount += couponAmt;
      base.total = Math.max(0, base.total - couponAmt);
    }

    // Add shipping
    base.shipping = shippingFee;
    base.total += shippingFee;

    return base;
  })();

  return {
    items,
    totals,
    selectedClient,
    setSelectedClient,
    globalDiscountPct,
    setGlobalDiscountPct,
    addItem,
    removeItem,
    updateQuantity,
    setItemDiscount,
    clearCart,
    heldCarts,
    holdCart,
    restoreCart,
    deleteHeldCart,
    appliedCoupon,
    setAppliedCoupon,
    shippingFee,
    setShippingFee,
    setItemNote,
  };
}
