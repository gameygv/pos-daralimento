import { useState } from 'react';
import { Warehouse, Plus, Package, ArrowRightLeft, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  useAlmacenes, useCreateAlmacen, useUpdateAlmacen,
  useAlmacenStock, useKardex, useAdjustAlmacenStock,
  useCreateTransferencia,
  type AlmacenRow, type KardexFilter,
} from '../hooks/useAlmacenes';
import { useAuth } from '@/features/auth/AuthProvider';

type Tab = 'stock' | 'kardex' | 'transferir';

const KARDEX_TIPOS = [
  { value: '', label: 'Todos' },
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'venta', label: 'Venta' },
  { value: 'devolucion', label: 'Devolucion' },
  { value: 'transferencia_entrada', label: 'Transf. Entrada' },
  { value: 'transferencia_salida', label: 'Transf. Salida' },
];

const TIPO_COLORS: Record<string, string> = {
  entrada: 'bg-green-100 text-green-700',
  salida: 'bg-red-100 text-red-700',
  ajuste: 'bg-yellow-100 text-yellow-700',
  venta: 'bg-blue-100 text-blue-700',
  devolucion: 'bg-purple-100 text-purple-700',
  transferencia_entrada: 'bg-teal-100 text-teal-700',
  transferencia_salida: 'bg-orange-100 text-orange-700',
};

