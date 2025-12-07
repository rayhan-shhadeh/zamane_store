# Zamanẻ ps E-Commerce Store

A complete, self-hosted e-commerce solution built with Next.js, Node.js, and PostgreSQL. Designed to replace Shopify with lower hosting costs while maintaining professional functionality.

## 🚀 Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js 14 + React 18 | SEO-friendly, fast, App Router |
| Styling | Tailwind CSS | Rapid development, consistent design |
| Backend | Node.js + Express | Familiar, robust REST API |
| Database | PostgreSQL | ACID compliance, relational data |
| ORM | Prisma | Type-safe, easy migrations |
| Auth | NextAuth.js + JWT | Secure, flexible authentication |
| Payments | Stripe | International support, well-documented |
| Images | Cloudinary | Free tier, image optimization |
| Hosting | Vercel + Railway | Cost-effective, scalable |

## 📁 Project Structure

```
zamane-store/
├── frontend/                 # Next.js application
│   ├── app/                  # App Router pages
│   │   ├── (shop)/           # Public shop routes
│   │   │   ├── page.tsx      # Homepage
│   │   │   ├── products/     # Product pages
│   │   │   ├── cart/         # Shopping cart
│   │   │   ├── checkout/     # Checkout flow
│   │   │   └── account/      # User account
│   │   ├── (admin)/          # Admin dashboard
│   │   └── api/              # API routes
│   ├── components/           # Reusable components
│   ├── lib/                  # Utilities & configs
│   ├── hooks/                # Custom React hooks
│   └── styles/               # Global styles
├── backend/                  # Express API server
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, validation
│   │   ├── services/         # Business logic
│   │   └── utils/            # Helper functions
│   └── prisma/               # Database schema
└── database/                 # SQL scripts & seeds
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Stripe account
- Cloudinary account (optional, for images)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/zamane-store.git
cd zamane-store

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Setup

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

**Backend (`backend/.env`):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/zamane_store
JWT_SECRET=your-jwt-secret-here
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
CLOUDINARY_URL=cloudinary://xxx:xxx@xxx
PORT=5000
```

### 3. Database Setup

```bash
cd backend

# Create database
createdb zamane_store

# Run migrations
npx prisma migrate dev

# Seed sample data
npx prisma db seed
```

### 4. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit `http://localhost:3000` for the store and `http://localhost:3000/admin` for the admin panel.

## 💳 Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Dashboard
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Enable these webhook events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

## 🌐 Deployment

### Vercel (Frontend)
```bash
cd frontend
vercel --prod
```

### Railway (Backend + Database)
1. Connect your GitHub repo to Railway
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy!

### Monthly Cost Estimate
| Service | Cost |
|---------|------|
| Vercel (Frontend) | Free |
| Railway (Backend) | ~$5/month |
| Railway (PostgreSQL) | ~$5/month |
| Cloudinary (Images) | Free tier |
| Stripe | 2.9% + 30¢ per transaction |
| **Total** | **~$10/month** vs $29+/month Shopify |

## 📦 Features

### Customer Features
- ✅ Product browsing with filters & search
- ✅ Shopping cart (persistent)
- ✅ Secure checkout with Stripe
- ✅ User accounts & order history
- ✅ Wishlist
- ✅ Product reviews
- ✅ Mobile responsive design
- ✅ RTL support (Arabic/Hebrew)

### Admin Features
- ✅ Dashboard with analytics
- ✅ Product management (CRUD)
- ✅ Order management
- ✅ Customer management
- ✅ Inventory tracking
- ✅ Discount codes
- ✅ Sales reports

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens with refresh rotation
- CSRF protection
- Input validation & sanitization
- Rate limiting on API
- SQL injection prevention (Prisma)
- XSS protection headers

## 📱 Responsive Breakpoints

```css
/* Mobile first approach */
sm: 640px   /* Large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

## 🎨 Design System

### Colors
```css
--primary: #1a1a1a       /* Elegant black */
--secondary: #c4a35a     /* Luxury gold */
--accent: #8b7355        /* Warm bronze */
--background: #fafafa    /* Off-white */
--text: #333333          /* Dark gray */
--error: #dc2626         /* Red */
--success: #16a34a       /* Green */
```

### Typography
- Display: Playfair Display (luxury feel)
- Body: Plus Jakarta Sans (modern, readable)

## 📞 Support

For issues or questions, create a GitHub issue or contact: your-email@example.com

## 📄 License

MIT License - feel free to use for your own projects.
