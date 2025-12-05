'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Mail, ArrowRight, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api';

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  total: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#c4a35a', '#1a1a1a', '#ffffff'],
    });

    // Fetch order details
    const fetchOrder = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/orders/by-session/${sessionId}`);
        setOrder(res.data.order);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [sessionId]);

  const copyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-pearl flex items-center justify-center py-16 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full bg-white border border-primary-200 p-8 md:p-12 text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
        >
          <CheckCircle className="w-10 h-10 text-green-600" />
        </motion.div>

        <h1 className="font-display text-3xl md:text-4xl mb-4">Thank You!</h1>
        <p className="text-primary-600 mb-8">
          Your order has been placed successfully. 
          We'll send you a confirmation email shortly.
        </p>

        {order && (
          <div className="bg-primary-50 p-6 mb-8 text-left">
            {/* Order Number */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-primary-200">
              <div>
                <p className="text-sm text-primary-500">Order Number</p>
                <p className="font-bold text-lg">{order.orderNumber}</p>
              </div>
              <button
                onClick={copyOrderNumber}
                className="p-2 hover:bg-primary-100 rounded transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-primary-500" />
                )}
              </button>
            </div>

            {/* Order Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-500">Status</span>
                <span className="font-medium capitalize">{order.status.toLowerCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-500">Items</span>
                <span className="font-medium">{order.items.length}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary-200 mt-2">
                <span>Total</span>
                <span>₪{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3 text-left">
            <Mail className="w-5 h-5 text-gold-600 mt-0.5" />
            <div>
              <p className="font-medium">Confirmation Email</p>
              <p className="text-sm text-primary-500">
                Check your inbox for order details and tracking info
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-left">
            <Package className="w-5 h-5 text-gold-600 mt-0.5" />
            <div>
              <p className="font-medium">Shipping</p>
              <p className="text-sm text-primary-500">
                Your order will be shipped within 1-2 business days
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {order && (
            <Link 
              href={`/account/orders/${order.id}`}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              View Order
            </Link>
          )}
          <Link 
            href="/products" 
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxury-pearl flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
