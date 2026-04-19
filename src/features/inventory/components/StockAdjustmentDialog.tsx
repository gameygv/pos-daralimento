import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdjustAlmacenStock, useAlmacenes } from '@/features/almacenes/hooks/useAlmacenes';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import type { ProductStockRow } from '../hooks/useInventory';
import { useQueryClient } from '@tanstack/react-query';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductStockRow | null;
  type: 'entrada' | 'salida';
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  type,
}: StockAdjustmentDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [selectedAlmacenId, setSelectedAlmacenId] = useState('');
  const [comment, setComment] = useState('');
  const adjustStock = useAdjustAlmacenStock();
  const { data: almacenes = [] } = useAlmacenes();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuantity('');
      setComment('');
      // Auto-select if only one almacén
      if (almacenes.length === 1) {
        setSelectedAlmacenId(almacenes[0].id);
      } else {
        setSelectedAlmacenId('');
      }
    }
  }, [open, almacenes]);

  const handleClose = (value: boolean) => {
    onOpenChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (!selectedAlmacenId) {
      toast.error('Selecciona un punto de venta');
      return;
    }

    // Get user name
    let userName = user?.email?.split('@')[0] ?? 'Usuario';
    if (user?.id) {
      const { data: vendeData } = (await supabase
        .from('vende' as never)
        .select('nomv')
        .eq('codven', user.id)
        .single()) as unknown as { data: { nomv: string } | null };
      if (vendeData?.nomv) userName = vendeData.nomv;
    }

    const almacenName = almacenes.find((a) => a.id === selectedAlmacenId)?.nombre ?? '';

    try {
      await adjustStock.mutateAsync({
        almacenId: selectedAlmacenId,
        variantId: product.variant_id,
        productId: product.id,
        tipo: type,
        cantidad: qty,
        comentario: comment || (type === 'entrada' ? 'Entrada de inventario' : 'Salida de inventario'),
        userId: user?.id ?? undefined,
        userName,
      });

      // Also invalidate inventory-specific queries
      void queryClient.invalidateQueries({ queryKey: ['product-stock'] });
      void queryClient.invalidateQueries({ queryKey: ['all-almacen-stock'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });

      toast.success(
        type === 'entrada'
          ? `+${qty} unidades en ${almacenName}`
          : `-${qty} unidades en ${almacenName}`,
      );
      handleClose(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al ajustar el stock');
    }
  };

  const isEntry = type === 'entrada';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEntry ? 'Entrada de mercancía' : 'Salida de mercancía'}</DialogTitle>
          <DialogDescription>
            {product?.name} — Stock total: {product?.stock}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Punto de Venta</Label>
            <Select value={selectedAlmacenId} onValueChange={setSelectedAlmacenId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona punto de venta" />
              </SelectTrigger>
              <SelectContent>
                {almacenes.map((alm) => (
                  <SelectItem key={alm.id} value={alm.id}>
                    {alm.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ej: 10"
              className="text-lg"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Comentario (opcional)</Label>
            <Input
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isEntry ? 'Ej: Recepción de proveedor' : 'Ej: Merma'}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
            <Button
              type="submit"
              disabled={adjustStock.isPending || !selectedAlmacenId}
              className={isEntry ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {adjustStock.isPending ? 'Guardando...' : isEntry ? 'Registrar entrada' : 'Registrar salida'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
