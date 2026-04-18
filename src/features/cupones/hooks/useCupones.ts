import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Cupon {
  id: string;
  codigo: string;
  descripcion: string | null;
  tipo: 'porcentaje' | 'monto';
  valor: number;
  monto_minimo: number;
  usos_maximos: number | null;
  usos_actuales: number;
  activo: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
}

const CUPONES_KEY = ['cupones'] as const;

export function useCupones() {
  return useQuery<Cupon[]>({
    queryKey: CUPONES_KEY,
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('cupones' as never)
        .select('*')
        .order('created_at' as never, { ascending: false })) as unknown as {
        data: Cupon[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateCupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cupon: Omit<Cupon, 'id' | 'usos_actuales' | 'created_at'>) => {
      const { error } = (await supabase
        .from('cupones' as never)
        .insert(cupon as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: CUPONES_KEY }),
  });
}

export function useToggleCupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = (await supabase
        .from('cupones' as never)
        .update({ activo } as never)
        .eq('id' as never, id as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: CUPONES_KEY }),
  });
}

export function useDeleteCupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = (await supabase
        .from('cupones' as never)
        .delete()
        .eq('id' as never, id as never)) as unknown as {
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: CUPONES_KEY }),
  });
}

/** Validate and apply a coupon by code */
export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<{ valid: true; cupon: Cupon; discount: number } | { valid: false; reason: string }> {
  const { data, error } = (await supabase
    .from('cupones' as never)
    .select('*')
    .eq('codigo' as never, code.trim().toUpperCase() as never)
    .eq('activo' as never, true as never)
    .limit(1)) as unknown as {
    data: Cupon[] | null;
    error: { message: string } | null;
  };

  if (error) return { valid: false, reason: error.message };
  if (!data || data.length === 0) return { valid: false, reason: 'Cupon no encontrado' };

  const cupon = data[0];
  const today = new Date().toISOString().split('T')[0];

  if (cupon.fecha_inicio && today < cupon.fecha_inicio) {
    return { valid: false, reason: 'Cupon aun no vigente' };
  }
  if (cupon.fecha_fin && today > cupon.fecha_fin) {
    return { valid: false, reason: 'Cupon expirado' };
  }
  if (cupon.usos_maximos !== null && cupon.usos_actuales >= cupon.usos_maximos) {
    return { valid: false, reason: 'Cupon agotado' };
  }
  if (subtotal < cupon.monto_minimo) {
    return { valid: false, reason: `Minimo de compra: $${cupon.monto_minimo}` };
  }

  const discount = cupon.tipo === 'porcentaje'
    ? subtotal * (cupon.valor / 100)
    : Math.min(cupon.valor, subtotal);

  return { valid: true, cupon, discount };
}

/** Increment usage counter after successful sale */
export async function incrementCouponUsage(cuponId: string): Promise<void> {
  await supabase.rpc('increment_cupon_usos' as never, { cupon_id: cuponId } as never);
  // Fallback if RPC doesn't exist: manual increment
  const { data } = (await supabase
    .from('cupones' as never)
    .select('usos_actuales')
    .eq('id' as never, cuponId as never)
    .single()) as unknown as { data: { usos_actuales: number } | null };
  if (data) {
    await supabase
      .from('cupones' as never)
      .update({ usos_actuales: data.usos_actuales + 1 } as never)
      .eq('id' as never, cuponId as never);
  }
}
