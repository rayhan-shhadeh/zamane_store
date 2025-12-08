"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Lock,
  CreditCard,
  Truck,
  MapPin,
  User,
  Phone,
  Mail,
  ArrowRight,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

const checkoutSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(9, "Please enter a valid phone number"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, itemCount } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<{
    code: string;
    amount: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: "Palestine",
    },
  });

  useEffect(() => {
    if (user) {
      setValue("email", user.email);
      setValue("firstName", user.firstName);
      setValue("lastName", user.lastName);
      if (user.phone) setValue("phone", user.phone);
    }
  }, [user, setValue]);

  const shippingCost = subtotal > 200 ? 0 : 25;
  const discountAmount = discount?.amount || 0;
  const total = subtotal - discountAmount + shippingCost;

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    try {
      const res = await api.post("/orders/validate-discount", {
        code: discountCode,
      });
      setDiscount({
        code: discountCode.toUpperCase(),
        amount: res.data.discountAmount,
      });
      toast.success(
        `Discount applied: -₪${res.data.discountAmount.toFixed(2)}`
      );
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid discount code");
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await api.post("/orders/checkout", {
        email: data.email,
        phone: data.phone,
        shippingAddress: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          street: data.street,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
        },
        discountCode: discount?.code,
        notes: data.notes,
      });

      // Redirect to Stripe checkout
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(
        error.response?.data?.error || "Checkout failed. Please try again."
      );
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-luxury-pearl flex items-center justify-center py-16">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-4">Your Cart is Empty</h1>
          <p className="text-primary-500 mb-8">
            Add some items before checking out.
          </p>
          <Link href="/products" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
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
            <Link
              href="/cart"
              className="text-primary-500 hover:text-primary-900"
            >
              Cart
            </Link>
            <ChevronRight className="w-4 h-4 text-primary-400" />
            <span className="text-primary-900 font-medium">Checkout</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        <h1 className="font-display text-3xl mb-8">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-primary-200 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="font-display text-xl">Contact Information</h2>
                </div>

                {!isAuthenticated && (
                  <p className="text-sm text-primary-500 mb-4">
                    Already have an account?{" "}
                    <Link
                      href="/account/login?redirect=/checkout"
                      className="text-gold-600 hover:underline"
                    >
                      Log in
                    </Link>
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                      <input
                        type="email"
                        {...register("email")}
                        className={`input-field pl-10 ${
                          errors.email ? "border-red-500" : ""
                        }`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                      <input
                        type="tel"
                        {...register("phone")}
                        className={`input-field pl-10 ${
                          errors.phone ? "border-red-500" : ""
                        }`}
                        placeholder="059-XXX-XXXX"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Shipping Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-primary-200 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="font-display text-xl">Shipping Address</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      {...register("firstName")}
                      className={`input-field ${
                        errors.firstName ? "border-red-500" : ""
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      {...register("lastName")}
                      className={`input-field ${
                        errors.lastName ? "border-red-500" : ""
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      {...register("street")}
                      className={`input-field ${
                        errors.street ? "border-red-500" : ""
                      }`}
                      placeholder="Street name, building, apartment"
                    />
                    {errors.street && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.street.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      {...register("city")}
                      className={`input-field ${
                        errors.city ? "border-red-500" : ""
                      }`}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Country *
                    </label>
                    <select
                      {...register("country")}
                      className={`input-field ${
                        errors.country ? "border-red-500" : ""
                      }`}
                    >
                      <option value="Palestine">Palestine</option>
                      <option value="Israel">Israel</option>
                      <option value="Jordan">Jordan</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      {...register("notes")}
                      rows={3}
                      className="input-field resize-none"
                      placeholder="Any special instructions for delivery..."
                    />
                  </div>
                </div>
              </motion.div>

              {/* Shipping Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-primary-200 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="font-display text-xl">Shipping Method</h2>
                </div>

                <div className="space-y-3">
                  <label
                    className={`block p-4 border-2 cursor-pointer transition-colors ${
                      shippingCost === 0
                        ? "border-gold-500 bg-gold-50"
                        : "border-primary-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          defaultChecked
                          className="w-4 h-4 text-gold-600"
                        />
                        <div>
                          <p className="font-medium">Standard Delivery</p>
                          <p className="text-sm text-primary-500">
                            3-7 business days
                          </p>
                        </div>
                      </div>
                      <span className="font-medium">
                        {shippingCost === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          `₪${shippingCost}`
                        )}
                      </span>
                    </div>
                  </label>
                </div>

                {shippingCost > 0 && (
                  <p className="text-sm text-primary-500 mt-3">
                    Add ₪{(200 - subtotal).toFixed(2)} more to get free
                    shipping!
                  </p>
                )}
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-primary-200 p-6 sticky top-24">
                <h2 className="font-display text-xl mb-6">Order Summary</h2>

                {/* Items */}
                <div className="space-y-4 max-h-64 overflow-y-auto mb-6">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="relative w-16 h-16 bg-primary-50 flex-shrink-0">
                        <Image
                          src={item.image || "https://placehold.co/100x100"}
                          alt={item.name}
                          fill
                          className="object-contain"
                        />
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-900 text-white text-xs rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {item.name}
                        </p>
                        {item.variant && (
                          <p className="text-xs text-primary-500">
                            {item.variant.name}
                          </p>
                        )}
                      </div>
                      <span className="font-medium text-sm">
                        ₪{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

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
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        placeholder="Enter code"
                        className="input-field pl-10 text-sm"
                        disabled={!!discount}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      className="btn-secondary text-sm px-4"
                      disabled={!!discount}
                    >
                      {discount ? "Applied" : "Apply"}
                    </button>
                  </div>
                  {discount && (
                    <p className="text-sm text-green-600 mt-2">
                      Code "{discount.code}" applied!
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-3 text-sm border-t border-primary-200 pt-6">
                  <div className="flex justify-between">
                    <span className="text-primary-600">
                      Subtotal ({itemCount} items)
                    </span>
                    <span className="font-medium">₪{subtotal.toFixed(2)}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₪{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-primary-600">Shipping</span>
                    <span className="font-medium">
                      {shippingCost === 0
                        ? "Free"
                        : `₪${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-primary-200 pt-3 mt-3">
                    <span>Total</span>
                    <span>₪{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay ₪{total.toFixed(2)}
                    </>
                  )}
                </button>

                {/* Security Note */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-primary-500">
                  <Lock className="w-3 h-3" />
                  <span>Secure checkout powered by Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
