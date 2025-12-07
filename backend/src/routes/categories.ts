import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, isAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ===================
// GET ALL CATEGORIES (Public)
// ===================
router.get('/', async (req, res, next) => {
  try {
    const { includeProducts } = req.query;

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        ...(includeProducts === 'true' && {
          products: {
            where: { isActive: true },
            take: 4,
            include: {
              images: { take: 1 }
            }
          },
          _count: {
            select: { products: { where: { isActive: true } } }
          }
        })
      }
    });

    // Only return top-level categories (no parent)
    const topLevel = categories.filter(c => !c.parentId);

    res.json({ categories: topLevel });
  } catch (error) {
    next(error);
  }
});

// ===================
// GET SINGLE CATEGORY (Public)
// ===================
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true }
        },
        parent: true,
        _count: {
          select: { products: { where: { isActive: true } } }
        }
      }
    });

    if (!category || !category.isActive) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    next(error);
  }
});

// ===================
// CREATE CATEGORY (Admin)
// ===================
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  nameAr: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

router.post('/', authenticate, isAdmin, validate(createCategorySchema), async (req, res, next) => {
  try {
    const data = req.body;

    // Check if slug exists
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug }
    });

    if (existing) {
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        slug: data.slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId,
        sortOrder: data.sortOrder,
      },
      include: { parent: true }
    });

    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
});

// ===================
// UPDATE CATEGORY (Admin)
// ===================
router.put('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.category.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: data.slug }
      });
      if (slugExists) {
        return res.status(400).json({ error: 'Slug already in use' });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        slug: data.slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
      include: { parent: true }
    });

    res.json({ category });
  } catch (error) {
    next(error);
  }
});

// ===================
// DELETE CATEGORY (Admin)
// ===================
router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if has products
    const productCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with products. Move products first.' 
      });
    }

    // Check if has children
    const childCount = await prisma.category.count({
      where: { parentId: id }
    });

    if (childCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with subcategories.' 
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
