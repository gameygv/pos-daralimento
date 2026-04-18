import { useState, type ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useMyActiveSession, type CajaSession } from '@/features/cajas/hooks/useCajas';
import { CajaSelectionModal } from '@/features/cajas/components/CajaSelectionModal';

interface CajaSessionEnforcerProps {
  children: ReactNode;
}

/**
 * Wraps authenticated content. For vendedores, blocks all pages
 * until they have an active caja session.
 * Admins can use the system without an active caja session.
 */
export function CajaSessionEnforcer({ children }: CajaSessionEnforcerProps) {
  const { data: role, isLoading: loadingRole } = useUserRole();
  const { data: activeSession, isLoading: loadingSession } = useMyActiveSession();
  const [localSession, setLocalSession] = useState<CajaSession | null>(null);

  const isAdmin = role === 'admin';
  const isLoading = loadingRole || loadingSession;

  // Only enforce for vendedores
  if (isLoading || isAdmin) {
    return <>{children}</>;
  }

  const session = activeSession ?? localSession;
  const needsSession = !session;

  function handleSessionSelected(newSession: CajaSession) {
    setLocalSession(newSession);
  }

  return (
    <>
      {needsSession && (
        <CajaSelectionModal
          open={true}
          onCajaSelected={handleSessionSelected}
        />
      )}
      {children}
    </>
  );
}
