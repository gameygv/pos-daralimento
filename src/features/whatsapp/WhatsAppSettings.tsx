import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, Save, Loader2, Send, Users, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendWhatsAppMessage, sendWhatsAppFile } from './sendWhatsApp';

interface WhatsAppConfig {
  id: number;
  enabled: boolean;
  chat_type: 'none' | 'number' | 'group';
  chat_id: string | null;
  chat_label: string | null;
}

interface ChatInfo {
  id: string;
  name: string;
  archive: boolean;
}

const WA_CONFIG_KEY = ['whatsapp-config'] as const;

export function useWhatsAppConfig() {
  return useQuery<WhatsAppConfig>({
    queryKey: [...WA_CONFIG_KEY],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('whatsapp_config' as never)
        .select('*')
        .eq('id', 1)
        .single()) as unknown as { data: WhatsAppConfig | null; error: { message: string } | null };
      if (error) throw new Error(error.message);
      return data ?? { id: 1, enabled: false, chat_type: 'none', chat_id: null, chat_label: null };
    },
  });
}

export function WhatsAppSettings() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useWhatsAppConfig();

  const [enabled, setEnabled] = useState(false);
  const [chatType, setChatType] = useState<'none' | 'number' | 'group'>('none');
  const [chatId, setChatId] = useState('');
  const [chatLabel, setChatLabel] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Test state
  const [testMessage, setTestMessage] = useState('Mensaje de prueba desde POS DAR Alimento');
  const [testImageUrl, setTestImageUrl] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Groups dialog
  const [showGroupsDialog, setShowGroupsDialog] = useState(false);
  const [groups, setGroups] = useState<ChatInfo[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setChatType(config.chat_type);
      setChatId(config.chat_id ?? '');
      setChatLabel(config.chat_label ?? '');
      // Extract phone from chatId if it's a number type
      if (config.chat_type === 'number' && config.chat_id) {
        setPhoneNumber(config.chat_id.replace('@c.us', ''));
      }
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Build chatId from phone number if type is 'number'
      let finalChatId = chatId;
      if (chatType === 'number' && phoneNumber) {
        finalChatId = `${phoneNumber.replace(/\D/g, '')}@c.us`;
      }
      if (chatType === 'none') {
        finalChatId = '';
      }

      const { error } = (await supabase
        .from('whatsapp_config' as never)
        .upsert({
          id: 1,
          enabled: chatType !== 'none' && enabled,
          chat_type: chatType,
          chat_id: finalChatId || null,
          chat_label: chatLabel || null,
          updated_at: new Date().toISOString(),
        })) as unknown as { error: { message: string } | null };
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WA_CONFIG_KEY });
      toast.success('Configuracion de WhatsApp guardada');
    },
    onError: (err) => toast.error(err.message),
  });

  async function handleLoadGroups() {
    setLoadingGroups(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('No hay sesion'); return; }
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'getChats', chatId: '_' }),
      });
      const data = await res.json() as ChatInfo[];
      if (Array.isArray(data)) {
        const groupChats = data.filter((c) => c.id?.endsWith('@g.us') && !c.archive);
        setGroups(groupChats);
      }
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    }
    setLoadingGroups(false);
    setShowGroupsDialog(true);
  }

  function selectGroup(group: ChatInfo) {
    setChatType('group');
    setChatId(group.id);
    setChatLabel(group.name);
    setShowGroupsDialog(false);
    toast.success(`Grupo seleccionado: ${group.name}`);
  }

  async function handleSendTest() {
    const targetChatId = chatType === 'number' ? `${phoneNumber.replace(/\D/g, '')}@c.us` : chatId;
    if (!targetChatId) { toast.error('Configura un destino primero'); return; }

    setIsSendingTest(true);
    try {
      // Send text
      const textResult = await sendWhatsAppMessage({ chatId: targetChatId, message: testMessage });
      if (!textResult.success) { toast.error(`Error texto: ${textResult.message}`); setIsSendingTest(false); return; }
      toast.success('Mensaje de texto enviado');

      // Send image if provided
      if (testImageUrl.trim()) {
        const imgResult = await sendWhatsAppFile({
          chatId: targetChatId,
          urlFile: testImageUrl.trim(),
          fileName: 'test-image.jpg',
          caption: 'Imagen de prueba desde POS',
        });
        if (imgResult.success) toast.success('Imagen enviada');
        else toast.error(`Error imagen: ${imgResult.message}`);
      }
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    }
    setIsSendingTest(false);
  }

  if (isLoading) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Notificaciones WhatsApp
          </CardTitle>
          <CardDescription>
            Enviar notificaciones de ventas por WhatsApp via Green API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Destination type */}
          <div className="space-y-2">
            <Label>Enviar notificaciones a</Label>
            <Select value={chatType} onValueChange={(v) => setChatType(v as 'none' | 'number' | 'group')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Desactivado (no enviar)</SelectItem>
                <SelectItem value="number">Numero individual</SelectItem>
                <SelectItem value="group">Grupo de WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Number input */}
          {chatType === 'number' && (
            <div className="space-y-2">
              <Label>Numero de WhatsApp (con codigo de pais)</Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ej: 5215512345678"
              />
              <p className="text-xs text-muted-foreground">
                Incluye codigo de pais sin + (Mexico: 521...)
              </p>
            </div>
          )}

          {/* Group selector */}
          {chatType === 'group' && (
            <div className="space-y-2">
              <Label>Grupo de WhatsApp</Label>
              <div className="flex gap-2">
                <Input
                  value={chatLabel || chatId}
                  readOnly
                  placeholder="Selecciona un grupo"
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleLoadGroups} disabled={loadingGroups}>
                  {loadingGroups ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Users className="mr-1 h-4 w-4" />}
                  {loadingGroups ? 'Cargando...' : 'Elegir grupo'}
                </Button>
              </div>
              {chatId && (
                <p className="text-xs text-muted-foreground">
                  chatId: <code>{chatId}</code>
                </p>
              )}
            </div>
          )}

          {/* Enable switch */}
          {chatType !== 'none' && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Activar notificaciones</Label>
                <p className="text-xs text-muted-foreground">Enviar automaticamente al crear ventas</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          )}

          {/* Save */}
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar configuracion WhatsApp
          </Button>

          {/* Test section */}
          {chatType !== 'none' && (chatId || phoneNumber) && (
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <p className="text-sm font-semibold">Prueba de envio</p>
              <div className="space-y-2">
                <Label className="text-xs">Mensaje de texto</Label>
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Mensaje de prueba..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  URL de imagen (opcional)
                </Label>
                <Input
                  value={testImageUrl}
                  onChange={(e) => setTestImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleSendTest} disabled={isSendingTest}>
                {isSendingTest ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                {isSendingTest ? 'Enviando...' : 'Enviar prueba'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Groups dialog */}
      <Dialog open={showGroupsDialog} onOpenChange={setShowGroupsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar grupo de WhatsApp</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {groups.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No se encontraron grupos</p>
            ) : (
              <div className="space-y-1">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => selectGroup(g)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/50"
                  >
                    <span className="font-medium">{g.name}</span>
                    <Badge variant="secondary" className="text-[10px]">Grupo</Badge>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
