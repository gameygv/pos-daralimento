import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreditoMovimiento {
  id: string;
  cliente_id: string;
  tipo: 'cargo' | 'abono';
  monto: number;
  saldo_anterior: number;
  saldo_nuevo: number;
  referencia: string | null;
  concepto: string | null;
  metodo_pago: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface ClienteCredito {
  id: string;
  nombre: string;
  saldo: number;
  limite_credito: number;
  telefono: string | null;
  email: string | null;
}

const CREDITOS_KEY = ['creditos'] as const;
const CREDITO_MOV_KEY = ['credito-movimientos'] as const;

/** List customers with active credit (saldo > 0 or has credit limit) */
export function useClientesConCredito() {
  return useQuery<ClienteCredito[]>({
    queryKey: [...CREDITOS_KEY],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('clientes' as never)
        .select('id, nombre, saldo, limite_credito, telefono, email')
        .or('saldo.gt.0,limite_credito.gt.0' as never)
        .order('nombre' as never)) as unknown as {
        data: ClienteCredito[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

/** Get credit movements for a customer */
export function useCreditoMovimientos(clienteId: string | null) {
  return useQuery<CreditoMovimiento[]>({
    queryKey: [...CREDITO_MOV_KEY, clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const { data, error } = (await supabase
        .from('credito_movimientos' as never)
        .select('*')
        .eq('cliente_id' as never, clienteId as never)
        .order('created_at' as never, { ascending: false })
        .limit(200)) as unknown as {
        data: CreditoMovimiento[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!clienteId,
  });
}

/** Record a credit charge (venta a crédito) */
export function useCargoCredito() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      clienteId: string;
      monto: number;
      referencia?: string;
      concepto?: string;
      userId?: string;
      userName?: string;
    }) => {
      // Get current saldo
      const { data: cliente } = (await supabase
        .from('clientes' as never)
        .select('saldo, limite_credito')
        .eq('id' as never, params.clienteId as never)
        .single()) as unknown as {
        data: { saldo: number; limite_credito: number } | null;
      };

      const prevSaldo = cliente?.saldo ?? 0;
      const limite = cliente?.limite_credito ?? 0;
      const newSaldo = prevSaldo + params.monto;

      // Check credit limit
      if (limite > 0 && newSaldo > limite) {
        throw new Error(`Excede limite de credito. Saldo actual: $${prevSaldo}, Limite: $${limite}`);
      }

      // Update customer balance
      const { error: updErr } = (await supabase
        .from('clientes' as never)
        .update({ saldo: newSaldo })
        .eq('id' as never, params.clienteId as never)) as unknown as {
        error: { message: string } | null;
      };
      if (updErr) throw new Error(updErr.message);

      // Record movement
      const { error: movErr } = (await supabase
        .from('credito_movimientos' as never)
        .insert({
          cliente_id: params.clienteId,
          tipo: 'cargo',
          monto: params.monto,
          saldo_anterior: prevSaldo,
          saldo_nuevo: newSaldo,
          referencia: params.referencia ?? null,
          concepto: params.concepto ?? 'Venta a credito',
          created_by: params.userId ?? null,
          created_by_name: params.userName ?? null,
        })) as unknown as { error: { message: string } | null };
      if (movErr) throw new Error(movErr.message);

      return { prevSaldo, newSaldo };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CREDITOS_KEY });
      void qc.invalidateQueries({ queryKey: CREDITO_MOV_KEY });
    },
  });
}

/** Record a credit payment (abono) */
export function useAbonoCredito() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      clienteId: string;
      monto: number;
      metodoPago: string;
      concepto?: string;
      userId?: string;
      userName?: string;
    }) => {
      // Get current saldo
      const { data: cliente } = (await supabase
        .from('clientes' as never)
        .select('saldo')
        .eq('id' as never, params.clienteId as never)
        .single()) as unknown as {
        data: { saldo: number } | null;
      };

      const prevSaldo = cliente?.saldo ?? 0;
      const newSaldo = Math.max(0, prevSaldo - params.monto);

      // Update customer balance
      const { error: updErr } = (await supabase
        .from('clientes' as never)
        .update({ saldo: newSaldo })
        .eq('id' as never, params.clienteId as never)) as unknown as {
        error: { message: string } | null;
      };
      if (updErr) throw new Error(updErr.message);

      // Record movement
      const { error: movErr } = (await supabase
        .from('credito_movimientos' as never)
        .insert({
          cliente_id: params.clienteId,
          tipo: 'abono',
          monto: params.monto,
          saldo_anterior: prevSaldo,
          saldo_nuevo: newSaldo,
          concepto: params.concepto ?? 'Abono a cuenta',
          metodo_pago: params.metodoPago,
          created_by: params.userId ?? null,
          created_by_name: params.userName ?? null,
        })) as unknown as { error: { message: string } | null };
      if (movErr) throw new Error(movErr.message);

      return { prevSaldo, newSaldo };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CREDITOS_KEY });
      void qc.invalidateQueries({ queryKey: CREDITO_MOV_KEY });
    },
  });
}
