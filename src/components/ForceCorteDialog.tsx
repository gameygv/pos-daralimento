import { useNavigate } from 'react-router-dom';
import { Calculator, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ForceCorteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cajaName?: string;
}

export function ForceCorteDialog({ open, onOpenChange, cajaName }: ForceCorteDialogProps) {
  const navigate = useNavigate();

  function handleGoToCorte() {
    onOpenChange(false);
    navigate('/corte');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Corte de Caja Requerido
          </DialogTitle>
          <DialogDescription>
            Debes hacer el corte de caja antes de cerrar sesion
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tienes la caja <strong>{cajaName ?? 'activa'}</strong> abierta. Para cerrar
            sesion primero debes realizar el corte de caja.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={handleGoToCorte}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Ir a Corte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
