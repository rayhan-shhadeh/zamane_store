import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper to get or create session ID for guest users
const getSessionId = (req: any, res: any): string => {
  let sessionId = req.cookies?.cart_session || req.headers['x-cart-session'];
  
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('cart_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
  
  return sessionId;
};

// ===================
// GET CART
// ===================
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const sessionId = getSessionId(req, res);
    
    const where = req.userId 
      ? { userId: req.userId }
      : { sessionId };

    const cartItems = await prisma.cartItem.findMany({
      where,
      include: {
        product: {
          include: {
            images: { take: 1 }
          }
        },
        variant: true,
      }
    });

    // Calculate totals
    let subtotal = 0;
    const items = cartItems.map(item => {
      const price = item.variant 
        ? Number(item.variant.price) 
        : Number(item.product.price);
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          compareAtPrice: item.product.compareAtPrice,
          image: item.product.images[0]?.url,
          inStock: item.product.quantity > 0 || item.product.allowBackorder,
          availableQuantity: item.product.quantity,
        },
        variant: item.variant ? {
          id: item.variant.id,
          name: item.variant.name,
          price: item.variant.price,
          options: item.variant.options,
        } : null,
        price,
        total: itemTotal,
      };
    });

    res.json({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      currency: 'ILS',
    });
  } catch (error) {
    next(error);
  }
});

// ===================
// ADD TO CART
// ===================
const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
});

router.post('/add', optionalAuth, validate(addToCartSchema), async (req, res, next) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const sessionId = getSessionId(req, res);

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If variant specified, verify it exists
    if (variantId) {
      const variant = product.variants.find(v => v.id === variantId);
      if (!variant || !variant.isActive) {
        return res.status(404).json({ error: 'Product variant not found' });
      }
    }

    // Check stock
    const availableQty = variantId 
      ? product.variants.find(v => v.id === variantId)?.quantity || 0
      : product.quantity;

    if (!product.allowBackorder && quantity > availableQty) {
      return res.status(400).json({ 
        error: 'Not enough stock available',
        available: availableQty 
      });
    }

    // Check for existing cart item
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        productId,
        variantId: variantId || null,
        ...(req.userId ? { userId: req.userId } : { sessionId }),
      }
    });

    let cartItem;

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (!product.allowBackorder && newQuantity > availableQty) {
        return res.status(400).json({ 
          error: 'Not enough stock available',
          available: availableQty 
        });
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: {
          product: { include: { images: { take: 1 } } },
          variant: true,
        }
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          productId,
          variantId,
          quantity,
          ...(req.userId ? { userId: req.userId } : { sessionId }),
        },
        include: {
          product: { include: { images: { take: 1 } } },
          variant: true,
        }
      });
    }

    res.json({ 
      message: 'Added to cart',
      item: cartItem 
    });
  } catch (error) {
    next(error);
  }
});

// ===================
// UPDATE CART ITEM
// ===================
const updateCartSchema = z.object({
  quantity: z.number().int().positive(),
});

router.put('/:itemId', optionalAuth, validate(updateCartSchema), async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const sessionId = getSessionId(req, res);

    // Find cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        ...(req.userId ? { userId: req.userId } : { sessionId }),
      },
      include: { product: true, variant: true }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Check stock
    const availableQty = cartItem.variant 
      ? cartItem.variant.quantity
      : cartItem.product.quantity;

    if (!cartItem.product.allowBackorder && quantity > availableQty) {
      return res.status(400).json({ 
        error: 'Not enough stock available',
        available: availableQty 
      });
    }

    // Update quantity
    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: { include: { images: { take: 1 } } },
        variant: true,
      }
    });

    res.json({ item: updated });
  } catch (error) {
    next(error);
  }
});

// ===================
// REMOVE FROM CART
// ===================
router.delete('/:itemId', optionalAuth, async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const sessionId = getSessionId(req, res);

    // Verify ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        ...(req.userId ? { userId: req.userId } : { sessionId }),
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await prisma.cartItem.delete({
      where: { id: itemId }
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
});

// ===================
// CLEAR CART
// ===================
router.delete('/', optionalAuth, async (req, res, next) => {
  try {
    const sessionId = getSessionId(req, res);

    await prisma.cartItem.deleteMany({
      where: req.userId 
        ? { userId: req.userId }
        : { sessionId }
    });

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
});

// ===================
// MERGE GUEST CART (after login)
// ===================
router.post('/merge', optionalAuth, async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { sessionId } = req.body;

    if (!sessionId) {
      return res.json({ message: 'No guest cart to merge' });
    }

    // Get guest cart items
    const guestItems = await prisma.cartItem.findMany({
      where: { sessionId }
    });

    // Merge each item
    for (const guestItem of guestItems) {
      const existingUserItem = await prisma.cartItem.findFirst({
        where: {
          userId: req.userId,
          productId: guestItem.productId,
          variantId: guestItem.variantId,
        }
      });

      if (existingUserItem) {
        // Add quantities
        await prisma.cartItem.update({
          where: { id: existingUserItem.id },
          data: { quantity: existingUserItem.quantity + guestItem.quantity }
        });
        await prisma.cartItem.delete({ where: { id: guestItem.id } });
      } else {
        // Transfer to user
        await prisma.cartItem.update({
          where: { id: guestItem.id },
          data: { userId: req.userId, sessionId: null }
        });
      }
    }

    res.json({ message: 'Cart merged successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
