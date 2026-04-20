import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Plus,
  Minus,
  Paperclip,
  AlertTriangle,
  QrCode,
  ChevronDown,
  ChevronRight,
  Save,
  Loader2,
  Warehouse,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useProductStock,
  useInventoryMovements,
  type ProductStockRow,
} from '../hooks/useInventory';
import { StockAdjustmentDialog } from './StockAdjustmentDialog';
import { useAlmacenes, useAlmacenStock, useUpsertAlmacenPrecio } from '@/features/almacenes/hooks/useAlmacenes';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from 'sonner';

const ALL_VALUE = '__all__';

const MOVEMENT_TYPES: Record<
  string,
  { label: string; color: string; icon: typeof ArrowUpCircle }
> = {
  entrada: {
    label: 'Entrada',
    color: 'bg-green-100 text-green-800',
    icon: ArrowUpCircle,
  },
  salida: {
    label: 'Salida',
    color: 'bg-red-100 text-red-800',
    icon: ArrowDownCircle,
  },
  ajuste: {
    label: 'Ajuste',
    color: 'bg-yellow-100 text-yellow-800',
    icon: RefreshCw,
  },
};

function getStockStatus(stock: number, minStock: number) {
  if (stock === 0) return { label: 'Agotado', color: 'bg-red-100 text-red-800' };
  if (stock < minStock) return { label: 'Bajo', color: 'bg-amber-100 text-amber-800' };
  return { label: 'OK', color: 'bg-green-100 text-green-800' };
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// Fetch all almacen_stock rows at once
function useAllAlmacenStock() {
  return useQuery<Array<{ almacen_id: string; variant_id: string; product_id: string; stock: number }>>({
    queryKey: ['all-almacen-stock'],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('almacen_stock' as never)
        .select('almacen_id, variant_id, stock, product_variants(product_id, products(is_active))' as never)) as unknown as {
        data: Array<{ almacen_id: string; variant_id: string; stock: number; product_variants: { product_id: string; products: { is_active: boolean } } }> | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return (data ?? [])
        .filter((r) => r.product_variants?.products?.is_active !== false)
        .map((r) => ({
          almacen_id: r.almacen_id,
          variant_id: r.variant_id,
          product_id: r.product_variants?.product_id ?? '',
          stock: r.stock,
        }));
    },
  });
}

