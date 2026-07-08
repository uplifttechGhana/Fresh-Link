import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import {
  Download,
  Share2,
  Loader2,
  Mail,
  MessageCircle,
  Smartphone,
  Copy,
} from 'lucide-react';
import { useOrder, useOrderInvoice } from '../../lib/hooks/useOrders';
import { useAuthStore } from '../../lib/authStore';
import {
  buildInvoiceDocument,
  downloadInvoicePdf,
  shareViaChannel,
  shareChannelLabel,
  type ShareChannel,
} from '../../lib/invoiceUtils';

const SHARE_OPTIONS: {
  id: ShareChannel;
  label: string;
  description: string;
  icon: typeof Mail;
  color: string;
}[] = [
  {
    id: 'email',
    label: 'Email',
    description: 'Share PDF via Gmail, Mail, etc.',
    icon: Mail,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'Share PDF via WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-50 text-green-600',
  },
  {
    id: 'sms',
    label: 'Messages',
    description: 'Share PDF via SMS or iMessage',
    icon: Smartphone,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    id: 'copy',
    label: 'Copy Text',
    description: 'Copy invoice to clipboard',
    icon: Copy,
    color: 'bg-gray-100 text-gray-600',
  },
];

export function Invoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState<'share' | 'download' | ShareChannel | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: order, isLoading: loadingOrder } = useOrder(id);
  const { data: invoice, isLoading: loadingInvoice } = useOrderInvoice(id);

  if (loadingOrder || loadingInvoice) {
    return (
      <div className="w-full h-full bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full h-full bg-cream flex flex-col items-center justify-center px-6">
        <p className="text-muted font-medium">Order not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-green font-bold">Go Back</button>
      </div>
    );
  }

  const doc = buildInvoiceDocument(order, invoice, user?.name ?? 'Buyer');
  const grandTotal = doc.subtotal + doc.deliveryFee;

  const handleDownload = async () => {
    setBusy('download');
    try {
      downloadInvoicePdf(doc);
      toast.success('Invoice PDF downloaded');
    } catch {
      toast.error('Could not download invoice');
    } finally {
      setBusy(null);
    }
  };

  const handleShareChannel = async (channel: ShareChannel) => {
    setBusy(channel);
    try {
      const result = await shareViaChannel(doc, channel);
      if (result === 'copied') {
        toast.success('Invoice copied to clipboard');
        setShareOpen(false);
      } else if (result === 'shared') {
        toast.success(`PDF attached — pick ${shareChannelLabel(channel)} from the share menu`);
        setShareOpen(false);
      } else {
        toast.success(`PDF downloaded — attach it in ${shareChannelLabel(channel)}`);
        setShareOpen(false);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Could not share invoice');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Invoice" showBack />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-24">
        <Card className="p-6 bg-white" id="invoice-document">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-display font-extrabold text-green text-xl">
                FreshLink
              </h2>
              <p className="text-xs text-muted mt-1">{doc.invoiceNumber}</p>
              <p className="text-xs text-muted">{doc.invoiceDate}</p>
            </div>
            <div className="px-3 py-1 bg-green-50 text-green text-xs font-bold rounded-full">
              {doc.paymentStatus}
            </div>
          </div>

          <div className="flex justify-between mb-8">
            <div>
              <h4 className="text-xs font-bold text-muted mb-1">Billed To:</h4>
              <p className="text-sm font-bold text-ink">{doc.buyerName}</p>
              <p className="text-xs text-muted">{doc.buyerAddress}</p>
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-muted mb-1">From:</h4>
              <p className="text-sm font-bold text-ink">{doc.farmerName}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-xs font-bold text-muted border-b border-gray-100 pb-2 mb-3">
              <span>Description</span>
              <span>Amount</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-ink mb-3">
                <span className="pr-4">{item.produce.title} × {item.quantity}</span>
                <span className="font-medium whitespace-nowrap">₵{item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium text-ink">₵{doc.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Delivery Fee</span>
              <span className="font-medium text-ink">₵{doc.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100 mt-2">
              <span className="text-ink">Total</span>
              <span className="text-green">₵{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-muted mb-1">Payment Method</h4>
            <p className="text-sm font-medium text-ink">{doc.paymentMethod}</p>
          </div>
        </Card>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-6 bg-cream/80 backdrop-blur-md">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShareOpen(true)}
            disabled={!!busy}
          >
            <Share2 size={20} className="mr-2" />
            Share
          </Button>
          <Button className="flex-1" onClick={handleDownload} disabled={!!busy}>
            {busy === 'download' ? (
              <Loader2 size={20} className="mr-2 animate-spin" />
            ) : (
              <Download size={20} className="mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      <Sheet open={shareOpen} onClose={() => !busy && setShareOpen(false)} title="Share Invoice">
        <p className="text-sm text-muted mb-4">
          A PDF is generated automatically. On phone, pick your app and the file will be attached.
        </p>
        <div className="space-y-2">
          {SHARE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isLoading = busy === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={!!busy}
                onClick={() => handleShareChannel(option.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${option.color}`}>
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-bold text-ink text-sm">{option.label}</p>
                  <p className="text-xs text-muted truncate">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
