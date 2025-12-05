"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt?: string }[];
  category?: { name: string; slug: string };
  averageRating?: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCartStore();

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "",
      slug: product.slug,
      quantity: 1,
    });
    toast.success("Added to cart");
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <div
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-primary-100">
          <Image
            src={product.images[0]?.url || "/placeholder-product.jpg"}
            alt={product.images[0]?.alt || product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && <span className="badge-sale">-{discount}%</span>}
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute top-3 right-3 flex flex-col gap-2"
          >
            <button
              onClick={handleWishlist}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isWishlisted
                  ? "bg-red-500 text-white"
                  : "bg-white text-luxury-black hover:bg-gold-500 hover:text-white"
              }`}
              aria-label="Add to wishlist"
            >
              <Heart
                className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`}
              />
            </button>
            <Link
              href={`/products/${product.slug}`}
              className="w-9 h-9 rounded-full bg-white text-luxury-black flex items-center justify-center hover:bg-gold-500 hover:text-white transition-colors"
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Add to Cart Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            className="absolute bottom-0 left-0 right-0 p-3"
          >
            <button
              onClick={handleAddToCart}
              className="w-full bg-luxury-black text-white py-3 flex items-center justify-center gap-2 hover:bg-gold-500 transition-colors text-sm font-medium"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Cart
            </button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="pt-4 space-y-1">
          {product.category && (
            <p className="text-xs text-primary-500 uppercase tracking-wider">
              {product.category.name}
            </p>
          )}
          <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-gold-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              ₪{Number(product.price).toFixed(2)}
            </span>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="text-sm text-primary-400 line-through">
                  ₪{Number(product.compareAtPrice).toFixed(2)}
                </span>
              )}
          </div>
        </div>
      </div>
    </Link>
  );
}