// Fetch all almacen_precios at once
function useAllAlmacenPrecios() {
  return useQuery<Array<{ almacen_id: string; product_id: string; precio_publico: number; precio_proveedores: number }>>({
    queryKey: ['all-almacen-precios'],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('almacen_precios' as never)
        .select('almacen_id, product_id, precio_publico, precio_proveedores')) as unknown as {
        data: Array<{ almacen_id: string; product_id: string; precio_publico: number; precio_proveedores: number }> | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function MovementList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Stock overview
  const { data: products = [], isLoading: loadingProducts } = useProductStock();
  const { data: almacenes = [] } = useAlmacenes();
  const { data: allAlmacenStock = [] } = useAllAlmacenStock();
  const { data: allAlmacenPrecios = [] } = useAllAlmacenPrecios();
  const upsertPrecio = useUpsertAlmacenPrecio();

  // Product search
  const [productSearch, setProductSearch] = useState('');

  // Expanded rows
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Inline stock adjustment
  const [adjustingCell, setAdjustingCell] = useState<{ productId: string; variantId: string; almacenId: string } | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState<'entrada' | 'salida'>('entrada');
  const [isSavingStock, setIsSavingStock] = useState(false);

  // Inline price editing
  const [editedPrices, setEditedPrices] = useState<Record<string, { publico: number; proveedores: number }>>({});
  const [isSavingPrices, setIsSavingPrices] = useState(false);

  // Adjustment dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'entrada' | 'salida'>('entrada');
  const [selectedProduct, setSelectedProduct] = useState<ProductStockRow | null>(null);

  // Movement filters
  const [productFilter, setProductFilter] = useState<string>(ALL_VALUE);
  const [typeFilter, setTypeFilter] = useState<string>(ALL_VALUE);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const { data: movements = [], isLoading: loadingMovements } =
    useInventoryMovements({
      productId: productFilter === ALL_VALUE ? null : productFilter,
      movementType: typeFilter === ALL_VALUE ? null : typeFilter,
      fechaDesde: fechaDesde || null,
      fechaHasta: fechaHasta || null,
    });

  // Build lookup maps
  const stockByProductAlmacen = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of allAlmacenStock) {
      map.set(`${s.product_id}::${s.almacen_id}`, s.stock);
    }
    return map;
  }, [allAlmacenStock]);

  const preciosByProductAlmacen = useMemo(() => {
    const map = new Map<string, { precio_publico: number; precio_proveedores: number }>();
    for (const p of allAlmacenPrecios) {
      map.set(`${p.product_id}::${p.almacen_id}`, { precio_publico: p.precio_publico, precio_proveedores: p.precio_proveedores });
    }
    return map;
  }, [allAlmacenPrecios]);

  const activeAlmacenes = almacenes.filter((a) => a.is_active);

  const openDialog = (product: ProductStockRow, type: 'entrada' | 'salida') => {
    setSelectedProduct(product);
    setDialogType(type);
    setDialogOpen(true);
  };

  function toggleExpand(productId: string) {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  async function handleInlineStockAdjust(productId: string, variantId: string, almacenId: string) {
    if (adjustQty <= 0) return;
    setIsSavingStock(true);
    try {
      // Get current almacen stock
      const { data: current } = (await supabase
        .from('almacen_stock' as never)
        .select('stock')
        .eq('almacen_id' as never, almacenId as never)
        .eq('variant_id' as never, variantId as never)
        .maybeSingle()) as unknown as { data: { stock: number } | null };

      const prevStock = current?.stock ?? 0;
      const newStock = adjustType === 'entrada' ? prevStock + adjustQty : prevStock - adjustQty;
      if (newStock < 0) { toast.error('Stock insuficiente'); setIsSavingStock(false); return; }

      // Upsert almacen_stock
      await supabase
        .from('almacen_stock' as never)
        .upsert({ almacen_id: almacenId, variant_id: variantId, stock: newStock }, { onConflict: 'almacen_id,variant_id' } as never);

      // Record kardex
      await supabase.from('kardex' as never).insert({
        almacen_id: almacenId,
        variant_id: variantId,
        product_id: productId,
        tipo: adjustType,
        cantidad: adjustQty,
        stock_anterior: prevStock,
        stock_nuevo: newStock,
        created_by: user?.id ?? null,
        created_by_name: user?.email?.split('@')[0] ?? null,
      });

      // Update total variant stock
      const { data: allStocks } = (await supabase
        .from('almacen_stock' as never)
        .select('stock')
        .eq('variant_id' as never, variantId as never)) as unknown as { data: { stock: number }[] | null };
      const totalStock = (allStocks ?? []).reduce((s, r) => s + r.stock, 0);
      await supabase.from('product_variants' as never).update({ stock: totalStock }).eq('id' as never, variantId as never);

      toast.success(`Stock actualizado: ${adjustType === 'entrada' ? '+' : '-'}${adjustQty}`);
      setAdjustingCell(null);
      setAdjustQty(0);
      void queryClient.invalidateQueries({ queryKey: ['all-almacen-stock'] });
      void queryClient.invalidateQueries({ queryKey: ['product-stock'] });
      void queryClient.invalidateQueries({ queryKey: ['almacen-stock'] });
    } catch (err) {
      toast.error((err as Error).message);
    }
    setIsSavingStock(false);
  }

  async function handleSavePrices() {
    setIsSavingPrices(true);
    try {
      const entries = Object.entries(editedPrices);
      for (const [key, prices] of entries) {
        const [productId, almacenId] = key.split('::');
        await upsertPrecio.mutateAsync({
          almacenId,
          productId,
          precioPublico: prices.publico,
          precioProveedores: prices.proveedores,
        });
      }
      setEditedPrices({});
      toast.success(`Precios actualizados (${entries.length} registro${entries.length !== 1 ? 's' : ''})`);
    } catch (err) {
      toast.error((err as Error).message);
    }
    setIsSavingPrices(false);
  }

  // Summary stats
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock < p.min_stock,
  ).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const editedCount = Object.keys(editedPrices).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos con stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold text-amber-600">
              {lowStockCount > 0 && <AlertTriangle className="h-5 w-5" />}
              {lowStockCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agotados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {outOfStockCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Stock Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Existencias por producto</CardTitle>
          <div className="flex gap-2">
            {editedCount > 0 && (
              <Button size="sm" onClick={handleSavePrices} disabled={isSavingPrices}>
                {isSavingPrices ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                Guardar {editedCount} precio{editedCount !== 1 ? 's' : ''}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/etiquetas')}
            >
              <QrCode className="mr-1 h-4 w-4" />
              Imprimir Etiquetas QR
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Input
              placeholder="Buscar producto por nombre o SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {(() => {
            const filtered = productSearch
              ? products.filter((p) => {
                  const q = productSearch.toLowerCase();
                  return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
                })
              : products;
            return loadingProducts ? (
            <div className="text-muted-foreground">Cargando productos...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <Package className="mx-auto mb-2 h-8 w-8" />
              <p>No hay productos con control de stock</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Stock Total</TableHead>
                    <TableHead className="text-right">Minimo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => {
                    const status = getStockStatus(product.stock, product.min_stock);
                    const isExpanded = expandedProducts.has(product.id);
                    return (
                      <>
                        <TableRow
                          key={product.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleExpand(product.id)}
                        >
                          <TableCell className="px-2">
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                          <TableCell className="text-right font-mono text-lg">{product.stock}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{product.min_stock}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 border-green-300 text-green-700 hover:bg-green-50"
                                onClick={() => openDialog(product, 'entrada')}
                                title="Entrada global"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 border-red-300 text-red-700 hover:bg-red-50"
                                onClick={() => openDialog(product, 'salida')}
                                title="Salida global"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded: per-almacén details */}
                        {isExpanded && (
                          <TableRow key={`${product.id}-detail`}>
                            <TableCell colSpan={7} className="bg-muted/30 p-0">
                              <div className="px-6 py-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  <Warehouse className="mr-1 inline h-3 w-3" />
                                  Detalle por Punto de Venta
                                </p>
                                <div className="overflow-x-auto rounded border bg-white">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted/40">
                                      <tr>
                                        <th className="px-3 py-1.5 text-left text-xs font-medium">Punto de Venta</th>
                                        <th className="px-3 py-1.5 text-right text-xs font-medium">Existencias</th>
                                        <th className="px-3 py-1.5 text-right text-xs font-medium">P. Público</th>
                                        <th className="px-3 py-1.5 text-right text-xs font-medium">P. Proveedores</th>
                                        <th className="px-3 py-1.5 text-center text-xs font-medium">Stock</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {activeAlmacenes.map((alm) => {
                                        const key = `${product.id}::${alm.id}`;
                                        const almStock = stockByProductAlmacen.get(key) ?? 0;
                                        const almPrecios = preciosByProductAlmacen.get(key);
                                        const edited = editedPrices[key];
                                        const publico = edited?.publico ?? almPrecios?.precio_publico ?? 0;
                                        const proveedores = edited?.proveedores ?? almPrecios?.precio_proveedores ?? 0;
                                        const isAdjusting = adjustingCell?.productId === product.id && adjustingCell?.almacenId === alm.id;

                                        return (
                                          <tr key={alm.id} className="hover:bg-muted/20">
                                            <td className="px-3 py-1.5 font-medium">{alm.nombre}</td>
                                            <td className="px-3 py-1.5 text-right font-mono font-semibold">
                                              {almStock}
                                            </td>
                                            <td className="px-3 py-1.5 text-right">
                                              <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="ml-auto h-6 w-24 text-right text-xs"
                                                value={publico}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                  const val = parseFloat(e.target.value) || 0;
                                                  setEditedPrices((prev) => ({
                                                    ...prev,
                                                    [key]: { publico: val, proveedores: prev[key]?.proveedores ?? proveedores },
                                                  }));
                                                }}
                                              />
                                            </td>
                                            <td className="px-3 py-1.5 text-right">
                                              <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="ml-auto h-6 w-24 text-right text-xs"
                                                value={proveedores}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                  const val = parseFloat(e.target.value) || 0;
                                                  setEditedPrices((prev) => ({
                                                    ...prev,
                                                    [key]: { publico: prev[key]?.publico ?? publico, proveedores: val },
                                                  }));
                                                }}
                                              />
                                            </td>
                                            <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                                              {isAdjusting ? (
                                                <div className="flex items-center justify-center gap-1">
                                                  <select
                                                    className="h-6 rounded border px-1 text-xs"
                                                    value={adjustType}
                                                    onChange={(e) => setAdjustType(e.target.value as 'entrada' | 'salida')}
                                                  >
                                                    <option value="entrada">+</option>
                                                    <option value="salida">-</option>
                                                  </select>
                                                  <Input
                                                    type="number"
                                                    min="1"
                                                    className="h-6 w-16 text-center text-xs"
                                                    value={adjustQty}
                                                    onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                                                    autoFocus
                                                  />
                                                  <Button
                                                    size="sm"
                                                    className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs px-3"
                                                    disabled={isSavingStock || adjustQty <= 0}
                                                    onClick={() => handleInlineStockAdjust(product.id, product.variant_id, alm.id)}
                                                  >
                                                    {isSavingStock ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                                                    Aplicar
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-muted-foreground"
                                                    onClick={() => setAdjustingCell(null)}
                                                  >
                                                    Cancelar
                                                  </Button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center justify-center gap-0.5">
                                                  <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-6 w-6 border-green-300 text-green-700 hover:bg-green-50"
                                                    onClick={() => { setAdjustingCell({ productId: product.id, variantId: product.variant_id, almacenId: alm.id }); setAdjustType('entrada'); setAdjustQty(0); }}
                                                  >
                                                    <Plus className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-6 w-6 border-red-300 text-red-700 hover:bg-red-50"
                                                    onClick={() => { setAdjustingCell({ productId: product.id, variantId: product.variant_id, almacenId: alm.id }); setAdjustType('salida'); setAdjustQty(0); }}
                                                  >
                                                    <Minus className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          );
          })()}
        </CardContent>
      </Card>

      {/* Movement History (Kardex) */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de movimientos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Producto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos los productos</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                {Object.entries(MOVEMENT_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-[160px]"
              placeholder="Desde"
            />
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-[160px]"
              placeholder="Hasta"
            />
          </div>

          {/* Movements Table */}
          {loadingMovements ? (
            <div className="text-muted-foreground">
              Cargando movimientos...
            </div>
          ) : movements.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <Package className="mx-auto mb-2 h-8 w-8" />
              <p>No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Anterior</TableHead>
                    <TableHead className="text-right">Nuevo</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead className="text-center">Adjunto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((mov) => {
                    const typeConfig = MOVEMENT_TYPES[mov.movement_type] ?? {
                      label: mov.movement_type,
                      color: 'bg-gray-100 text-gray-800',
                      icon: Package,
                    };
                    const Icon = typeConfig.icon;
                    return (
                      <TableRow key={mov.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDate(mov.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {mov.product_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={typeConfig.color}
                          >
                            <Icon className="mr-1 h-3 w-3" />
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {mov.movement_type === 'entrada' ? '+' : '-'}
                          {mov.quantity}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {mov.previous_stock}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {mov.new_stock}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mov.created_by_name ?? '—'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {mov.comments ?? '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          {mov.attachment_url ? (
                            <a
                              href={mov.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800"
                              title="Ver adjunto"
                            >
                              <Paperclip className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog (global) */}
      <StockAdjustmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        type={dialogType}
      />
    </div>
  );
}
