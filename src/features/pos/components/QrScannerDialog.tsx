import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
}

export function QrScannerDialog({ open, onOpenChange, onScan }: QrScannerDialogProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const containerId = 'qr-scanner-region';

  useEffect(() => {
    if (!open) return;

    // Small delay to ensure the DOM element is rendered
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [open]);

  async function startScanner() {
    try {
      setError(null);
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Successful scan
          onScan(decodedText);
          onOpenChange(false);
        },
        () => {
          // QR code not found in frame — ignore
        },
      );
      setScanning(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setError('Permiso de camara denegado. Activa el permiso en tu navegador.');
      } else if (msg.includes('NotFoundError') || msg.includes('no camera')) {
        setError('No se encontro ninguna camara en este dispositivo.');
      } else {
        setError(`Error al iniciar la camara: ${msg}`);
      }
    }
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        const state = scanner.getState();
        // State 2 = SCANNING
        if (state === 2) {
          await scanner.stop();
        }
        scanner.clear();
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) stopScanner();
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escanear codigo QR / Barras
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            id={containerId}
            className="w-full overflow-hidden rounded-lg"
            style={{ minHeight: scanning ? undefined : '250px' }}
          />

          {error && (
            <div className="flex flex-col items-center gap-3 text-center">
              <CameraOff className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={startScanner}>
                Reintentar
              </Button>
            </div>
          )}

          {scanning && !error && (
            <p className="text-sm text-muted-foreground">
              Apunta la camara al codigo QR o de barras
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
