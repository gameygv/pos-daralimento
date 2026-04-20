import { useState, useCallback } from 'react';
import { Warehouse, Plus, Package, ArrowRightLeft, ScrollText, DollarSign, Save, Loader2, Pencil, RefreshCw, Globe } from 'lucide-react';
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
  useAlmacenStock, useAllProductVariants, useKardex, useAdjustAlmacenStock,
  useCreateTransferencia, useAlmacenPrecios, useUpsertAlmacenPrecio,
  type AlmacenRow, type KardexFilter,
} from '../hooks/useAlmacenes';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { syncProductToWC } from '@/features/catalog/products/utils/syncProductToWC';
import { logAction } from '@/features/logs/hooks/useLogs';

type Tab = 'stock' | 'precios' | 'kardex' | 'transferir';

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
  const { data: almacenes = [], isLoading } = useAlmacenes(true);
  const createAlmacen = useCreateAlmacen();
  const updateAlmacen = useUpdateAlmacen();
  const adjustStock = useAdjustAlmacenStock();
  const createTransfer = useCreateTransferencia();

  const queryClient = useQueryClient();
  const [selectedAlmacen, setSelectedAlmacen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('stock');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDir, setNewDir] = useState('');
  const [newClienteId, setNewClienteId] = useState('');
  // Edit state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDir, setEditDir] = useState('');
  const [editClienteId, setEditClienteId] = useState('');
  // WC bulk sync
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ done: 0, total: 0 });

  // Fetch clientes for selector
  const { data: clientes = [] } = useQuery<Array<{ id: string; nombre: string }>>({
    queryKey: ['clientes-list'],
    queryFn: async () => {
      const { data } = (await supabase
        .from('clientes' as never)
        .select('id, nombre')
        .order('nombre' as never)) as unknown as { data: Array<{ id: string; nombre: string }> | null };
      return data ?? [];
    },
  });

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
  const { data: allVariants = [] } = useAllProductVariants();
  const { data: kardexData = [] } = useKardex(kardexFilter);
  const { data: preciosData = [] } = useAlmacenPrecios(selectedAlmacen);
  const upsertPrecio = useUpsertAlmacenPrecio();

  // Track edited prices locally before saving
  const [editedPrecios, setEditedPrecios] = useState<Record<string, { publico: number; proveedores: number }>>({});
  const [precioFilter, setPrecioFilter] = useState('');

  const selected = almacenes.find((a) => a.id === selectedAlmacen);

  async function handleCreateAlmacen() {
    if (!newName.trim()) return;
    const result = await createAlmacen.mutateAsync({
      nombre: newName.trim(),
      descripcion: newDesc.trim() || null,
      direccion: newDir.trim() || null,
      tienda_id: null,
      is_active: true,
      is_default: false,
    });
    // Link client if selected
    if (newClienteId && result?.id) {
      await supabase.from('almacenes' as never).update({ cliente_id: newClienteId } as never).eq('id' as never, result.id as never);
    }
    toast.success('Punto de Venta creado');
    setNewName('');
    setNewDesc('');
    setNewDir('');
    setNewClienteId('');
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

  function openEditDialog(alm: AlmacenRow) {
    setEditName(alm.nombre);
    setEditDesc(alm.descripcion ?? '');
    setEditDir(alm.direccion ?? '');
    setEditClienteId(alm.cliente_id ?? '');
    setShowEditDialog(true);
  }

  async function handleEditAlmacen() {
    if (!selectedAlmacen || !editName.trim()) return;
    await updateAlmacen.mutateAsync({
      id: selectedAlmacen,
      nombre: editName.trim(),
      descripcion: editDesc.trim() || null,
      direccion: editDir.trim() || null,
      cliente_id: editClienteId && editClienteId !== '__none__' ? editClienteId : null,
    } as { id: string } & Partial<AlmacenRow>);
    toast.success('Punto de Venta actualizado');
    setShowEditDialog(false);
  }

  async function handleToggleAlmacenActive(alm: AlmacenRow) {
    if (alm.nombre === 'Página Web') return;
    await updateAlmacen.mutateAsync({ id: alm.id, is_active: !alm.is_active } as { id: string } & Partial<AlmacenRow>);
    toast.success(alm.is_active ? 'Punto de Venta desactivado' : 'Punto de Venta activado');
  }

  const handleSyncAllWC = useCallback(async () => {
    setIsSyncingAll(true);
    // Get "Página Web" almacén id
    const paginaWeb = almacenes.find((a) => a.nombre === 'Página Web');
    if (!paginaWeb) { toast.error('No se encontró el almacén "Página Web"'); setIsSyncingAll(false); return; }

    // Get all products with precio_publico > 0 in Página Web
    const { data: precios } = (await supabase
      .from('almacen_precios' as never)
      .select('product_id')
      .eq('almacen_id' as never, paginaWeb.id as never)
      .gt('precio_publico' as never, 0 as never)) as unknown as {
      data: Array<{ product_id: string }> | null;
    };
    const productIds = (precios ?? []).map((p) => p.product_id);
    if (productIds.length === 0) { toast.error('No hay productos vinculados a Página Web'); setIsSyncingAll(false); return; }

    setSyncProgress({ done: 0, total: productIds.length });
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < productIds.length; i++) {
      try {
        const result = await syncProductToWC(productIds[i]);
        if (result.success) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
      setSyncProgress({ done: i + 1, total: productIds.length });
    }

    void queryClient.invalidateQueries({ queryKey: ['product-wc-map'] });
    logAction('wc_sync_masivo', { total: productIds.length, exitosos: successCount, errores: errorCount });
    toast.success(`Sincronizacion completada: ${successCount} exitosos, ${errorCount} errores`);
    setIsSyncingAll(false);
  }, [almacenes, queryClient]);

  // Filter almacenes by active status
  const visibleAlmacenes = showInactive ? almacenes : almacenes.filter((a) => a.is_active);

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Switch id="show-inactive-alm" checked={showInactive} onCheckedChange={setShowInactive} />
            <label htmlFor="show-inactive-alm" className="text-xs text-muted-foreground cursor-pointer">Inactivos</label>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Punto de Venta
          </Button>
        </div>
      </div>

      {/* Almacen cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleAlmacenes.map((a) => {
          const isSelected = selectedAlmacen === a.id;
          const isPaginaWeb = a.nombre === 'Página Web';
          return (
            <Card
              key={a.id}
              className={`cursor-pointer transition-all ${!a.is_active ? 'opacity-50' : ''} ${isSelected ? 'ring-2 ring-teal-500' : 'hover:shadow-md'}`}
              onClick={() => setSelectedAlmacen(a.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {isPaginaWeb ? <Globe className="h-4 w-4 text-blue-600" /> : <Warehouse className="h-4 w-4 text-teal-600" />}
                  {a.nombre}
                  {a.is_default && (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                      Principal
                    </span>
                  )}
                  {!a.is_active && <Badge variant="secondary" className="text-[10px]">Inactivo</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {a.direccion && <p className="text-xs text-muted-foreground">{a.direccion}</p>}
                {a.descripcion && <p className="text-xs text-muted-foreground">{a.descripcion}</p>}
                <div className="flex items-center gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                  {!isPaginaWeb && (
                    <>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSelectedAlmacen(a.id); openEditDialog(a); }}>
                        <Pencil className="mr-1 h-3 w-3" /> Editar
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className={`h-7 text-xs ${a.is_active ? 'text-red-600' : 'text-green-600'}`}
                        onClick={() => handleToggleAlmacenActive(a)}
                      >
                        {a.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </>
                  )}
                  {isPaginaWeb && (
                    <Button
                      variant="outline" size="sm" className="h-7 text-xs"
                      disabled={isSyncingAll}
                      onClick={handleSyncAllWC}
                    >
                      <RefreshCw className={`mr-1 h-3 w-3 ${isSyncingAll ? 'animate-spin' : ''}`} />
                      {isSyncingAll
                        ? `Sincronizando ${syncProgress.done}/${syncProgress.total}...`
                        : 'Sincronizar todo con WooCommerce'}
                    </Button>
                  )}
                </div>
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
                  variant={activeTab === 'precios' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('precios')}
                >
                  <DollarSign className="mr-1 h-4 w-4" /> Precios
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

            {activeTab === 'precios' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar producto..."
                    value={precioFilter}
                    onChange={(e) => setPrecioFilter(e.target.value)}
                    className="max-w-xs"
                  />
                  {Object.keys(editedPrecios).length > 0 && (
                    <Button
                      size="sm"
                      disabled={upsertPrecio.isPending}
                      onClick={async () => {
                        try {
                          for (const [productId, prices] of Object.entries(editedPrecios)) {
                            await upsertPrecio.mutateAsync({
                              almacenId: selectedAlmacen!,
                              productId,
                              precioPublico: prices.publico,
                              precioProveedores: prices.proveedores,
                            });
                          }
                          setEditedPrecios({});
                          toast.success(`Precios actualizados (${Object.keys(editedPrecios).length} productos)`);
                        } catch (err) {
                          toast.error((err as Error).message);
                        }
                      }}
                    >
                      {upsertPrecio.isPending ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-1 h-4 w-4" />
                      )}
                      Guardar {Object.keys(editedPrecios).length} cambio{Object.keys(editedPrecios).length !== 1 ? 's' : ''}
                    </Button>
                  )}
                </div>
                {preciosData.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No hay productos activos para configurar precios.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">SKU</th>
                          <th className="px-3 py-2 text-left font-medium">Producto</th>
                          <th className="px-3 py-2 text-right font-medium">Precio Público</th>
                          <th className="px-3 py-2 text-right font-medium">Precio Proveedores</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preciosData
                          .filter((p) => {
                            if (!precioFilter) return true;
                            const q = precioFilter.toLowerCase();
                            return p.product_name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
                          })
                          .map((p) => {
                            const edited = editedPrecios[p.product_id];
                            const publico = edited?.publico ?? p.precio_publico;
                            const proveedores = edited?.proveedores ?? p.precio_proveedores;
                            return (
                              <tr key={p.product_id} className="hover:bg-muted/30">
                                <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                                <td className="px-3 py-2">{p.product_name}</td>
                                <td className="px-3 py-2 text-right">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="ml-auto h-7 w-28 text-right text-xs"
                                    value={publico}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setEditedPrecios((prev) => ({
                                        ...prev,
                                        [p.product_id]: {
                                          publico: val,
                                          proveedores: prev[p.product_id]?.proveedores ?? p.precio_proveedores,
                                        },
                                      }));
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="ml-auto h-7 w-28 text-right text-xs"
                                    value={proveedores}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setEditedPrecios((prev) => ({
                                        ...prev,
                                        [p.product_id]: {
                                          publico: prev[p.product_id]?.publico ?? p.precio_publico,
                                          proveedores: val,
                                        },
                                      }));
                                    }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
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
            <div>
              <Label>Cliente vinculado</Label>
              <Select value={newClienteId} onValueChange={setNewClienteId}>
                <SelectTrigger><SelectValue placeholder="Sin cliente vinculado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin cliente vinculado</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Al seleccionar este punto de venta en el POS, se auto-selecciona este cliente</p>
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
                  const item = allVariants.find((s) => s.variant_id === v);
                  setAdjProduct(item?.product_id ?? '');
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona producto" /></SelectTrigger>
                <SelectContent>
                  {allVariants.map((v) => {
                    const existing = stockData.find((s) => s.variant_id === v.variant_id);
                    return (
                      <SelectItem key={v.variant_id} value={v.variant_id}>
                        {v.product_name} ({v.sku}){existing ? ` - Stock: ${existing.stock}` : ''}
                      </SelectItem>
                    );
                  })}
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

      {/* Edit punto de venta dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Punto de Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Descripcion</Label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Opcional" />
            </div>
            <div>
              <Label>Direccion</Label>
              <Input value={editDir} onChange={(e) => setEditDir(e.target.value)} placeholder="Opcional" />
            </div>
            <div>
              <Label>Cliente vinculado</Label>
              <Select value={editClienteId || '__none__'} onValueChange={setEditClienteId}>
                <SelectTrigger><SelectValue placeholder="Sin cliente vinculado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin cliente vinculado</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleEditAlmacen} disabled={!editName.trim() || updateAlmacen.isPending}>
              {updateAlmacen.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
