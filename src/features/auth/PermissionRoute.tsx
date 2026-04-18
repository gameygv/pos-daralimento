import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/permissions';

interface PermissionRouteProps {
  /** Any ONE of these permissions grants access */
  requires: Permission | Permission[];
}

export function PermissionRoute({ requires }: PermissionRouteProps) {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Verificando permisos...
      </div>
    );
  }

  const perms = Array.isArray(requires) ? requires : [requires];
  const allowed = perms.some((p) => can(p));

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
