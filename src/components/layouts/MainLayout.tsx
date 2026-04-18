import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { OpenRegisterAlert } from '@/components/OpenRegisterAlert';
import { CajaSessionEnforcer } from '@/components/CajaSessionEnforcer';

export function MainLayout() {
  return (
    <CajaSessionEnforcer>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <OpenRegisterAlert />
          <Outlet />
        </main>
      </div>
    </CajaSessionEnforcer>
  );
}
