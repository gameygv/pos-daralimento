import html2canvas from 'html2canvas';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

interface NotaInfo {
  folio: number;
  folio_display: string;
  cliente: string;
  total: number;
  pagado: number;
  fecha: string;
  hora: string;
  vendedor: string | null;
  metodo_pago: string;
  entrega_status: string;
  pago_status: string;
  notas_pago: string | null;
}

interface NotaItem {
  art: string;
  can: number;
  prec: number;
  descue: number;
}

/**
 * Render a nota ticket as a PNG image, upload to Supabase storage,
 * and return the public URL. Returns null on failure.
 */
export async function renderTicketImage(
  nota: NotaInfo,
  items: NotaItem[],
  entregaUrl: string,
): Promise<string | null> {
  try {
    // Fetch config
    const { data: config } = (await supabase
      .from('pvcntl' as never)
      .select('empresa, logoemp, lin1, lin2, lin3, lin4, lin5, lin6, lin7')
      .maybeSingle()) as unknown as {
      data: { empresa: string; logoemp: string | null; lin1: string; lin2: string; lin3: string; lin4: string; lin5: string; lin6: string; lin7: string } | null;
    };

    const empresa = config?.empresa || 'DAR Alimento';
    const headerLines = [config?.lin1, config?.lin2, config?.lin3].filter(Boolean);
    const footerLines = [config?.lin4, config?.lin5, config?.lin6, config?.lin7].filter(Boolean);
    const folio = nota.folio_display || String(nota.folio);
    const saldo = nota.total - nota.pagado;

    // Generate QR as inline SVG string
    const qrSvg = renderToStaticMarkup(createElement(QRCodeSVG, { value: entregaUrl, size: 120, level: 'M' }));

    // Build ticket HTML
    const ticketHtml = `
      <div style="width:320px;padding:24px;font-family:Arial,sans-serif;background:#fff;color:#000">
        <div style="text-align:center;margin-bottom:12px">
          ${config?.logoemp ? `<img src="${config.logoemp}" style="height:48px;margin:0 auto 8px;display:block" crossorigin="anonymous"/>` : ''}
          <div style="font-size:18px;font-weight:bold">${escapeHtml(empresa)}</div>
          ${headerLines.map((l) => `<div style="font-size:10px;color:#888">${escapeHtml(l as string)}</div>`).join('')}
        </div>
        <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
        <div style="font-size:12px">
          <div style="display:flex;justify-content:space-between"><span style="font-weight:bold;font-size:14px">Nota: #${escapeHtml(folio)}</span></div>
          <div style="display:flex;justify-content:space-between"><span>Fecha:</span><span>${escapeHtml(nota.fecha)} ${escapeHtml(nota.hora)}</span></div>
          <div style="display:flex;justify-content:space-between"><span>Cliente:</span><span style="font-weight:600">${escapeHtml(nota.cliente)}</span></div>
          ${nota.vendedor ? `<div style="display:flex;justify-content:space-between"><span>Vendedor:</span><span>${escapeHtml(nota.vendedor)}</span></div>` : ''}
        </div>
        <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
        ${items.length > 0 ? `
          <div style="font-size:11px">
            ${items.map((i) => `<div style="display:flex;justify-content:space-between"><span>${i.can} x ${escapeHtml(i.art)}</span><span style="font-weight:500;margin-left:8px;white-space:nowrap">${formatPrice((i.prec - i.descue) * i.can)}</span></div>`).join('')}
          </div>
        ` : '<div style="font-size:11px;color:#aaa;text-align:center;padding:4px 0">Nota importada</div>'}
        <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
        <div style="font-size:12px">
          <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold"><span>TOTAL</span><span>${formatPrice(nota.total)}</span></div>
          <div style="display:flex;justify-content:space-between"><span>Forma de pago:</span><span style="text-transform:capitalize">${escapeHtml(nota.metodo_pago)}</span></div>
          ${saldo > 0.01 ? `<div style="display:flex;justify-content:space-between;font-weight:bold;color:#dc2626"><span>SALDO PENDIENTE:</span><span>${formatPrice(saldo)}</span></div>` : ''}
        </div>
        <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
        <div style="display:flex;justify-content:center;gap:8px;margin:8px 0">
          <span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;${nota.pago_status === 'pagado' ? 'background:#dcfce7;color:#166534' : 'background:#fef3c7;color:#92400e'}">${nota.pago_status === 'pagado' ? '✓ Pagado' : 'Pago pendiente'}</span>
          <span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;${nota.entrega_status === 'entregado' ? 'background:#dbeafe;color:#1e40af' : 'background:#fee2e2;color:#991b1b'}">${nota.entrega_status === 'entregado' ? '✓ Entregado' : 'Sin entregar'}</span>
        </div>
        <div style="text-align:center;margin:12px 0">
          ${qrSvg}
          <div style="font-size:9px;color:#aaa;margin-top:4px">Escanea para confirmar entrega</div>
        </div>
        ${footerLines.length > 0 ? `
          <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
          <div style="text-align:center">${footerLines.map((l) => `<div style="font-size:10px;color:#888">${escapeHtml(l as string)}</div>`).join('')}</div>
        ` : ''}
        <div style="text-align:center;font-size:8px;color:#ccc;margin-top:8px">pos.daralimento.com</div>
      </div>
    `;

    // Render in hidden container
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
    container.innerHTML = ticketHtml;
    document.body.appendChild(container);

    // Capture with html2canvas
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    document.body.removeChild(container);

    // Convert to blob
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;

    // Upload to Supabase storage
    const fileName = `tickets/nota-${folio}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, blob, { contentType: 'image/png', upsert: true });
    if (uploadError) {
      console.warn('Upload error:', uploadError.message);
      return null;
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return publicUrl.publicUrl;
  } catch (err) {
    console.warn('renderTicketImage error:', (err as Error).message);
    return null;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
