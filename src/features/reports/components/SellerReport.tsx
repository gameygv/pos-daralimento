import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

interface SellerSaleRow {
  folio: number;
  vende: string | null;
  prec: number;
  can: number;
  descue: number;
  status: string;
  caja_id: string | null;
}

interface SellerSummary {
  vendedor: string;
  caja: string;
  tickets: number;
  totalVentas: number;
}

function useSellerSales(fechaDesde: string, fechaHasta: string) {
  return useQuery<SellerSaleRow[]>({
    queryKey: ['seller-report', fechaDesde, fechaHasta],
    queryFn: async () => {
      let query = supabase
        .from('vtatkt' as never)
        .select('folio, vende, prec, can, descue, status, caja_id')
        .neq('status' as never, 'CANCELADO' as never)
        .order('vende')
        .limit(5000);

      if (fechaDesde) {
        query = query.gte('fecha' as never, fechaDesde as never);
      }
      if (fechaHasta) {
        query = query.lte('fecha' as never, fechaHasta as never);
      }

      const { data, error } = (await query) as unknown as {
        data: SellerSaleRow[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

function useCajasMap() {
  return useQuery<Record<string, string>>({
    queryKey: ['cajas-map'],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('cajas' as never)
        .select('id, nombre, prefijo_folio')) as unknown as {
        data: { id: string; nombre: string; prefijo_folio: string }[] | null;
        error: { message: string } | null;
      };
      if (error) throw new Error(error.message);
      const map: Record<string, string> = {};
      for (const c of data ?? []) {
        map[c.id] = c.prefijo_folio ? `${c.nombre} (${c.prefijo_folio})` : c.nombre;
      }
      return map;
    },
  });
}

export function SellerReport() {
  const today = new Date().toISOString().split('T')[0];
  const [fechaDesde, setFechaDesde] = useState(today);
  const [fechaHasta, setFechaHasta] = useState(today);

  const { data: sales = [], isLoading } = useSellerSales(fechaDesde, fechaHasta);
  const { data: cajasMap = {} } = useCajasMap();

  const sellerData = useMemo(() => {
    const groupMap = new Map<string, { folios: Set<number>; total: number }>();

    for (const row of sales) {
      const vendedor = row.vende || 'Sin vendedor';
      const cajaName = row.caja_id ? (cajasMap[row.caja_id] || 'Caja desconocida') : 'Sin caja';
      const key = `${vendedor}|${cajaName}`;
      const lineTotal = row.prec * row.can - row.descue;

      const existing = groupMap.get(key);
      if (existing) {
        existing.folios.add(row.folio);
        existing.total += lineTotal;
      } else {
        groupMap.set(key, {
          folios: new Set([row.folio]),
          total: lineTotal,
        });
      }
    }

    const result: SellerSummary[] = [];
    for (const [key, data] of groupMap) {
      const [vendedor, caja] = key.split('|');
      result.push({
        vendedor,
        caja,
        tickets: data.folios.size,
        totalVentas: data.total,
      });
    }

    return result.sort((a, b) => b.totalVentas - a.totalVentas);
  }, [sales, cajasMap]);

  const totalGeneral = sellerData.reduce((s, d) => s + d.totalVentas, 0);
  const totalTickets = sellerData.reduce((s, d) => s + d.tickets, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5" />
          Ventas por Vendedor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-[160px]"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : sellerData.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No hay ventas en el rango seleccionado
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Caja</TableHead>
                  <TableHead className="text-right">Tickets</TableHead>
                  <TableHead className="text-right">Total Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.vendedor}</TableCell>
                    <TableCell>{row.caja}</TableCell>
                    <TableCell className="text-right">{row.tickets}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatPrice(row.totalVentas)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-bold">{totalTickets}</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatPrice(totalGeneral)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
