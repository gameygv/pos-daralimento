import { useState } from 'react';
import { CreditCard, DollarSign, TrendingDown, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  useClientesConCredito, useCreditoMovimientos, useAbonoCredito,
  type ClienteCredito,
} from '../hooks/useCreditos';
import { useAuth } from '@/features/auth/AuthProvider';

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

export function CreditosPage() {
  const { user } = useAuth();
  const { data: clientes = [], isLoading } = useClientesConCredito();
  const abonar = useAbonoCredito();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAbono, setShowAbono] = useState(false);
  const [abonoMonto, setAbonoMonto] = useState(0);
  const [abonoMetodo, setAbonoMetodo] = useState('efectivo');

  const selected = clientes.find((c) => c.id === selectedId) ?? null;
  const { data: movimientos = [] } = useCreditoMovimientos(selectedId);

  const filtered = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const totalDeuda = clientes.reduce((s, c) => s + c.saldo, 0);
  const totalLimite = clientes.reduce((s, c) => s + c.limite_credito, 0);

  async function handleAbono() {
    if (!selectedId || abonoMonto <= 0) return;
    try {
      const result = await abonar.mutateAsync({
        clienteId: selectedId,
        monto: abonoMonto,
        metodoPago: abonoMetodo,
        userId: user?.id,
        userName: user?.email?.split('@')[0],
      });
      toast.success(`Abono registrado. Saldo: ${formatPrice(result.newSaldo)}`);
      setShowAbono(false);
      setAbonoMonto(0);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando creditos...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Creditos</h1>
        <p className="text-muted-foreground">Gestion de creditos y cuentas por cobrar de clientes</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-red-500" /> Total por Cobrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatPrice(totalDeuda)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 text-blue-500" /> Credito Otorgado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatPrice(totalLimite)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 text-teal-500" /> Clientes con Credito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-teal-600">{clientes.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client list */}
        <div className="space-y-3 lg:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                    selectedId === c.id ? 'bg-teal-50 text-teal-700' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.nombre}</p>
                    {c.telefono && <p className="text-xs text-muted-foreground">{c.telefono}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${c.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPrice(c.saldo)}
                    </p>
                    {c.limite_credito > 0 && (
                      <p className="text-[10px] text-muted-foreground">Limite: {formatPrice(c.limite_credito)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selected.nombre}</CardTitle>
                  <Button size="sm" onClick={() => { setAbonoMonto(0); setShowAbono(true); }}>
                    <TrendingDown className="mr-1 h-4 w-4" /> Registrar Abono
                  </Button>
                </div>
                <div className="flex gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                    <p className={`text-lg font-bold ${selected.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPrice(selected.saldo)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Limite de credito</p>
                    <p className="text-lg font-bold text-blue-600">
                      {selected.limite_credito > 0 ? formatPrice(selected.limite_credito) : 'Sin limite'}
                    </p>
                  </div>
                  {selected.limite_credito > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Disponible</p>
                      <p className="text-lg font-bold text-teal-600">
                        {formatPrice(Math.max(0, selected.limite_credito - selected.saldo))}
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm font-semibold">Historial de movimientos</p>
                <ScrollArea className="h-[350px]">
                  {movimientos.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">Sin movimientos</p>
                  ) : (
                    <div className="space-y-2">
                      {movimientos.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            m.tipo === 'cargo' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {m.tipo === 'cargo' ? 'Cargo' : 'Abono'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{m.concepto}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.created_by_name} - {new Date(m.created_at).toLocaleString('es-MX')}
                              {m.metodo_pago && ` - ${m.metodo_pago}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${m.tipo === 'cargo' ? 'text-red-600' : 'text-green-600'}`}>
                              {m.tipo === 'cargo' ? '+' : '-'}{formatPrice(m.monto)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Saldo: {formatPrice(m.saldo_nuevo)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <div className="flex h-[500px] items-center justify-center text-muted-foreground">
              Selecciona un cliente para ver su detalle de credito
            </div>
          )}
        </div>
      </div>

      {/* Abono dialog */}
      <Dialog open={showAbono} onOpenChange={setShowAbono}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Abono - {selected?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Saldo actual: <span className="font-bold text-red-600">{formatPrice(selected?.saldo ?? 0)}</span>
              </p>
            </div>
            <div>
              <Label>Monto del abono</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={abonoMonto || ''}
                onChange={(e) => setAbonoMonto(parseFloat(e.target.value) || 0)}
                placeholder="$0.00"
              />
            </div>
            <div>
              <Label>Metodo de pago</Label>
              <Select value={abonoMetodo} onValueChange={setAbonoMetodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbono(false)}>Cancelar</Button>
            <Button onClick={handleAbono} disabled={abonoMonto <= 0 || abonar.isPending}>
              {abonar.isPending ? 'Registrando...' : `Abonar ${formatPrice(abonoMonto)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
