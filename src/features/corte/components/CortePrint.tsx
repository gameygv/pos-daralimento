import type { PaymentBreakdown, ProductSale } from '../hooks/useCortes';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

interface CortePrintProps {
  folioCorte: number;
  fecha: string;
  hora: string;
  cajero: string;
  ticketCount: number;
  totalProducts: number;
  breakdown: PaymentBreakdown[];
  productSales: ProductSale[];
  totalSales: number;
  cajaName?: string;
  cajaPrefix?: string;
  folioInicial?: string;
  folioFinal?: string;
}

export function CortePrint({
  folioCorte,
  fecha,
  hora,
  cajero,
  totalProducts,
  breakdown,
  productSales,
  totalSales,
  cajaName,
  cajaPrefix,
  folioInicial,
  folioFinal,
}: CortePrintProps) {
  const totalRecibido = breakdown.reduce((acc, b) => acc + b.total, 0);
  const diferencia = totalSales - totalRecibido;

  return (
    <div className="corte-print mx-auto max-w-[80mm] bg-white p-4 font-mono text-xs">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm font-bold">================================</p>
        <p className="text-sm font-bold">CORTE DE CAJA</p>
        <p className="text-sm font-bold">The Elephant Bowl</p>
        <p className="text-sm font-bold">================================</p>
        <p>Fecha: {fecha}</p>
        <p>Hora: {hora}</p>
        <p>Cajero: {cajero}</p>
        <p>Corte #: {folioCorte}</p>
        {cajaName && (
          <p>Caja: {cajaName}{cajaPrefix ? ` (${cajaPrefix})` : ''}</p>
        )}
        {folioInicial && folioFinal && (
          <p>Folios: {folioInicial} - {folioFinal}</p>
        )}
        <p>--------------------------------</p>
      </div>

      {/* Products sold */}
      <div className="mt-2">
        <p className="font-bold">PRODUCTOS VENDIDOS</p>
        <div className="flex justify-between text-[10px] font-bold">
          <span className="w-8">Cant</span>
          <span className="flex-1">Producto</span>
          <span className="w-20 text-right">Total</span>
        </div>
        {productSales.map((p) => (
          <div key={p.art} className="flex justify-between text-[10px]">
            <span className="w-8 text-right pr-1">{p.cantidad}</span>
            <span className="flex-1 truncate">{p.descr}</span>
            <span className="w-20 text-right">{formatPrice(p.total)}</span>
          </div>
        ))}
        <p>--------------------------------</p>
        <div className="flex justify-between font-bold">
          <span>TOTAL PRODUCTOS:</span>
          <span>{totalProducts}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>TOTAL VENTA:</span>
          <span>{formatPrice(totalSales)}</span>
        </div>
      </div>

      {/* Payment methods */}
      <div className="mt-2">
        <p className="font-bold">FORMAS DE PAGO</p>
        {breakdown.map((b) => (
          <div key={b.method} className="flex justify-between">
            <span>{b.label}:</span>
            <span>{formatPrice(b.total)}</span>
          </div>
        ))}
        <p>--------------------------------</p>
        <div className="flex justify-between font-bold">
          <span>TOTAL RECIBIDO:</span>
          <span>{formatPrice(totalRecibido)}</span>
        </div>
      </div>

      {/* Difference */}
      <div className="mt-2">
        <div className="flex justify-between font-bold">
          <span>DIFERENCIA:</span>
          <span>{formatPrice(diferencia)}</span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <p className="text-sm font-bold">================================</p>
      </div>
    </div>
  );
}
