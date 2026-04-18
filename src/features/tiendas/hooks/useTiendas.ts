import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSettings } from '@/features/settings/hooks/useSettings';

export interface TiendaRow {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  is_active: boolean;
  is_secret: boolean;
  created_at: string;
}

export interface TiendaUserRow {
  tienda_id: string;
  user_id: string;
}

const TIENDAS_KEY = ['tiendas'] as const;
const TIENDA_USERS_KEY = ['tienda-users'] as const;

// ─── CRUD ───────────────────────────────────────────────────

export function useTiendas() {
  return useQuery<TiendaRow[]>({
    queryKey: TIENDAS_KEY,
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('tiendas' as never)
        .select('*')
        .order('nombre')) as unknown as {
        data: TiendaRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateTienda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tienda: Omit<TiendaRow, 'id' | 'created_at'>) => {
      const { data, error } = (await supabase
        .from('tiendas' as never)
        .insert(tienda as never)
        .select()
        .single()) as unknown as {
        data: TiendaRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: TIENDAS_KEY }),
  });
}

export function useUpdateTienda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TiendaRow>) => {
      const { error } = (await supabase
        .from('tiendas' as never)
        .update(updates as never)
        .eq('id' as never, id as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: TIENDAS_KEY }),
  });
}

export function useDeleteTienda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = (await supabase
        .from('tiendas' as never)
        .delete()
        .eq('id' as never, id as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: TIENDAS_KEY }),
  });
}

// ─── Visible tiendas (respects mode T + user assignments) ──

/** Get tiendas visible to the current user */
export function useVisibleTiendas() {
  const { user } = useAuth();
  const { data: settings } = useSettings();

  return useQuery<TiendaRow[]>({
    queryKey: [...TIENDAS_KEY, 'visible', user?.id, settings?.modo_seguro_t],
    queryFn: async () => {
      if (!user) return [];

      // Get all active tiendas
      const { data: all, error } = (await supabase
        .from('tiendas' as never)
        .select('*')
        .eq('is_active' as never, true as never)
        .order('nombre')) as unknown as {
        data: TiendaRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      if (!all) return [];

      const modoT = settings?.modo_seguro_t ?? false;
      let filtered = modoT ? all : all.filter((t) => !t.is_secret);

      // Check user assignments
      const { data: assignments } = (await supabase
        .from('tienda_users' as never)
        .select('tienda_id')
        .eq('user_id' as never, user.id as never)) as unknown as {
        data: { tienda_id: string }[] | null;
      };

      if (assignments && assignments.length > 0) {
        const assignedIds = new Set(assignments.map((a) => a.tienda_id));
        filtered = filtered.filter((t) => assignedIds.has(t.id));
      } else {
        // Check if ANY tienda has assignments (same pattern as caja_users)
        const { data: anyAssignment } = (await supabase
          .from('tienda_users' as never)
          .select('tienda_id')
          .limit(1)) as unknown as {
          data: { tienda_id: string }[] | null;
        };
        if (anyAssignment && anyAssignment.length > 0) return [];
      }

      return filtered;
    },
    enabled: !!user,
  });
}

// ─── Tienda User Assignments ────────────────────────────────

export function useAllTiendaUsers() {
  return useQuery<TiendaUserRow[]>({
    queryKey: [...TIENDA_USERS_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('tienda_users' as never)
        .select('*')) as unknown as {
        data: TiendaUserRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useAssignUserToTienda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { tiendaId: string; userId: string }) => {
      const { error } = (await supabase
        .from('tienda_users' as never)
        .upsert({ tienda_id: params.tiendaId, user_id: params.userId } as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: TIENDA_USERS_KEY }),
  });
}

export function useUnassignUserFromTienda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { tiendaId: string; userId: string }) => {
      const { error } = (await supabase
        .from('tienda_users' as never)
        .delete()
        .eq('tienda_id' as never, params.tiendaId as never)
        .eq('user_id' as never, params.userId as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: TIENDA_USERS_KEY }),
  });
}
