import { useState } from 'react';
import { Plus, Ticket, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  useCupones,
  useCreateCupon,
  useToggleCupon,
  useDeleteCupon,
} from '../hooks/useCupones';

export function CuponesView() {
  const { data: cupones = [], isLoading } = useCupones();
  const createCupon = useCreateCupon();
  const toggleCupon = useToggleCupon();
  const deleteCupon = useDeleteCupon();
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'porcentaje' | 'monto'>('porcentaje');
  const [valor, setValor] = useState('');
  const [montoMinimo, setMontoMinimo] = useState('');
  const [usosMaximos, setUsosMaximos] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  function resetForm() {
    setCodigo('');
    setDescripcion('');
    setTipo('porcentaje');
    setValor('');
    setMontoMinimo('');
    setUsosMaximos('');
    setFechaInicio('');
    setFechaFin('');
  }

  async function handleCreate() {
    if (!codigo.trim() || !valor) {
      toast.error('Codigo y valor son requeridos');
      return;
    }
    await createCupon.mutateAsync({
      codigo: codigo.trim().toUpperCase(),
      descripcion: descripcion || null,
      tipo,
      valor: parseFloat(valor),
      monto_minimo: parseFloat(montoMinimo) || 0,
      usos_maximos: usosMaximos ? parseInt(usosMaximos) : null,
      activo: true,
      fecha_inicio: fechaInicio || null,
      fecha_fin: fechaFin || null,
    });
    toast.success('Cupon creado');
    resetForm();
    setShowCreate(false);
  }

  async function handleToggle(id: string, activo: boolean) {
    await toggleCupon.mutateAsync({ id, activo: !activo });
  }

  async function handleDelete(id: string) {
    await deleteCupon.mutateAsync(id);
    toast.success('Cupon eliminado');
  }

  if (isLoading) return <p className="text-muted-foreground">Cargando cupones...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupones</h1>
          <p className="text-sm text-muted-foreground">Crea y administra cupones de descuento</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cupon
        </Button>
      </div>

      {cupones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Ticket className="mx-auto mb-3 h-10 w-10" />
            <p className="text-lg font-medium">Sin cupones</p>
            <p className="text-sm">Crea tu primer cupon de descuento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Min. compra</TableHead>
                <TableHead className="text-center">Usos</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cupones.map((c) => (
                <TableRow key={c.id} className={!c.activo ? 'opacity-50' : ''}>
                  <TableCell className="font-mono font-bold">{c.codigo}</TableCell>
                  <TableCell className="text-sm">{c.descripcion || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {c.tipo === 'porcentaje' ? '%' : '$'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {c.tipo === 'porcentaje' ? `${c.valor}%` : `$${c.valor}`}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.monto_minimo > 0 ? `$${c.monto_minimo}` : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.usos_actuales}{c.usos_maximos !== null ? `/${c.usos_maximos}` : ''}
                  </TableCell>
                  <TableCell className="text-xs">
                    {c.fecha_inicio || c.fecha_fin
                      ? `${c.fecha_inicio ?? '...'} - ${c.fecha_fin ?? '...'}`
                      : 'Sin limite'}
                  </TableCell>
                  <TableCell>
                    <Badge className={c.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggle(c.id, c.activo)}
                        className="rounded p-1.5 hover:bg-gray-100"
                        title={c.activo ? 'Desactivar' : 'Activar'}
                      >
                        {c.activo ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Cupon</DialogTitle>
            <DialogDescription>Crea un cupon de descuento</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Codigo</label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: VERANO20"
                className="font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Descripcion (opcional)</label>
              <Input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: 20% descuento verano"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Tipo</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setTipo('porcentaje')}
                    className={`flex-1 rounded-md border-2 px-3 py-2 text-sm font-medium ${
                      tipo === 'porcentaje'
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-gray-200'
                    }`}
                  >
                    % Porcentaje
                  </button>
                  <button
                    onClick={() => setTipo('monto')}
                    className={`flex-1 rounded-md border-2 px-3 py-2 text-sm font-medium ${
                      tipo === 'monto'
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-gray-200'
                    }`}
                  >
                    $ Monto fijo
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Valor {tipo === 'porcentaje' ? '(%)' : '($)'}
                </label>
                <Input
                  type="number"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder={tipo === 'porcentaje' ? 'Ej: 20' : 'Ej: 100'}
                  min={0}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Compra minima ($)</label>
                <Input
                  type="number"
                  value={montoMinimo}
                  onChange={(e) => setMontoMinimo(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Usos maximos</label>
                <Input
                  type="number"
                  value={usosMaximos}
                  onChange={(e) => setUsosMaximos(e.target.value)}
                  placeholder="Ilimitado"
                  min={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Fecha inicio</label>
                <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Fecha fin</label>
                <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            </div>
            <Button
              className="h-11 w-full"
              onClick={handleCreate}
              disabled={createCupon.isPending}
            >
              {createCupon.isPending ? 'Creando...' : 'Crear Cupon'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
