import { useState, useEffect } from 'react';
import { Search, Package, QrCode, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePosProducts, applyAlmacenPrices } from '../hooks/usePosProducts';
import { useCategoryList } from '@/features/catalog/categories';
import type { PosProduct } from '../hooks/usePosProducts';
import { QuickProductDialog } from './QuickProductDialog';
import { QrScannerDialog } from './QrScannerDialog';
import { formatPrice } from '@/features/catalog/products/schemas/product.schema';

const ALL_VALUE = '__all__';

interface ProductGridProps {
  onProductSelect: (product: PosProduct) => void;
  onBarcodeScan: (barcode: string) => void;
  almacenPriceMap?: Map<string, { precio_publico: number; precio_proveedores: number }>;
  almacenStockMap?: Map<string, number>;
}

export function ProductGrid({ onProductSelect, onBarcodeScan, almacenPriceMap, almacenStockMap }: ProductGridProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_VALUE);
  const [showQuickProduct, setShowQuickProduct] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: rawProducts = [], isLoading } = usePosProducts({
    query: debouncedSearch || null,
    categoryId: selectedCategory === ALL_VALUE ? null : selectedCategory,
  });

  const products = applyAlmacenPrices(rawProducts, almacenPriceMap);

  const { data: categories = [] } = useCategoryList();

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar producto o escanear codigo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-14 rounded-lg border-2 pl-12 text-lg focus:border-teal-500"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 shrink-0 rounded-lg border-2"
          onClick={() => setShowQrScanner(true)}
        >
          <QrCode className="h-6 w-6" />
        </Button>
      </div>

      {/* Filter tabs */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-1">
          <Button
            variant={selectedCategory === ALL_VALUE ? 'default' : 'outline'}
            size="sm"
            className={`min-h-[44px] shrink-0 rounded-full px-5 text-sm font-medium ${
              selectedCategory === ALL_VALUE
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => setSelectedCategory(ALL_VALUE)}
          >
            Todos
          </Button>
          {categories.filter((cat) => !cat.parent_id).map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              className={`min-h-[44px] shrink-0 rounded-full px-5 text-sm font-medium ${
                selectedCategory === cat.id
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] shrink-0 rounded-full border-teal-300 px-5 text-sm font-medium text-teal-700 hover:bg-teal-50"
            onClick={() => setShowQuickProduct(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Agregar producto
          </Button>
        </div>
      </ScrollArea>

      {/* Product grid */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Cargando productos...
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Package className="h-16 w-16" />
          <p className="text-lg">No se encontraron productos</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => {
              const almStock = almacenStockMap ? (almacenStockMap.get(product.id) ?? 0) : product.total_stock;
              const isOutOfStock = product.track_stock && almStock <= 0;
              return (
              <button
                key={product.id}
                onClick={() => { if (!isOutOfStock) onProductSelect(product); }}
                disabled={isOutOfStock}
                className={`group relative flex flex-col overflow-hidden rounded-lg shadow-sm transition-transform duration-100 ${
                  isOutOfStock ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white hover:shadow-md active:scale-95'
                }`}
                style={{ aspectRatio: '1' }}
              >
                {/* Stock badge */}
                {product.track_stock && (
                  <span
                    className={`absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-xs font-bold ${
                      almStock <= 0
                        ? 'bg-red-500 text-white'
                        : almStock <= 5
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {almStock <= 0 ? 'Agotado' : almStock}
                  </span>
                )}
                {/* Image area */}
                <div className="flex flex-1 items-center justify-center bg-gray-100 p-4">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-gray-300" />
                  )}
                </div>
                {/* Name + prices bar */}
                <div className="w-full bg-teal-700 px-3 py-2 text-left">
                  <span className="line-clamp-1 text-sm font-medium leading-tight text-white">
                    {product.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    {product.base_price > 0 && (
                      <span className="text-teal-200">Pub: {formatPrice(product.base_price)}</span>
                    )}
                    {product.precio_mayoreo > 0 && product.precio_mayoreo !== product.base_price && (
                      <span className="text-purple-300">Prov: {formatPrice(product.precio_mayoreo)}</span>
                    )}
                    {product.base_price <= 0 && product.precio_mayoreo <= 0 && (
                      <span className="text-teal-300">Sin precio</span>
                    )}
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        </ScrollArea>
      )}

      <QuickProductDialog
        open={showQuickProduct}
        onOpenChange={setShowQuickProduct}
      />

      <QrScannerDialog
        open={showQrScanner}
        onOpenChange={setShowQrScanner}
        onScan={onBarcodeScan}
      />
    </div>
  );
}
