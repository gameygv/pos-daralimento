import { useState } from 'react';
import { Search, RotateCcw, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  useSearchTicket,
  useProcessReturn,
  type TicketItemForReturn,
} from '../hooks/useDevoluciones';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function DevolucionesView() {
  const [folioInput, setFolioInput] = useState('');
  const [searchFolio, setSearchFolio] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);

  const { data: ticket, isLoading } = useSearchTicket(searchFolio);
  const processReturn = useProcessReturn();

  function handleSearch() {
    setSearchFolio(folioInput.trim());
    setSelectedItems({});
    setDone(false);
  }

  function toggleItem(item: TicketItemForReturn) {
    setSelectedItems((prev) => {
      if (prev[item.id] !== undefined) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: item.can };
    });
  }

  function updateReturnQty(itemId: string, qty: number, max: number) {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: Math.max(1, Math.min(max, qty)),
    }));
  }

  async function handleReturn() {
    const entries = Object.entries(selectedItems);
    if (entries.length === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    await processReturn.mutateAsync({
      itemIds: entries.map(([id]) => id),
      quantities: entries.map(([, qty]) => qty),
      reason: reason || 'DEVOLUCION',
    });

    toast.success('Devolucion procesada correctamente');
    setDone(true);
    setSelectedItems({});
  }

  function handleReset() {
    setFolioInput('');
    setSearchFolio('');
    setSelectedItems({});
    setReason('');
    setDone(false);
  }

  const selectedCount = Object.keys(selectedItems).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Devoluciones</h1>
        <p className="text-sm text-muted-foreground">
          Busca un ticket por folio para procesar una devolucion
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Numero de folio..."
          value={folioInput}
          onChange={(e) => setFolioInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="h-11"
          type="number"
        />
        <Button onClick={handleSearch} className="h-11" disabled={!folioInput.trim()}>
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <p className="text-center text-sm text-muted-foreground">Buscando ticket...</p>
      )}

      {/* Not found */}
      {searchFolio && !isLoading && !ticket && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="mx-auto mb-2 h-8 w-8" />
            <p>No se encontro ticket con folio #{searchFolio}</p>
            <p className="text-xs">Solo se muestran ventas con status VENDIDO</p>
          </CardContent>
        </Card>
      )}

      {/* Done */}
      {done && (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="mx-auto mb-2 h-10 w-10 text-green-600" />
            <p className="text-lg font-bold">Devolucion procesada</p>
            <p className="text-sm text-muted-foreground">
              El stock ha sido restaurado y los items marcados como devueltos
            </p>
            <Button variant="outline" className="mt-4" onClick={handleReset}>
              Nueva devolucion
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ticket found */}
      {ticket && !done && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ticket #{ticket.folioDisplay}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {ticket.fecha} {ticket.hora}
              </span>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Cliente: {ticket.cliente} | Vendedor: {ticket.vendedor} | Pago: {ticket.metodoPago}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Items */}
            <div className="divide-y rounded-lg border">
              {ticket.items.map((item) => {
                const isSelected = selectedItems[item.id] !== undefined;
                const returnQty = selectedItems[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                      isSelected ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(item)}
                      className="h-4 w-4 rounded border-gray-300 accent-red-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.art}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.can} x {formatPrice(item.prec)}
                        {item.descue > 0 && ` (desc: ${formatPrice(item.descue)})`}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-muted-foreground">Cant:</label>
                        <Input
                          type="number"
                          min={1}
                          max={item.can}
                          value={returnQty}
                          onChange={(e) =>
                            updateReturnQty(item.id, parseInt(e.target.value) || 1, item.can)
                          }
                          className="h-7 w-16 text-center text-xs"
                        />
                      </div>
                    )}
                    <span className="w-20 text-right text-sm font-semibold">
                      {formatPrice(item.prec * item.can)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reason */}
            <div>
              <label className="mb-1 block text-sm font-medium">Motivo (opcional)</label>
              <Input
                placeholder="Ej: producto danado, error de cobro..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Action */}
            <Button
              className="h-12 w-full bg-red-600 text-white hover:bg-red-700"
              disabled={selectedCount === 0 || processReturn.isPending}
              onClick={handleReturn}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {processReturn.isPending
                ? 'Procesando...'
                : `Devolver ${selectedCount} producto${selectedCount !== 1 ? 's' : ''}`}
            </Button>

            {processReturn.isError && (
              <p className="text-center text-sm text-red-600">
                Error: {processReturn.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
