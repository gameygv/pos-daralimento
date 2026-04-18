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
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/FileUpload';
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
  const [cost, setCost] = useState('');
  const [comments, setComments] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  const adjustStock = useAdjustStock();

  const resetForm = () => {
    setQuantity('');
    setCost('');
    setComments('');
    setAttachmentUrl(null);
  };

  const handleClose = (value: boolean) => {
    if (!value) resetForm();
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

    if (!comments.trim()) {
      toast.error('Los comentarios son obligatorios');
      return;
    }

    try {
      await adjustStock.mutateAsync({
        productId: product.id,
        variantId: product.variant_id,
        movementType: type,
        quantity: qty,
        cost: cost ? parseFloat(cost) : null,
        comments: comments.trim(),
        attachmentUrl,
      });

      toast.success(
        type === 'entrada'
          ? `Entrada registrada: +${qty} unidades`
          : `Salida registrada: -${qty} unidades`,
      );
      handleClose(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al ajustar el stock',
      );
    }
  };

  const isEntry = type === 'entrada';
  const title = isEntry ? 'Entrada de mercancia' : 'Salida de mercancia';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {product?.name} ({product?.sku}) — Stock actual: {product?.stock}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad *</Label>
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

          {isEntry && (
            <div className="space-y-2">
              <Label htmlFor="cost">Costo unitario</Label>
              <Input
                id="cost"
                type="number"
                min={0}
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="Ej: 150.00"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comments">Comentarios *</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Explica el motivo del movimiento..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Archivo adjunto</Label>
            <FileUpload
              value={attachmentUrl}
              onChange={setAttachmentUrl}
              bucket="inventory-attachments"
              accept="image/*,.pdf"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={adjustStock.isPending}
              className={isEntry ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {adjustStock.isPending
                ? 'Guardando...'
                : isEntry
                  ? 'Registrar entrada'
                  : 'Registrar salida'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
