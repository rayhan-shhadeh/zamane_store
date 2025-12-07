import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, isAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ===================
// GET ALL PRODUCTS (Public)
// ===================
router.get('/', async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '12',
      category,
      minPrice,
      maxPrice,
      search,
      sort = 'createdAt',
      order = 'desc',
      featured,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = { slug: category };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    // Build order by
    const orderBy: any = {};
    if (sort === 'price') {
      orderBy.price = order;
    } else if (sort === 'name') {
      orderBy.name = order;
    } else {
      orderBy.createdAt = order;
    }

    // Get products with count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1, // Only get first image for listing
          },
          _count: {
            select: { reviews: true }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    // Calculate average ratings
    const productsWithRatings = await Promise.all(
      products.map(async (product) => {
        const avgRating = await prisma.review.aggregate({
          where: { productId: product.id, isApproved: true },
          _avg: { rating: true }
        });
        return {
          ...product,
          averageRating: avgRating._avg.rating || 0,
        };
      })
    );

    res.json({
      products: productsWithRatings,
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
// GET SINGLE PRODUCT (Public)
// ===================
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true }
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tags: {
          include: { tag: true }
        },
        _count: {
          select: { reviews: true }
        }
      }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get average rating
    const avgRating = await prisma.review.aggregate({
      where: { productId: product.id, isApproved: true },
      _avg: { rating: true }
    });

    // Get related products
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      include: {
        images: { take: 1 }
      }
    });

    res.json({
      product: {
        ...product,
        averageRating: avgRating._avg.rating || 0,
      },
      relatedProducts,
    });
  } catch (error) {
    next(error);
  }
});

// ===================
// GET FEATURED PRODUCTS (Public)
// ===================
router.get('/featured/list', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      take: 8,
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// ===================
// SEARCH PRODUCTS (Public)
// ===================
router.get('/search/query', async (req, res, next) => {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.json({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
        ]
      },
      take: parseInt(limit as string),
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: {
          take: 1,
          select: { url: true }
        }
      }
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// ===================
// CREATE PRODUCT (Admin)
// ===================
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  nameAr: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  descriptionAr: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().min(0).default(0),
  categoryId: z.string().min(1, 'Category is required'),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
  })).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

router.post('/', authenticate, isAdmin, validate(createProductSchema), async (req, res, next) => {
  try {
    const data = req.body;

    // Check if slug exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: data.slug }
    });

    if (existingProduct) {
      return res.status(400).json({ error: 'Product with this slug already exists' });
    }

    // Create product with images
    const product = await prisma.product.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        slug: data.slug,
        description: data.description,
        descriptionAr: data.descriptionAr,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        sku: data.sku,
        quantity: data.quantity,
        categoryId: data.categoryId,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        images: data.images ? {
          create: data.images.map((img: any, index: number) => ({
            url: img.url,
            alt: img.alt,
            sortOrder: index,
          }))
        } : undefined,
      },
      include: {
        category: true,
        images: true,
      }
    });

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

// ===================
// UPDATE PRODUCT (Admin)
// ===================
router.put('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: data.slug }
      });
      if (slugExists) {
        return res.status(400).json({ error: 'Slug already in use' });
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        slug: data.slug,
        description: data.description,
        descriptionAr: data.descriptionAr,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        sku: data.sku,
        quantity: data.quantity,
        categoryId: data.categoryId,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
      include: {
        category: true,
        images: true,
      }
    });

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// ===================
// DELETE PRODUCT (Admin)
// ===================
router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Soft delete - just mark as inactive
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ===================
// ADD PRODUCT REVIEW (Authenticated)
// ===================
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  content: z.string().optional(),
});

router.post('/:id/reviews', authenticate, validate(reviewSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, content } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: req.userId!,
          productId: id,
        }
      }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Check if user purchased this product (for verified badge)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: id,
        order: {
          userId: req.userId,
          status: 'DELIVERED',
        }
      }
    });

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: req.userId!,
        productId: id,
        rating,
        title,
        content,
        isVerified: !!hasPurchased,
        isApproved: false, // Requires admin approval
      },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    res.status(201).json({ 
      review,
      message: 'Review submitted and pending approval' 
    });
  } catch (error) {
    next(error);
  }
});

export default router;
