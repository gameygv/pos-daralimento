import { useState } from 'react';
import { Printer, Search, Tag, Check, Calendar, QrCode, Filter, Download, Package, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
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
import { usePosProducts, type PosProduct } from '@/features/pos/hooks/usePosProducts';
import { useAlmacenes } from '@/features/almacenes/hooks/useAlmacenes';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useProductStock } from '@/features/inventory/hooks/useInventory';
import { toast } from 'sonner';

// ─── Label size configs in mm ─────────────────────────────
const LABEL_CONFIGS = {
  medium: { w: 40, h: 25, qr: 10, fontSize: 2.8, name: 'Mediana (4×2.5 cm)', gap: 3 },
  large:  { w: 50, h: 30, qr: 14, fontSize: 3.2, name: 'Grande (5×3 cm)', gap: 3 },
} as const;

type LabelSize = keyof typeof LABEL_CONFIGS;

// A4 printable area (210×297mm minus 10mm margins each side)
const PAGE_W = 190;
const PAGE_H = 277;

function calcGrid(size: LabelSize) {
  const cfg = LABEL_CONFIGS[size];
  const cols = Math.floor((PAGE_W + cfg.gap) / (cfg.w + cfg.gap));
  const rows = Math.floor((PAGE_H + cfg.gap) / (cfg.h + cfg.gap));
  return { cols, rows, perPage: cols * rows };
}

interface SelectedProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}

const ALL_VALUE = '__all__';

// ─── Helpers ──────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeSvgText(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Truncate string to maxLen chars with ellipsis */
function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

/** Split name into max 2 lines */
function splitName(name: string, maxChars: number): string[] {
  if (name.length <= maxChars) return [name];
  // Try to break at last space within limit
  const breakIdx = name.lastIndexOf(' ', maxChars);
  if (breakIdx > 0) {
    return [name.slice(0, breakIdx), truncate(name.slice(breakIdx + 1), maxChars)];
  }
  return [truncate(name, maxChars), ''];
}

