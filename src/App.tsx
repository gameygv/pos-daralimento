import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { MainLayout } from '@/components/layouts/MainLayout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PermissionRoute } from '@/features/auth/PermissionRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import DashboardPage from '@/pages/DashboardPage';
import ProductosPage from '@/pages/ProductosPage';
import CategoriasPage from '@/pages/CategoriasPage';
import PosPage from '@/pages/PosPage';
import InventarioPage from '@/pages/InventarioPage';
import ClientesPage from '@/pages/ClientesPage';
import ReportesPage from '@/pages/ReportesPage';
import CortePage from '@/pages/CortePage';
import CxCPage from '@/pages/CxCPage';
import GastosPage from '@/pages/GastosPage';
import UsuariosPage from '@/pages/UsuariosPage';
import ConfiguracionPage from '@/pages/ConfiguracionPage';
import LogsPage from '@/pages/LogsPage';
import CajasPage from '@/pages/CajasPage';
import DevolucionesPage from '@/pages/DevolucionesPage';
import CuponesPage from '@/pages/CuponesPage';
import TiendasPage from '@/pages/TiendasPage';
import AlmacenesPage from '@/pages/AlmacenesPage';
import CreditosPage from '@/pages/CreditosPage';
import EtiquetasPage from '@/pages/EtiquetasPage';
import OrdenesCompraPage from '@/pages/OrdenesCompraPage';
import NotasPage from '@/pages/NotasPage';
import EntregaPage from '@/pages/EntregaPage';
import NotFoundPage from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="max-w-lg space-y-4 rounded-lg border bg-card p-8 text-card-foreground shadow-lg">
        <h1 className="text-2xl font-bold">POS DAR Alimento</h1>
        <p className="text-muted-foreground">
          El sistema necesita conectarse a Supabase para funcionar. Configura las variables de entorno:
        </p>
        <div className="rounded-md bg-muted p-4 font-mono text-sm">
          <p>VITE_SUPABASE_URL=https://tu-supabase.example.com</p>
          <p>VITE_SUPABASE_ANON_KEY=tu-anon-key</p>
        </div>
        <p className="text-sm text-muted-foreground">
          En Vercel: Settings → Environment Variables → agrega ambas variables y redeploy.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="pos-theme">
        <SetupRequired />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
    <ThemeProvider defaultTheme="system" storageKey="pos-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/entrega/:token" element={<EntregaPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="pos" element={<PosPage />} />
                  <Route element={<MainLayout />}>
                    {/* Accessible to all authenticated users */}
                    <Route index element={<DashboardPage />} />
                    <Route path="notas" element={<NotasPage />} />
                    <Route path="clientes" element={<ClientesPage />} />
                    <Route path="corte" element={<CortePage />} />

                    {/* Permission-gated routes */}
                    <Route element={<PermissionRoute requires="productos" />}>
                      <Route path="productos" element={<ProductosPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="categorias" />}>
                      <Route path="categorias" element={<CategoriasPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="inventario" />}>
                      <Route path="inventario" element={<InventarioPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="almacenes" />}>
                      <Route path="almacenes" element={<AlmacenesPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="reportes" />}>
                      <Route path="reportes" element={<ReportesPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="tiendas" />}>
                      <Route path="tiendas" element={<TiendasPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="cupones" />}>
                      <Route path="cupones" element={<CuponesPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="devoluciones" />}>
                      <Route path="devoluciones" element={<DevolucionesPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="cxc" />}>
                      <Route path="cxc" element={<CxCPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="creditos" />}>
                      <Route path="creditos" element={<CreditosPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="gastos" />}>
                      <Route path="gastos" element={<GastosPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="usuarios" />}>
                      <Route path="usuarios" element={<UsuariosPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="cajas" />}>
                      <Route path="cajas" element={<CajasPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="configuracion" />}>
                      <Route path="configuracion" element={<ConfiguracionPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="logs" />}>
                      <Route path="logs" element={<LogsPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="etiquetas" />}>
                      <Route path="etiquetas" element={<EtiquetasPage />} />
                    </Route>
                    <Route element={<PermissionRoute requires="inventario" />}>
                      <Route path="ordenes-compra" element={<OrdenesCompraPage />} />
                    </Route>
                  </Route>
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
