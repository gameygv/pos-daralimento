import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CxCRow {
  id: string;
  folio: string;
  fecha: string;
  total: number;
  pagado: number;
  saldo: number;
  status: string;
  cliente_id: string | null;
  cliente_nombre: string | null;
}

const CXC_KEY = ['cxc'] as const;

export function useCxC(statusFilter?: string | null) {
  return useQuery<CxCRow[]>({
    queryKey: [...CXC_KEY, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('cxc' as never)
        .select('*')
        .order('fecha', { ascending: false })
        .limit(200);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = (await query) as unknown as {
        data: CxCRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}
