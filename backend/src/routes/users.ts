import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===================
// GET USER ADDRESSES
// ===================
router.get('/addresses', async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.userId },
      orderBy: { isDefault: 'desc' }
    });

    res.json({ addresses });
  } catch (error) {
    next(error);
  }
});

// ===================
// ADD ADDRESS
// ===================
const addressSchema = z.object({
  type: z.enum(['SHIPPING', 'BILLING']).default('SHIPPING'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1),
  isDefault: z.boolean().default(false),
});

router.post('/addresses', validate(addressSchema), async (req, res, next) => {
  try {
    const data = req.body;

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.userId, type: data.type },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.userId!,
        ...data,
      }
    });

    res.status(201).json({ address });
  } catch (error) {
    next(error);
  }
});

// ===================
// UPDATE ADDRESS
// ===================
router.put('/addresses/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.userId, type: data.type || existing.type, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data
    });

    res.json({ address });
  } catch (error) {
    next(error);
  }
});

// ===================
// DELETE ADDRESS
// ===================
router.delete('/addresses/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.delete({ where: { id } });

    res.json({ message: 'Address deleted' });
  } catch (error) {
    next(error);
  }
});

// ===================
// GET WISHLIST
// ===================
router.get('/wishlist', async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: req.userId },
      include: {
        product: {
          include: {
            images: { take: 1 },
            category: { select: { name: true, slug: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ 
      items: wishlist.map(w => ({
        id: w.id,
        addedAt: w.createdAt,
        product: w.product,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// ===================
// ADD TO WISHLIST
// ===================
router.post('/wishlist/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.userId!,
          productId,
        }
      }
    });

    if (existing) {
      return res.json({ message: 'Already in wishlist' });
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: req.userId!,
        productId,
      },
      include: {
        product: {
          include: { images: { take: 1 } }
        }
      }
    });

    res.status(201).json({ item: wishlistItem });
  } catch (error) {
    next(error);
  }
});

// ===================
// REMOVE FROM WISHLIST
// ===================
router.delete('/wishlist/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;

    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId: req.userId!,
          productId,
        }
      }
    });

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
});

export default router;