export function AlmacenesPage() {
  const { user } = useAuth();
  const { data: almacenes = [], isLoading } = useAlmacenes();
  const createAlmacen = useCreateAlmacen();
  const updateAlmacen = useUpdateAlmacen();
  const adjustStock = useAdjustAlmacenStock();
  const createTransfer = useCreateTransferencia();

  const [selectedAlmacen, setSelectedAlmacen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('stock');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDir, setNewDir] = useState('');

  // Kardex filters
  const [kardexTipo, setKardexTipo] = useState('');
  const kardexFilter: KardexFilter = {
    almacenId: selectedAlmacen,
    tipo: kardexTipo === '__all' ? null : (kardexTipo || null),
  };

  // Transfer state
  const [transferDest, setTransferDest] = useState('');
  const [transferItems, setTransferItems] = useState<Array<{ variantId: string; productId: string; sku: string; name: string; cantidad: number }>>([]);

  // Adjust state
  const [adjVariant, setAdjVariant] = useState('');
  const [adjProduct, setAdjProduct] = useState('');
  const [adjTipo, setAdjTipo] = useState<'entrada' | 'salida' | 'ajuste'>('entrada');
  const [adjCantidad, setAdjCantidad] = useState(0);
  const [adjComentario, setAdjComentario] = useState('');

  const { data: stockData = [] } = useAlmacenStock(selectedAlmacen);
  const { data: kardexData = [] } = useKardex(kardexFilter);

  const selected = almacenes.find((a) => a.id === selectedAlmacen);

  async function handleCreateAlmacen() {
    if (!newName.trim()) return;
    await createAlmacen.mutateAsync({
      nombre: newName.trim(),
      descripcion: newDesc.trim() || null,
      direccion: newDir.trim() || null,
      tienda_id: null,
      is_active: true,
      is_default: false,
    });
    toast.success('Punto de Venta creado');
    setNewName('');
    setNewDesc('');
    setNewDir('');
    setShowCreateDialog(false);
  }

  async function handleAdjust() {
    if (!selectedAlmacen || !adjVariant) return;
    await adjustStock.mutateAsync({
      almacenId: selectedAlmacen,
      variantId: adjVariant,
      productId: adjProduct,
      tipo: adjTipo,
      cantidad: adjCantidad,
      comentario: adjComentario,
      userId: user?.id,
      userName: user?.email?.split('@')[0],
    });
    toast.success('Stock ajustado');
    setShowAdjustDialog(false);
    setAdjVariant('');
    setAdjCantidad(0);
    setAdjComentario('');
  }

  async function handleTransfer() {
    if (!selectedAlmacen || !transferDest || transferItems.length === 0) return;
    await createTransfer.mutateAsync({
      almacenOrigenId: selectedAlmacen,
      almacenDestinoId: transferDest,
      items: transferItems.map((i) => ({ variantId: i.variantId, productId: i.productId, cantidad: i.cantidad })),
      userId: user?.id,
      userName: user?.email?.split('@')[0],
    });
    toast.success('Transferencia completada');
    setTransferItems([]);
    setTransferDest('');
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando puntos de venta...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Puntos de Venta</h1>
          <p className="text-muted-foreground">Gestiona inventario por ubicacion con trazabilidad Kardex</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Punto de Venta
        </Button>
      </div>

      {/* Almacen cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {almacenes.map((a) => {
          const isSelected = selectedAlmacen === a.id;
          return (
            <Card
              key={a.id}
              className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-teal-500' : 'hover:shadow-md'}`}
              onClick={() => setSelectedAlmacen(a.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Warehouse className="h-4 w-4 text-teal-600" />
                  {a.nombre}
                  {a.is_default && (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                      Principal
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {a.direccion && <p className="text-xs text-muted-foreground">{a.direccion}</p>}
                {a.descripcion && <p className="text-xs text-muted-foreground">{a.descripcion}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-teal-600" />
                {selected.nombre}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'stock' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('stock')}
                >
                  <Package className="mr-1 h-4 w-4" /> Stock
                </Button>
                <Button
                  variant={activeTab === 'kardex' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('kardex')}
                >
                  <ScrollText className="mr-1 h-4 w-4" /> Kardex
                </Button>
                <Button
                  variant={activeTab === 'transferir' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('transferir')}
                >
                  <ArrowRightLeft className="mr-1 h-4 w-4" /> Transferir
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'stock' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setShowAdjustDialog(true)}>
                    <Plus className="mr-1 h-4 w-4" /> Ajustar Stock
                  </Button>
                </div>
                {stockData.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    Sin productos en este punto de venta. Ajusta stock o transfiere productos.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">SKU</th>
                          <th className="px-3 py-2 text-left font-medium">Producto</th>
                          <th className="px-3 py-2 text-right font-medium">Stock</th>
                          <th className="px-3 py-2 text-right font-medium">Min.</th>
                          <th className="px-3 py-2 text-center font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {stockData.map((s) => (
                          <tr key={s.variant_id} className="hover:bg-muted/30">
                            <td className="px-3 py-2 font-mono text-xs">{s.sku}</td>
                            <td className="px-3 py-2">{s.product_name}</td>
                            <td className="px-3 py-2 text-right font-semibold">{s.stock}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{s.min_stock}</td>
                            <td className="px-3 py-2 text-center">
                              {s.stock <= 0 ? (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">Agotado</span>
                              ) : s.stock <= s.min_stock ? (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">Bajo</span>
                              ) : (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">OK</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'kardex' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select value={kardexTipo} onValueChange={setKardexTipo}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {KARDEX_TIPOS.map((t) => (
                        <SelectItem key={t.value || '__all'} value={t.value || '__all'}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ScrollArea className="h-[400px]">
                  {kardexData.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">Sin movimientos</p>
                  ) : (
                    <div className="space-y-2">
                      {kardexData.map((k) => (
                        <div key={k.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TIPO_COLORS[k.tipo] ?? 'bg-gray-100 text-gray-700'}`}>
                            {k.tipo.replace('_', ' ')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{k.comentario || k.referencia || '-'}</p>
                            <p className="text-xs text-muted-foreground">
                              {k.created_by_name} - {new Date(k.created_at).toLocaleString('es-MX')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${k.cantidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {k.cantidad >= 0 ? '+' : ''}{k.cantidad}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {k.stock_anterior} → {k.stock_nuevo}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {activeTab === 'transferir' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Punto de Venta destino</Label>
                  <Select value={transferDest} onValueChange={setTransferDest}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {almacenes
                        .filter((a) => a.id !== selectedAlmacen)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Productos a transferir</Label>
                  <p className="text-xs text-muted-foreground">
                    Selecciona del stock actual de este punto de venta
                  </p>
                  {stockData.map((s) => {
                    const existing = transferItems.find((i) => i.variantId === s.variant_id);
                    return (
                      <div key={s.variant_id} className="flex items-center gap-2 rounded border px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{s.product_name}</p>
                          <p className="text-xs text-muted-foreground">Stock: {s.stock}</p>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={s.stock}
                          className="h-8 w-20"
                          value={existing?.cantidad ?? 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setTransferItems((prev) => {
                              const filtered = prev.filter((i) => i.variantId !== s.variant_id);
                              if (val > 0) filtered.push({ variantId: s.variant_id, productId: s.product_id, sku: s.sku, name: s.product_name, cantidad: val });
                              return filtered;
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <Button
                  onClick={handleTransfer}
                  disabled={!transferDest || transferItems.length === 0 || createTransfer.isPending}
                  className="w-full"
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  {createTransfer.isPending ? 'Transfiriendo...' : `Transferir ${transferItems.length} producto(s)`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create punto de venta dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Punto de Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej. Bodega Norte" />
            </div>
            <div>
              <Label>Descripcion</Label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Opcional" />
            </div>
            <div>
              <Label>Direccion</Label>
              <Input value={newDir} onChange={(e) => setNewDir(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateAlmacen} disabled={!newName.trim() || createAlmacen.isPending}>
              {createAlmacen.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust stock dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Stock - {selected?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Producto</Label>
              <Select
                value={adjVariant}
                onValueChange={(v) => {
                  setAdjVariant(v);
                  const item = stockData.find((s) => s.variant_id === v);
                  setAdjProduct(item?.product_id ?? '');
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona producto" /></SelectTrigger>
                <SelectContent>
                  {stockData.map((s) => (
                    <SelectItem key={s.variant_id} value={s.variant_id}>
                      {s.product_name} ({s.sku}) - Stock: {s.stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de movimiento</Label>
              <Select value={adjTipo} onValueChange={(v) => setAdjTipo(v as 'entrada' | 'salida' | 'ajuste')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (+)</SelectItem>
                  <SelectItem value="salida">Salida (-)</SelectItem>
                  <SelectItem value="ajuste">Ajuste (fijar cantidad)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input type="number" min={0} value={adjCantidad} onChange={(e) => setAdjCantidad(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Comentario</Label>
              <Input value={adjComentario} onChange={(e) => setAdjComentario(e.target.value)} placeholder="Razon del ajuste" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>Cancelar</Button>
            <Button onClick={handleAdjust} disabled={!adjVariant || adjustStock.isPending}>
              {adjustStock.isPending ? 'Ajustando...' : 'Aplicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
