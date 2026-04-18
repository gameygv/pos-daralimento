import { useState } from 'react';
import { Plus, Pencil, Trash2, Monitor, Users, Loader2, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { Badge } from '@/components/ui/badge';
import {
  useCajas,
  useCreateCaja,
  useUpdateCaja,
  useDeleteCaja,
  useActiveSessions,
  useAllCajaUsers,
  useAssignUserToCaja,
  useUnassignUserFromCaja,
  type CajaRow,
} from '@/features/cajas/hooks/useCajas';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface VendeRow {
  codven: string;
  nombre: string;
  role: string;
}

function useVendedores() {
  return useQuery<VendeRow[]>({
    queryKey: ['vendedores'],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('vende' as never)
        .select('codven, nombre, role')
        .order('nombre')) as unknown as {
        data: VendeRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export default function CajasPage() {
  const { data: cajas = [], isLoading } = useCajas();
  const { data: sessions = [] } = useActiveSessions();
  const { data: cajaUsers = [] } = useAllCajaUsers();
  const { data: vendedores = [] } = useVendedores();
  const createCaja = useCreateCaja();
  const updateCaja = useUpdateCaja();
  const deleteCaja = useDeleteCaja();
  const assignUser = useAssignUserToCaja();
  const unassignUser = useUnassignUserFromCaja();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CajaRow | null>(null);
  const [nombre, setNombre] = useState('');
  const [tienda, setTienda] = useState('Principal');
  const [prefijoFolio, setPrefijoFolio] = useState('');

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCaja, setAssignCaja] = useState<CajaRow | null>(null);

  function handleCreate() {
    setEditing(null);
    setNombre('');
    setTienda('Principal');
    setPrefijoFolio('');
    setFormOpen(true);
  }

  function handleEdit(caja: CajaRow) {
    setEditing(caja);
    setNombre(caja.nombre);
    setTienda(caja.tienda);
    setPrefijoFolio(caja.prefijo_folio || '');
    setFormOpen(true);
  }

  async function handleSave() {
    if (!nombre.trim()) return;
    try {
      if (editing) {
        await updateCaja.mutateAsync({
          id: editing.id,
          nombre: nombre.trim(),
          tienda: tienda.trim(),
          prefijo_folio: prefijoFolio.trim(),
        });
      } else {
        await createCaja.mutateAsync({
          nombre: nombre.trim(),
          tienda: tienda.trim(),
          is_active: true,
          prefijo_folio: prefijoFolio.trim(),
        });
      }
      setFormOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      toast.error(msg);
    }
  }

  async function handleToggleActive(caja: CajaRow) {
    try {
      await updateCaja.mutateAsync({ id: caja.id, is_active: !caja.is_active });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      toast.error(msg);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Eliminar esta caja?')) {
      try {
        await deleteCaja.mutateAsync(id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        toast.error(msg);
      }
    }
  }

  function handleManageUsers(caja: CajaRow) {
    setAssignCaja(caja);
    setAssignOpen(true);
  }

  function getSessionForCaja(cajaId: string) {
    return sessions.find((s) => s.caja_id === cajaId);
  }

  function getAssignedUsers(cajaId: string) {
    return cajaUsers.filter((cu) => cu.caja_id === cajaId);
  }

  async function handleToggleUser(cajaId: string, userId: string, isAssigned: boolean) {
    try {
      if (isAssigned) {
        await unassignUser.mutateAsync({ cajaId, userId });
      } else {
        await assignUser.mutateAsync({ cajaId, userId });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cajas Registradoras</h1>
          <p className="text-muted-foreground">Administra las cajas de tu punto de venta</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Caja
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : cajas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <Monitor className="mx-auto mb-2 h-8 w-8" />
          <p>No hay cajas registradas.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tienda</TableHead>
                <TableHead>Prefijo</TableHead>
                <TableHead>Folio Actual</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Activa</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead className="w-[140px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cajas.map((caja) => {
                const session = getSessionForCaja(caja.id);
                const assigned = getAssignedUsers(caja.id);
                return (
                  <TableRow key={caja.id}>
                    <TableCell className="font-medium">{caja.nombre}</TableCell>
                    <TableCell>{caja.tienda}</TableCell>
                    <TableCell>
                      {caja.prefijo_folio ? (
                        <Badge variant="outline" className="font-mono">
                          <Hash className="mr-1 h-3 w-3" />
                          {caja.prefijo_folio}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {caja.folio_actual}
                    </TableCell>
                    <TableCell>
                      {session ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          En uso por {session.user_name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Disponible
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={caja.is_active}
                        onCheckedChange={() => handleToggleActive(caja)}
                      />
                    </TableCell>
                    <TableCell>
                      {assigned.length > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          {assigned.length} usuario{assigned.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Todos</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleManageUsers(caja)} title="Asignar usuarios">
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(caja)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(caja.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Caja' : 'Nueva Caja'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modifica los datos de la caja' : 'Agrega una nueva caja registradora'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Caja 1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tienda</label>
              <Input
                value={tienda}
                onChange={(e) => setTienda(e.target.value)}
                placeholder="Principal"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Prefijo de Folio</label>
              <Input
                value={prefijoFolio}
                onChange={(e) => setPrefijoFolio(e.target.value)}
                placeholder="C1"
                maxLength={10}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                El prefijo aparece en los tickets (ej. &quot;C1-001&quot;, &quot;TIEN2-001&quot;)
              </p>
            </div>
            {editing && (
              <div>
                <label className="text-sm font-medium">Folio Actual</label>
                <Input
                  value={editing.folio_actual}
                  disabled
                  className="bg-muted"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  El folio se incrementa automaticamente con cada venta
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!nombre.trim() || createCaja.isPending || updateCaja.isPending}
              >
                {editing ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Assignment Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar Usuarios a {assignCaja?.nombre}</DialogTitle>
            <DialogDescription>
              Selecciona los usuarios que pueden usar esta caja. Si no seleccionas ninguno, todos los usuarios tendran acceso.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {vendedores.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay usuarios registrados</p>
            ) : (
              vendedores.map((v) => {
                const isAssigned = cajaUsers.some(
                  (cu) => cu.caja_id === assignCaja?.id && cu.user_id === v.codven,
                );
                return (
                  <div
                    key={v.codven}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{v.nombre}</p>
                      <p className="text-xs text-muted-foreground">{v.role}</p>
                    </div>
                    <Switch
                      checked={isAssigned}
                      onCheckedChange={() => {
                        if (assignCaja) {
                          void handleToggleUser(assignCaja.id, v.codven, isAssigned);
                        }
                      }}
                    />
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
