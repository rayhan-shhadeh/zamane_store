import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/products' },
    { name: 'Watches', href: '/products?category=watches' },
    { name: 'Bags', href: '/products?category=bags' },
    { name: 'Jewelry', href: '/products?category=jewelry' },
    { name: 'New Arrivals', href: '/products?sort=createdAt&order=desc' },
    { name: 'Sale', href: '/products?sale=true' },
  ],
  support: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQs', href: '/faq' },
    { name: 'Shipping Info', href: '/shipping' },
    { name: 'Returns & Exchanges', href: '/returns' },
    { name: 'Track Order', href: '/track-order' },
    { name: 'Size Guide', href: '/size-guide' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Our Story', href: '/about#story' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Refund Policy', href: '/refund-policy' },
  ],
};

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
];

export default function Footer() {
  return (
    <footer className="bg-luxury-black text-white">
      {/* Main Footer */}
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-4">
              <h2 className="font-display text-3xl">
                Zamanẻ<span className="text-gold-500">ps</span>
              </h2>
            </Link>
            <p className="text-primary-400 text-sm mb-6 max-w-sm">
              Discover luxury watches, designer bags, and elegant accessories. 
              Premium quality at exceptional prices.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-primary-400">
              <a href="mailto:info@zamaneps.com" className="flex items-center gap-2 hover:text-gold-400 transition-colors">
                <Mail className="w-4 h-4" />
                info@zamaneps.com
              </a>
              <a href="tel:+972000000000" className="flex items-center gap-2 hover:text-gold-400 transition-colors">
                <Phone className="w-4 h-4" />
                +972-XXX-XXXX
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Palestine
              </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold-500 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-primary-400 hover:text-gold-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-primary-400 hover:text-gold-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-primary-400 hover:text-gold-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-primary-400 hover:text-gold-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods & Copyright */}
      <div className="border-t border-white/10">
        <div className="container-custom py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-500">
            © {new Date().getFullYear()} Zamanẻ ps. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-primary-500">Secure payments with</span>
            <div className="flex items-center gap-2">
              {/* Payment icons - using text placeholders */}
              <div className="px-2 py-1 bg-white/10 rounded text-xs">Visa</div>
              <div className="px-2 py-1 bg-white/10 rounded text-xs">Mastercard</div>
              <div className="px-2 py-1 bg-white/10 rounded text-xs">Stripe</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
