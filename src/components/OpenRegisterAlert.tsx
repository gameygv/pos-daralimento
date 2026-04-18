import { useNavigate } from 'react-router-dom';
import { AlertCircle, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMyActiveSession, useActiveCajas } from '@/features/cajas/hooks/useCajas';

export function OpenRegisterAlert() {
  const navigate = useNavigate();
  const { data: session } = useMyActiveSession();
  const { data: cajas = [] } = useActiveCajas();

  if (!session) return null;

  const cajaName = cajas.find((c) => c.id === session.caja_id)?.nombre ?? 'Caja';
  const openedAt = new Date(session.opened_at);
  const timeStr = openedAt.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Monitor className="h-4 w-4" />
        <span>
          Tienes la caja <strong>{cajaName}</strong> abierta desde las {timeStr}.
        </span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-7 border-amber-300 text-amber-800 hover:bg-amber-100"
          onClick={() => navigate('/corte')}
        >
          Hacer corte de caja
        </Button>
      </div>
    </div>
  );
}
