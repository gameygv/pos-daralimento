import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LealtadConfig {
  activo: boolean;
  puntos_por_peso: number;
  valor_punto: number;
  umbral_plata: number;
  umbral_oro: number;
}

export interface LealtadMovimiento {
  id: string;
  cliente_id: string;
  tipo: 'acumular' | 'canjear' | 'ajuste';
  puntos: number;
  puntos_anterior: number;
  puntos_nuevo: number;
  referencia: string | null;
  concepto: string | null;
  created_at: string;
}

const CONFIG_KEY = ['lealtad-config'] as const;
const MOVIMIENTOS_KEY = ['lealtad-movimientos'] as const;

export function useLealtadConfig() {
  return useQuery<LealtadConfig>({
    queryKey: [...CONFIG_KEY],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('lealtad_config' as never)
        .select('*')
        .single()) as unknown as {
        data: LealtadConfig | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? { activo: false, puntos_por_peso: 1, valor_punto: 0.1, umbral_plata: 500, umbral_oro: 2000 };
    },
  });
}

export function useUpdateLealtadConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<LealtadConfig>) => {
      const { error } = (await supabase
        .from('lealtad_config' as never)
        .update({ ...config, updated_at: new Date().toISOString() })
        .eq('id' as never, 1 as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: CONFIG_KEY }),
  });
}

export function useLealtadMovimientos(clienteId: string | null) {
  return useQuery<LealtadMovimiento[]>({
    queryKey: [...MOVIMIENTOS_KEY, clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const { data, error } = (await supabase
        .from('lealtad_movimientos' as never)
        .select('*')
        .eq('cliente_id' as never, clienteId as never)
        .order('created_at' as never, { ascending: false })
        .limit(100)) as unknown as {
        data: LealtadMovimiento[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!clienteId,
  });
}

/** Earn points after a sale */
export function useAcumularPuntos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      clienteId: string;
      montoVenta: number;
      puntosPorPeso: number;
      referencia?: string;
    }) => {
      const puntosGanados = Math.floor(params.montoVenta * params.puntosPorPeso);
      if (puntosGanados <= 0) return;

      // Get current points
      const { data: cliente } = (await supabase
        .from('clientes' as never)
        .select('puntos_lealtad, puntos_acumulados')
        .eq('id' as never, params.clienteId as never)
        .single()) as unknown as {
        data: { puntos_lealtad: number; puntos_acumulados: number } | null;
      };

      const prev = cliente?.puntos_lealtad ?? 0;
      const newPuntos = prev + puntosGanados;
      const newAcumulados = (cliente?.puntos_acumulados ?? 0) + puntosGanados;

      const { error: updateErr } = (await supabase
        .from('clientes' as never)
        .update({ puntos_lealtad: newPuntos, puntos_acumulados: newAcumulados })
        .eq('id' as never, params.clienteId as never)) as unknown as { error: { message: string } | null };
      if (updateErr) throw new Error(updateErr.message);

      await supabase.from('lealtad_movimientos' as never).insert({
        cliente_id: params.clienteId,
        tipo: 'acumular',
        puntos: puntosGanados,
        puntos_anterior: prev,
        puntos_nuevo: newPuntos,
        referencia: params.referencia ?? null,
        concepto: `+${puntosGanados} pts por compra de $${params.montoVenta.toFixed(2)}`,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: MOVIMIENTOS_KEY }),
  });
}

/** Redeem points for a discount */
export function useCanjearPuntos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      clienteId: string;
      puntos: number;
      referencia?: string;
    }) => {
      const { data: cliente } = (await supabase
        .from('clientes' as never)
        .select('puntos_lealtad')
        .eq('id' as never, params.clienteId as never)
        .single()) as unknown as {
        data: { puntos_lealtad: number } | null;
      };

      const prev = cliente?.puntos_lealtad ?? 0;
      if (params.puntos > prev) throw new Error('Puntos insuficientes');

      const newPuntos = prev - params.puntos;

      const { error: updateErr } = (await supabase
        .from('clientes' as never)
        .update({ puntos_lealtad: newPuntos })
        .eq('id' as never, params.clienteId as never)) as unknown as { error: { message: string } | null };
      if (updateErr) throw new Error(updateErr.message);

      await supabase.from('lealtad_movimientos' as never).insert({
        cliente_id: params.clienteId,
        tipo: 'canjear',
        puntos: -params.puntos,
        puntos_anterior: prev,
        puntos_nuevo: newPuntos,
        referencia: params.referencia ?? null,
        concepto: `Canje de ${params.puntos} pts`,
      });

      return { puntosRestantes: newPuntos };
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: MOVIMIENTOS_KEY }),
  });
}

/** Get customer tier based on accumulated points */
export function getClienteTier(puntosAcumulados: number, config: LealtadConfig): 'bronce' | 'plata' | 'oro' {
  if (puntosAcumulados >= config.umbral_oro) return 'oro';
  if (puntosAcumulados >= config.umbral_plata) return 'plata';
  return 'bronce';
}

export const TIER_COLORS = {
  bronce: 'bg-orange-100 text-orange-700',
  plata: 'bg-gray-200 text-gray-700',
  oro: 'bg-yellow-100 text-yellow-700',
};

export const TIER_LABELS = {
  bronce: 'Bronce',
  plata: 'Plata',
  oro: 'Oro',
};
