/** All available permissions in the system */
export const PERMISSIONS = {
  pos: 'pos',
  clientes: 'clientes',
  corte: 'corte',
  productos: 'productos',
  categorias: 'categorias',
  inventario: 'inventario',
  almacenes: 'almacenes',
  reportes: 'reportes',
  cajas: 'cajas',
  cupones: 'cupones',
  devoluciones: 'devoluciones',
  cxc: 'cxc',
  gastos: 'gastos',
  creditos: 'creditos',
  usuarios: 'usuarios',
  tiendas: 'tiendas',
  configuracion: 'configuracion',
  logs: 'logs',
  etiquetas: 'etiquetas',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type UserRole = 'admin' | 'gerente' | 'vendedor';

/** Default permissions by role */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: Object.values(PERMISSIONS), // everything
  gerente: [
    'pos', 'clientes', 'corte',
    'productos', 'categorias', 'inventario', 'almacenes',
    'reportes', 'cajas', 'cupones', 'devoluciones',
    'cxc', 'gastos', 'creditos', 'etiquetas',
  ],
  vendedor: [
    'pos', 'clientes', 'corte',
  ],
};

/** Get permissions for a role */
export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as UserRole] ?? ROLE_PERMISSIONS.vendedor;
}

/** Check if a role has a specific permission */
export function hasPermission(role: string, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

/** Human-readable labels for permissions */
export const PERMISSION_LABELS: Record<Permission, string> = {
  pos: 'Punto de Venta',
  clientes: 'Clientes',
  corte: 'Corte de Caja',
  productos: 'Productos',
  categorias: 'Categorias',
  inventario: 'Inventario',
  almacenes: 'Almacenes',
  reportes: 'Reportes',
  cajas: 'Cajas',
  cupones: 'Cupones',
  devoluciones: 'Devoluciones',
  cxc: 'Cuentas por Cobrar',
  gastos: 'Gastos',
  creditos: 'Creditos',
  usuarios: 'Usuarios',
  tiendas: 'Tiendas',
  configuracion: 'Configuracion',
  logs: 'Logs',
  etiquetas: 'Etiquetas',
};

/** Human-readable role labels */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  vendedor: 'Vendedor',
};
