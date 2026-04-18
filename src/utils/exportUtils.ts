/**
 * Export utilities for generating CSV/Excel and PDF downloads from data tables.
 */

/** Export data as CSV (opens as Excel) */
export function exportToCSV(
  data: Record<string, unknown>[],
  columns: { key: string; label: string }[],
  filename: string,
) {
  if (data.length === 0) return;

  const header = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        const str = val == null ? '' : String(val);
        // Escape commas and quotes
        return str.includes(',') || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(','),
  );

  const csv = [header, ...rows].join('\n');
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel to detect encoding
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Export data as a printable PDF (via browser print dialog) */
export function exportToPDF(
  title: string,
  data: Record<string, unknown>[],
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center' }[],
  options?: { subtitle?: string; orientation?: 'portrait' | 'landscape' },
) {
  if (data.length === 0) return;

  const orientation = options?.orientation ?? 'portrait';
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const safeTitle = escapeHtml(title);
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      return val == null ? '' : escapeHtml(String(val));
    }),
  );

  printWindow.document.write(`
    <html>
    <head>
      <title>${safeTitle}</title>
      <style>
        @page { size: ${orientation}; margin: 15mm; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #333; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 12px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f4f6; padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 600; border-bottom: 2px solid #ddd; }
        td { padding: 5px 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #fafafa; }
        .right { text-align: right; }
        .center { text-align: center; }
        .footer { margin-top: 16px; font-size: 9px; color: #999; text-align: center; }
      </style>
    </head>
    <body>
      <h1>${safeTitle}</h1>
      ${options?.subtitle ? `<p class="subtitle">${escapeHtml(options.subtitle)}</p>` : ''}
      <table>
        <thead>
          <tr>
            ${columns.map((c) => `<th class="${c.align ?? 'left'}">${escapeHtml(c.label)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) =>
            `<tr>${row.map((val, i) => `<td class="${columns[i].align ?? 'left'}">${val}</td>`).join('')}</tr>`,
          ).join('')}
        </tbody>
      </table>
      <p class="footer">Generado: ${new Date().toLocaleString('es-MX')} | POS The Elephant Bowl</p>
      <script>window.print(); window.close();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
