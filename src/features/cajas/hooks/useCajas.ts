import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';

export interface CajaRow {
  id: string;
  nombre: string;
  tienda: string;
  tienda_id: string | null;
  is_active: boolean;
  created_at: string;
  prefijo_folio: string;
  folio_actual: number;
}

export type CajaInsert = Omit<CajaRow, 'id' | 'created_at' | 'folio_actual'> & {
  folio_actual?: number;
};

export interface CajaSession {
  id: string;
  caja_id: string;
  user_id: string;
  user_name: string;
  opened_at: string;
  closed_at: string | null;
  monto_apertura: number;
  monto_cierre: number | null;
  status: 'open' | 'closed';
  corte_id: number | null;
}

export interface CajaUserRow {
  caja_id: string;
  user_id: string;
}

const CAJAS_KEY = ['cajas'] as const;
const SESSIONS_KEY = ['caja-sessions'] as const;
const CAJA_USERS_KEY = ['caja-users'] as const;

// ─── Cajas CRUD ─────────────────────────────────────────────

export function useCajas() {
  return useQuery<CajaRow[]>({
    queryKey: CAJAS_KEY,
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('cajas' as never)
        .select('*')
        .order('nombre')) as unknown as {
        data: CajaRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useActiveCajas() {
  return useQuery<CajaRow[]>({
    queryKey: [...CAJAS_KEY, 'active'],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('cajas' as never)
        .select('*')
        .eq('is_active' as never, true as never)
        .order('nombre')) as unknown as {
        data: CajaRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (caja: CajaInsert) => {
      const { data, error } = (await supabase
        .from('cajas' as never)
        .insert(caja as never)
        .select()
        .single()) as unknown as {
        data: CajaRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CAJAS_KEY });
    },
  });
}

export function useUpdateCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CajaInsert>) => {
      const { data, error } = (await supabase
        .from('cajas' as never)
        .update(updates as never)
        .eq('id' as never, id as never)
        .select()
        .single()) as unknown as {
        data: CajaRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CAJAS_KEY });
    },
  });
}

export function useDeleteCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = (await supabase
        .from('cajas' as never)
        .delete()
        .eq('id' as never, id as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CAJAS_KEY });
    },
  });
}

// ─── Caja Session Storage ───────────────────────────────────

const CAJA_STORAGE_KEY = 'pos-selected-caja';
const SESSION_STORAGE_KEY = 'pos-caja-session';

