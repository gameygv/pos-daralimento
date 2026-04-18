import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export default function EntregaPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'confirming' | 'success' | 'already' | 'error'>('loading');
  const [nota, setNota] = useState<{ folio_display: string; cliente: string; total: number; entrega_status: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Token de entrega no válido');
      return;
    }

    // Fetch the nota by token
    async function fetchNota() {
      const { data, error } = (await supabase
        .from('notas' as never)
        .select('folio_display, cliente, total, entrega_status')
        .eq('entrega_token' as never, token as never)
        .single()) as unknown as {
        data: { folio_display: string; cliente: string; total: number; entrega_status: string } | null;
        error: { message: string } | null;
      };

      if (error || !data) {
        setStatus('error');
        setErrorMsg('Nota no encontrada');
        return;
      }

      setNota(data);
      if (data.entrega_status === 'entregado') {
        setStatus('already');
      } else {
        setStatus('confirming');
      }
    }

    void fetchNota();
  }, [token]);

  async function handleConfirm() {
    if (!token) return;
    setStatus('loading');

    const { error } = (await supabase
      .from('notas' as never)
      .update({
        entrega_status: 'entregado',
        entregado_at: new Date().toISOString(),
      } as never)
      .eq('entrega_token' as never, token as never)) as unknown as {
      error: { message: string } | null;
    };

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    setStatus('success');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Confirmación de Entrega</CardTitle>
          <p className="text-sm text-muted-foreground">DAR Alimento</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-muted-foreground">Procesando...</p>
            </div>
          )}

          {status === 'confirming' && nota && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-100 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nota:</span>
                  <span className="font-mono font-bold">#{nota.folio_display}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{nota.cliente}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold">{formatPrice(nota.total)}</span>
                </div>
              </div>
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={() => void handleConfirm()}
              >
                <CheckCircle className="h-5 w-5" />
                Confirmar Entrega
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Al confirmar, esta orden se marcará como entregada en el sistema.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-700">¡Entrega Confirmada!</h3>
              <p className="text-center text-muted-foreground">
                La nota #{nota?.folio_display} ha sido marcada como entregada.
              </p>
            </div>
          )}

          {status === 'already' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-blue-700">Ya fue entregada</h3>
              <p className="text-center text-muted-foreground">
                Esta nota ya fue marcada como entregada previamente.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-red-700">Error</h3>
              <p className="text-center text-muted-foreground">{errorMsg}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
