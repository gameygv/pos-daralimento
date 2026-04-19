import { useState, useEffect, useCallback, useMemo } from 'react';
import { Pencil, Plus, Package, ChevronLeft, ChevronRight, X, ImageIcon, Calculator, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { useProducts, useToggleProductActive } from '../hooks/useProducts';
import type { StockFilter } from '../hooks/useProducts';
import { useCategoryList } from '@/features/catalog/categories';
import type { ProductSearchResult } from '@/integrations/supabase/catalog-types';
import { ProductForm } from './ProductForm';
import { PriceCalculatorDialog } from './PriceCalculatorDialog';
import { syncProductToWC } from '../utils/syncProductToWC';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAlmacenes } from '@/features/almacenes/hooks/useAlmacenes';
import { Label } from '@/components/ui/label';

const ALL_VALUE = '__all__';

const STOCK_FILTER_OPTIONS: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'Todo el stock' },
  { value: 'in_stock', label: 'En stock' },
  { value: 'low_stock', label: 'Stock bajo' },
  { value: 'out_of_stock', label: 'Sin stock' },
];

export function ProductList() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_VALUE);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [page, setPage] = useState(0);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [calcProduct, setCalcProduct] = useState<{ id: string; name: string } | null>(null);
  const [almacenFilter, setAlmacenFilter] = useState<string>(ALL_VALUE);
  const [showInactive, setShowInactive] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, categoryFilter, stockFilter, almacenFilter, showInactive]);

  const { data, isLoading } = useProducts({
    query: debouncedSearch || null,
    categoryId: categoryFilter === ALL_VALUE ? null : categoryFilter,
    stockFilter,
    page,
  });
  const { data: categories = [] } = useCategoryList();
  const { data: almacenes = [] } = useAlmacenes();
  const toggleActive = useToggleProductActive();
  const queryClient = useQueryClient();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Fetch ALL almacén prices (for almacén filter + Página Web detection)
  const { data: allAlmacenPrecios = [] } = useQuery<Array<{ almacen_id: string; product_id: string; precio_publico: number; precio_proveedores: number }>>({
    queryKey: ['all-almacen-precios-list'],
    queryFn: async () => {
      const { data } = (await supabase
        .from('almacen_precios' as never).select('almacen_id, product_id, precio_publico, precio_proveedores')) as unknown as {
        data: Array<{ almacen_id: string; product_id: string; precio_publico: number; precio_proveedores: number }> | null;
      };
      return data ?? [];
    },
  });

  // Products linked to each almacén (has precio_publico > 0 OR precio_proveedores > 0)
  const productsByAlmacen = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const p of allAlmacenPrecios) {
      if (p.precio_publico > 0 || p.precio_proveedores > 0) {
        if (!map.has(p.almacen_id)) map.set(p.almacen_id, new Set());
        map.get(p.almacen_id)!.add(p.product_id);
      }
    }
    return map;
  }, [allAlmacenPrecios]);

  // "Página Web" linked products (for WC column)
  const paginaWebAlmacen = almacenes.find((a) => a.nombre === 'Página Web');
  const linkedProducts = paginaWebAlmacen ? (productsByAlmacen.get(paginaWebAlmacen.id) ?? new Set<string>()) : new Set<string>();

  // Fetch WC mappings
  const { data: wcMappings = [] } = useQuery<Array<{ product_id: string; wc_product_id: number; synced_at: string | null }>>({
    queryKey: ['product-wc-map'],
    queryFn: async () => {
      const { data } = (await supabase
        .from('product_wc_map' as never).select('product_id, wc_product_id, synced_at')) as unknown as {
        data: Array<{ product_id: string; wc_product_id: number; synced_at: string | null }> | null;
      };
      return data ?? [];
    },
  });

  // Build lookup maps
  const linkedProducts = new Set(paginaWebPrecios.map((p) => p.product_id));
  const wcMapByProduct = new Map(wcMappings.map((m) => [m.product_id, m]));

  async function handleSyncWC(productId: string) {
    setSyncingId(productId);
    try {
      const result = await syncProductToWC(productId);
      if (result.success) {
        toast.success(result.message);
        void queryClient.invalidateQueries({ queryKey: ['product-wc-map'] });
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    }
    setSyncingId(null);
  }

  const rawProducts = data?.products ?? [];
  const hasNextPage = data?.hasNextPage ?? false;
  const totalFetched = data?.totalFetched ?? 0;

  // Client-side filters: almacén + inactive
  const products = useMemo(() => {
    let filtered = rawProducts;
    // Filter by almacén
    if (almacenFilter !== ALL_VALUE) {
      const almacenProducts = productsByAlmacen.get(almacenFilter);
      if (almacenProducts) {
        filtered = filtered.filter((p) => almacenProducts.has(p.id));
      } else {
        filtered = [];
      }
    }
    // Filter inactive
    if (!showInactive) {
      filtered = filtered.filter((p) => p.is_active);
    }
    return filtered;
  }, [rawProducts, almacenFilter, productsByAlmacen, showInactive]);

  const hasActiveFilters =
    search !== '' ||
    categoryFilter !== ALL_VALUE ||
    stockFilter !== 'all' ||
    almacenFilter !== ALL_VALUE ||
    showInactive;

  const clearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setCategoryFilter(ALL_VALUE);
    setStockFilter('all');
    setAlmacenFilter(ALL_VALUE);
    setShowInactive(false);
    setPage(0);
  }, []);

  function handleCreate() {
    setEditingProductId(null);
    setIsFormOpen(true);
  }

  function handleEdit(id: string) {
    setEditingProductId(id);
    setIsFormOpen(true);
  }

  function handleToggleActive(id: string, currentActive: boolean) {
    toggleActive.mutate({ id, is_active: !currentActive });
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando productos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nombre, SKU o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={almacenFilter} onValueChange={setAlmacenFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Punto de Venta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos los puntos de venta</SelectItem>
            {almacenes.map((alm) => (
              <SelectItem key={alm.id} value={alm.id}>{alm.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            {STOCK_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive" className="text-xs text-muted-foreground cursor-pointer">
            Inactivos
          </Label>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
        <div className="ml-auto">
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {products.length} de {totalFetched} productos
        {page > 0 && ` — Página ${page + 1}`}
      </div>

      {/* Table */}
      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <Package className="mx-auto mb-2 h-8 w-8" />
          <p>No hay productos</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Nombre</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead className="text-center">WC</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: ProductSearchResult) => {
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <code className="text-xs">{product.sku}</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.total_stock}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.is_active}
                        onCheckedChange={() =>
                          handleToggleActive(product.id, product.is_active)
                        }
                        aria-label={`${product.is_active ? 'Desactivar' : 'Activar'} ${product.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {linkedProducts.has(product.id) ? (() => {
                        const wcMap = wcMapByProduct.get(product.id);
                        const isSyncing = syncingId === product.id;
                        return (
                          <TooltipProvider>
                            <div className="flex items-center justify-center gap-1">
                              {wcMap ? (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1.5">
                                      <Check className="mr-0.5 h-3 w-3" />
                                      WC
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>WC ID: {wcMap.wc_product_id}</p>
                                    {wcMap.synced_at && (
                                      <p className="text-xs text-muted-foreground">
                                        Sync: {new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(wcMap.synced_at))}
                                      </p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] px-1.5">
                                      <AlertCircle className="mr-0.5 h-3 w-3" />
                                      WC
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>No sincronizado con WooCommerce</TooltipContent>
                                </Tooltip>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={isSyncing}
                                title="Sincronizar con WooCommerce"
                                onClick={() => handleSyncWC(product.id)}
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                              </Button>
                            </div>
                          </TooltipProvider>
                        );
                      })() : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Calculadora de precio por peso"
                          onClick={() => setCalcProduct({
                            id: product.id,
                            name: product.name,
                          })}
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar producto"
                          onClick={() => handleEdit(product.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {page + 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <ProductForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        productId={editingProductId}
      />

      <PriceCalculatorDialog
        open={calcProduct !== null}
        onOpenChange={(open) => { if (!open) setCalcProduct(null); }}
        productId={calcProduct?.id ?? null}
        productName={calcProduct?.name ?? ''}
      />
    </div>
  );
}
