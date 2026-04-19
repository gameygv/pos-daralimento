import { useState } from 'react';
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
import { useAdjustStock, type ProductStockRow } from '../hooks/useInventory';

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
  const adjustStock = useAdjustStock();

  const handleClose = (value: boolean) => {
    if (!value) setQuantity('');
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

    try {
      await adjustStock.mutateAsync({
        productId: product.id,
        variantId: product.variant_id,
        movementType: type,
        quantity: qty,
        comments: type === 'entrada' ? 'Entrada de inventario' : 'Salida de inventario',
      });
      toast.success(
        type === 'entrada'
          ? `Entrada registrada: +${qty} unidades`
          : `Salida registrada: -${qty} unidades`,
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
          <DialogTitle>{isEntry ? 'Entrada de mercancia' : 'Salida de mercancia'}</DialogTitle>
          <DialogDescription>
            {product?.name} — Stock actual: {product?.stock}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
            <Button
              type="submit"
              disabled={adjustStock.isPending}
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
