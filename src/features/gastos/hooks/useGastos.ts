import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Category types ──

export interface GastoCategoriaRow {
  id: string;
  nombre: string;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
}

export type GastoCategoriaInsert = Pick<GastoCategoriaRow, 'nombre' | 'parent_id'>;

const CATEGORIAS_KEY = ['gasto_categorias'] as const;

export function useGastoCategorias() {
  return useQuery<GastoCategoriaRow[]>({
    queryKey: [...CATEGORIAS_KEY],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('gasto_categorias' as never)
        .select('*')
        .eq('is_active', true)
        .order('nombre')) as unknown as {
        data: GastoCategoriaRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateGastoCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cat: GastoCategoriaInsert) => {
      const { data, error } = (await supabase
        .from('gasto_categorias' as never)
        .insert(cat)
        .select()
        .single()) as unknown as {
        data: GastoCategoriaRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIAS_KEY });
    },
  });
}

export function useUpdateGastoCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<GastoCategoriaInsert & { is_active: boolean }>) => {
      const { data, error } = (await supabase
        .from('gasto_categorias' as never)
        .update(updates)
        .eq('id', id)
        .select()
        .single()) as unknown as {
        data: GastoCategoriaRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIAS_KEY });
    },
  });
}

// ── Gasto types ──

export interface GastoRow {
  id: string;
  fecha: string;
  concepto: string;
  monto: number;
  categoria: string | null;
  categoria_id: string | null;
  notas: string | null;
  created_by: string | null;
  created_at: string;
}

export type GastoInsert = Omit<GastoRow, 'id' | 'created_at'>;

const GASTOS_KEY = ['gastos'] as const;

export function useGastos(filters?: {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  categoriaId?: string | null;
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
      if (filters?.categoriaId) {
        query = query.eq('categoria_id', filters.categoriaId);
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
