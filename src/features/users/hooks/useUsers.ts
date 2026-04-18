import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin';

export interface VendeRow {
  codven: string;
  nomv: string;
  comis: number;
  role: string;
}

export type VendeInsert = Omit<VendeRow, 'codven'> & { codven?: string };

export interface CreateUserData {
  email: string;
  password: string;
  nomv: string;
  comis: number;
  role: string;
}

export interface UpdatePasswordData {
  userId: string;
  password: string;
}

const USERS_KEY = ['users'] as const;

export function useUsers() {
  return useQuery<VendeRow[]>({
    queryKey: [...USERS_KEY],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('vende' as never)
        .select('*')
        .order('nomv')) as unknown as {
        data: VendeRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    retry: false,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      if (!supabaseAdmin) {
        throw new Error('Admin no configurado. Agrega VITE_SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.');
      }

      // 1. Create auth user (auto-confirmed, no email verification)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { name: data.nomv, role: data.role },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // 2. Insert into vende table with auth user ID as codven
      const { error: vendeError } = (await supabase
        .from('vende' as never)
        .insert({
          codven: authData.user.id,
          nomv: data.nomv,
          comis: data.comis,
          role: data.role,
        })) as unknown as { error: { message: string } | null };

      if (vendeError) {
        // Rollback: delete auth user if vende insert fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(vendeError.message);
      }

      return authData.user;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: VendeRow) => {
      const { codven, ...updates } = user;
      const { error } = (await supabase
        .from('vende' as never)
        .update(updates)
        .eq('codven', codven)
        .select()
        .single()) as unknown as {
        data: VendeRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async ({ userId, password }: UpdatePasswordData) => {
      if (!supabaseAdmin) {
        throw new Error('Admin no configurado. Agrega VITE_SUPABASE_SERVICE_ROLE_KEY.');
      }

      if (!UUID_REGEX.test(userId)) {
        throw new Error(
          'Este usuario fue creado manualmente (sin cuenta de autenticación). ' +
          'Elimínalo y créalo de nuevo con "Nuevo Usuario" para asignarle email y contraseña.'
        );
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      });

      if (error) throw new Error(error.message);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (codven: string) => {
      // Delete from vende table
      const { error } = (await supabase
        .from('vende' as never)
        .delete()
        .eq('codven', codven)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);

      // Also delete auth user if admin is configured
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.deleteUser(codven).catch(() => {
          // Non-blocking: auth user may not exist for legacy records
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}
