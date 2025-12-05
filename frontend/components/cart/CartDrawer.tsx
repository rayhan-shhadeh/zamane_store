'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, itemCount, subtotal, removeItem, updateQuantity } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <h2 className="font-display text-lg">Your Cart</h2>
                <span className="text-sm text-primary-500">({itemCount} items)</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-primary-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <ShoppingBag className="w-16 h-16 text-primary-200 mb-4" />
                  <h3 className="font-display text-xl mb-2">Your cart is empty</h3>
                  <p className="text-primary-500 mb-6">
                    Looks like you haven't added anything yet.
                  </p>
                  <button onClick={onClose} className="btn-primary">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantId || ''}`}
                      className="flex gap-4 pb-4 border-b border-primary-100 last:border-0"
                    >
                      {/* Image */}
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={onClose}
                        className="relative w-20 h-20 bg-primary-100 flex-shrink-0"
                      >
                        <Image
                          src={item.image || '/placeholder-product.jpg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={onClose}
                          className="font-medium text-sm line-clamp-2 hover:text-gold-600 transition-colors"
                        >
                          {item.name}
                        </Link>
                        {item.variant && (
                          <p className="text-xs text-primary-500 mt-0.5">
                            {item.variant.name}
                          </p>
                        )}
                        <p className="font-semibold mt-1">
                          ₪{(item.price * item.quantity).toFixed(2)}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-primary-200">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity - 1,
                                  item.variantId
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="p-1.5 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity + 1,
                                  item.variantId
                                )
                              }
                              className="p-1.5 hover:bg-primary-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-primary-100 p-4 space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between text-lg">
                  <span>Subtotal</span>
                  <span className="font-semibold">₪{subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-primary-500">
                  Shipping and taxes calculated at checkout
                </p>

                {/* Buttons */}
                <div className="space-y-2">
                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="btn-primary w-full"
                  >
                    Checkout
                  </Link>
                  <Link
                    href="/cart"
                    onClick={onClose}
                    className="btn-secondary w-full"
                  >
                    View Cart
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
