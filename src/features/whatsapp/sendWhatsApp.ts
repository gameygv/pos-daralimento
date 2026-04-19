import { supabase } from '@/integrations/supabase/client';

interface SendMessageParams {
  chatId: string;
  message: string;
}

interface SendFileParams {
  chatId: string;
  urlFile: string;
  fileName: string;
  caption?: string;
}

interface WhatsAppResult {
  success: boolean;
  message: string;
  idMessage?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesion activa');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

/**
 * Send a text message via WhatsApp (Green API proxy)
 */
export async function sendWhatsAppMessage(params: SendMessageParams): Promise<WhatsAppResult> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'sendMessage',
        chatId: params.chatId,
        message: params.message,
      }),
    });
    const data = await res.json() as { idMessage?: string; error?: string };
    if (!res.ok) return { success: false, message: data.error ?? res.statusText };
    return { success: true, message: 'Mensaje enviado', idMessage: data.idMessage };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

/**
 * Send a file (PDF, image, etc.) via WhatsApp (Green API proxy)
 */
export async function sendWhatsAppFile(params: SendFileParams): Promise<WhatsAppResult> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'sendFileByUrl',
        chatId: params.chatId,
        urlFile: params.urlFile,
        fileName: params.fileName,
        caption: params.caption ?? '',
      }),
    });
    const data = await res.json() as { idMessage?: string; error?: string };
    if (!res.ok) return { success: false, message: data.error ?? res.statusText };
    return { success: true, message: 'Archivo enviado', idMessage: data.idMessage };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

/**
 * Send a sale notification: text message + PDF + delivery link
 * @param chatId - WhatsApp chat ID (number@c.us or group@g.us)
 * @param nota - Sale data (folio, cliente, total, items, etc.)
 * @param entregaUrl - Public delivery confirmation URL
 * @param pdfUrl - URL of the nota PDF (optional)
 */
export async function sendSaleNotification(params: {
  chatId: string;
  folioDisplay: string;
  cliente: string;
  total: number;
  vendedor: string;
  items: Array<{ nombre: string; cantidad: number; precio: number }>;
  entregaUrl: string;
  pdfUrl?: string;
}): Promise<WhatsAppResult> {
  const { chatId, folioDisplay, cliente, total, vendedor, items, entregaUrl, pdfUrl } = params;

  // Build message text
  const itemLines = items
    .map((i) => `  • ${i.cantidad}x ${i.nombre} — $${i.precio.toFixed(2)}`)
    .join('\n');

  const totalFormatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total);

  const message = [
    `🛒 *Nueva venta - ${folioDisplay}*`,
    '',
    `👤 Cliente: ${cliente}`,
    `🧑‍💼 Vendedor: ${vendedor}`,
    '',
    `📦 Productos:`,
    itemLines,
    '',
    `💰 *Total: ${totalFormatted}*`,
    '',
    `📋 Confirmar entrega:`,
    entregaUrl,
  ].join('\n');

  // Send text message first
  const textResult = await sendWhatsAppMessage({ chatId, message });
  if (!textResult.success) return textResult;

  // Send PDF if available
  if (pdfUrl) {
    await sendWhatsAppFile({
      chatId,
      urlFile: pdfUrl,
      fileName: `nota-${folioDisplay}.pdf`,
      caption: `Nota de venta ${folioDisplay}`,
    });
  }

  return { success: true, message: 'Notificacion enviada por WhatsApp' };
}
