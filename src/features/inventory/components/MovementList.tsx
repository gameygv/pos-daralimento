import { useState } from 'react';
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

export function MovementList() {
  const navigate = useNavigate();
  // Stock overview
  const { data: products = [], isLoading: loadingProducts } = useProductStock();

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

  const openDialog = (product: ProductStockRow, type: 'entrada' | 'salida') => {
    setSelectedProduct(product);
    setDialogType(type);
    setDialogOpen(true);
  };

  // Summary stats
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock < p.min_stock,
  ).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/etiquetas')}
          >
            <QrCode className="mr-1 h-4 w-4" />
            Imprimir Etiquetas QR
          </Button>
        </CardHeader>
        <CardContent>
          {loadingProducts ? (
            <div className="text-muted-foreground">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <Package className="mx-auto mb-2 h-8 w-8" />
              <p>No hay productos con control de stock</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    <TableHead className="text-right">Minimo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const status = getStockStatus(
                      product.stock,
                      product.min_stock,
                    );
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.sku}
                        </TableCell>
                        <TableCell className="text-right font-mono text-lg">
                          {product.stock}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {product.min_stock}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={status.color}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                              onClick={() => openDialog(product, 'entrada')}
                              title="Entrada de mercancia"
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                              onClick={() => openDialog(product, 'salida')}
                              title="Salida de mercancia"
                            >
                              <Minus className="h-5 w-5" />
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

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        type={dialogType}
      />
    </div>
  );
}
