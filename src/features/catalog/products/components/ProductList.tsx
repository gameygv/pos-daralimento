import { useState, useEffect, useCallback } from 'react';
import { Pencil, Plus, Package, ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useProducts, useToggleProductActive } from '../hooks/useProducts';
import type { StockFilter } from '../hooks/useProducts';
import { useCategoryList } from '@/features/catalog/categories';
import { PRODUCT_TYPE_CONFIG, formatPrice } from '../schemas/product.schema';
import type { ProductSearchResult } from '@/integrations/supabase/catalog-types';
import type { ProductType } from '@/integrations/supabase/catalog-types';
import { ProductForm } from './ProductForm';

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
  const [typeFilter, setTypeFilter] = useState<string>(ALL_VALUE);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_VALUE);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [page, setPage] = useState(0);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, typeFilter, categoryFilter, stockFilter]);

  const { data, isLoading } = useProducts({
    query: debouncedSearch || null,
    productType: typeFilter === ALL_VALUE ? null : typeFilter,
    categoryId: categoryFilter === ALL_VALUE ? null : categoryFilter,
    stockFilter,
    page,
  });
  const { data: categories = [] } = useCategoryList();
  const toggleActive = useToggleProductActive();

  const products = data?.products ?? [];
  const hasNextPage = data?.hasNextPage ?? false;
  const totalFetched = data?.totalFetched ?? 0;

  const hasActiveFilters =
    search !== '' ||
    typeFilter !== ALL_VALUE ||
    categoryFilter !== ALL_VALUE ||
    stockFilter !== 'all';

  const clearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setTypeFilter(ALL_VALUE);
    setCategoryFilter(ALL_VALUE);
    setStockFilter('all');
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos los tipos</SelectItem>
            {(Object.entries(PRODUCT_TYPE_CONFIG) as [ProductType, { label: string; color: string }][]).map(
              ([type, config]) => (
                <SelectItem key={type} value={type}>
                  {config.label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: ProductSearchResult) => {
                const typeConfig = PRODUCT_TYPE_CONFIG[product.product_type];
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
                    <TableCell>
                      <Badge variant="secondary" className={typeConfig.color}>
                        {typeConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(product.base_price)}
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
    </div>
  );
}
