'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: { url: string }[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/products/search/query?q=${encodeURIComponent(searchQuery)}`);
      setResults(response.data.products);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    searchProducts(debouncedQuery);
  }, [debouncedQuery, searchProducts]);

  // Clear results when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
      onClose();
    }
  };

  const handleResultClick = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 p-4 md:p-8"
          >
            <div className="max-w-2xl mx-auto bg-white shadow-luxury-lg">
              {/* Search Input */}
              <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-12 pr-12 py-4 text-lg border-b border-primary-100 outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-primary-50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                  </div>
                ) : query && results.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-primary-500">
                      No results found for "{query}"
                    </p>
                    <p className="text-sm text-primary-400 mt-1">
                      Try adjusting your search terms
                    </p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="p-4">
                    <p className="text-sm text-primary-500 mb-3">
                      {results.length} result{results.length !== 1 ? 's' : ''} found
                    </p>
                    <div className="space-y-2">
                      {results.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-4 p-2 hover:bg-primary-50 rounded transition-colors"
                        >
                          <div className="relative w-12 h-12 bg-primary-100 flex-shrink-0">
                            <Image
                              src={product.images[0]?.url || '/placeholder-product.jpg'}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {product.name}
                            </p>
                            <p className="text-sm text-primary-500">
                              ₪{product.price.toFixed(2)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* View All Link */}
                    <button
                      onClick={() => {
                        router.push(`/products?search=${encodeURIComponent(query)}`);
                        onClose();
                      }}
                      className="w-full mt-4 py-3 text-center text-sm font-medium text-gold-600 hover:text-gold-700 border-t border-primary-100"
                    >
                      View all results →
                    </button>
                  </div>
                ) : (
                  <div className="p-4">
                    <p className="text-sm text-primary-500 mb-3">Popular searches</p>
                    <div className="flex flex-wrap gap-2">
                      {['Watches', 'Bags', 'Jewelry', 'Bracelets', 'Wallets'].map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="px-3 py-1.5 text-sm bg-primary-50 hover:bg-primary-100 rounded-full transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
