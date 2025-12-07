import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Helper functions
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// ===================
// REGISTER
// ===================
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in database
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    res.status(201).json({
      message: 'Registration successful',
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// ===================
// LOGIN
// ===================
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    // Clean up old sessions (keep last 5)
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    
    if (sessions.length > 5) {
      const sessionsToDelete = sessions.slice(5).map(s => s.id);
      await prisma.session.deleteMany({
        where: { id: { in: sessionsToDelete } }
      });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// ===================
// REFRESH TOKEN
// ===================
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!
      );
    } catch (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Find session
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Generate new tokens
    const tokens = generateTokens(session.userId);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// ===================
// LOGOUT
// ===================
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// ===================
// GET CURRENT USER
// ===================
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        addresses: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// ===================
// UPDATE PROFILE
// ===================
const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
});

router.patch('/me', authenticate, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
      }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// ===================
// CHANGE PASSWORD
// ===================
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

router.post('/change-password', authenticate, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: req.userId }
    });

    res.json({ message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    next(error);
  }
});

export default router;
