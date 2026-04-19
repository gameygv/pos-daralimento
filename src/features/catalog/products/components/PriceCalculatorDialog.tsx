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
      if (almacenes.length === 1) {
        setSelectedAlmacenId(almacenes[0].id);
      } else {
        setSelectedAlmacenId('');
      }
    }
  }, [open, almacenes]);

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
  const pesoRegistrado = productWeight ?? 0;

  const precioPorGramoPublico = pesoRegistrado > 0 ? prices.publico / pesoRegistrado : 0;
  const precioPorGramoProveedor = pesoRegistrado > 0 ? prices.proveedor / pesoRegistrado : 0;

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
            <p className="text-xs text-muted-foreground">
              Peso registrado: <strong>{pesoRegistrado > 0 ? `${pesoRegistrado}g` : 'No registrado'}</strong>
              {pesoRegistrado > 0 && (
                <span className="ml-2">
                  ({precioPorGramoPublico > 0 ? `${formatCurrency(precioPorGramoPublico)}/g pub.` : ''}
                  {precioPorGramoProveedor > 0 ? ` · ${formatCurrency(precioPorGramoProveedor)}/g prov.` : ''})
                </span>
              )}
            </p>
          </div>

          {/* Grams input */}
          {pesoRegistrado > 0 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="calc-gramos" className="flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5" />
                  Gramos deseados
                </Label>
                <Input
                  id="calc-gramos"
                  type="number"
                  min={1}
                  step={1}
                  value={gramos}
                  onChange={(e) => setGramos(e.target.value)}
                  placeholder="Ej: 1000"
                  className="text-lg"
                  autoFocus
                />
              </div>

              {/* Result */}
              {gramosNum > 0 && (
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
            </>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Este producto no tiene peso registrado. Registra el peso en la ficha del producto para usar la calculadora.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
