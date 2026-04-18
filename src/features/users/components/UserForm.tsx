import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import type { VendeRow, CreateUserData } from '../hooks/useUsers';
import { ROLE_LABELS, getPermissionsForRole, PERMISSION_LABELS, type UserRole } from '@/lib/permissions';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: VendeRow | null;
  saving: boolean;
  onSave: (data: CreateUserData | { nomv: string; comis: number; role: string; codven: string }) => void;
  onChangePassword?: (userId: string, password: string) => void;
  changingPassword?: boolean;
}

export function UserForm({ open, onOpenChange, user, saving, onSave, onChangePassword, changingPassword }: UserFormProps) {
  const isEditing = !!user;
  const [nomv, setNomv] = useState('');
  const [role, setRole] = useState('vendedor');
  const [comis, setComis] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (user) {
      setNomv(user.nomv);
      setRole(user.role || 'vendedor');
      setComis(user.comis);
      setEmail('');
      setPassword('');
    } else {
      setNomv('');
      setRole('vendedor');
      setComis(0);
      setEmail('');
      setPassword('');
    }
    setNewPassword('');
    setShowChangePassword(false);
  }, [user, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onSave({
        codven: user.codven,
        nomv,
        comis: role === 'admin' ? 0 : comis,
        role,
      });
    } else {
      onSave({
        email,
        password,
        nomv,
        comis: role === 'admin' ? 0 : comis,
        role,
      } as CreateUserData);
    }
  };

  const handleChangePassword = () => {
    if (user && onChangePassword && newPassword.length >= 6) {
      onChangePassword(user.codven, newPassword);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nomv">Nombre completo</Label>
            <Input
              id="nomv"
              value={nomv}
              onChange={(e) => setNomv(e.target.value)}
              required
              placeholder="Ej. Juan Pérez"
            />
          </div>

          {!isEditing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email (para iniciar sesión)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="usuario@daralimento.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendedor">{ROLE_LABELS.vendedor}</SelectItem>
                <SelectItem value="gerente">{ROLE_LABELS.gerente}</SelectItem>
                <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role !== 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="comis">Comision (%)</Label>
              <Input
                id="comis"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={comis}
                onChange={(e) => setComis(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {/* Show permissions for selected role */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Permisos de {ROLE_LABELS[role as UserRole] ?? role}
            </p>
            <div className="flex flex-wrap gap-1">
              {getPermissionsForRole(role).map((perm) => (
                <span
                  key={perm}
                  className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700"
                >
                  {PERMISSION_LABELS[perm]}
                </span>
              ))}
            </div>
          </div>

          {/* Change password section (edit mode only) */}
          {isEditing && onChangePassword && (
            <div className="rounded-lg border p-3 space-y-3">
              {!showChangePassword ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowChangePassword(true)}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Cambiar contraseña
                </Button>
              ) : (
                <>
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={newPassword.length < 6 || changingPassword}
                      onClick={handleChangePassword}
                    >
                      {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? 'Actualizar' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
