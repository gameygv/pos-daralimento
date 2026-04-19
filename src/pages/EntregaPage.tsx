import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Truck, Package, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

interface NotaData {
  folio_display: string;
  cliente: string;
  total: number;
  pagado: number;
  fecha: string;
  hora: string;
  vendedor: string | null;
  metodo_pago: string;
  entrega_status: string;
  pago_status: string;
  folio: number;
}

interface NotaItem {
  art: string;
  can: number;
  prec: number;
  descue: number;
}

export default function EntregaPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [nota, setNota] = useState<NotaData | null>(null);
  const [items, setItems] = useState<NotaItem[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [justConfirmed, setJustConfirmed] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); setErrorMsg('Token no valido'); return; }

    async function fetchNota() {
      const { data, error } = (await supabase
        .from('notas' as never)
        .select('folio, folio_display, cliente, total, pagado, fecha, hora, vendedor, metodo_pago, entrega_status, pago_status')
        .eq('entrega_token' as never, token as never)
        .single()) as unknown as {
        data: NotaData | null;
        error: { message: string } | null;
      };
      if (error || !data) { setErrorMsg('Nota no encontrada'); setLoading(false); return; }
      setNota(data);

      // Fetch items
      const { data: itemData } = (await supabase
        .from('vtatkt' as never)
        .select('art, can, prec, descue')
        .eq('folio' as never, data.folio as never)
        .neq('status' as never, 'CANCELADO' as never)) as unknown as {
        data: NotaItem[] | null;
      };
      setItems(itemData ?? []);
      setLoading(false);
    }
    void fetchNota();
  }, [token]);

  async function handleConfirm() {
    if (!token) return;
    setConfirming(true);
    const { error } = (await supabase
      .from('notas' as never)
      .update({ entrega_status: 'entregado', entregado_at: new Date().toISOString() } as never)
      .eq('entrega_token' as never, token as never)) as unknown as { error: { message: string } | null };
    if (error) { setErrorMsg(error.message); }
    else {
      setNota((prev) => prev ? { ...prev, entrega_status: 'entregado' } : prev);
      setJustConfirmed(true);
    }
    setConfirming(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (errorMsg && !nota) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
            <h3 className="text-lg font-bold text-red-700">Error</h3>
            <p className="text-muted-foreground">{errorMsg}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!nota) return null;

  const isEntregado = nota.entrega_status === 'entregado';
  const saldo = nota.total - nota.pagado;
  const currentUrl = window.location.href;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center print:pb-2">
          <CardTitle className="text-xl">DAR Alimento</CardTitle>
          <p className="text-sm text-muted-foreground">Nota de Venta</p>
        </CardHeader>
        <CardContent className="space-y-4 print:space-y-2">
          {/* Nota details */}
          <div className="rounded-lg bg-gray-100 p-4 space-y-1 text-sm print:bg-white print:p-0 print:border-b print:pb-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nota:</span>
              <span className="font-mono font-bold text-lg">#{nota.folio_display}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span>{nota.fecha} {nota.hora}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{nota.cliente}</span>
            </div>
            {nota.vendedor && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendedor:</span>
                <span>{nota.vendedor}</span>
              </div>
            )}
          </div>

          {/* Items / Totals */}
          <div className="text-sm">
            {items.length > 0 && (
              <>
                <div className="border-t border-b py-1 mb-1 font-semibold flex justify-between text-xs text-muted-foreground">
                  <span>Producto</span>
                  <span>Total</span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-0.5">
                    <span>{item.can}x {item.art}</span>
                    <span className="font-medium">{formatPrice((item.prec - item.descue) * item.can)}</span>
                  </div>
                ))}
              </>
            )}
            <div className="border-t mt-1 pt-1 flex justify-between font-bold text-base">
              <span>TOTAL</span>
              <span>{formatPrice(nota.total)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Forma de pago:</span>
              <span className="capitalize">{nota.metodo_pago}</span>
            </div>
            {nota.pagado > 0 && (
              <div className="flex justify-between text-xs text-green-700">
                <span>Pagado:</span>
                <span>{formatPrice(nota.pagado)}</span>
              </div>
            )}
            {saldo > 0.01 && (
              <div className="flex justify-between text-xs font-bold text-amber-700">
                <span>Saldo pendiente:</span>
                <span>{formatPrice(saldo)}</span>
              </div>
            )}
          </div>

          {/* Status badges */}
          <div className="flex items-center justify-center gap-3">
            {nota.pago_status === 'pagado' ? (
              <Badge className="bg-green-100 text-green-800 px-3 py-1">
                <CheckCircle className="mr-1 h-3 w-3" /> Pagado
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-300 text-amber-700 px-3 py-1">
                Pago pendiente
              </Badge>
            )}
            {isEntregado ? (
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                <CheckCircle className="mr-1 h-3 w-3" /> Entregado
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-300 text-red-700 px-3 py-1">
                <Package className="mr-1 h-3 w-3" /> Sin entregar
              </Badge>
            )}
          </div>

          {/* QR code — always visible */}
          <div className="flex flex-col items-center gap-2 py-2">
            <QRCodeSVG value={currentUrl} size={120} level="M" />
            <p className="text-[10px] text-muted-foreground text-center">
              Escanea para confirmar entrega
            </p>
          </div>

          {/* Confirm delivery button */}
          {!isEntregado && (
            <Button
              className="w-full gap-2 bg-green-600 hover:bg-green-700 print:hidden"
              size="lg"
              onClick={() => void handleConfirm()}
              disabled={confirming}
            >
              {confirming ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
              Confirmar Entrega
            </Button>
          )}

          {justConfirmed && (
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-sm font-medium text-green-700">Entrega confirmada</p>
            </div>
          )}

          {/* Print button */}
          <Button
            variant="outline"
            className="w-full gap-2 print:hidden"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Imprimir Nota
          </Button>

          <p className="text-center text-[10px] text-muted-foreground print:mt-2">
            pos.daralimento.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
