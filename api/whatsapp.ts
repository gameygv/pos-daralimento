import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless proxy to Green API (WhatsApp).
 * Keeps credentials server-side only.
 *
 * Usage from frontend:
 *   POST /api/whatsapp
 *   Body: { action: "sendMessage", chatId: "5215512345678@c.us", message: "Hola" }
 *   Body: { action: "sendFileByUrl", chatId: "...", urlFile: "https://...", fileName: "nota.pdf", caption: "..." }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const API_URL = process.env.GREEN_API_URL;
  const INSTANCE = process.env.GREEN_API_INSTANCE;
  const TOKEN = process.env.GREEN_API_TOKEN;

  if (!API_URL || !INSTANCE || !TOKEN) {
    return res.status(500).json({ error: 'Green API credentials not configured' });
  }

  // Basic auth: require Supabase JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action, chatId, message, urlFile, fileName, caption } = req.body as {
    action: string;
    chatId: string;
    message?: string;
    urlFile?: string;
    fileName?: string;
    caption?: string;
  };

  if (!action || !chatId) {
    return res.status(400).json({ error: 'Missing action or chatId' });
  }

  try {
    let endpoint: string;
    let body: Record<string, unknown>;

    switch (action) {
      case 'sendMessage':
        endpoint = `${API_URL}/waInstance${INSTANCE}/sendMessage/${TOKEN}`;
        body = { chatId, message: message ?? '' };
        break;

      case 'sendFileByUrl':
        endpoint = `${API_URL}/waInstance${INSTANCE}/sendFileByUrl/${TOKEN}`;
        body = {
          chatId,
          urlFile: urlFile ?? '',
          fileName: fileName ?? 'archivo.pdf',
          caption: caption ?? '',
        };
        break;

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Green API error', details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Green API request failed', details: (err as Error).message });
  }
}
