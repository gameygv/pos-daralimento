import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Tags, MonitorSmartphone,
  Warehouse, Users2, BarChart3, Calculator, CreditCard, Wallet,
  Settings, ScrollText, LogOut, PanelLeftClose, PanelLeft, Monitor,
  RotateCcw, Truck, FileText,
  Ticket,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { useMyActiveSession, useActiveCajas } from '@/features/cajas/hooks/useCajas';
import { ForceCorteDialog } from '@/components/ForceCorteDialog';
import type { Permission } from '@/lib/permissions';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** If set, user needs this permission to see the item */
  permission?: Permission;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard',      path: '/',              icon: LayoutDashboard },
  { label: 'POS',            path: '/pos',           icon: MonitorSmartphone },
  { label: 'Notas',          path: '/notas',         icon: FileText },
  { label: 'Clientes',       path: '/clientes',      icon: Users2 },
  { label: 'Productos',      path: '/productos',     icon: Package, permission: 'productos' },
  { label: 'Categorias',     path: '/categorias',    icon: Tags, permission: 'categorias' },
  { label: 'Inventario',     path: '/inventario',    icon: Warehouse, permission: 'inventario' },
  { label: 'Puntos de Venta', path: '/almacenes',     icon: Package, permission: 'almacenes' },
  { label: 'Ord. Compra',   path: '/ordenes-compra', icon: Truck, permission: 'inventario' },
  { label: 'Reportes',       path: '/reportes',      icon: BarChart3, permission: 'reportes' },
  { label: 'Corte',          path: '/corte',         icon: Calculator },
  { label: 'Cupones',        path: '/cupones',       icon: Ticket, permission: 'cupones' },
  { label: 'Devoluciones',   path: '/devoluciones',  icon: RotateCcw, permission: 'devoluciones' },
  { label: 'CxC',            path: '/cxc',           icon: CreditCard, permission: 'cxc' },
  { label: 'Creditos',       path: '/creditos',      icon: Wallet, permission: 'creditos' },
  { label: 'Gastos',         path: '/gastos',        icon: Wallet, permission: 'gastos' },
  { label: 'Usuarios',       path: '/usuarios',      icon: Settings, permission: 'usuarios' },
  { label: 'Sucursales',      path: '/tiendas',       icon: Store, permission: 'tiendas' },
  { label: 'Cajas',          path: '/cajas',         icon: Monitor, permission: 'cajas' },
  { label: 'Configuracion',  path: '/configuracion', icon: Settings, permission: 'configuracion' },
  { label: 'Etiquetas',      path: '/etiquetas',     icon: Tags, permission: 'etiquetas' },
  { label: 'Logs',           path: '/logs',          icon: ScrollText, permission: 'logs' },
];

export { menuItems };

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { can, isAdmin } = usePermissions();
  const { data: activeSession } = useMyActiveSession();
  const { data: cajas = [] } = useActiveCajas();
  const [collapsed, setCollapsed] = useState(false);
  const [showCorteDialog, setShowCorteDialog] = useState(false);

  const visibleItems = menuItems.filter((item) => !item.permission || can(item.permission));
  const activeCajaName = cajas.find((c) => c.id === activeSession?.caja_id)?.nombre;

  function handleLogout() {
    // Vendedores must do corte before logging out
    if (!isAdmin && activeSession) {
      setShowCorteDialog(true);
      return;
    }
    void signOut();
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-card transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Package size={20} />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">POS</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {visibleItems.map(({ label, path, icon: Icon }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t px-2 py-3">
        {!collapsed && user && (
          <p className="mb-2 truncate px-3 text-xs text-muted-foreground">
            {user.email}
          </p>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          {!collapsed && <span>Cerrar sesion</span>}
        </Button>
      </div>

      <ForceCorteDialog
        open={showCorteDialog}
        onOpenChange={setShowCorteDialog}
        cajaName={activeCajaName}
      />
    </aside>
  );
}