export function getStoredCajaId(): string | null {
  try {
    return localStorage.getItem(CAJA_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredCajaId(id: string): void {
  try {
    localStorage.setItem(CAJA_STORAGE_KEY, id);
  } catch {
    // localStorage not available
  }
}

export function getStoredSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // localStorage not available
  }
}

// ─── Caja Sessions ──────────────────────────────────────────

/** List all open sessions (to show which cajas are in use) */
export function useActiveSessions() {
  return useQuery<(CajaSession & { caja_nombre?: string })[]>({
    queryKey: [...SESSIONS_KEY, 'active'],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('caja_sessions' as never)
        .select('*')
        .eq('status' as never, 'open' as never)) as unknown as {
        data: CajaSession[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    refetchInterval: 15000,
  });
}

/** Get the current user's open session (if any) */
export function useMyActiveSession() {
  const { user } = useAuth();
  return useQuery<CajaSession | null>({
    queryKey: [...SESSIONS_KEY, 'my', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = (await supabase
        .from('caja_sessions' as never)
        .select('*')
        .eq('user_id' as never, user.id as never)
        .eq('status' as never, 'open' as never)
        .limit(1)
        .maybeSingle()) as unknown as {
        data: CajaSession | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** Open a caja session */
export function useOpenCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      cajaId: string;
      userId: string;
      userName: string;
      montoApertura: number;
    }) => {
      const { data, error } = (await supabase
        .from('caja_sessions' as never)
        .insert({
          caja_id: params.cajaId,
          user_id: params.userId,
          user_name: params.userName,
          monto_apertura: params.montoApertura,
          status: 'open',
        } as never)
        .select()
        .single()) as unknown as {
        data: CajaSession | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      if (data) {
        setStoredSessionId(data.id);
        setStoredCajaId(data.caja_id);
      }
      return data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
}

/** Close a caja session */
export function useCloseCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      montoCierre?: number;
      corteId?: number;
    }) => {
      const { error } = (await supabase
        .from('caja_sessions' as never)
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          ...(params.montoCierre !== undefined ? { monto_cierre: params.montoCierre } : {}),
          ...(params.corteId !== undefined ? { corte_id: params.corteId } : {}),
        } as never)
        .eq('id' as never, params.sessionId as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      setStoredSessionId(null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
}

// ─── Caja User Assignments ──────────────────────────────────

/** Get cajas assigned to a specific user (or all if admin) */
export function useUserCajas() {
  const { user } = useAuth();
  return useQuery<CajaRow[]>({
    queryKey: [...CAJAS_KEY, 'user-cajas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get all active cajas
      const { data: allCajas, error: cajasErr } = (await supabase
        .from('cajas' as never)
        .select('*')
        .eq('is_active' as never, true as never)
        .order('nombre')) as unknown as {
        data: CajaRow[] | null;
        error: { message: string } | null;
      };
      if (cajasErr) throw new Error(cajasErr.message);
      if (!allCajas) return [];

      // Get user's assignments
      const { data: assignments, error: assignErr } = (await supabase
        .from('caja_users' as never)
        .select('caja_id')
        .eq('user_id' as never, user.id as never)) as unknown as {
        data: { caja_id: string }[] | null;
        error: { message: string } | null;
      };
      if (assignErr) throw new Error(assignErr.message);

      // If user has specific assignments, filter to those
      if (assignments && assignments.length > 0) {
        const assignedIds = new Set(assignments.map((a) => a.caja_id));
        return allCajas.filter((c) => assignedIds.has(c.id));
      }

      // If no specific assignments, check if ANY caja has assignments
      // (if so, this user has no access; if none have assignments, all users get all)
      const { data: anyCajaUsers } = (await supabase
        .from('caja_users' as never)
        .select('caja_id')
        .limit(1)) as unknown as {
        data: { caja_id: string }[] | null;
      };

      // If there are assignments but not for this user, return empty
      if (anyCajaUsers && anyCajaUsers.length > 0) return [];

      // No assignments at all = everyone gets all cajas
      return allCajas;
    },
    enabled: !!user,
  });
}

/** Increment folio for a caja and return next folio + display string */
export async function getNextCajaFolio(cajaId: string): Promise<{
  folio: number;
  folioDisplay: string;
}> {
  // Read current caja state
  const { data: caja, error: readErr } = (await supabase
    .from('cajas' as never)
    .select('folio_actual, prefijo_folio')
    .eq('id' as never, cajaId as never)
    .single()) as unknown as {
    data: { folio_actual: number; prefijo_folio: string } | null;
    error: { message: string } | null;
  };
  if (readErr) throw new Error(readErr.message);
  if (!caja) throw new Error('Caja no encontrada');

  const nextFolio = caja.folio_actual + 1;
  const prefix = caja.prefijo_folio || '';
  const folioDisplay = prefix ? `${prefix}-${nextFolio}` : `${nextFolio}`;

  // Update caja with new folio
  const { error: updateErr } = (await supabase
    .from('cajas' as never)
    .update({ folio_actual: nextFolio } as never)
    .eq('id' as never, cajaId as never)) as unknown as {
    error: { message: string } | null;
  };
  if (updateErr) throw new Error(updateErr.message);

  return { folio: nextFolio, folioDisplay };
}

/** Get users assigned to a specific caja */
export function useCajaUsers(cajaId: string | null) {
  return useQuery<CajaUserRow[]>({
    queryKey: [...CAJA_USERS_KEY, cajaId],
    queryFn: async () => {
      if (!cajaId) return [];
      const { data, error } = (await supabase
        .from('caja_users' as never)
        .select('*')
        .eq('caja_id' as never, cajaId as never)) as unknown as {
        data: CajaUserRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!cajaId,
  });
}

/** Get all caja_users assignments (for admin page) */
export function useAllCajaUsers() {
  return useQuery<CajaUserRow[]>({
    queryKey: [...CAJA_USERS_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('caja_users' as never)
        .select('*')) as unknown as {
        data: CajaUserRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

/** Assign a user to a caja */
export function useAssignUserToCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { cajaId: string; userId: string }) => {
      const { error } = (await supabase
        .from('caja_users' as never)
        .upsert({
          caja_id: params.cajaId,
          user_id: params.userId,
        } as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CAJA_USERS_KEY });
    },
  });
}

/** Unassign a user from a caja */
export function useUnassignUserFromCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { cajaId: string; userId: string }) => {
      const { error } = (await supabase
        .from('caja_users' as never)
        .delete()
        .eq('caja_id' as never, params.cajaId as never)
        .eq('user_id' as never, params.userId as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CAJA_USERS_KEY });
    },
  });
}
