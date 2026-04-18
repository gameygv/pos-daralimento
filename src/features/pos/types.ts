export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  cost: number | null;
  taxRate: number;
  quantity: number;
  imageUrl: string | null;
  /** Per-item discount: 0-100 percentage */
  discountPct: number;
  /** Optional note for this item */
  note: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}
