import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Truck, Package, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
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
  notas_pago: string | null;
}

interface NotaItem {
  art: string;
  can: number;
  prec: number;
  descue: number;
}

interface ConfigData {
  empresa: string;
  logoemp: string | null;
  lin1: string | null;
  lin2: string | null;
  lin3: string | null;
  lin4: string | null;
  lin5: string | null;
  lin6: string | null;
  lin7: string | null;
}

export default function EntregaPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [nota, setNota] = useState<NotaData | null>(null);
  const [items, setItems] = useState<NotaItem[]>([]);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [justConfirmed, setJustConfirmed] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); setErrorMsg('Token no valido'); return; }

    async function fetchAll() {
      // Fetch nota
      const { data, error } = (await supabase
        .from('notas' as never)
        .select('folio, folio_display, cliente, total, pagado, fecha, hora, vendedor, metodo_pago, entrega_status, pago_status, notas_pago')
        .eq('entrega_token' as never, token as never)
        .maybeSingle()) as unknown as { data: NotaData | null; error: { message: string } | null };
      if (error || !data) { setErrorMsg('Nota no encontrada'); setLoading(false); return; }
      setNota(data);

      // Fetch items
      const { data: itemData } = (await supabase
        .from('vtatkt' as never)
        .select('art, can, prec, descue')
        .eq('folio' as never, data.folio as never)
        .neq('status' as never, 'CANCELADO' as never)) as unknown as { data: NotaItem[] | null };
      setItems(itemData ?? []);

      // Fetch config
      const { data: cfg } = (await supabase
        .from('pvcntl' as never)
        .select('empresa, logoemp, lin1, lin2, lin3, lin4, lin5, lin6, lin7')
        .maybeSingle()) as unknown as { data: ConfigData | null };
      setConfig(cfg);

      setLoading(false);
    }
    void fetchAll();
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
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>;
  }

  if (errorMsg && !nota) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
          <h3 className="text-lg font-bold text-red-700">Error</h3>
          <p className="text-gray-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!nota) return null;

  const isEntregado = nota.entrega_status === 'entregado';
  const saldo = nota.total - nota.pagado;
  const currentUrl = window.location.href;
  const headerLines = [config?.lin1, config?.lin2, config?.lin3].filter(Boolean) as string[];
  const footerLines = [config?.lin4, config?.lin5, config?.lin6, config?.lin7].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
      {/* Printable ticket */}
      <div className="mx-auto max-w-[320px] bg-white p-6 shadow-lg print:shadow-none print:max-w-none print:mx-0" id="ticket">

        {/* Header: Logo + Company name */}
        <div className="text-center mb-3">
          {config?.logoemp && (
            <img src={config.logoemp} alt="" className="mx-auto mb-2 h-16 w-16 object-contain" />
          )}
          <h1 className="text-lg font-bold">{config?.empresa || 'DAR Alimento'}</h1>
          {headerLines.map((line, i) => (
            <p key={i} className="text-[10px] text-gray-500">{line}</p>
          ))}
        </div>

        <div className="border-t border-dashed my-2" />

        {/* Nota info */}
        <div className="text-xs space-y-0.5">
          <div className="flex justify-between">
            <span className="font-bold text-sm">Nota: #{nota.folio_display || nota.folio}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{nota.fecha} {nota.hora}</span>
          </div>
          <div className="flex justify-between">
            <span>Cliente:</span>
            <span className="font-medium">{nota.cliente}</span>
          </div>
          {nota.vendedor && (
            <div className="flex justify-between">
              <span>Vendedor:</span>
              <span>{nota.vendedor}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed my-2" />

        {/* Items */}
        {items.length > 0 ? (
          <div className="text-xs space-y-0.5">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="flex-1">{item.can} x {item.art}</span>
                <span className="ml-2 font-medium">{formatPrice((item.prec - item.descue) * item.can)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-1">Nota importada — sin desglose de artículos</p>
        )}

        <div className="border-t border-dashed my-2" />

        {/* Totals */}
        <div className="text-xs space-y-0.5">
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span>{formatPrice(nota.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Forma de pago:</span>
            <span className="capitalize">{nota.metodo_pago}</span>
          </div>
          {nota.pagado > 0 && nota.pagado < nota.total && (
            <div className="flex justify-between text-green-700">
              <span>Pagado:</span>
              <span>{formatPrice(nota.pagado)}</span>
            </div>
          )}
          {saldo > 0.01 && (
            <div className="flex justify-between font-bold text-red-700">
              <span>SALDO PENDIENTE:</span>
              <span>{formatPrice(saldo)}</span>
            </div>
          )}
          {nota.notas_pago && (
            <p className="text-[10px] text-gray-400 italic mt-1">{nota.notas_pago}</p>
          )}
        </div>

        <div className="border-t border-dashed my-2" />

        {/* Status */}
        <div className="flex justify-center gap-2 my-2">
          <Badge className={nota.pago_status === 'pagado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
            {nota.pago_status === 'pagado' ? '✓ Pagado' : 'Pago pendiente'}
          </Badge>
          <Badge className={isEntregado ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
            {isEntregado ? '✓ Entregado' : 'Sin entregar'}
          </Badge>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center my-3">
          <QRCodeSVG value={currentUrl} size={100} level="M" />
          <p className="text-[9px] text-gray-400 mt-1">Escanea para confirmar entrega</p>
        </div>

        {/* Footer lines */}
        {footerLines.length > 0 && (
          <>
            <div className="border-t border-dashed my-2" />
            <div className="text-center">
              {footerLines.map((line, i) => (
                <p key={i} className="text-[10px] text-gray-500">{line}</p>
              ))}
            </div>
          </>
        )}

        <p className="text-center text-[8px] text-gray-300 mt-2">pos.daralimento.com</p>
      </div>

      {/* Action buttons — hidden on print */}
      <div className="mx-auto max-w-[320px] mt-4 space-y-2 print:hidden">
        {!isEntregado && (
          <Button
            className="w-full gap-2 bg-green-600 hover:bg-green-700"
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

        <Button variant="outline" className="w-full gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir Ticket
        </Button>
      </div>
    </div>
  );
}