function formatWeight(grams: number | null): string {
  if (grams === null || grams === undefined) return '—';
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)}kg`;
  return `${grams}g`;
}

/** Fetch weight_grams for a list of product IDs */
async function fetchWeights(ids: string[]): Promise<Map<string, number | null>> {
  if (ids.length === 0) return new Map();
  const { data } = (await supabase
    .from('products' as never)
    .select('id, weight_grams')
    .in('id' as never, ids as never)) as unknown as {
    data: Array<{ id: string; weight_grams: number | null }> | null;
  };
  return new Map((data ?? []).map((p) => [p.id, p.weight_grams]));
}

// ─── Main component ──────────────────────────────────────

export function EtiquetasPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectedProduct[]>([]);
  const [labelSize, setLabelSize] = useState<LabelSize>('medium');

  const [filterMode, setFilterMode] = useState<'search' | 'inventory'>('search');
  const [almacenFilter, setAlmacenFilter] = useState<string>(ALL_VALUE);

  function getTodayRange() {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    return { desde: `${dateStr}T00:00`, hasta: `${dateStr}T23:59` };
  }
  const [fechaDesde, setFechaDesde] = useState(() => getTodayRange().desde);
  const [fechaHasta, setFechaHasta] = useState(() => getTodayRange().hasta);

  const { data: products = [] } = usePosProducts({ query: search || null });
  const { data: almacenes = [] } = useAlmacenes();
  const { data: allProductStock = [] } = useProductStock();

  const { data: inventoryProducts = [] } = useQuery<Array<{ id: string; name: string; sku: string; base_price: number; almacen_nombre: string; qty: number }>>({
    queryKey: ['etiquetas-inventory', fechaDesde, fechaHasta, almacenFilter],
    queryFn: async () => {
      if (!fechaDesde && !fechaHasta) return [];
      let query = supabase
        .from('kardex' as never)
        .select('product_id, cantidad, almacen_id, created_at')
        .in('tipo' as never, ['entrada', 'ajuste'] as never)
        .order('created_at' as never, { ascending: false });
      if (fechaDesde) query = query.gte('created_at' as never, new Date(fechaDesde).toISOString() as never);
      if (fechaHasta) query = query.lte('created_at' as never, new Date(fechaHasta).toISOString() as never);
      if (almacenFilter !== ALL_VALUE) query = query.eq('almacen_id' as never, almacenFilter as never);
      const { data: kardexRows, error } = (await query) as unknown as {
        data: Array<{ product_id: string; cantidad: number; almacen_id: string }> | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      if (!kardexRows || kardexRows.length === 0) return [];
      const byProduct = new Map<string, { qty: number; almacen_id: string }>();
      for (const k of kardexRows) {
        const existing = byProduct.get(k.product_id);
        if (existing) existing.qty += k.cantidad;
        else byProduct.set(k.product_id, { qty: k.cantidad, almacen_id: k.almacen_id });
      }
      const productIds = [...byProduct.keys()];
      const { data: prods } = (await supabase
        .from('products' as never)
        .select('id, name, sku, base_price')
        .in('id' as never, productIds as never)) as unknown as {
        data: Array<{ id: string; name: string; sku: string; base_price: number }> | null;
      };
      const almName = almacenFilter !== ALL_VALUE ? almacenes.find((a) => a.id === almacenFilter)?.nombre ?? '' : '';
      return (prods ?? []).map((p) => ({ ...p, almacen_nombre: almName, qty: byProduct.get(p.id)?.qty ?? 1 }));
    },
    enabled: filterMode === 'inventory',
  });

  // ─── Selection handlers ──────────────────────────────

  function toggleProduct(p: PosProduct | { id: string; name: string; sku: string }) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === p.id);
      if (exists) return prev.filter((s) => s.id !== p.id);
      return [...prev, { id: p.id, name: p.name, sku: p.sku, quantity: 1 }];
    });
  }

  function selectAllInventory() {
    const newSelected: SelectedProduct[] = [];
    for (const p of inventoryProducts) {
      if (!selected.find((s) => s.id === p.id)) {
        newSelected.push({ id: p.id, name: p.name, sku: p.sku, quantity: p.qty ?? 1 });
      }
    }
    setSelected((prev) => [...prev, ...newSelected]);
  }

  function selectAllWithStock() {
    const withStock = allProductStock.filter((p) => p.stock > 0);
    const newSelected: SelectedProduct[] = [];
    for (const p of withStock) {
      if (!selected.find((s) => s.id === p.id)) {
        newSelected.push({ id: p.id, name: p.name, sku: p.sku, quantity: p.stock });
      }
    }
    setSelected((prev) => [...prev, ...newSelected]);
  }

  function updateQuantity(id: string, qty: number) {
    setSelected((prev) => prev.map((s) => (s.id === id ? { ...s, quantity: Math.max(1, qty) } : s)));
  }

  // ─── Print (HTML for EPSON) ───────────────────────────

  async function handlePrint() {
    const cfg = LABEL_CONFIGS[labelSize];
    const grid = calcGrid(labelSize);

    const labels = selected.flatMap((s) => Array.from({ length: s.quantity }, () => s));
    const weightMap = await fetchWeights([...new Set(selected.map((s) => s.id))]);
    const maxChars = labelSize === 'large' ? 18 : 16;

    const labelHtml = labels.map((l) => {
      const qrSize = cfg.qr * 3.78; // mm to px approx at 96dpi
      const qrSvg = renderToString(<QRCodeSVG value={l.sku} size={qrSize} level="M" />);
      const weight = formatWeight(weightMap.get(l.id) ?? null);
      return `
        <div class="label">
          <div class="label-info">
            <div class="name">${escapeHtml(l.name)}</div>
            <div class="sku">${escapeHtml(l.sku)}</div>
            <div class="weight">${weight}</div>
          </div>
          <div class="qr">${qrSvg}</div>
        </div>`;
    }).join('');

    const totalPages = Math.ceil(labels.length / grid.perPage);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<html><head><title>Etiquetas QR - ${labels.length} unidades</title>
      <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 10mm; color: #000; }
        .grid {
          display: flex; flex-wrap: wrap;
          gap: ${cfg.gap}mm;
          width: ${PAGE_W}mm;
        }
        .label {
          width: ${cfg.w}mm; height: ${cfg.h}mm;
          border: 0.3mm solid #000;
          padding: 1.5mm;
          display: flex; align-items: center; gap: 1.5mm;
          overflow: hidden;
          page-break-inside: avoid;
        }
        .label-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.5mm; }
        .name { font-weight: bold; font-size: ${cfg.fontSize}mm; line-height: 1.25;
                 overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .sku { font-size: ${cfg.fontSize * 0.75}mm; color: #333; font-family: monospace; font-weight: 600; }
        .weight { font-size: ${cfg.fontSize * 0.75}mm; color: #333; font-weight: 600; }
        .qr { flex-shrink: 0; }
        .qr svg { display: block; width: ${cfg.qr}mm; height: ${cfg.qr}mm; }
        .page-info { font-size: 2.5mm; color: #999; text-align: right; margin-top: 2mm; }
      </style></head><body>
      <div class="grid">${labelHtml}</div>
      ${totalPages > 1 ? `<div class="page-info">${labels.length} etiquetas en ${totalPages} paginas</div>` : ''}
      <script>window.print();<\/script>
      </body></html>`);
    printWindow.document.close();
  }

  // ─── Download SVG for Cricut ──────────────────────────

  async function handleDownloadSVG() {
    const cfg = LABEL_CONFIGS[labelSize];
    const grid = calcGrid(labelSize);
    const maxChars = labelSize === 'large' ? 18 : 16;

    const labels = selected.flatMap((s) => Array.from({ length: s.quantity }, () => s));
    if (labels.length === 0) return;

    const weightMap = await fetchWeights([...new Set(selected.map((s) => s.id))]);
    const totalPages = Math.ceil(labels.length / grid.perPage);

    for (let page = 0; page < totalPages; page++) {
      const pageLabels = labels.slice(page * grid.perPage, (page + 1) * grid.perPage);
      let svgContent = '';

      pageLabels.forEach((l, idx) => {
        const col = idx % grid.cols;
        const row = Math.floor(idx / grid.cols);
        const x = col * (cfg.w + cfg.gap);
        const y = row * (cfg.h + cfg.gap);
        const weight = formatWeight(weightMap.get(l.id) ?? null);
        const lines = splitName(l.name, maxChars);

        // QR code as embedded SVG
        const qrSvgFull = renderToStaticMarkup(<QRCodeSVG value={l.sku} size={100} level="M" />);
        // Extract inner content (remove outer <svg> tag)
        const qrInner = qrSvgFull.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

        const qrX = x + cfg.w - cfg.qr - 1.5;
        const qrY = y + (cfg.h - cfg.qr) / 2;
        const textX = x + 1.5;

        svgContent += `
  <g>
    <rect x="${x}" y="${y}" width="${cfg.w}" height="${cfg.h}" fill="white" stroke="#000" stroke-width="0.25"/>
    <text x="${textX}" y="${y + cfg.fontSize + 1.5}" font-family="Arial, sans-serif" font-size="${cfg.fontSize}" font-weight="bold" fill="#000">
      ${escapeSvgText(lines[0])}
    </text>
    ${lines[1] ? `<text x="${textX}" y="${y + cfg.fontSize * 2 + 2.5}" font-family="Arial, sans-serif" font-size="${cfg.fontSize}" font-weight="bold" fill="#000">${escapeSvgText(lines[1])}</text>` : ''}
    <text x="${textX}" y="${y + cfg.h - cfg.fontSize * 1.5 - 1}" font-family="monospace" font-size="${cfg.fontSize * 0.75}" fill="#333" font-weight="600">
      ${escapeSvgText(l.sku)}
    </text>
    <text x="${textX}" y="${y + cfg.h - 1.5}" font-family="Arial, sans-serif" font-size="${cfg.fontSize * 0.75}" fill="#333" font-weight="600">
      ${escapeSvgText(weight)}
    </text>
    <g transform="translate(${qrX}, ${qrY}) scale(${cfg.qr / 100})">
      ${qrInner}
    </g>
  </g>`;
      });

      const usedW = grid.cols * cfg.w + (grid.cols - 1) * cfg.gap;
      const usedH = Math.ceil(pageLabels.length / grid.cols) * cfg.h + (Math.ceil(pageLabels.length / grid.cols) - 1) * cfg.gap;

      const svgDoc = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${usedW} ${usedH}" width="${usedW}mm" height="${usedH}mm">
${svgContent}
</svg>`;

      const blob = new Blob([svgDoc], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = totalPages > 1 ? `etiquetas-pagina-${page + 1}.svg` : 'etiquetas.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    toast.success(`SVG descargado (${labels.length} etiquetas en ${totalPages} archivo${totalPages > 1 ? 's' : ''})`);
  }

  // ─── Computed values ──────────────────────────────────

  const totalLabels = selected.reduce((s, p) => s + p.quantity, 0);
  const grid = calcGrid(labelSize);
  const totalPages = Math.ceil(totalLabels / grid.perPage);
  const cfg = LABEL_CONFIGS[labelSize];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Etiquetas QR</h1>
          <p className="text-muted-foreground">
            Genera etiquetas con QR para imprimir y cortar con Cricut
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={selected.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={handleDownloadSVG} disabled={selected.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Descargar SVG para Cricut
          </Button>
        </div>
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
                  filterMode === 'search' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Search className="h-3.5 w-3.5" /> Buscar
              </button>
              <button
                onClick={() => setFilterMode('inventory')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterMode === 'inventory' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" /> Por Inventario
              </button>
            </div>

            {filterMode === 'search' ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar producto por nombre o SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    {products.map((p) => {
                      const isSelected = selected.some((s) => s.id === p.id);
                      return (
                        <button key={p.id} onClick={() => toggleProduct(p)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${isSelected ? 'bg-teal-50 text-teal-700' : 'hover:bg-muted/50'}`}>
                          {isSelected && <Check className="h-4 w-4 shrink-0 text-teal-600" />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-dashed p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{allProductStock.filter((p) => p.stock > 0).length} productos con existencia</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={selectAllWithStock}>
                      <Check className="mr-1 h-3 w-3" /> Seleccionar todo el inventario
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Desde</Label>
                    <Input type="datetime-local" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Hasta</Label>
                    <Input type="datetime-local" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={almacenFilter} onValueChange={setAlmacenFilter}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Punto de Venta" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Todos los puntos de venta</SelectItem>
                      {almacenes.map((a) => (<SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                {inventoryProducts.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm text-muted-foreground">{inventoryProducts.length} productos encontrados</span>
                    <Button variant="outline" size="sm" onClick={selectAllInventory}>
                      <Check className="mr-1 h-3 w-3" /> Seleccionar todos
                    </Button>
                  </div>
                )}

                <ScrollArea className="h-[340px]">
                  <div className="space-y-1">
                    {inventoryProducts.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        {fechaDesde || fechaHasta ? 'Sin movimientos en ese rango' : 'Selecciona un rango de fechas'}
                      </p>
                    ) : inventoryProducts.map((p) => {
                      const isSelected = selected.some((s) => s.id === p.id);
                      return (
                        <button key={p.id}
                          onClick={() => setSelected((prev) => {
                            const exists = prev.find((s) => s.id === p.id);
                            if (exists) return prev.filter((s) => s.id !== p.id);
                            return [...prev, { id: p.id, name: p.name, sku: p.sku, quantity: p.qty ?? 1 }];
                          })}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${isSelected ? 'bg-teal-50 text-teal-700' : 'hover:bg-muted/50'}`}>
                          {isSelected && <Check className="h-4 w-4 shrink-0 text-teal-600" />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.qty} etiqueta{p.qty !== 1 ? 's' : ''}{p.almacen_nombre ? ` · ${p.almacen_nombre}` : ''}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>

        {/* Config + Preview + Instructions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuracion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tamano de etiqueta</Label>
                <div className="mt-1 flex gap-2">
                  {(Object.entries(LABEL_CONFIGS) as [LabelSize, typeof LABEL_CONFIGS[LabelSize]][]).map(([key, val]) => (
                    <Button key={key} variant={labelSize === key ? 'default' : 'outline'} size="sm" onClick={() => setLabelSize(key)}>
                      {val.name}
                    </Button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {grid.cols}×{grid.rows} = {grid.perPage} etiquetas por hoja A4
                  {totalLabels > 0 && ` · ${totalPages} hoja${totalPages !== 1 ? 's' : ''} para ${totalLabels} etiquetas`}
                </p>
              </div>

              {selected.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Cantidad por producto</Label>
                    <button onClick={() => setSelected([])} className="text-xs text-red-500 hover:text-red-700">Limpiar todo</button>
                  </div>
                  <ScrollArea className="max-h-[200px]">
                    {selected.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 py-0.5">
                        <p className="min-w-0 flex-1 truncate text-sm">{s.name}</p>
                        <Input type="number" min={1} className="h-7 w-20 text-sm" value={s.quantity}
                          onChange={(e) => updateQuantity(s.id, parseInt(e.target.value) || 1)} />
                        <button onClick={() => setSelected((prev) => prev.filter((p) => p.id !== s.id))}
                          className="text-xs text-red-500 hover:text-red-700">✕</button>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          {selected.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode className="h-4 w-4" /> Vista previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selected.slice(0, 3).map((s) => {
                    const pxW = cfg.w * 3;
                    const pxH = cfg.h * 3;
                    const qrPx = cfg.qr * 3;
                    return (
                      <div key={s.id} className="flex items-center gap-1 rounded border border-black p-1" style={{ width: pxW, height: pxH }}>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[8px] font-bold leading-tight">{s.name}</p>
                          <p className="mt-0.5 font-mono text-[7px] font-semibold text-gray-600">{s.sku}</p>
                          <p className="text-[7px] font-semibold text-gray-600">—</p>
                        </div>
                        <div className="shrink-0">
                          <QRCodeSVG value={s.sku} size={qrPx} level="M" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selected.length > 3 && (
                  <p className="mt-1 text-xs text-muted-foreground">+{selected.length - 3} productos mas...</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" /> Instrucciones de impresion y corte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">Opcion A: Imprimir y cortar con Cricut</p>
                <ol className="mt-1 ml-4 list-decimal space-y-1">
                  <li>Selecciona productos y cantidades</li>
                  <li>Click <strong>"Descargar SVG para Cricut"</strong></li>
                  <li>Abre <strong>Cricut Design Space</strong> → <em>Nuevo proyecto</em></li>
                  <li><strong>Subir</strong> → <em>Cargar imagen</em> → selecciona el SVG descargado</li>
                  <li>Selecciona <strong>"Imprimir luego cortar"</strong> como tipo de imagen</li>
                  <li>Inserta en el lienzo y ajusta el tamano si es necesario</li>
                  <li>Click <strong>"Crear"</strong> → Cricut enviara a imprimir en la EPSON con marcas de registro</li>
                  <li>Coloca la hoja impresa en el tapete del Cricut</li>
                  <li>El Cricut leera las marcas y cortara cada etiqueta</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold text-foreground">Opcion B: Solo imprimir (corte manual)</p>
                <ol className="mt-1 ml-4 list-decimal space-y-1">
                  <li>Selecciona productos y cantidades</li>
                  <li>Click <strong>"Imprimir"</strong></li>
                  <li>Configura la impresora: <strong>A4, Negro/Escala de grises, Calidad Alto</strong></li>
                  <li>Corta las etiquetas manualmente por las lineas</li>
                </ol>
              </div>
              <div className="rounded bg-amber-50 p-2 text-xs text-amber-800">
                <strong>Nota papel glossy:</strong> Si el Cricut no lee las marcas de registro en el vinil glossy,
                coloca un trozo de cinta adhesiva mate (masking tape) sobre cada marca de esquina.
                El acabado mate permite al sensor detectar las marcas correctamente.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
