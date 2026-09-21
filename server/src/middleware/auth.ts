import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user info from JWT
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        mustChangePassword: boolean;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'toktickit-lab3-dev-secret-key';

import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware: Authenticate JWT from httpOnly cookie.
 * Verifies token signature and checks database for active user status (session invalidation).
 * Attaches req.user if valid and active; returns 401 otherwise.
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
      mustChangePassword: boolean;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, isActive: true, mustChangePassword: true },
    });

    if (!user || !user.isActive) {
      res.clearCookie('token');
      res.status(401).json({ error: 'Account is inactive or session has been invalidated' });
      return;
    }

    req.user = {
      ...decoded,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware factory: Require specific role(s).
 * Must be used AFTER authenticateToken.
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied — insufficient permissions' });
      return;
    }

    next();
  };
};

/**
 * Middleware: Block normal endpoints if user must change password.
 * Allows only /api/auth/change-password and /api/auth/logout.
 */
export const passwordChangeGuard = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    next();
    return;
  }

  if (req.user.mustChangePassword) {
    // Allow password change and logout even when password change is required
    const allowedPaths = ['/api/auth/change-password', '/api/auth/logout', '/api/auth/me'];
    if (allowedPaths.includes(req.path)) {
      next();
      return;
    }

    res.status(403).json({
      error: 'Password change required',
      mustChangePassword: true,
    });
    return;
  }

  next();
};

export { JWT_SECRET };
