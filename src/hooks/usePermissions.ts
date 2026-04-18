import { useUserRole } from './useUserRole';
import { hasPermission, getPermissionsForRole, type Permission, type UserRole } from '@/lib/permissions';

export function usePermissions() {
  const { data: role, isLoading } = useUserRole();

  const currentRole = (role ?? 'vendedor') as UserRole;

  return {
    role: currentRole,
    isLoading,
    isAdmin: currentRole === 'admin',
    isGerente: currentRole === 'gerente',
    isVendedor: currentRole === 'vendedor',
    permissions: getPermissionsForRole(currentRole),
    can: (permission: Permission) => hasPermission(currentRole, permission),
  };
}
