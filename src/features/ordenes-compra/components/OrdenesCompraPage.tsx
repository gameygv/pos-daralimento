import { useState } from 'react';
import { Plus, FileText, Truck, Search, Building2 } from 'lucide-react';
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
  useOrdenesCompra, useOrdenCompraItems, useCreateOrdenCompra, useUpdateOCStatus,
  useProveedores, useCreateProveedor,
  type OrdenCompraRow,
} from '../hooks/useOrdenesCompra';
import { useAlmacenes } from '@/features/almacenes/hooks/useAlmacenes';
import { usePosProducts, type PosProduct } from '@/features/pos/hooks/usePosProducts';
import { useAuth } from '@/features/auth/AuthProvider';

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

const STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviada: 'bg-blue-100 text-blue-700',
  parcial: 'bg-yellow-100 text-yellow-700',
  recibida: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  parcial: 'Parcial',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
};

export function OrdenesCompraPage() {
  const { user } = useAuth();
  const { data: ordenes = [], isLoading } = useOrdenesCompra();
  const { data: proveedores = [] } = useProveedores();
  const { data: almacenes = [] } = useAlmacenes();
  const createOC = useCreateOrdenCompra();
  const updateStatus = useUpdateOCStatus();
  const createProveedor = useCreateProveedor();

  const [selectedOC, setSelectedOC] = useState<string | null>(null);
  const [showNewOC, setShowNewOC] = useState(false);
  const [showNewProv, setShowNewProv] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  // New OC form
  const [ocProvId, setOcProvId] = useState('');
  const [ocAlmacen, setOcAlmacen] = useState('');
  const [ocNotas, setOcNotas] = useState('');
  const [ocItems, setOcItems] = useState<Array<{ productId: string; variantId: string | null; name: string; qty: number; cost: number }>>([]);
  const [productSearch, setProductSearch] = useState('');

  // New proveedor form
  const [provNombre, setProvNombre] = useState('');
  const [provTel, setProvTel] = useState('');
  const [provEmail, setProvEmail] = useState('');

  const { data: searchProducts = [] } = usePosProducts({ query: productSearch || null });
  const { data: ocItemsData = [] } = useOrdenCompraItems(selectedOC);
  const selectedOrden = ordenes.find((o) => o.id === selectedOC);

  const filtered = statusFilter
    ? ordenes.filter((o) => o.status === statusFilter)
    : ordenes;

  function addProductToOC(p: PosProduct) {
    if (ocItems.some((i) => i.productId === p.id)) return;
    setOcItems((prev) => [...prev, { productId: p.id, variantId: null, name: p.name, qty: 1, cost: 0 }]);
    setProductSearch('');
  }

  async function handleCreateOC() {
    const prov = proveedores.find((p) => p.id === ocProvId);
    if (!prov || ocItems.length === 0) return;

    await createOC.mutateAsync({
      proveedorId: prov.id,
      proveedorNombre: prov.nombre,
      almacenDestinoId: ocAlmacen || null,
      notas: ocNotas || undefined,
      items: ocItems.map((i) => ({
        productId: i.productId,
        descripcion: i.name,
        cantidadOrdenada: i.qty,
        costoUnitario: i.cost,
      })),
      userId: user?.id,
      userName: user?.email?.split('@')[0],
    });
    toast.success('Orden de compra creada');
    setShowNewOC(false);
    setOcItems([]);
    setOcNotas('');
  }

  async function handleCreateProv() {
    if (!provNombre.trim()) return;
    await createProveedor.mutateAsync({
      nombre: provNombre.trim(),
      contacto: null,
      telefono: provTel.trim() || null,
      email: provEmail.trim() || null,
      direccion: null,
      notas: null,
      is_active: true,
    });
    toast.success('Proveedor creado');
    setShowNewProv(false);
    setProvNombre('');
    setProvTel('');
    setProvEmail('');
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ordenes de Compra</h1>
          <p className="text-muted-foreground">Gestiona pedidos a proveedores y recepcion de mercancia</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewProv(true)}>
            <Building2 className="mr-2 h-4 w-4" /> Nuevo Proveedor
          </Button>
          <Button onClick={() => setShowNewOC(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Orden
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'borrador', 'enviada', 'parcial', 'recibida'].map((s) => (
          <Button
            key={s || 'all'}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s ? STATUS_LABELS[s] : 'Todas'}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders list */}
        <div className="lg:col-span-1">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filtered.map((o) => (
                <Card
                  key={o.id}
                  className={`cursor-pointer transition-all ${selectedOC === o.id ? 'ring-2 ring-teal-500' : 'hover:shadow-md'}`}
                  onClick={() => setSelectedOC(o.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">OC-{String(o.folio).padStart(4, '0')}</p>
                        <p className="text-xs text-muted-foreground">{o.proveedor_nombre}</p>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[o.status] ?? ''}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                        <p className="mt-1 text-sm font-semibold">{formatPrice(o.total)}</p>
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">Sin ordenes</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selectedOrden ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    OC-{String(selectedOrden.folio).padStart(4, '0')}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[selectedOrden.status] ?? ''}`}>
                      {STATUS_LABELS[selectedOrden.status] ?? selectedOrden.status}
                    </span>
                  </CardTitle>
                  <div className="flex gap-2">
                    {selectedOrden.status === 'borrador' && (
                      <Button size="sm" onClick={() => updateStatus.mutateAsync({ id: selectedOrden.id, status: 'enviada' }).then(() => toast.success('Orden enviada'))}>
                        Enviar
                      </Button>
                    )}
                    {(selectedOrden.status === 'enviada' || selectedOrden.status === 'parcial') && (
                      <Button size="sm" onClick={() => updateStatus.mutateAsync({ id: selectedOrden.id, status: 'recibida' }).then(() => toast.success('Orden recibida'))}>
                        <Truck className="mr-1 h-4 w-4" /> Marcar Recibida
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Proveedor</p>
                    <p className="font-medium">{selectedOrden.proveedor_nombre}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha</p>
                    <p className="font-medium">{new Date(selectedOrden.created_at).toLocaleDateString('es-MX')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{formatPrice(selectedOrden.total)}</p>
                  </div>
                  {selectedOrden.notas && (
                    <div>
                      <p className="text-muted-foreground">Notas</p>
                      <p>{selectedOrden.notas}</p>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Producto</th>
                        <th className="px-3 py-2 text-right font-medium">Ordenado</th>
                        <th className="px-3 py-2 text-right font-medium">Recibido</th>
                        <th className="px-3 py-2 text-right font-medium">Costo</th>
                        <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {ocItemsData.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">{item.descripcion}</td>
                          <td className="px-3 py-2 text-right">{item.cantidad_ordenada}</td>
                          <td className="px-3 py-2 text-right">{item.cantidad_recibida}</td>
                          <td className="px-3 py-2 text-right">{formatPrice(item.costo_unitario)}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatPrice(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex h-[500px] items-center justify-center text-muted-foreground">
              Selecciona una orden de compra
            </div>
          )}
        </div>
      </div>

      {/* New OC Dialog */}
      <Dialog open={showNewOC} onOpenChange={setShowNewOC}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Proveedor *</Label>
              <Select value={ocProvId} onValueChange={setOcProvId}>
                <SelectTrigger><SelectValue placeholder="Selecciona proveedor" /></SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Almacen destino</Label>
              <Select value={ocAlmacen} onValueChange={setOcAlmacen}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {almacenes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Agregar productos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {productSearch && searchProducts.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded border">
                  {searchProducts.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addProductToOC(p)}
                      className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-muted/50"
                    >
                      {p.name} - {p.sku}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {ocItems.length > 0 && (
              <div className="space-y-2">
                <Label>Items ({ocItems.length})</Label>
                {ocItems.map((item, i) => (
                  <div key={item.productId} className="flex items-center gap-2 rounded border p-2">
                    <p className="min-w-0 flex-1 truncate text-sm">{item.name}</p>
                    <Input
                      type="number"
                      min={1}
                      className="h-8 w-16"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        setOcItems((prev) => prev.map((it, j) => (j === i ? { ...it, qty } : it)));
                      }}
                    />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      className="h-8 w-24"
                      placeholder="Costo"
                      value={item.cost || ''}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 0;
                        setOcItems((prev) => prev.map((it, j) => (j === i ? { ...it, cost } : it)));
                      }}
                    />
                    <button
                      className="text-xs text-red-500 hover:underline"
                      onClick={() => setOcItems((prev) => prev.filter((_, j) => j !== i))}
                    >
                      X
                    </button>
                  </div>
                ))}
                <p className="text-right text-sm font-bold">
                  Subtotal: {formatPrice(ocItems.reduce((s, i) => s + i.qty * i.cost, 0))}
                </p>
              </div>
            )}
            <div>
              <Label>Notas</Label>
              <Input value={ocNotas} onChange={(e) => setOcNotas(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewOC(false)}>Cancelar</Button>
            <Button onClick={handleCreateOC} disabled={!ocProvId || ocItems.length === 0 || createOC.isPending}>
              {createOC.isPending ? 'Creando...' : 'Crear Orden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Proveedor Dialog */}
      <Dialog open={showNewProv} onOpenChange={setShowNewProv}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={provNombre} onChange={(e) => setProvNombre(e.target.value)} />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input value={provTel} onChange={(e) => setProvTel(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={provEmail} onChange={(e) => setProvEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProv(false)}>Cancelar</Button>
            <Button onClick={handleCreateProv} disabled={!provNombre.trim()}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
