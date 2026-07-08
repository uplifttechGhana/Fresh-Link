import { jsPDF } from 'jspdf';
import type { Order, Invoice } from './hooks/useOrders';

export interface InvoiceDocument {
  invoiceNumber: string;
  invoiceDate: string;
  buyerName: string;
  buyerAddress: string;
  farmerName: string;
  paymentMethod: string;
  paymentStatus: string;
  items: { title: string; quantity: number; total: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderId: string;
}

export type ShareChannel = 'email' | 'whatsapp' | 'sms' | 'copy';

export function buildInvoiceDocument(
  order: Order,
  invoice: Invoice | undefined,
  buyerName: string,
): InvoiceDocument {
  const deliveryFee = order.deliveryFee ?? 15;
  const subtotal = order.subtotal;
  const total = subtotal + deliveryFee;

  return {
    invoiceNumber: invoice?.number ?? `INV-${order.id.slice(0, 8).toUpperCase()}`,
    invoiceDate: invoice
      ? new Date(invoice.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : new Date(order.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
    buyerName,
    buyerAddress: order.deliveryAddress,
    farmerName: order.farmer?.user?.name ?? 'Farmer',
    paymentMethod: order.notes?.match(/Payment: (.+)/)?.[1] ?? 'Mobile Money',
    paymentStatus: order.paymentStatus === 'success' ? 'PAID' : order.paymentStatus.toUpperCase(),
    items: order.items.map((item) => ({
      title: item.produce.title,
      quantity: item.quantity,
      total: item.total,
    })),
    subtotal,
    deliveryFee,
    total,
    orderId: order.id,
  };
}

function formatMoney(amount: number) {
  return `GHS ${amount.toFixed(2)}`;
}

export function invoiceToPlainText(doc: InvoiceDocument): string {
  const lines = [
    'FreshLink Invoice',
    doc.invoiceNumber,
    doc.invoiceDate,
    '',
    `Status: ${doc.paymentStatus}`,
    '',
    `Billed to: ${doc.buyerName}`,
    doc.buyerAddress,
    '',
    `From: ${doc.farmerName}`,
    '',
    'Items',
    ...doc.items.map((i) => `  ${i.title} x${i.quantity} — ${formatMoney(i.total)}`),
    '',
    `Subtotal: ${formatMoney(doc.subtotal)}`,
    `Delivery: ${formatMoney(doc.deliveryFee)}`,
    `Total: ${formatMoney(doc.total)}`,
    '',
    `Payment: ${doc.paymentMethod}`,
    '',
    'Thank you for shopping with FreshLink Ghana.',
  ];
  return lines.join('\n');
}

function invoicePdfFilename(doc: InvoiceDocument) {
  return `FreshLink-${doc.invoiceNumber.replace(/\s+/g, '-')}.pdf`;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Build a printable PDF invoice and return as Blob. */
export function generateInvoicePdf(doc: InvoiceDocument): Blob {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 22;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      pdf.addPage();
      y = 22;
    }
  };

  const write = (
    text: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; align?: 'left' | 'right' } = {},
  ) => {
    const { size = 10, bold = false, color = [22, 32, 26], align = 'left' } = opts;
    pdf.setFontSize(size);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, contentW) as string[];
    const lineH = size * 0.42;
    ensureSpace(lines.length * lineH + 2);
    const x = align === 'right' ? pageW - margin : margin;
    pdf.text(lines, x, y, { align });
    y += lines.length * lineH + 2;
  };

  const row = (left: string, right: string, bold = false) => {
    ensureSpace(8);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setTextColor(22, 32, 26);
    pdf.text(left, margin, y);
    pdf.text(right, pageW - margin, y, { align: 'right' });
    y += 7;
  };

  // Header
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(21, 128, 61);
  pdf.text('FreshLink', margin, y);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(21, 128, 61);
  pdf.text(doc.paymentStatus, pageW - margin, y - 2, { align: 'right' });
  y += 10;

