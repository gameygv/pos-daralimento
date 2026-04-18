import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClienteRow {
  id: string;
  nombre: string;
  telefono: string | null;
  telefono2: string | null;
  email: string | null;
  direccion: string | null;
  rfc: string | null;
  saldo: number;
  created_at: string;
}

export type ClienteInsert = Omit<ClienteRow, 'id' | 'created_at'>;

const CUSTOMERS_KEY = ['customers'] as const;

export function useCustomers(search?: string | null) {
  return useQuery<ClienteRow[]>({
    queryKey: [...CUSTOMERS_KEY, search],
    queryFn: async () => {
      let query = supabase
        .from('clientes' as never)
        .select('*')
        .order('nombre')
        .limit(200);

      if (search) {
        query = query.or(
          `nombre.ilike.%${search}%,telefono.ilike.%${search}%,telefono2.ilike.%${search}%,email.ilike.%${search}%`,
        );
      }

      const { data, error } = (await query) as unknown as {
        data: ClienteRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: ClienteInsert) => {
      const { data, error } = (await supabase
        .from('clientes' as never)
        .insert(customer)
        .select()
        .single()) as unknown as {
        data: ClienteRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ClienteInsert>) => {
      const { data, error } = (await supabase
        .from('clientes' as never)
        .update(updates)
        .eq('id', id)
        .select()
        .single()) as unknown as {
        data: ClienteRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
    },
  });
}
