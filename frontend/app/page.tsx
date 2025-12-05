'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Truck, Shield, RotateCcw } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt?: string }[];
  category: { name: string; slug: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  _count?: { products: number };
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products/featured/list'),
          api.get('/categories?includeProducts=true'),
        ]);
        setFeaturedProducts(productsRes.data.products);
        setCategories(categoriesRes.data.categories);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden bg-luxury-black">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-noise opacity-50" />
        </div>
        
        {/* Hero Image */}
        <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:block">
          <div className="relative h-full">
            <Image
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200"
              alt="Luxury Watch"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-luxury-black via-luxury-black/50 to-transparent" />
          </div>
        </div>

        {/* Content */}
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <span className="inline-flex items-center gap-2 text-gold-400 text-sm tracking-widest uppercase mb-6">
              <Sparkles className="w-4 h-4" />
              New Collection 2024
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-6">
              Elevate Your
              <span className="block text-gold-400">Style</span>
            </h1>
            <p className="text-primary-300 text-lg mb-8 leading-relaxed">
              Discover our curated collection of luxury watches, designer bags, 
              and elegant accessories. Premium quality at exceptional prices.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="btn-gold">
                Shop Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link href="/categories" className="btn-secondary border-white/20 text-white hover:bg-white hover:text-luxury-black">
                Browse Categories
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-gold-400 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Bar */}
      <section className="bg-luxury-pearl border-y border-primary-200">
        <div className="container-custom py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, text: 'Free Shipping', sub: 'Orders over ₪200' },
              { icon: Shield, text: 'Secure Payment', sub: '100% Protected' },
              { icon: RotateCcw, text: 'Easy Returns', sub: '14-day policy' },
              { icon: Sparkles, text: 'Premium Quality', sub: 'Guaranteed' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{feature.text}</p>
                  <p className="text-xs text-primary-500">{feature.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl mb-4">Shop by Category</h2>
            <p className="text-primary-500 max-w-lg mx-auto">
              Explore our carefully curated collections of luxury accessories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.slice(0, 4).map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  href={`/products?category=${category.slug}`}
                  className="group block relative aspect-[3/4] overflow-hidden bg-primary-100"
                >
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-200 to-primary-100" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <h3 className="font-display text-xl md:text-2xl text-white mb-1">
                      {category.name}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {category._count?.products || 0} Products
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl mb-2">Featured Products</h2>
              <p className="text-primary-500">Handpicked luxury items for you</p>
            </div>
            <Link 
              href="/products" 
              className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-gold-600 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-square skeleton" />
                  <div className="h-4 skeleton w-3/4" />
                  <div className="h-4 skeleton w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link href="/products" className="btn-secondary">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-16 md:py-24 bg-luxury-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-noise" />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-gold-400 text-sm tracking-widest uppercase mb-4 block">
              Limited Time Offer
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-6">
              Get 10% Off Your First Order
            </h2>
            <p className="text-primary-300 text-lg mb-8 max-w-xl mx-auto">
              Use code <span className="text-gold-400 font-semibold">WELCOME10</span> at checkout 
              to enjoy exclusive savings on your first purchase.
            </p>
            <Link href="/products" className="btn-gold">
              Start Shopping
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl mb-4">Stay Updated</h2>
            <p className="text-primary-500 mb-8">
              Subscribe to our newsletter for exclusive offers, new arrivals, and style inspiration.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field flex-1"
                required
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
