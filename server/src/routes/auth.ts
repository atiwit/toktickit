import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma/client';
import { authenticateToken, JWT_SECRET } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const BCRYPT_COST = 10;
const JWT_EXPIRY = '24h';
const COOKIE_NAME = 'token';

// Password validation: ≥8 chars, 1 uppercase, 1 lowercase, 1 digit (BR-09)
const validatePassword = (password: string): string | null => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};

/**
 * POST /api/auth/login
 * Validate credentials, issue JWT in httpOnly cookie (FR-01, FR-02, BR-01, BR-06, BR-07)
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: String(email) },
    });

    // User not found — return safe generic message (BR-06)
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Inactive account — return safe message (BR-07)
    if (!user.isActive) {
      res.status(403).json({ error: 'Your account is inactive. Please contact an administrator.' });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(String(password), user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Issue JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    // Set httpOnly cookie (SameSite=Strict for CSRF protection)
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Return user info (never return password data — BR-11)
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error: any) {
    console.error('Login error details:', error.message || error);
    res.status(500).json({ error: 'Unable to process login' });
  }
});

/**
 * POST /api/auth/logout
 * Clear cookie, invalidate session (FR-04, BR-10)
 */
router.post('/logout', authenticateToken, (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Return authenticated user identity and role (FR-05, BR-11)
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Unable to fetch user' });
  }
});

/**
 * POST /api/auth/change-password
 * Mandatory first-login password change (FR-03, BR-02, BR-08, BR-09)
 */
router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    // Validate passwords match
    if (!newPassword || !confirmPassword) {
      res.status(400).json({ error: 'New password and confirmation are required' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    // Validate password strength (BR-09)
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      res.status(400).json({ error: passwordError });
      return;
    }

    // Hash new password with bcrypt cost factor 10 (BR-08)
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
      },
    });

    // Issue a new JWT with updated mustChangePassword=false
    const tokenPayload = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      mustChangePassword: updatedUser.mustChangePassword,
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Unable to change password' });
  }
});

export default router;
