import { jsPDF } from 'jspdf';

export type TicketTemplate = 'standard' | 'detailed' | 'courtesy';

export interface TicketConfig {
  empresa: string;
  logoemp: string | null;
  lines: string[];
  footerLines: string[];
}

export interface FullTicketData {
  folio: number;
  folioDisplay?: string;
  fecha: string;
  hora: string;
  cliente: string;
  items: {
    cantidad: number;
    descrip: string;
    precio: number;
    note?: string;
    discountPct?: number;
  }[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  metodo_pago?: string;
  vendedor?: string;
}

const getBase64ImageFromURL = (url: string): Promise<{ dataURL: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve({ dataURL: canvas.toDataURL('image/png'), width: img.width, height: img.height });
    };
    img.onerror = reject;
  });
};

async function printHeader(doc: jsPDF, config: TicketConfig): Promise<number> {
  let y = 7;

  if (config.logoemp) {
    try {
      const { dataURL, width, height } = await getBase64ImageFromURL(config.logoemp);
      const maxW = 25;
      const imgH = (height * maxW) / width;
      doc.addImage(dataURL, 'PNG', (58 - maxW) / 2, y, maxW, imgH);
      y += imgH + 2;
    } catch {
      // skip logo
    }
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(config.empresa.substring(0, 25), 29, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  for (const line of config.lines) {
    doc.text(line.substring(0, 35), 29, y, { align: 'center' });
    y += 3;
  }
  return y;
}

function printTicketInfo(doc: jsPDF, data: FullTicketData, y: number): number {
  doc.setFontSize(7);
  y += 3;
  doc.text(`TICKET: #${data.folioDisplay || data.folio}`, 3, y);
  doc.text(`FECHA: ${data.fecha}`, 55, y, { align: 'right' });
  y += 3;
  doc.text(`HORA: ${data.hora}`, 55, y, { align: 'right' });
  y += 3;
  doc.text(`CLIENTE: ${(data.cliente || 'Mostrador').substring(0, 25)}`, 3, y);
  y += 3;
  if (data.vendedor) {
    doc.text(`VENDEDOR: ${data.vendedor.substring(0, 25)}`, 3, y);
    y += 3;
  }
  if (data.metodo_pago) {
    doc.text(`PAGO: ${data.metodo_pago.toUpperCase()}`, 3, y);
    y += 3;
  }
  return y;
}

function printFooter(doc: jsPDF, config: TicketConfig, y: number): number {
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  for (const line of config.footerLines) {
    doc.text(line.substring(0, 40), 29, y, { align: 'center' });
    y += 3;
  }
  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.text('Gracias por su compra', 29, y, { align: 'center' });
  return y;
}

function dash(doc: jsPDF, y: number): number {
  doc.setLineDashPattern([0.5, 0.5], 0);
  doc.line(3, y, 55, y);
  return y;
}

/** Standard template — compact, current behavior */
function renderStandard(doc: jsPDF, data: FullTicketData, y: number): number {
  y += 2;
  dash(doc, y);
  y += 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CANT', 3, y);
  doc.text('DESCRIPCION', 9, y);
  doc.text('IMPORTE', 55, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 1;
  dash(doc, y);

  for (const item of data.items) {
    y += 4;
    doc.text(`${item.cantidad}`, 5, y, { align: 'center' });
    doc.text(item.descrip.substring(0, 18), 9, y);
    doc.text(`${(item.cantidad * item.precio).toFixed(2)}`, 55, y, { align: 'right' });
  }

  y += 4;
  dash(doc, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 38, y, { align: 'right' });
  doc.text(`$${data.total.toFixed(2)}`, 55, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  return y + 8;
}

/** Detailed template — shows subtotal, discount, shipping, IVA, notes */
function renderDetailed(doc: jsPDF, data: FullTicketData, y: number): number {
  y += 2;
  dash(doc, y);
  y += 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CANT', 3, y);
  doc.text('DESCRIPCION', 9, y);
  doc.text('IMPORTE', 55, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 1;
  dash(doc, y);

  for (const item of data.items) {
    y += 4;
    doc.text(`${item.cantidad}`, 5, y, { align: 'center' });
    doc.text(item.descrip.substring(0, 18), 9, y);
    doc.text(`${(item.cantidad * item.precio).toFixed(2)}`, 55, y, { align: 'right' });
    if (item.discountPct && item.discountPct > 0) {
      y += 3;
      doc.setFontSize(6);
      doc.text(`  Desc: -${item.discountPct}%`, 9, y);
      doc.setFontSize(7);
    }
    if (item.note) {
      y += 3;
      doc.setFontSize(6);
      doc.text(`  Nota: ${item.note.substring(0, 25)}`, 9, y);
      doc.setFontSize(7);
    }
  }

  y += 4;
  dash(doc, y);
  y += 4;
  doc.setFontSize(7);
  doc.text('Subtotal:', 38, y, { align: 'right' });
  doc.text(`$${data.subtotal.toFixed(2)}`, 55, y, { align: 'right' });
  if (data.discount > 0) {
    y += 3;
    doc.text('Descuento:', 38, y, { align: 'right' });
    doc.text(`-$${data.discount.toFixed(2)}`, 55, y, { align: 'right' });
  }
  if (data.shipping > 0) {
    y += 3;
    doc.text('Envio:', 38, y, { align: 'right' });
    doc.text(`+$${data.shipping.toFixed(2)}`, 55, y, { align: 'right' });
  }
  y += 3;
  doc.text('IVA:', 38, y, { align: 'right' });
  doc.text(`$${data.tax.toFixed(2)}`, 55, y, { align: 'right' });
  y += 4;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 38, y, { align: 'right' });
  doc.text(`$${data.total.toFixed(2)}`, 55, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  return y + 8;
}

/** Courtesy template — no prices */
function renderCourtesy(doc: jsPDF, data: FullTicketData, y: number): number {
  y += 2;
  dash(doc, y);
  y += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTA DE CORTESIA', 29, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  y += 1;
  dash(doc, y);

  for (const item of data.items) {
    y += 4;
    doc.text(`${item.cantidad}x`, 5, y, { align: 'center' });
    doc.text(item.descrip.substring(0, 30), 9, y);
    if (item.note) {
      y += 3;
      doc.setFontSize(6);
      doc.text(`  ${item.note.substring(0, 30)}`, 9, y);
      doc.setFontSize(7);
    }
  }

  y += 4;
  dash(doc, y);
  return y + 8;
}

export async function printTicketWithTemplate(
  data: FullTicketData,
  config: TicketConfig,
  template: TicketTemplate = 'standard',
) {
  const extraHeight = template === 'detailed' ? 40 : 0;
  const doc = new jsPDF({
    unit: 'mm',
    format: [58, 150 + data.items.length * 10 + extraHeight],
  });

  let y = await printHeader(doc, config);
  y = printTicketInfo(doc, data, y);

  switch (template) {
    case 'detailed':
      y = renderDetailed(doc, data, y);
      break;
    case 'courtesy':
      y = renderCourtesy(doc, data, y);
      break;
    default:
      y = renderStandard(doc, data, y);
      break;
  }

  y = printFooter(doc, config, y);

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
