import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAlmacenes, useProductAlmacenPrecios } from '@/features/almacenes/hooks/useAlmacenes';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Calculator, Scale, DollarSign } from 'lucide-react';

interface PriceCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
  productName: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

export function PriceCalculatorDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: PriceCalculatorDialogProps) {
  const [selectedAlmacenId, setSelectedAlmacenId] = useState('');
  const [gramos, setGramos] = useState('');
  const [pesoBase, setPesoBase] = useState('');

  const { data: almacenes = [] } = useAlmacenes();
  const { data: almacenPrecios = [] } = useProductAlmacenPrecios(productId);

  // Fetch product weight
  const { data: productWeight } = useQuery<number | null>({
    queryKey: ['product-weight', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data } = (await supabase
        .from('products' as never)
        .select('weight_grams')
        .eq('id', productId)
        .single()) as unknown as { data: { weight_grams: number | null } | null };
      return data?.weight_grams ?? null;
    },
    enabled: !!productId && open,
  });

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setGramos('');
      setPesoBase('');
      if (almacenes.length === 1) {
        setSelectedAlmacenId(almacenes[0].id);
      } else {
        setSelectedAlmacenId('');
      }
    }
  }, [open, almacenes]);

  // Pre-fill peso base when weight loads
  useEffect(() => {
    if (productWeight && productWeight > 0 && !pesoBase) {
      setPesoBase(String(productWeight));
    }
  }, [productWeight, pesoBase]);

  // Get prices for selected almacén
  const prices = useMemo(() => {
    if (selectedAlmacenId) {
      const almPrecio = almacenPrecios.find((p) => p.almacen_id === selectedAlmacenId);
      if (almPrecio) {
        return {
          publico: almPrecio.precio_publico,
          proveedor: almPrecio.precio_proveedores,
        };
      }
    }
    return { publico: 0, proveedor: 0 };
  }, [selectedAlmacenId, almacenPrecios]);

  // Calculate new prices
  const gramosNum = parseFloat(gramos) || 0;
  const pesoBaseNum = parseFloat(pesoBase) || 0;

  const precioPorGramoPublico = pesoBaseNum > 0 ? prices.publico / pesoBaseNum : 0;
  const precioPorGramoProveedor = pesoBaseNum > 0 ? prices.proveedor / pesoBaseNum : 0;

  const precioCalculadoPublico = gramosNum > 0 ? precioPorGramoPublico * gramosNum : 0;
  const precioCalculadoProveedor = gramosNum > 0 ? precioPorGramoProveedor * gramosNum : 0;

  const almacenName = almacenes.find((a) => a.id === selectedAlmacenId)?.nombre ?? '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de precio por peso
          </DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Almacén selector */}
          <div className="space-y-1.5">
            <Label>Punto de Venta</Label>
            <Select value={selectedAlmacenId} onValueChange={setSelectedAlmacenId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona punto de venta" />
              </SelectTrigger>
              <SelectContent>
                {almacenes.map((alm) => (
                  <SelectItem key={alm.id} value={alm.id}>{alm.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current prices */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Precios registrados {almacenName && `— ${almacenName}`}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Precio Publico</p>
                <p className="text-lg font-bold">{formatCurrency(prices.publico)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Precio Proveedor</p>
                <p className="text-lg font-bold">{formatCurrency(prices.proveedor)}</p>
              </div>
            </div>
            {pesoBaseNum > 0 && (precioPorGramoPublico > 0 || precioPorGramoProveedor > 0) && (
              <p className="text-xs text-muted-foreground">
                {precioPorGramoPublico > 0 ? `${formatCurrency(precioPorGramoPublico)}/g pub.` : ''}
                {precioPorGramoProveedor > 0 ? ` · ${formatCurrency(precioPorGramoProveedor)}/g prov.` : ''}
              </p>
            )}
          </div>

          {/* Weight + grams inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calc-peso-base" className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5" />
                Peso base (g)
              </Label>
              <Input
                id="calc-peso-base"
                type="number"
                min={1}
                step={1}
                value={pesoBase}
                onChange={(e) => setPesoBase(e.target.value)}
                placeholder="Ej: 500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-gramos">Gramos deseados</Label>
              <Input
                id="calc-gramos"
                type="number"
                min={1}
                step={1}
                value={gramos}
                onChange={(e) => setGramos(e.target.value)}
                placeholder="Ej: 1000"
                autoFocus
              />
            </div>
          </div>

          {/* Result */}
          {gramosNum > 0 && pesoBaseNum > 0 && (
            <div className="rounded-lg border-2 border-teal-200 bg-teal-50 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Precio para {gramosNum}g
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-teal-600">Precio Publico</p>
                  <p className="text-2xl font-bold text-teal-800">
                    {precioCalculadoPublico > 0 ? formatCurrency(precioCalculadoPublico) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-teal-600">Precio Proveedor</p>
                  <p className="text-2xl font-bold text-teal-800">
                    {precioCalculadoProveedor > 0 ? formatCurrency(precioCalculadoProveedor) : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
