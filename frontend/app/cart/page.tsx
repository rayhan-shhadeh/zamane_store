"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Tag,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/stores/cartStore";

export default function CartPage() {
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart } =
    useCartStore();

  useEffect(() => {
    // Cart is loaded from store on component mount
  }, []);
  type Item = {
    price: number;
    compareAtPrice?: number;
  };
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      toast.error("Failed to update quantity");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const shippingCost = subtotal > 200 ? 0 : 25;
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-luxury-pearl flex items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-primary-400" />
          </div>
          <h1 className="font-display text-3xl mb-4">Your Cart is Empty</h1>
          <p className="text-primary-500 mb-8 max-w-md mx-auto">
            Looks like you haven't added anything to your cart yet. Start
            shopping to fill it up!
          </p>
          <Link href="/products" className="btn-primary">
            Continue Shopping
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-pearl">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-primary-200">
        <div className="container-custom py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-primary-500 hover:text-primary-900">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-primary-400" />
            <span className="text-primary-900 font-medium">Shopping Cart</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl">Shopping Cart</h1>
          <span className="text-primary-500">{itemCount} items</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white border border-primary-200 p-4 md:p-6"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <Link
                      href={`/products/${item.slug}`}
                      className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-primary-50"
                    >
                      <Image
                        src={
                          item.image ||
                          "https://placehold.co/200x200/f5f5f5/999?text=No+Image"
                        }
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-medium hover:text-gold-600 transition-colors line-clamp-2"
                      >
                        {item.name}
                      </Link>

                      {item.variant && (
                        <p className="text-sm text-primary-500 mt-1">
                          {item.variant.name}
                        </p>
                      )}

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-bold">
                          ₪{item.price.toFixed(2)}
                        </span>

                        {typeof item === "object" &&
                          item !== null &&
                          "compareAtPrice" in item &&
                          typeof item.compareAtPrice === "number" &&
                          typeof item.price === "number" &&
                          item.compareAtPrice > item.price && (
                            <span className="text-sm text-primary-400 line-through">
                              ₪{item.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                      </div>

                      {/* Stock Warning */}
                      {"inStock" in item && !item.inStock && (
                        <div className="flex items-center gap-1 text-red-500 text-sm mt-2">
                          <AlertCircle className="w-4 h-4" />
                          Out of stock
                        </div>
                      )}

                      {/* Mobile Actions */}
                      <div className="flex items-center justify-between mt-4 md:hidden">
                        {/* Quantity */}
                        <div className="flex items-center border border-primary-300">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                            className="p-2 hover:bg-primary-100 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-4 py-2 text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            className="p-2 hover:bg-primary-100 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-red-500 hover:text-red-600 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex flex-col items-end justify-between">
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-primary-400 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="flex items-center gap-4">
                        {/* Quantity */}
                        <div className="flex items-center border border-primary-300">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                            className="p-2 hover:bg-primary-100 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 font-medium min-w-[50px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            className="p-2 hover:bg-primary-100 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <span className="font-bold text-lg min-w-[80px] text-right">
                          ₪{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Continue Shopping */}
            <div className="flex justify-between items-center pt-4">
              <Link
                href="/products"
                className="text-sm font-medium text-primary-600 hover:text-primary-900 flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Continue Shopping
              </Link>

              <button
                onClick={() => {
                  clearCart();
                  toast.success("Cart cleared");
                }}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-primary-200 p-6 sticky top-24">
              <h2 className="font-display text-xl mb-6">Order Summary</h2>

              {/* Discount Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Discount Code
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="input-field pl-10 text-sm"
                    />
                  </div>
                  <button className="btn-secondary text-sm px-4">Apply</button>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-3 text-sm border-t border-primary-200 pt-6">
                <div className="flex justify-between">
                  <span className="text-primary-600">Subtotal</span>
                  <span className="font-medium">₪{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `₪${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-primary-500">
                    Free shipping on orders over ₪200
                  </p>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-primary-200 pt-3 mt-3">
                  <span>Total</span>
                  <span>₪{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Payment Methods */}
              <div className="mt-6 pt-6 border-t border-primary-200">
                <p className="text-xs text-primary-500 text-center mb-3">
                  Secure payment with
                </p>
                <div className="flex justify-center gap-2">
                  <div className="w-12 h-8 bg-primary-100 rounded flex items-center justify-center text-xs font-bold">
                    VISA
                  </div>
                  <div className="w-12 h-8 bg-primary-100 rounded flex items-center justify-center text-xs font-bold">
                    MC
                  </div>
                  <div className="w-12 h-8 bg-primary-100 rounded flex items-center justify-center text-xs font-bold">
                    AMEX
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
