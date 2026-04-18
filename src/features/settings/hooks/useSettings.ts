import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PvcntlRow {
  id?: number;
  empresa: string;
  lin1: string;
  lin2: string;
  lin3: string;
  lin4: string;
  lin5: string;
  lin6: string;
  lin7: string;
  logoemp: string;
  foliotkt: number;
  foliocor: number;
  foliomvt: number;
  usadmon: string | null;
  usaventa: string | null;
  ultclt: number | null;
  modo_seguro_t: boolean;
}

export const EMPTY_CONFIG: PvcntlRow = {
  empresa: '',
  lin1: '',
  lin2: '',
  lin3: '',
  lin4: '',
  lin5: '',
  lin6: '',
  lin7: '',
  logoemp: '',
  foliotkt: 0,
  foliocor: 0,
  foliomvt: 0,
  usadmon: null,
  usaventa: null,
  ultclt: null,
  modo_seguro_t: false,
};

const SETTINGS_KEY = ['settings'] as const;

export function useSettings() {
  return useQuery<PvcntlRow>({
    queryKey: [...SETTINGS_KEY],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('pvcntl' as never)
        .select('*')
        .limit(1)
        .maybeSingle()) as unknown as {
        data: PvcntlRow | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? EMPTY_CONFIG;
    },
    retry: false,
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: PvcntlRow) => {
      const { error } = (await supabase
        .from('pvcntl' as never)
        .upsert(config)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}
