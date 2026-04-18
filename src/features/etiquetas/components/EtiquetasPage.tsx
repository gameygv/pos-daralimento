import { useState, useRef, useMemo } from 'react';
import { Printer, Search, Tag, Check, Calendar, QrCode, Filter } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePosProducts, type PosProduct } from '@/features/pos/hooks/usePosProducts';
import { useInventoryMovements } from '@/features/inventory/hooks/useInventory';

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

interface SelectedProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

const ALL_VALUE = '__all__';

export function EtiquetasPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectedProduct[]>([]);
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showPrice, setShowPrice] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // Filtro por rango de fechas de movimientos de inventario
  const [filterMode, setFilterMode] = useState<'search' | 'inventory'>('search');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [movementType, setMovementType] = useState<string>(ALL_VALUE);

  const { data: products = [] } = usePosProducts({ query: search || null });

  // Buscar movimientos de inventario en el rango de fechas (solo en modo inventario)
  const { data: movements = [] } = useInventoryMovements({
    movementType: movementType === ALL_VALUE ? null : movementType,
    fechaDesde: fechaDesde || null,
    fechaHasta: fechaHasta || null,
    enabled: filterMode === 'inventory',
  });

  // Productos únicos encontrados en movimientos de inventario
  const inventoryProducts = useMemo(() => {
    if (filterMode !== 'inventory' || movements.length === 0) return [];
    const seen = new Map<string, { id: string; name: string; sku: string }>();
    for (const m of movements) {
      if (!seen.has(m.product_id)) {
        seen.set(m.product_id, {
          id: m.product_id,
          name: m.product_name ?? 'Desconocido',
          sku: m.product_sku ?? '',
        });
      }
    }
    return Array.from(seen.values());
  }, [movements, filterMode]);

  // Productos a mostrar en la lista
  const displayProducts = filterMode === 'search' ? products : [];

  function toggleProduct(p: PosProduct | { id: string; name: string; sku: string }) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === p.id);
      if (exists) return prev.filter((s) => s.id !== p.id);
      const price = 'base_price' in p ? p.base_price : 0;
      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          sku: p.sku,
          price,
          quantity: 1,
        },
      ];
    });
  }

  function selectAllInventory() {
    const newSelected: SelectedProduct[] = [];
    for (const p of inventoryProducts) {
      if (!selected.find((s) => s.id === p.id)) {
        newSelected.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: 0,
          quantity: 1,
        });
      }
    }
    setSelected((prev) => [...prev, ...newSelected]);
  }

  function updateQuantity(id: string, qty: number) {
    setSelected((prev) =>
      prev.map((s) => (s.id === id ? { ...s, quantity: Math.max(1, qty) } : s)),
    );
  }

  function handlePrint() {
    const sizeMap = {
      small: { w: 130, h: 100, qr: 50, fontSize: 8, gap: 6 },
      medium: { w: 180, h: 140, qr: 70, fontSize: 10, gap: 8 },
      large: { w: 240, h: 180, qr: 100, fontSize: 12, gap: 10 },
    };
    const size = sizeMap[labelSize];

    const labels = selected.flatMap((s) =>
      Array.from({ length: s.quantity }, () => s),
    );

    // Generate QR SVGs as strings
    const labelHtml = labels
      .map((l) => {
        const qrSvg = renderToString(
          <QRCodeSVG value={l.sku} size={size.qr} level="M" />,
        );
        return `
          <div class="label">
            <div class="label-info">
              <div class="name">${escapeHtml(l.name)}</div>
              <div class="sku">${escapeHtml(l.sku)}</div>
              ${showPrice && l.price > 0 ? `<div class="price">${formatPrice(l.price)}</div>` : ''}
            </div>
            <div class="qr">${qrSvg}</div>
          </div>
        `;
      })
      .join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>Etiquetas QR</title>
        <style>
          @page { margin: 5mm; }
          body { font-family: Arial, sans-serif; margin: 0; }
          .grid { display: flex; flex-wrap: wrap; gap: ${size.gap}px; }
          .label {
            width: ${size.w}px;
            height: ${size.h}px;
            border: 1px solid #ccc;
            padding: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
            overflow: hidden;
            page-break-inside: avoid;
            box-sizing: border-box;
          }
          .label-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .name {
            font-weight: bold;
            font-size: ${size.fontSize}px;
            line-height: 1.2;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
          }
          .sku {
            font-size: ${Math.max(size.fontSize - 2, 7)}px;
            color: #666;
            font-family: monospace;
            font-weight: 600;
          }
          .price {
            font-size: ${size.fontSize + 1}px;
            font-weight: bold;
            color: #111;
          }
          .qr {
            flex-shrink: 0;
          }
          .qr svg {
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="grid">${labelHtml}</div>
        <script>window.print(); window.close();<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  const totalLabels = selected.reduce((s, p) => s + p.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Etiquetas QR</h1>
          <p className="text-muted-foreground">
            Genera e imprime etiquetas con codigo QR escaneable desde el POS
          </p>
        </div>
        <Button onClick={handlePrint} disabled={selected.length === 0}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir {totalLabels} etiqueta(s)
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" /> Seleccionar Productos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filter mode tabs */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => setFilterMode('search')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterMode === 'search'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Search className="h-3.5 w-3.5" />
                Buscar
              </button>
              <button
                onClick={() => setFilterMode('inventory')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterMode === 'inventory'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Por Inventario
              </button>
            </div>

            {filterMode === 'search' ? (
              /* Búsqueda directa */
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto por nombre o SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    {displayProducts.map((p) => {
                      const isSelected = selected.some((s) => s.id === p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => toggleProduct(p)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isSelected ? 'bg-teal-50 text-teal-700' : 'hover:bg-muted/50'
                          }`}
                        >
                          {isSelected && <Check className="h-4 w-4 shrink-0 text-teal-600" />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.sku} - {formatPrice(p.base_price)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            ) : (
              /* Filtro por movimientos de inventario */
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Desde</Label>
                    <Input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Hasta</Label>
                    <Input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={movementType} onValueChange={setMovementType}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Tipo de movimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Todos los tipos</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="salida">Salidas</SelectItem>
                      <SelectItem value="ajuste">Ajustes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {inventoryProducts.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm text-muted-foreground">
                      {inventoryProducts.length} productos encontrados
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllInventory}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Seleccionar todos
                    </Button>
                  </div>
                )}

                <ScrollArea className="h-[340px]">
                  <div className="space-y-1">
                    {inventoryProducts.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        {fechaDesde || fechaHasta
                          ? 'Sin movimientos en ese rango'
                          : 'Selecciona un rango de fechas'}
                      </p>
                    ) : (
                      inventoryProducts.map((p) => {
                        const isSelected = selected.some((s) => s.id === p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => toggleProduct(p)}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              isSelected ? 'bg-teal-50 text-teal-700' : 'hover:bg-muted/50'
                            }`}
                          >
                            {isSelected && <Check className="h-4 w-4 shrink-0 text-teal-600" />}
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.sku}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>

        {/* Preview + config */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuracion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tamano de etiqueta</Label>
                <div className="mt-1 flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <Button
                      key={size}
                      variant={labelSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLabelSize(size)}
                    >
                      {size === 'small'
                        ? 'Chica'
                        : size === 'medium'
                          ? 'Mediana'
                          : 'Grande'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showPrice" className="cursor-pointer text-sm">
                  Mostrar precio en etiqueta
                </Label>
                <Switch
                  id="showPrice"
                  checked={showPrice}
                  onCheckedChange={setShowPrice}
                />
              </div>

              {selected.length > 0 && (
                <div className="space-y-2">
                  <Label>Cantidad por producto</Label>
                  {selected.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm">{s.name}</p>
                      <Input
                        type="number"
                        min={1}
                        className="h-8 w-20"
                        value={s.quantity}
                        onChange={(e) =>
                          updateQuantity(s.id, parseInt(e.target.value) || 1)
                        }
                      />
                      <button
                        onClick={() =>
                          setSelected((prev) => prev.filter((p) => p.id !== s.id))
                        }
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          {selected.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode className="h-4 w-4" />
                  Vista previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={printRef} className="flex flex-wrap gap-3">
                  {selected.slice(0, 4).map((s) => {
                    const sizeMap = {
                      small: { w: 130, h: 100, qr: 50 },
                      medium: { w: 180, h: 140, qr: 70 },
                      large: { w: 240, h: 180, qr: 100 },
                    };
                    const dim = sizeMap[labelSize];
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 rounded border p-2"
                        style={{ width: dim.w, height: dim.h }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-bold leading-tight">
                            {s.name}
                          </p>
                          <p className="mt-1 font-mono text-[10px] font-semibold text-muted-foreground">
                            {s.sku}
                          </p>
                          {showPrice && s.price > 0 && (
                            <p className="mt-1 text-sm font-bold">{formatPrice(s.price)}</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <QRCodeSVG value={s.sku} size={dim.qr} level="M" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selected.length > 4 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    +{selected.length - 4} productos mas...
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
