'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Grid3X3, LayoutList } from 'lucide-react';
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
}

const sortOptions = [
  { value: 'createdAt-desc', label: 'Newest' },
  { value: 'createdAt-asc', label: 'Oldest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get current filters from URL
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'createdAt';
  const currentOrder = searchParams.get('order') || 'desc';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '12');
      if (currentCategory) params.set('category', currentCategory);
      if (currentSearch) params.set('search', currentSearch);
      if (currentSort) params.set('sort', currentSort);
      if (currentOrder) params.set('order', currentOrder);
      if (currentMinPrice) params.set('minPrice', currentMinPrice);
      if (currentMaxPrice) params.set('maxPrice', currentMaxPrice);

      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [currentCategory, currentSearch, currentSort, currentOrder, currentPage, currentMinPrice, currentMaxPrice]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filters change (unless updating page itself)
    if (!('page' in updates)) {
      params.delete('page');
    }

    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/products');
  };

  const hasActiveFilters = currentCategory || currentSearch || currentMinPrice || currentMaxPrice;

  return (
    <div className="min-h-screen pt-32 pb-16">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl mb-2">
            {currentSearch ? `Search: "${currentSearch}"` : currentCategory ? categories.find(c => c.slug === currentCategory)?.name || 'Products' : 'All Products'}
          </h1>
          <p className="text-primary-500">
            {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-primary-100">
          <div className="flex items-center gap-3">
            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-primary-200 hover:border-primary-300 transition-colors lg:hidden"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-gold-500 text-white text-xs rounded-full flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="hidden lg:flex items-center gap-2">
                {currentCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-sm">
                    {categories.find(c => c.slug === currentCategory)?.name}
                    <button onClick={() => updateFilters({ category: null })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {currentSearch && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-sm">
                    "{currentSearch}"
                    <button onClick={() => updateFilters({ search: null })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-gold-600 hover:text-gold-700"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <div className="relative">
              <select
                value={`${currentSort}-${currentOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  updateFilters({ sort, order });
                }}
                className="appearance-none pl-3 pr-8 py-2 border border-primary-200 bg-white text-sm cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>

            {/* View Mode */}
            <div className="hidden md:flex border border-primary-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100' : ''}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-100' : ''}`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-32 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="font-medium mb-3">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => updateFilters({ category: null })}
                    className={`block w-full text-left text-sm py-1 ${!currentCategory ? 'text-gold-600 font-medium' : 'text-primary-600 hover:text-luxury-black'}`}
                  >
                    All Products
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => updateFilters({ category: category.slug })}
                      className={`block w-full text-left text-sm py-1 ${currentCategory === category.slug ? 'text-gold-600 font-medium' : 'text-primary-600 hover:text-luxury-black'}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={currentMinPrice}
                    onChange={(e) => updateFilters({ minPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-200 text-sm"
                  />
                  <span className="text-primary-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={currentMaxPrice}
                    onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-primary-200 text-sm"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <div className="aspect-square skeleton" />
                    <div className="h-4 skeleton w-3/4" />
                    <div className="h-4 skeleton w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="font-display text-xl mb-2">No products found</h3>
                <p className="text-primary-500 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button onClick={clearFilters} className="btn-primary">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => updateFilters({ page: (i + 1).toString() })}
                        className={`w-10 h-10 flex items-center justify-center ${
                          currentPage === i + 1
                            ? 'bg-luxury-black text-white'
                            : 'border border-primary-200 hover:border-primary-400'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
