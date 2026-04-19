import { DollarSign, Users, UserCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

interface PriceSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  precioPublico: number;
  precioProveedores: number;
  onSelect: (price: number) => void;
}

export function PriceSelectDialog({
  open,
  onOpenChange,
  productName,
  precioPublico,
  precioProveedores,
  onSelect,
}: PriceSelectDialogProps) {
  function handleSelect(price: number) {
    onSelect(price);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center text-base">Seleccionar precio</DialogTitle>
          <DialogDescription className="text-center text-sm">
            {productName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSelect(precioPublico)}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-teal-200 bg-teal-50 p-4 transition-all hover:border-teal-500 hover:shadow-md active:scale-95"
          >
            <UserCheck className="h-6 w-6 text-teal-600" />
            <span className="text-xs font-medium text-teal-700">Publico</span>
            <span className="text-lg font-bold text-teal-800">{formatPrice(precioPublico)}</span>
          </button>
          <button
            onClick={() => handleSelect(precioProveedores)}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-purple-200 bg-purple-50 p-4 transition-all hover:border-purple-500 hover:shadow-md active:scale-95"
          >
            <Users className="h-6 w-6 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Proveedor</span>
            <span className="text-lg font-bold text-purple-800">{formatPrice(precioProveedores)}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
