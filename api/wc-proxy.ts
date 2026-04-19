import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless proxy to WooCommerce REST API.
 * Keeps WC credentials server-side only.
 *
 * Usage from frontend:
 *   fetch('/api/wc-proxy?path=/products&per_page=100')
 *   fetch('/api/wc-proxy?path=/products/123', { method: 'PUT', body: JSON.stringify({ stock_quantity: 5 }) })
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const WC_URL = process.env.WC_URL;
  const WC_KEY = process.env.WC_CONSUMER_KEY;
  const WC_SECRET = process.env.WC_CONSUMER_SECRET;

  if (!WC_URL || !WC_KEY || !WC_SECRET) {
    return res.status(500).json({ error: 'WooCommerce credentials not configured' });
  }

  // Basic auth check: require Supabase JWT in Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const wcPath = req.query.path as string;
  if (!wcPath) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  // Build WC API URL with query params
  const url = new URL(`/wp-json/wc/v3${wcPath}`, WC_URL);
  url.searchParams.set('consumer_key', WC_KEY);
  url.searchParams.set('consumer_secret', WC_SECRET);

  // Forward additional query params (except path)
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path' && typeof value === 'string') {
      url.searchParams.set(key, value);
    }
  }

  try {
    const fetchOptions: RequestInit = {
      method: req.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const wcRes = await fetch(url.toString(), fetchOptions);
    const data = await wcRes.json();

    // Forward WC pagination headers
    const totalPages = wcRes.headers.get('x-wp-totalpages');
    const total = wcRes.headers.get('x-wp-total');
    if (totalPages) res.setHeader('x-wp-totalpages', totalPages);
    if (total) res.setHeader('x-wp-total', total);

    return res.status(wcRes.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'WooCommerce API error', details: (err as Error).message });
  }
}