  write(doc.invoiceNumber, { size: 9, color: [107, 119, 112] });
  write(doc.invoiceDate, { size: 9, color: [107, 119, 112] });
  y += 4;

  write('Billed To', { size: 8, bold: true, color: [107, 119, 112] });
  write(doc.buyerName, { bold: true });
  write(doc.buyerAddress, { size: 9, color: [107, 119, 112] });
  y += 2;

  write('From', { size: 8, bold: true, color: [107, 119, 112] });
  write(doc.farmerName, { bold: true });
  y += 6;

  ensureSpace(12);
  pdf.setDrawColor(230, 230, 230);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  row('Description', 'Amount', true);
  ensureSpace(4);
  pdf.line(margin, y - 3, pageW - margin, y - 3);
  y += 2;

  for (const item of doc.items) {
    row(`${item.title} x${item.quantity}`, formatMoney(item.total));
  }

  y += 4;
  ensureSpace(4);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  row('Subtotal', formatMoney(doc.subtotal));
  row('Delivery Fee', formatMoney(doc.deliveryFee));
  y += 2;
  row('Total', formatMoney(doc.total), true);

  y += 8;
  write('Payment Method', { size: 8, bold: true, color: [107, 119, 112] });
  write(doc.paymentMethod);

  y += 6;
  write('Thank you for shopping with FreshLink Ghana.', { size: 9, color: [107, 119, 112] });

  return pdf.output('blob');
}

export function invoicePdfFile(doc: InvoiceDocument): File {
  const blob = generateInvoicePdf(doc);
  return new File([blob], invoicePdfFilename(doc), { type: 'application/pdf' });
}

/** Download invoice as PDF. */
export function downloadInvoicePdf(doc: InvoiceDocument) {
  const blob = generateInvoicePdf(doc);
  triggerBlobDownload(blob, invoicePdfFilename(doc));
}

function openShareEmail(doc: InvoiceDocument) {
  const subject = encodeURIComponent(`FreshLink Invoice ${doc.invoiceNumber}`);
  const body = encodeURIComponent(invoiceToPlainText(doc));
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function openShareWhatsApp(doc: InvoiceDocument) {
  const text = encodeURIComponent(invoiceToPlainText(doc));
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
}

function openShareSms(doc: InvoiceDocument) {
  const body = encodeURIComponent(invoiceToPlainText(doc));
  window.location.href = `sms:?body=${body}`;
}

export async function copyInvoiceText(doc: InvoiceDocument) {
  await navigator.clipboard.writeText(invoiceToPlainText(doc));
}

const CHANNEL_LABELS: Record<Exclude<ShareChannel, 'copy'>, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  sms: 'Messages',
};

/**
 * Generate PDF and share with file attachment via the system share sheet.
 * On mobile this attaches the PDF when the user picks Email, WhatsApp, etc.
 */
export async function shareInvoicePdf(
  doc: InvoiceDocument,
  channel: Exclude<ShareChannel, 'copy'>,
): Promise<'shared' | 'downloaded'> {
  const file = invoicePdfFile(doc);
  const text = invoiceToPlainText(doc);
  const title = `FreshLink ${doc.invoiceNumber}`;

  if (navigator.share) {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, files: [file] });
        return 'shared';
      }
      await navigator.share({ title, text });
      downloadInvoicePdf(doc);
      return 'downloaded';
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
    }
  }

  downloadInvoicePdf(doc);
  if (channel === 'email') openShareEmail(doc);
  else if (channel === 'whatsapp') openShareWhatsApp(doc);
  else if (channel === 'sms') openShareSms(doc);
  return 'downloaded';
}

export async function shareViaChannel(
  doc: InvoiceDocument,
  channel: ShareChannel,
): Promise<'copied' | 'shared' | 'downloaded'> {
  if (channel === 'copy') {
    await copyInvoiceText(doc);
    return 'copied';
  }
  return shareInvoicePdf(doc, channel);
}

export function shareChannelLabel(channel: ShareChannel) {
  if (channel === 'copy') return 'clipboard';
  return CHANNEL_LABELS[channel];
}
