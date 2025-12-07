import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { authenticate, optionalAuth, isAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateOrderNumber } from '../utils/orderNumber';
import { sendOrderConfirmation } from '../services/email';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// ===================
// CREATE CHECKOUT SESSION
// ===================
const checkoutSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().min(1),
  }),
  discountCode: z.string().optional(),
  notes: z.string().optional(),
});

router.post('/checkout', optionalAuth, validate(checkoutSchema), async (req, res, next) => {
  try {
    const { email, phone, shippingAddress, discountCode, notes } = req.body;
    const sessionId = req.cookies?.cart_session || req.headers['x-cart-session'];

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: req.userId 
        ? { userId: req.userId }
        : { sessionId },
      include: {
        product: { include: { images: { take: 1 } } },
        variant: true,
      }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Verify stock and calculate totals
    let subtotal = 0;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderItems: any[] = [];

    for (const item of cartItems) {
      const price = item.variant 
        ? Number(item.variant.price)
        : Number(item.product.price);
      
      const availableQty = item.variant
        ? item.variant.quantity
        : item.product.quantity;

      if (!item.product.allowBackorder && item.quantity > availableQty) {
        return res.status(400).json({
          error: `Not enough stock for ${item.product.name}`,
          productId: item.productId,
          available: availableQty,
        });
      }

      subtotal += price * item.quantity;

      // Stripe line item
      lineItems.push({
        price_data: {
          currency: 'ils',
          product_data: {
            name: item.product.name,
            description: item.variant ? item.variant.name : undefined,
            images: item.product.images[0] ? [item.product.images[0].url] : [],
          },
          unit_amount: Math.round(price * 100), // Stripe uses cents/agorot
        },
        quantity: item.quantity,
      });

      // Order item data
      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name: item.product.name + (item.variant ? ` - ${item.variant.name}` : ''),
        sku: item.variant?.sku || item.product.sku,
        price,
        quantity: item.quantity,
        total: price * item.quantity,
      });
    }

    // Apply discount if provided
    let discountAmount = 0;
    let discountCodeRecord = null;

    if (discountCode) {
      discountCodeRecord = await prisma.discountCode.findUnique({
        where: { code: discountCode.toUpperCase() }
      });

      if (!discountCodeRecord) {
        return res.status(400).json({ error: 'Invalid discount code' });
      }

      if (!discountCodeRecord.isActive) {
        return res.status(400).json({ error: 'Discount code is no longer active' });
      }

      if (discountCodeRecord.expiresAt && discountCodeRecord.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Discount code has expired' });
      }

      if (discountCodeRecord.maxUses && discountCodeRecord.usedCount >= discountCodeRecord.maxUses) {
        return res.status(400).json({ error: 'Discount code usage limit reached' });
      }

      if (discountCodeRecord.minOrderAmount && subtotal < Number(discountCodeRecord.minOrderAmount)) {
        return res.status(400).json({ 
          error: `Minimum order amount of ${discountCodeRecord.minOrderAmount} ILS required` 
        });
      }

      // Calculate discount
      if (discountCodeRecord.type === 'PERCENTAGE') {
        discountAmount = subtotal * (Number(discountCodeRecord.value) / 100);
      } else if (discountCodeRecord.type === 'FIXED_AMOUNT') {
        discountAmount = Number(discountCodeRecord.value);
      }
    }

    // Calculate shipping (can be customized based on location/weight)
    const shippingCost = subtotal > 200 ? 0 : 25; // Free shipping over 200 ILS

    // Calculate total
    const total = subtotal - discountAmount + shippingCost;

    // Create or get address
    let addressId = null;
    if (req.userId) {
      const address = await prisma.address.create({
        data: {
          userId: req.userId,
          ...shippingAddress,
        }
      });
      addressId = address.id;
    }

    // Create order in pending state
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.userId,
        email,
        phone,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal,
        shippingCost,
        discountAmount,
        total,
        currency: 'ILS',
        notes,
        shippingAddressId: addressId,
        discountCodeId: discountCodeRecord?.id,
        items: {
          create: orderItems,
        },
        timeline: {
          create: {
            status: 'PENDING',
            note: 'Order created, awaiting payment',
          }
        }
      },
      include: { items: true }
    });

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      discounts: discountCodeRecord ? [{
        coupon: await getOrCreateStripeCoupon(discountCodeRecord),
      }] : undefined,
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: Math.round(shippingCost * 100),
            currency: 'ils',
          },
          display_name: shippingCost === 0 ? 'Free Shipping' : 'Standard Shipping',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 3 },
            maximum: { unit: 'business_day', value: 7 },
          },
        },
      }],
      customer_email: email,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancelled`,
    });

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentId: checkoutSession.id }
    });

    res.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    next(error);
  }
});

// Helper to create Stripe coupon from our discount code
async function getOrCreateStripeCoupon(discountCode: any): Promise<string> {
  try {
    // Try to get existing coupon
    const coupon = await stripe.coupons.retrieve(discountCode.code);
    return coupon.id;
  } catch (error) {
    // Create new coupon
    const couponData: Stripe.CouponCreateParams = {
      id: discountCode.code,
      name: discountCode.code,
    };

    if (discountCode.type === 'PERCENTAGE') {
      couponData.percent_off = Number(discountCode.value);
    } else {
      couponData.amount_off = Math.round(Number(discountCode.value) * 100);
      couponData.currency = 'ils';
    }

    const newCoupon = await stripe.coupons.create(couponData);
    return newCoupon.id;
  }
}

// ===================
// GET ORDER BY ID
// ===================
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { take: 1 } }
            }
          }
        },
        shippingAddress: true,
        timeline: {
          orderBy: { createdAt: 'desc' }
        },
        discountCode: true,
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify ownership (unless admin)
    if (req.userId !== order.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
});

// ===================
// GET ORDER BY NUMBER (Public with email verification)
// ===================
router.get('/track/:orderNumber', async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const { email } = req.query;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              include: { images: { take: 1 } }
            }
          }
        },
        timeline: {
          orderBy: { createdAt: 'desc' }
        },
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify email for security
    if (email && order.email.toLowerCase() !== (email as string).toLowerCase()) {
      return res.status(403).json({ error: 'Email does not match order' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
});

// ===================
// GET USER'S ORDERS
// ===================
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.userId },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                include: { images: { take: 1 } }
              }
            }
          },
        }
      }),
      prisma.order.count({ where: { userId: req.userId } })
    ]);

    res.json({
      orders,
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
// CANCEL ORDER (User)
// ===================
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow cancellation of pending/confirmed orders
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Order cannot be cancelled at this stage' 
      });
    }

    // If paid, initiate refund
    if (order.paymentStatus === 'PAID' && order.stripePaymentId) {
      // Get payment intent from session
      const session = await stripe.checkout.sessions.retrieve(order.stripePaymentId);
      if (session.payment_intent) {
        await stripe.refunds.create({
          payment_intent: session.payment_intent as string,
        });
      }
    }

    // Update order
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus,
        cancelledAt: new Date(),
        timeline: {
          create: {
            status: 'CANCELLED',
            note: reason || 'Cancelled by customer',
          }
        }
      }
    });

    // Restore inventory
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: id }
    });

    for (const item of orderItems) {
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { quantity: { increment: item.quantity } }
        });
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } }
        });
      }
    }

    res.json({ 
      message: 'Order cancelled successfully',
      order: updated 
    });
  } catch (error) {
    next(error);
  }
});

// ===================
// ADMIN: UPDATE ORDER STATUS
// ===================
router.patch('/:id/status', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, note } = req.body;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData: any = {
      status,
      timeline: {
        create: {
          status,
          note: note || `Status updated to ${status}`,
        }
      }
    };

    if (status === 'SHIPPED' && trackingNumber) {
      updateData.trackingNumber = trackingNumber;
      updateData.shippedAt = new Date();
    }

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        timeline: { orderBy: { createdAt: 'desc' } },
      }
    });

    // Send notification email
    // await sendOrderStatusUpdate(order.email, updated);

    res.json({ order: updated });
  } catch (error) {
    next(error);
  }
});

// ===================
// ADMIN: GET ALL ORDERS
// ===================
router.get('/admin/all', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { 
      page = '1', 
      limit = '20',
      status,
      paymentStatus,
      search,
      dateFrom,
      dateTo,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = {};

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          user: {
            select: { firstName: true, lastName: true, email: true }
          },
        }
      }),
      prisma.order.count({ where })
    ]);

    // Calculate stats
    const stats = await prisma.order.aggregate({
      where,
      _sum: { total: true },
      _count: true,
    });

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      stats: {
        totalOrders: stats._count,
        totalRevenue: stats._sum.total,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
