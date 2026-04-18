import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  UserList,
  UserForm,
} from '@/features/users';
import { useUpdatePassword } from '@/features/users/hooks/useUsers';
import type { VendeRow, CreateUserData } from '@/features/users/hooks/useUsers';

export default function UsuariosPage() {
  const { data: users, isLoading, isError } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const updatePassword = useUpdatePassword();

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<VendeRow | null>(null);

  const handleEdit = (user: VendeRow) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleDelete = (user: VendeRow) => {
    if (!confirm(`Eliminar a ${user.nomv}?`)) return;
    deleteUser.mutate(user.codven, {
      onSuccess: () => toast.success('Usuario eliminado'),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleSave = (data: CreateUserData | { nomv: string; comis: number; role: string; codven: string }) => {
    if (editingUser) {
      const updateData = data as { nomv: string; comis: number; role: string; codven: string };
      updateUser.mutate(
        { codven: editingUser.codven, nomv: updateData.nomv, comis: updateData.comis, role: updateData.role },
        {
          onSuccess: () => {
            toast.success('Usuario actualizado');
            setFormOpen(false);
          },
          onError: (err) => toast.error(err.message),
        },
      );
    } else {
      const createData = data as CreateUserData;
      createUser.mutate(createData, {
        onSuccess: () => {
          toast.success('Usuario creado exitosamente. Ya puede iniciar sesión.');
          setFormOpen(false);
        },
        onError: (err) => toast.error(err.message),
      });
    }
  };

  const handleChangePassword = (userId: string, password: string) => {
    updatePassword.mutate({ userId, password }, {
      onSuccess: () => toast.success('Contraseña actualizada'),
      onError: (err) => toast.error(err.message),
    });
  };

  const saving = createUser.isPending || updateUser.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona vendedores y administradores
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <UserPlus className="h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      {isError ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            No se pudo cargar la lista de usuarios. Verifica que la tabla
            &quot;vende&quot; exista en Supabase.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <UserList
              users={users ?? []}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      )}

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        saving={saving}
        onSave={handleSave}
        onChangePassword={handleChangePassword}
        changingPassword={updatePassword.isPending}
      />
    </div>
  );
}
