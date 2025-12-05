"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  Share2,
  Check,
  Minus,
  Plus,
  ChevronRight,
  Star,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";
import ProductCard from "@/components/products/ProductCard";

interface ProductImage {
  id: string;
  url: string;
  alt?: string;
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  quantity: number;
  options: Record<string, string>;
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  content?: string;
  isVerified: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string };
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  description: string;
  descriptionAr?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  quantity: number;
  allowBackorder: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews: Review[];
  category: { id: string; name: string; slug: string };
  averageRating: number;
  _count: { reviews: number };
}

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { addItem, isLoading: cartLoading } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        setProduct(res.data.product);
        setRelatedProducts(res.data.relatedProducts || []);

        if (res.data.product.variants?.length > 0) {
          setSelectedVariant(res.data.product.variants[0]);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addItem(product.id, selectedVariant?.id, quantity);
      toast.success("Added to cart!", {
        icon: "🛒",
        style: { background: "#1a1a1a", color: "#fff" },
      });
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  const currentPrice = selectedVariant
    ? selectedVariant.price
    : product?.price || 0;
  const inStock = selectedVariant
    ? selectedVariant.quantity > 0
    : (product?.quantity || 0) > 0 || product?.allowBackorder;

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-pearl">
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="aspect-square skeleton" />
            <div className="space-y-4">
              <div className="h-8 skeleton w-3/4" />
              <div className="h-6 skeleton w-1/4" />
              <div className="h-24 skeleton" />
              <div className="h-12 skeleton w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display mb-4">Product Not Found</h1>
          <Link href="/products" className="btn-primary">
            Back to Products
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
              href="/products"
              className="text-primary-500 hover:text-primary-900"
            >
              Products
            </Link>
            <ChevronRight className="w-4 h-4 text-primary-400" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-primary-500 hover:text-primary-900"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="w-4 h-4 text-primary-400" />
            <span className="text-primary-900 font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="container-custom py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div
              className="relative aspect-square bg-white overflow-hidden"
              layoutId="product-image"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={
                      product.images[selectedImage]?.url ||
                      "https://placehold.co/600x600/f5f5f5/999?text=No+Image"
                    }
                    alt={product.images[selectedImage]?.alt || product.name}
                    fill
                    className="object-contain"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Sale Badge */}
              {product.compareAtPrice &&
                product.compareAtPrice > product.price && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1">
                    SALE
                  </span>
                )}
            </motion.div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 flex-shrink-0 border-2 transition-colors ${
                      selectedImage === index
                        ? "border-gold-500"
                        : "border-transparent hover:border-primary-300"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="font-display text-3xl lg:text-4xl mb-2">
                {product.name}
              </h1>
              {product.nameAr && (
                <p className="text-primary-500 text-lg mb-4" dir="rtl">
                  {product.nameAr}
                </p>
              )}

              {/* Rating */}
              {product._count.reviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(product.averageRating)
                            ? "text-gold-500 fill-gold-500"
                            : "text-primary-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-primary-500">
                    ({product._count.reviews} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary-900">
                  ₪{Number(currentPrice).toFixed(2)}
                </span>
                {product.compareAtPrice &&
                  product.compareAtPrice > currentPrice && (
                    <>
                      <span className="text-xl text-primary-400 line-through">
                        ₪{Number(product.compareAtPrice).toFixed(2)}
                      </span>
                      <span className="text-sm font-medium text-red-500">
                        Save{" "}
                        {Math.round(
                          (1 - currentPrice / product.compareAtPrice) * 100
                        )}
                        %
                      </span>
                    </>
                  )}
              </div>
            </div>

            {/* Variants */}
            {product.variants.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Options
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.quantity === 0}
                      className={`px-4 py-2 border text-sm transition-all ${
                        selectedVariant?.id === variant.id
                          ? "border-gold-500 bg-gold-50 text-gold-700"
                          : variant.quantity === 0
                          ? "border-primary-200 text-primary-400 cursor-not-allowed"
                          : "border-primary-300 hover:border-primary-400"
                      }`}
                    >
                      {variant.name}
                      {variant.quantity === 0 && " (Out of Stock)"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-primary-300">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-primary-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 py-3 font-medium min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-primary-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock Status */}
                <span
                  className={`text-sm font-medium flex items-center gap-1 ${
                    inStock ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {inStock ? (
                    <>
                      <Check className="w-4 h-4" /> In Stock
                    </>
                  ) : (
                    "Out of Stock"
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || cartLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartLoading ? "Adding..." : "Add to Cart"}
              </button>

              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`btn-secondary p-4 ${
                  isWishlisted ? "text-red-500 border-red-500" : ""
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`}
                />
              </button>

              <button onClick={handleShare} className="btn-secondary p-4">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-primary-200">
              {[
                { icon: Truck, text: "Free Shipping" },
                { icon: Shield, text: "Secure Payment" },
                { icon: RotateCcw, text: "14-Day Returns" },
              ].map((feature, i) => (
                <div key={i} className="text-center">
                  <feature.icon className="w-5 h-5 mx-auto mb-1 text-gold-600" />
                  <span className="text-xs text-primary-600">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="font-medium text-lg mb-3">Description</h2>
              <p className="text-primary-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
              {product.descriptionAr && (
                <p className="text-primary-600 leading-relaxed mt-4" dir="rtl">
                  {product.descriptionAr}
                </p>
              )}
            </div>

            {/* SKU */}
            {product.sku && (
              <p className="text-sm text-primary-500">
                SKU: <span className="font-medium">{product.sku}</span>
              </p>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        {product.reviews.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl mb-8">Customer Reviews</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {product.reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white p-6 border border-primary-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "text-gold-500 fill-gold-500"
                                : "text-primary-300"
                            }`}
                          />
                        ))}
                      </div>
                      {review.isVerified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-primary-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="font-medium mb-1">
                    {review.user.firstName} {review.user.lastName.charAt(0)}.
                  </p>
                  {review.title && (
                    <p className="font-medium text-lg mb-2">{review.title}</p>
                  )}
                  {review.content && (
                    <p className="text-primary-600">{review.content}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
