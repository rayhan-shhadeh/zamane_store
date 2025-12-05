'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingBag, User, Menu, X, Heart, ChevronDown 
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/products' },
  { 
    name: 'Categories', 
    href: '/categories',
    children: [
      { name: 'Watches', href: '/products?category=watches' },
      { name: 'Bags', href: '/products?category=bags' },
      { name: 'Jewelry', href: '/products?category=jewelry' },
      { name: 'Wallets', href: '/products?category=wallets' },
    ]
  },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const { itemCount } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isHomePage = pathname === '/';
  const headerBg = isScrolled || !isHomePage 
    ? 'bg-white shadow-sm' 
    : 'bg-transparent';
  const textColor = isScrolled || !isHomePage 
    ? 'text-luxury-black' 
    : 'text-white';

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}
      >
        {/* Announcement Bar */}
        <div className="bg-luxury-black text-white text-center py-2 text-sm">
          <p>Free shipping on orders over ₪200 | Use code <span className="text-gold-400">WELCOME10</span> for 10% off</p>
        </div>

        <div className="container-custom">
          <nav className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`md:hidden p-2 -ml-2 ${textColor}`}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <h1 className={`font-display text-2xl md:text-3xl tracking-wide ${textColor}`}>
                Zamanẻ<span className="text-gold-500">ps</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <div 
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => item.children && setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-gold-500 ${textColor} ${
                      pathname === item.href ? 'text-gold-500' : ''
                    }`}
                  >
                    {item.name}
                    {item.children && <ChevronDown className="w-4 h-4" />}
                  </Link>

                  {/* Dropdown */}
                  {item.children && (
                    <AnimatePresence>
                      {activeDropdown === item.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 pt-2"
                        >
                          <div className="bg-white shadow-luxury-lg py-2 min-w-[180px]">
                            {item.children.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                className="block px-4 py-2 text-sm text-luxury-black hover:bg-primary-50 hover:text-gold-600 transition-colors"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`p-2 transition-colors hover:text-gold-500 ${textColor}`}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <Link
                href="/wishlist"
                className={`hidden md:block p-2 transition-colors hover:text-gold-500 ${textColor}`}
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              <Link
                href={isAuthenticated ? '/account' : '/login'}
                className={`hidden md:block p-2 transition-colors hover:text-gold-500 ${textColor}`}
                aria-label="Account"
              >
                <User className="w-5 h-5" />
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 transition-colors hover:text-gold-500 ${textColor}`}
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-white text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 md:hidden overflow-y-auto"
            >
              <div className="p-4 border-b border-primary-100 flex items-center justify-between">
                <h2 className="font-display text-xl">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-4">
                {navigation.map((item) => (
                  <div key={item.name} className="border-b border-primary-100 last:border-0">
                    <Link
                      href={item.href}
                      className="block py-3 font-medium"
                    >
                      {item.name}
                    </Link>
                    {item.children && (
                      <div className="pl-4 pb-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block py-2 text-sm text-primary-600"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-primary-100">
                <Link
                  href={isAuthenticated ? '/account' : '/login'}
                  className="flex items-center gap-3 py-2"
                >
                  <User className="w-5 h-5" />
                  <span>{isAuthenticated ? 'My Account' : 'Sign In'}</span>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 py-2"
                >
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
