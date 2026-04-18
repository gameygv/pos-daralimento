import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateGasto, useUpdateGasto, useGastoCategorias } from '../hooks/useGastos';
import type { GastoRow } from '../hooks/useGastos';

interface GastosFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gasto?: GastoRow | null;
}

export function GastosForm({ open, onOpenChange, gasto }: GastosFormProps) {
  const [fecha, setFecha] = useState('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [notas, setNotas] = useState('');

  const { data: categorias = [] } = useGastoCategorias();
  const createGasto = useCreateGasto();
  const updateGasto = useUpdateGasto();
  const isEditing = !!gasto;

  // Build parent/child structure
  const parents = categorias.filter((c) => !c.parent_id);
  const children = categorias.filter((c) => !!c.parent_id);

  useEffect(() => {
    if (gasto) {
      setFecha(gasto.fecha);
      setConcepto(gasto.concepto);
      setMonto(String(gasto.monto));
      setCategoriaId(gasto.categoria_id ?? '');
      setNotas(gasto.notas ?? '');
    } else {
      setFecha(new Date().toISOString().split('T')[0]!);
      setConcepto('');
      setMonto('');
      setCategoriaId('');
      setNotas('');
    }
  }, [gasto, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selectedCat = categorias.find((c) => c.id === categoriaId);
    const data = {
      fecha,
      concepto,
      monto: parseFloat(monto),
      categoria: selectedCat?.nombre ?? null,
      categoria_id: categoriaId || null,
      notas: notas || null,
      created_by: null,
    };

    if (isEditing) {
      await updateGasto.mutateAsync({ id: gasto.id, ...data });
    } else {
      await createGasto.mutateAsync(data);
    }
    onOpenChange(false);
  }

  const isPending = createGasto.isPending || updateGasto.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Gasto' : 'Nuevo Gasto'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha *</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto *</Label>
            <Input
              id="concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monto">Monto *</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecciona categoría..." />
              </SelectTrigger>
              <SelectContent>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !concepto || !monto}>
              {isPending
                ? 'Guardando...'
                : isEditing
                  ? 'Actualizar'
                  : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
