import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GastoRow {
  id: string;
  fecha: string;
  concepto: string;
  monto: number;
  categoria: string | null;
  notas: string | null;
  created_by: string | null;
  created_at: string;
}

export type GastoInsert = Omit<GastoRow, 'id' | 'created_at'>;

const GASTOS_KEY = ['gastos'] as const;

export function useGastos(filters?: {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
}) {
  return useQuery<GastoRow[]>({
    queryKey: [...GASTOS_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('gastos' as never)
        .select('*')
        .order('fecha', { ascending: false })
        .limit(200);

      if (filters?.fechaDesde) {
        query = query.gte('fecha', filters.fechaDesde);
      }
      if (filters?.fechaHasta) {
        query = query.lte('fecha', filters.fechaHasta);
      }

      const { data, error } = (await query) as unknown as {
        data: GastoRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateGasto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gasto: GastoInsert) => {
      const { data, error } = (await supabase
        .from('gastos' as never)
        .insert(gasto)
        .select()
        .single()) as unknown as {
        data: GastoRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GASTOS_KEY });
    },
  });
}

export function useUpdateGasto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<GastoInsert>) => {
      const { data, error } = (await supabase
        .from('gastos' as never)
        .update(updates)
        .eq('id', id)
        .select()
        .single()) as unknown as {
        data: GastoRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GASTOS_KEY });
    },
  });
}
