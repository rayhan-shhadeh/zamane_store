'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react';

export default function CheckoutCancelledPage() {
  return (
    <div className="min-h-screen bg-luxury-pearl flex items-center justify-center py-16 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white border border-primary-200 p-8 md:p-12 text-center"
      >
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="font-display text-3xl md:text-4xl mb-4">Payment Cancelled</h1>
        <p className="text-primary-600 mb-8">
          Your payment was cancelled and you have not been charged. 
          Your cart items are still saved if you'd like to try again.
        </p>

        {/* Reasons */}
        <div className="bg-primary-50 p-6 mb-8 text-left">
          <p className="font-medium mb-3">Common reasons for cancellation:</p>
          <ul className="space-y-2 text-sm text-primary-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-2" />
              Changed your mind about the purchase
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-2" />
              Payment method issue
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-2" />
              Browser or connection interrupted
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href="/cart"
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Cart
          </Link>
          <Link 
            href="/contact" 
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Support
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
