import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useSaveSettings, SettingsForm } from '@/features/settings';
import { WhatsAppSettings } from '@/features/whatsapp/WhatsAppSettings';
import { CleanupSection } from '@/features/settings/components/CleanupSection';

export default function ConfiguracionPage() {
  const { data, isLoading, isError } = useSettings();
  const saveSettings = useSaveSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Personaliza la identidad del negocio y el formato de tickets
        </p>
      </div>

      {isError ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            No se pudo cargar la configuración. Verifica que la tabla
            &quot;pvcntl&quot; exista en Supabase.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <SettingsForm
            initialData={data}
            saving={saveSettings.isPending}
            onSave={(config) =>
              saveSettings.mutate(config, {
                onSuccess: () => toast.success('Configuración guardada'),
                onError: (err) => toast.error(err.message),
              })
            }
          />
          <WhatsAppSettings />
          <CleanupSection />
        </>
      )}
    </div>
  );
}
