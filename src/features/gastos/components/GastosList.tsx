import { useState } from 'react';
import { Pencil, Plus, Wallet, FolderPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useGastos, useGastoCategorias, useCreateGastoCategoria, useUpdateGastoCategoria } from '../hooks/useGastos';
import { GastosForm } from './GastosForm';
import type { GastoRow } from '../hooks/useGastos';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function GastosList() {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filterCategoriaId, setFilterCategoriaId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoRow | null>(null);
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');

  const { data: categorias = [] } = useGastoCategorias();
  const createCategoria = useCreateGastoCategoria();
  const updateCategoria = useUpdateGastoCategoria();

  const parents = categorias.filter((c) => !c.parent_id);
  const children = categorias.filter((c) => !!c.parent_id);

  const { data: gastos = [], isLoading } = useGastos({
    fechaDesde: fechaDesde || null,
    fechaHasta: fechaHasta || null,
    categoriaId: filterCategoriaId || null,
  });

  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);

  function getCategoriaName(categoriaId: string | null, categoriaText: string | null) {
    if (categoriaId) {
      const cat = categorias.find((c) => c.id === categoriaId);
      if (cat) {
        const parent = cat.parent_id ? categorias.find((p) => p.id === cat.parent_id) : null;
        return parent ? `${parent.nombre} > ${cat.nombre}` : cat.nombre;
      }
    }
    return categoriaText ?? '—';
  }

  function handleCreate() {
    setEditingGasto(null);
    setIsFormOpen(true);
  }

  function handleEdit(gasto: GastoRow) {
    setEditingGasto(gasto);
    setIsFormOpen(true);
  }

  async function handleCreateCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await createCategoria.mutateAsync({
      nombre: newCatName.trim(),
      parent_id: newCatParentId || null,
    });
    setNewCatName('');
    setNewCatParentId('');
    setIsCatDialogOpen(false);
  }

  async function handleDeleteCategoria(id: string) {
    await updateCategoria.mutateAsync({ id, is_active: false });
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando gastos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatPrice(totalGastos)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gastos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{categorias.length}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCatDialogOpen(true)}
              >
                <FolderPlus className="mr-1 h-4 w-4" />
                Gestionar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
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
        <Select value={filterCategoriaId} onValueChange={setFilterCategoriaId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {parents.map((parent) => {
              const subs = children.filter((c) => c.parent_id === parent.id);
              return (
                <div key={parent.id}>
                  <SelectItem value={parent.id} className="font-semibold">
                    {parent.nombre}
                  </SelectItem>
                  {subs.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id} className="pl-6">
                      └ {sub.nombre}
                    </SelectItem>
                  ))}
                </div>
              );
            })}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Table */}
      {gastos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <Wallet className="mx-auto mb-2 h-8 w-8" />
          <p>No hay gastos registrados</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastos.map((gasto) => (
                <TableRow key={gasto.id}>
                  <TableCell>{gasto.fecha}</TableCell>
                  <TableCell className="font-medium">
                    {gasto.concepto}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {formatPrice(gasto.monto)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getCategoriaName(gasto.categoria_id, gasto.categoria)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {gasto.notas ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(gasto)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <GastosForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        gasto={editingGasto}
      />

      {/* Category management dialog */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gestionar Categorías de Gastos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current categories tree */}
            <div className="max-h-[300px] space-y-1 overflow-y-auto rounded-lg border p-3">
              {parents.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin categorías</p>
              )}
              {parents.map((parent) => {
                const subs = children.filter((c) => c.parent_id === parent.id);
                return (
                  <div key={parent.id}>
                    <div className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted">
                      <span className="font-semibold">{parent.nombre}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => void handleDeleteCategoria(parent.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                    {subs.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded px-2 py-1 pl-6 hover:bg-muted"
                      >
                        <span className="text-sm">└ {sub.nombre}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => void handleDeleteCategoria(sub.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Add new category */}
            <form onSubmit={(e) => void handleCreateCategoria(e)} className="space-y-3">
              <div className="space-y-2">
                <Label>Nueva categoría</Label>
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nombre de la categoría"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría padre (opcional)</Label>
                <Select value={newCatParentId} onValueChange={setNewCatParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Raíz (categoría principal)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Raíz (categoría principal)</SelectItem>
                    {parents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!newCatName.trim() || createCategoria.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  {createCategoria.isPending ? 'Creando...' : 'Agregar'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
