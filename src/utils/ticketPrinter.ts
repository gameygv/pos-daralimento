import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";

const getBase64ImageFromURL = (url: string): Promise<{ dataURL: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve({ dataURL, width: img.width, height: img.height });
    };
    img.onerror = (error) => reject(error);
  });
};

interface TicketItem {
  cantidad: number;
  descrip: string;
  precio: number;
}

interface TicketData {
  folio: number;
  folioDisplay?: string;
  fecha: string;
  hora: string;
  cliente: string;
  items: TicketItem[];
  total: number;
  metodo_pago?: string;
  vendedor?: string;
}

export type { TicketData, TicketItem };

export const printTicket = async (ticketData: TicketData) => {
  try {
    const { data: config } = (await supabase
      .from('pvcntl' as never)
      .select('*')
      .single()) as unknown as { data: Record<string, unknown> | null };

    const doc = new jsPDF({
      unit: "mm",
      format: [58, 150 + (ticketData.items.length * 8)]
    });

    let y = 7;

    if (config?.logoemp) {
      try {
        const { dataURL, width, height } = await getBase64ImageFromURL(config.logoemp as string);
        const maxWidth = 25;
        const imgHeight = (height * maxWidth) / width;
        const xOffset = (58 - maxWidth) / 2;
        doc.addImage(dataURL, 'PNG', xOffset, y, maxWidth, imgHeight);
        y += imgHeight + 2;
      } catch (error) {
        console.warn("Error al cargar el logo:", error);
      }
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(((config?.empresa as string) || "POS").substring(0, 25), 29, y, { align: "center" });
    y += 4;
    doc.setFont("helvetica", "normal");

    doc.setFontSize(7);
    [1, 2, 3].forEach(n => {
      const line = config?.[`lin${n}`];
      if (line) {
        doc.text(String(line).substring(0, 35), 29, y, { align: "center" });
        y += 3;
      }
    });

    y += 3;
    doc.text(`TICKET: #${ticketData.folioDisplay || ticketData.folio}`, 3, y);
    doc.text(`FECHA: ${ticketData.fecha}`, 55, y, { align: "right" });
    y += 3;
    doc.text(`HORA: ${ticketData.hora}`, 55, y, { align: "right" });
    y += 3;
    doc.text(`CLIENTE: ${(ticketData.cliente || "Mostrador").substring(0, 25)}`, 3, y);
    y += 3;
    if (ticketData.vendedor) {
      doc.text(`VENDEDOR: ${ticketData.vendedor.substring(0, 25)}`, 3, y);
      y += 3;
    }
    if (ticketData.metodo_pago) {
      doc.text(`PAGO: ${ticketData.metodo_pago.toUpperCase()}`, 3, y);
      y += 3;
    }

    y += 2;
    doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(3, y, 55, y);

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("CANT", 3, y);
    doc.text("DESCRIPCION", 9, y);
    doc.text("IMPORTE", 55, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 1;
    doc.line(3, y, 55, y);

    ticketData.items.forEach((item) => {
      y += 4;
      doc.text(`${item.cantidad}`, 5, y, { align: "center" });
      doc.text(`${(item.descrip || "").substring(0, 18)}`, 9, y);
      doc.text(`${(item.cantidad * item.precio).toFixed(2)}`, 55, y, { align: "right" });
    });

    y += 4;
    doc.line(3, y, 55, y);
    y += 5;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", 38, y, { align: "right" });
    doc.text(`$${ticketData.total.toFixed(2)}`, 55, y, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += 8;
    doc.setFontSize(7);
    [4, 5, 6, 7].forEach(n => {
      const line = config?.[`lin${n}`];
      if (line) {
        doc.text(String(line).substring(0, 40), 29, y, { align: "center" });
        y += 3;
      }
    });

    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Gracias por su compra", 29, y, { align: "center" });

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(e);
    throw new Error(`Error al generar ticket: ${message}`);
  }
};
