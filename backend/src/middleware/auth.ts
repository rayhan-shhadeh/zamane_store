import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

// ===================
// AUTHENTICATE (Required)
// ===================
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify session exists
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        token,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!session) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Attach user info to request
    req.userId = session.userId;
    req.userRole = session.user.role;

    next();
  } catch (error) {
    next(error);
  }
};

// ===================
// OPTIONAL AUTH (For cart, etc.)
// ===================
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without auth
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const session = await prisma.session.findFirst({
        where: {
          userId: decoded.userId,
          token,
          expiresAt: { gt: new Date() }
        },
        include: { user: true }
      });

      if (session) {
        req.userId = session.userId;
        req.userRole = session.user.role;
      }
    } catch {
      // Invalid token, continue as guest
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ===================
// ADMIN ONLY
// ===================
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ===================
// SUPER ADMIN ONLY
// ===================
export const isSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};
