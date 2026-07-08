import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopBar } from '../../components/ui/TopBar';
import { Card } from '../../components/ui/Card';
import { FileText, MessageCircle } from 'lucide-react';
import { useBuyerOrders, formatOrderStatus, orderStatusColor } from '../../lib/hooks/useOrders';
import { useStartConversation } from '../../lib/hooks/useChat';

export function OrderHistory() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useBuyerOrders();
  const startConv = useStartConversation();

  const openOrderChat = async (order: NonNullable<typeof orders>[number], e: React.MouseEvent) => {
    e.stopPropagation();
    const farmerId = order.farmer?.userId;
    if (!farmerId) return;
    try {
      const conv = await startConv.mutateAsync({ farmerId, orderId: order.id });
      navigate(`/buyer/chat/${conv.id}`);
    } catch {
      navigate('/buyer/messages');
    }
  };

  const items = orders ?? [];

  return (
    <div className="w-full h-full bg-cream flex flex-col">
      <TopBar title="Order History" showBack />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-10">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-4 animate-pulse h-28" />
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pt-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl mx-auto">
              📦
            </div>
            <h3 className="font-bold text-ink mb-2">No orders yet</h3>
            <p className="text-sm text-muted">Your order history will appear here</p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="space-y-4">
            {items.map((order, idx) =>
            <motion.div
              key={order.id}
              initial={{
                opacity: 0,
                y: 10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: idx * 0.05
              }}>
              
                <Card
                className="p-4"
                onClick={() => navigate(`/buyer/tracking/${order.id}`)}>
                
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-ink text-sm">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </h4>
                      <span className="text-xs text-muted">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${orderStatusColor(order.status)}`}>
                      {formatOrderStatus(order.status)}
                    </span>
                  </div>

                  <div className="py-3 border-y border-gray-100 mb-3">
                    <p className="text-sm text-ink font-medium line-clamp-1">
                      {order.items.map((i) => `${i.produce.title} ×${i.quantity}`).join(', ')}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      From: {order.farmer?.user?.name ?? 'Farmer'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-ink">
                      ₵{order.total.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => openOrderChat(order, e)}
                        disabled={startConv.isPending}
                        className="flex items-center gap-1 text-green text-xs font-bold disabled:opacity-50"
                      >
                        <MessageCircle size={14} />
                        Chat
                      </button>
                      <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/buyer/invoice/${order.id}`);
                    }}
                    className="flex items-center gap-1 text-green text-xs font-bold">
                    
                      <FileText size={14} />
                      Invoice
                    </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
          )}
          </div>
        )}
      </div>
    </div>);

}
