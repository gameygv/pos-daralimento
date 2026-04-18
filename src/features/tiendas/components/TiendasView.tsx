import { useState } from 'react';
import {
  Store,
  Plus,
  Trash2,
  Edit2,
  EyeOff,
  Eye,
  Users,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import {
  useTiendas,
  useCreateTienda,
  useUpdateTienda,
  useDeleteTienda,
  useAllTiendaUsers,
  useAssignUserToTienda,
  useUnassignUserFromTienda,
  type TiendaRow,
} from '../hooks/useTiendas';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/features/settings/hooks/useSettings';

interface UserRow {
  id: string;
  email: string;
}

function useAllUsers() {
  return useQuery<UserRow[]>({
    queryKey: ['all-users-for-tiendas'],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('vende' as never)
        .select('user_id, email')
        .order('email')) as unknown as {
        data: { user_id: string; email: string }[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return (data ?? []).map((u) => ({ id: u.user_id, email: u.email }));
    },
  });
}

export function TiendasView() {
  const { data: tiendas = [], isLoading } = useTiendas();
  const createTienda = useCreateTienda();
  const updateTienda = useUpdateTienda();
  const deleteTienda = useDeleteTienda();
  const { data: allAssignments = [] } = useAllTiendaUsers();
  const assignUser = useAssignUserToTienda();
  const unassignUser = useUnassignUserFromTienda();
  const { data: allUsers = [] } = useAllUsers();
  const { data: settings } = useSettings();
  const modoT = settings?.modo_seguro_t ?? false;

  const [showCreate, setShowCreate] = useState(false);
  const [editTienda, setEditTienda] = useState<TiendaRow | null>(null);
  const [assignTiendaId, setAssignTiendaId] = useState<string | null>(null);

  // Form
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSecret, setIsSecret] = useState(false);

  function resetForm() {
    setNombre('');
    setDireccion('');
    setTelefono('');
    setIsSecret(false);
  }

  function openEdit(t: TiendaRow) {
    setEditTienda(t);
    setNombre(t.nombre);
    setDireccion(t.direccion ?? '');
    setTelefono(t.telefono ?? '');
    setIsSecret(t.is_secret);
  }

  async function handleCreate() {
    if (!nombre.trim()) return;
    await createTienda.mutateAsync({
      nombre: nombre.trim(),
      direccion: direccion || null,
      telefono: telefono || null,
      is_active: true,
      is_secret: isSecret,
    });
    toast.success('Tienda creada');
    resetForm();
    setShowCreate(false);
  }

  async function handleUpdate() {
    if (!editTienda || !nombre.trim()) return;
    await updateTienda.mutateAsync({
      id: editTienda.id,
      nombre: nombre.trim(),
      direccion: direccion || null,
      telefono: telefono || null,
      is_secret: isSecret,
    });
    toast.success('Tienda actualizada');
    resetForm();
    setEditTienda(null);
  }

  async function handleToggleActive(t: TiendaRow) {
    await updateTienda.mutateAsync({ id: t.id, is_active: !t.is_active });
  }

  async function handleDelete(id: string) {
    await deleteTienda.mutateAsync(id);
    toast.success('Tienda eliminada');
  }

  function getAssignedUsers(tiendaId: string) {
    return allAssignments
      .filter((a) => a.tienda_id === tiendaId)
      .map((a) => {
        const user = allUsers.find((u) => u.id === a.user_id);
        return { userId: a.user_id, email: user?.email ?? a.user_id };
      });
  }

  async function handleAssign(tiendaId: string, userId: string) {
    await assignUser.mutateAsync({ tiendaId, userId });
    toast.success('Usuario asignado');
  }

  async function handleUnassign(tiendaId: string, userId: string) {
    await unassignUser.mutateAsync({ tiendaId, userId });
    toast.success('Usuario removido');
  }

  if (isLoading) return <p className="text-muted-foreground">Cargando tiendas...</p>;

  // Filter tiendas by modo T visibility
  const visibleTiendas = modoT ? tiendas : tiendas.filter((t) => !t.is_secret);

  const assignTienda = tiendas.find((t) => t.id === assignTiendaId);
  const assignedUsers = assignTiendaId ? getAssignedUsers(assignTiendaId) : [];
  const assignedIds = new Set(assignedUsers.map((u) => u.userId));
  const unassignedUsers = allUsers.filter((u) => !assignedIds.has(u.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tiendas</h1>
          <p className="text-sm text-muted-foreground">Administra sucursales y acceso de usuarios</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Tienda
        </Button>
      </div>

      {visibleTiendas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Store className="mx-auto mb-3 h-10 w-10" />
            <p className="text-lg font-medium">Sin tiendas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Direccion</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTiendas.map((t) => {
                const users = getAssignedUsers(t.id);
                return (
                  <TableRow key={t.id} className={!t.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.nombre}</span>
                        {modoT && t.is_secret && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px]">
                            <EyeOff className="mr-0.5 h-3 w-3" /> T
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{t.direccion || '—'}</TableCell>
                    <TableCell className="text-sm">{t.telefono || '—'}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => setAssignTiendaId(t.id)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <Users className="h-3.5 w-3.5" />
                        {users.length > 0 ? `${users.length} asignados` : 'Todos'}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge className={t.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {t.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleActive(t)} className="rounded p-1.5 hover:bg-gray-100">
                          {t.is_active ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                        </button>
                        <button onClick={() => openEdit(t)} className="rounded p-1.5 hover:bg-gray-100">
                          <Edit2 className="h-4 w-4 text-gray-600" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
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
      <Dialog open={showCreate || !!editTienda} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditTienda(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTienda ? 'Editar Tienda' : 'Nueva Tienda'}</DialogTitle>
            <DialogDescription>Datos de la sucursal</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre *</label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Sucursal Centro" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Direccion</label>
              <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle, numero, colonia..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Telefono</label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="55 1234 5678" />
            </div>
            {modoT && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Visibilidad restringida</p>
                  <p className="text-xs text-muted-foreground">Solo visible en modo avanzado</p>
                </div>
                <Switch checked={isSecret} onCheckedChange={setIsSecret} />
              </div>
            )}
            <Button className="h-11 w-full" onClick={editTienda ? handleUpdate : handleCreate}>
              {editTienda ? 'Guardar Cambios' : 'Crear Tienda'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Assignment Dialog */}
      <Dialog open={!!assignTiendaId} onOpenChange={(o) => { if (!o) setAssignTiendaId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Usuarios — {assignTienda?.nombre}</DialogTitle>
            <DialogDescription>
              {assignedUsers.length === 0
                ? 'Sin asignaciones = todos los usuarios tienen acceso'
                : `${assignedUsers.length} usuario(s) asignado(s)`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Assigned */}
            {assignedUsers.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">ASIGNADOS</p>
                <div className="space-y-1">
                  {assignedUsers.map((u) => (
                    <div key={u.userId} className="flex items-center justify-between rounded border px-3 py-2">
                      <span className="text-sm">{u.email}</span>
                      <button
                        onClick={() => assignTiendaId && handleUnassign(assignTiendaId, u.userId)}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Unassigned */}
            {unassignedUsers.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">DISPONIBLES</p>
                <div className="space-y-1">
                  {unassignedUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between rounded border px-3 py-2">
                      <span className="text-sm">{u.email}</span>
                      <button
                        onClick={() => assignTiendaId && handleAssign(assignTiendaId, u.id)}
                        className="rounded p-1 text-green-600 hover:bg-green-50"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
