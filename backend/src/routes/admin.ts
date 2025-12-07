import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();

// All routes require admin authentication
router.use(authenticate, isAdmin);

// ===================
// DASHBOARD STATS
// ===================
router.get('/dashboard', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get various stats
    const [
      totalOrders,
      todayOrders,
      monthOrders,
      lastMonthOrders,
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalCustomers,
      newCustomers,
      totalProducts,
      lowStockProducts,
      pendingOrders,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      // Total orders
      prisma.order.count({ where: { paymentStatus: 'PAID' } }),
      
      // Today's orders
      prisma.order.count({
        where: { createdAt: { gte: today }, paymentStatus: 'PAID' }
      }),
      
      // This month orders
      prisma.order.count({
        where: { createdAt: { gte: thisMonth }, paymentStatus: 'PAID' }
      }),
      
      // Last month orders
      prisma.order.count({
        where: { 
          createdAt: { gte: lastMonth, lt: thisMonth },
          paymentStatus: 'PAID'
        }
      }),
      
      // Total revenue
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true }
      }),
      
      // This month revenue
      prisma.order.aggregate({
        where: { createdAt: { gte: thisMonth }, paymentStatus: 'PAID' },
        _sum: { total: true }
      }),
      
      // Last month revenue
      prisma.order.aggregate({
        where: { 
          createdAt: { gte: lastMonth, lt: thisMonth },
          paymentStatus: 'PAID'
        },
        _sum: { total: true }
      }),
      
      // Total customers
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      
      // New customers this month
      prisma.user.count({
        where: { createdAt: { gte: thisMonth }, role: 'CUSTOMER' }
      }),
      
      // Total products
      prisma.product.count({ where: { isActive: true } }),
      
      // Low stock products
      prisma.product.count({
        where: {
          isActive: true,
          trackInventory: true,
          quantity: { lte: prisma.product.fields.lowStockThreshold }
        }
      }),
      
      // Pending orders
      prisma.order.count({ where: { status: 'PENDING' } }),
      
      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          user: { select: { firstName: true, lastName: true } }
        }
      }),
      
      // Top selling products
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Get product details for top products
    const topProductIds = topProducts.map(p => p.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      include: { images: { take: 1 } }
    });

    // Calculate growth percentages
    const orderGrowth = lastMonthOrders > 0 
      ? ((monthOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1)
      : 100;
    
    const revenueGrowth = Number(lastMonthRevenue._sum.total) > 0
      ? ((Number(monthRevenue._sum.total) - Number(lastMonthRevenue._sum.total)) / Number(lastMonthRevenue._sum.total) * 100).toFixed(1)
      : 100;

    res.json({
      overview: {
        totalOrders,
        todayOrders,
        monthOrders,
        orderGrowth: Number(orderGrowth),
        totalRevenue: Number(totalRevenue._sum.total) || 0,
        monthRevenue: Number(monthRevenue._sum.total) || 0,
        revenueGrowth: Number(revenueGrowth),
        totalCustomers,
        newCustomers,
        totalProducts,
        lowStockProducts,
        pendingOrders,
      },
      recentOrders,
      topProducts: topProducts.map(tp => ({
        ...topProductDetails.find(p => p.id === tp.productId),
        totalSold: tp._sum.quantity,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// ===================
// SALES CHART DATA
// ===================
router.get('/sales-chart', async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate = new Date();
    let groupBy: 'day' | 'week' | 'month' = 'day';
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        groupBy = 'day';
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        groupBy = 'day';
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        groupBy = 'week';
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupBy = 'month';
        break;
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        paymentStatus: 'PAID',
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by period
    const grouped: Record<string, { revenue: number; orders: number }> = {};
    
    orders.forEach(order => {
      let key: string;
      const date = new Date(order.createdAt);
      
      if (groupBy === 'day') {
        key = date.toISOString().slice(0, 10);
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!grouped[key]) {
        grouped[key] = { revenue: 0, orders: 0 };
      }
      grouped[key].revenue += Number(order.total);
      grouped[key].orders += 1;
    });

    const chartData = Object.entries(grouped).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }));

    res.json({ chartData });
  } catch (error) {
    next(error);
  }
});

// ===================
// LOW STOCK PRODUCTS
// ===================
router.get('/low-stock', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        trackInventory: true,
        quantity: { lte: 10 } // Default threshold
      },
      include: {
        category: { select: { name: true } },
        images: { take: 1 }
      },
      orderBy: { quantity: 'asc' }
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// ===================
// CUSTOMERS LIST
// ===================
router.get('/customers', async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = { role: 'CUSTOMER' };
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Get total spent for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const totalSpent = await prisma.order.aggregate({
          where: { userId: customer.id, paymentStatus: 'PAID' },
          _sum: { total: true }
        });
        return {
          ...customer,
          totalSpent: Number(totalSpent._sum.total) || 0,
        };
      })
    );

    res.json({
      customers: customersWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    next(error);
  }
});

// ===================
// DISCOUNT CODES
// ===================
router.get('/discounts', async (req, res, next) => {
  try {
    const discounts = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ discounts });
  } catch (error) {
    next(error);
  }
});

router.post('/discounts', async (req, res, next) => {
  try {
    const data = req.body;
    
    const discount = await prisma.discountCode.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount,
        maxUses: data.maxUses,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive ?? true,
      }
    });

    res.status(201).json({ discount });
  } catch (error) {
    next(error);
  }
});

router.delete('/discounts/:id', async (req, res, next) => {
  try {
    await prisma.discountCode.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Discount code deleted' });
  } catch (error) {
    next(error);
  }
});

// ===================
// REVIEWS MODERATION
// ===================
router.get('/reviews/pending', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: false },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { name: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

router.patch('/reviews/:id/approve', async (req, res, next) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: true }
    });
    res.json({ review });
  } catch (error) {
    next(error);
  }
});

router.delete('/reviews/:id', async (req, res, next) => {
  try {
    await prisma.review.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
