import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient, Role, TicketStatus } from './generated/prisma/client';

const app = express();

// ---------------------------------------------------------------------------
// CORS — must send credentials for httpOnly cookie
// ---------------------------------------------------------------------------
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

interface JwtPayload {
  userId: number;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function setTokenCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24h in ms
    secure: process.env.NODE_ENV === 'production',
  });
}

// ---------------------------------------------------------------------------
// Extend Express Request with user
// ---------------------------------------------------------------------------
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ---------------------------------------------------------------------------
// Middleware: authenticate — validates JWT cookie and verifies user is active in DB (session invalidation)
// ---------------------------------------------------------------------------
async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Verify user exists and is active in database (invalidates session immediately upon deactivation)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true, mustChangePassword: true },
    });

    if (!user || !user.isActive) {
      res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Account is inactive or session has been invalidated' } });
      return;
    }

    req.user = {
      ...payload,
      role: user.role as Role,
      mustChangePassword: user.mustChangePassword,
    };
    next();
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Session expired or invalid' } });
  }
}

// ---------------------------------------------------------------------------
// Middleware: requirePasswordChange — if mustChangePassword, block all but
// change-password and logout (→ 403)
// ---------------------------------------------------------------------------
function requirePasswordChange(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) { next(); return; }
  const ALLOWED_PATHS = ['/api/auth/change-password', '/api/auth/logout', '/api/auth/me'];
  if (req.user.mustChangePassword && !ALLOWED_PATHS.includes(req.path)) {
    res.status(403).json({
      error: {
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'You must change your password before continuing.',
      },
    });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// Middleware: authorize(...roles) — checks role → 403 if unauthorized
// ---------------------------------------------------------------------------
function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' } });
      return;
    }
    next();
  };
}

// Convenience chains
const authOnly = [authenticate, requirePasswordChange];
const requesterOnly = [...authOnly, authorize(Role.REQUESTER)];
const staffOnly = [...authOnly, authorize(Role.IT_STAFF)];
const staffOrAdmin = [...authOnly, authorize(Role.IT_STAFF, Role.ADMINISTRATOR)];
const adminOnly = [...authOnly, authorize(Role.ADMINISTRATOR)];
const anyRole = [...authOnly, authorize(Role.REQUESTER, Role.IT_STAFF, Role.ADMINISTRATOR)];

// ---------------------------------------------------------------------------
// Password validation helper
// ---------------------------------------------------------------------------
function validatePassword(pw: string): string | null {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number';
  return null;
}

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'Tok TickIT API' });
});

// ===========================================================================
// AUTH ENDPOINTS
// ===========================================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const errors: Record<string, string> = {};

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'A valid email is required';
    }
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      errors.password = 'Password is required';
    }
    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', fields: errors } });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

    // Safe response — no info leak on whether email exists (BR-06)
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        error: { code: 'ACCOUNT_INACTIVE', message: 'Your account is inactive. Please contact an administrator.' },
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account is inactive. Please contact an administrator.',
      });
      return;
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
    const token = signToken(payload);
    setTokenCookie(res, token);

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Login failed. Please try again.' } });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', authenticate, (req: Request, res: Response) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
app.get('/api/auth/me', ...authOnly, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, mustChangePassword: true },
    });
    if (!user || !user) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'User not found' } });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to retrieve user' } });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const errors: Record<string, string> = {};

    const pwError = validatePassword(newPassword);
    if (pwError) errors.newPassword = pwError;
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', fields: errors } });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash, mustChangePassword: false },
      select: { id: true, name: true, email: true, role: true, mustChangePassword: true },
    });

    // Re-issue token with mustChangePassword = false
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: false,
    };
    setTokenCookie(res, signToken(payload));

    res.status(200).json({ user });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to change password' } });
  }
});

// ===========================================================================
// REFERENCE DATA
// ===========================================================================

app.get('/api/categories', ...anyRole, async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to fetch categories' } });
  }
});

app.get('/api/related-systems', ...anyRole, async (_req: Request, res: Response) => {
  try {
    const systems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    });
    res.status(200).json(systems);
  } catch (error) {
    console.error('Related systems error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to fetch related systems' } });
  }
});

// ===========================================================================
// REQUESTER TICKET ENDPOINTS
// ===========================================================================

// POST /api/tickets — Create Ticket (Requester only)
app.post('/api/tickets', ...requesterOnly, async (req: Request, res: Response) => {
  try {
    const { categoryId, relatedSystemId, requestedPriority, summary, description } = req.body;
    const requesterId = req.user!.userId;

    const errors: Record<string, string> = {};
    if (!categoryId || typeof categoryId !== 'number') errors.categoryId = 'categoryId is required and must be a number';
    if (!relatedSystemId || typeof relatedSystemId !== 'number') errors.relatedSystemId = 'relatedSystemId is required and must be a number';
    if (!requestedPriority || !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(requestedPriority)) errors.requestedPriority = 'requestedPriority must be LOW, MEDIUM, HIGH, or CRITICAL';
    if (!summary || typeof summary !== 'string' || summary.trim().length === 0) errors.summary = 'summary is required';
    else if (summary.trim().length > 200) errors.summary = 'summary must be 200 characters or less';
    if (!description || typeof description !== 'string' || description.trim().length === 0) errors.description = 'description is required';
    else if (description.trim().length > 2000) errors.description = 'description must be 2000 characters or less';

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', fields: errors } });
      return;
    }

    // Generate ticket number TKT-YYYYMMDD-NNNN
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `TKT-${dateStr}-`;
    const lastTicket = await prisma.ticket.findFirst({
      where: { ticketNumber: { startsWith: prefix } },
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    });
    let sequence = 1;
    if (lastTicket) {
      const lastSeg = lastTicket.ticketNumber.slice(lastTicket.ticketNumber.lastIndexOf('-') + 1);
      const lastSeq = parseInt(lastSeg, 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }
    const ticketNumber = `${prefix}${String(sequence).padStart(4, '0')}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId,                        // from JWT, not client body (BR-03)
        categoryId,
        relatedSystemId,
        requestedPriority,
        itPriority: requestedPriority,      // default copy (BR-13)
        summary: summary.trim(),
        description: description.trim(),
        status: 'NEW',
      },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        requestedPriority: true,
        itPriority: true,
        summary: true,
        description: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to create ticket' } });
  }
});

// GET /api/tickets — List own Tickets (Requester only)
app.get('/api/tickets', ...requesterOnly, async (req: Request, res: Response) => {
  try {
    const requesterId = req.user!.userId;
    const { search, status, category, requestedPriority, sort, page, limit } = req.query;

    const pageNum = parseInt(String(page)) || 1;
    const limitNum = parseInt(String(limit)) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { requesterId };  // always scoped to authenticated user (AC-03)

    if (status && status !== '') where.status = String(status);
    if (category && category !== '') {
      const catId = parseInt(String(category), 10);
      if (!isNaN(catId)) where.categoryId = catId;
    }
    if (requestedPriority && requestedPriority !== '') where.requestedPriority = String(requestedPriority);
    if (search && String(search).trim() !== '') {
      where.OR = [
        { ticketNumber: { contains: String(search), mode: 'insensitive' } },
        { summary: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const orderBy: any = sort === 'date_asc' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const [totalCount, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where, orderBy, skip, take: limitNum,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
        },
      }),
    ]);

    res.status(200).json({
      data: tickets,
      meta: {
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        currentPage: pageNum,
      },
    });
  } catch (error) {
    console.error('List tickets error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to fetch tickets' } });
  }
});

// GET /api/tickets/:id — Ticket Detail (Requester: own only; 404 not 403 for others)
app.get('/api/tickets/:id', ...requesterOnly, async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId) || !Number.isInteger(ticketId)) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } });
    return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true } },
        attachments: {
          orderBy: { uploadedAt: 'asc' },
          select: { id: true, originalFilename: true, mimeType: true, size: true, isRemoved: true, removedReason: true, removedAt: true, uploadedAt: true, ticketId: true },
        },
      },
    });

    // 404 (not 403) for not-owned ticket — no info leak (BR-06, AC-03)
    if (!ticket || ticket.requesterId !== req.user!.userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
      return;
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Ticket detail error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to fetch ticket' } });
  }
});

// PATCH /api/tickets/:id/requester-resolved — Requester indicates "Problem Appears Resolved" (FR-12)
app.patch('/api/tickets/:id/requester-resolved', ...requesterOnly, async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } }); return; }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.requesterId !== req.user!.userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
      return;
    }
    if (ticket.status !== TicketStatus.IN_PROGRESS && ticket.status !== TicketStatus.WAITING_FOR_REQUESTER) {
      res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'This action is only permitted when ticket is In Progress or Waiting for Requester' } });
      return;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { requesterIndicatedResolved: true },
      select: { id: true, requesterIndicatedResolved: true, status: true },
    });
    res.status(200).json({ ticket: updated });
  } catch (error) {
    console.error('Requester resolved error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to update ticket' } });
  }
});

// ===========================================================================
// ATTACHMENT ENDPOINTS
// ===========================================================================

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`MIME_REJECTED:${file.mimetype}`));
  },
});

// POST /api/tickets/:id/attachments
app.post('/api/tickets/:id/attachments', ...requesterOnly, (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } }); return; }

  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds the 5 MB limit' } }); return;
      }
      if (err instanceof Error && err.message.startsWith('MIME_REJECTED')) {
        res.status(400).json({ error: { code: 'MIME_REJECTED', message: 'File type not allowed. Accepted: JPG, PNG, WEBP, PDF' } }); return;
      }
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Upload failed' } }); return;
    }
    if (!req.file) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'No file provided' } }); return; }

    try {
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) {
        try { fs.unlinkSync(req.file.path); } catch { /**/ }
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return;
      }
      if (ticket.requesterId !== req.user!.userId) {
        try { fs.unlinkSync(req.file.path); } catch { /**/ }
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return;  // no info leak
      }

      const activeCount = await prisma.attachment.count({ where: { ticketId, isRemoved: false } });
      if (activeCount >= 5) {
        try { fs.unlinkSync(req.file.path); } catch { /**/ }
        res.status(400).json({ error: { code: 'ATTACHMENT_LIMIT', message: 'Ticket already has 5 active attachments' } }); return;
      }

      const attachment = await prisma.attachment.create({
        data: {
          ticketId,
          originalFilename: req.file.originalname,
          storedFilename: req.file.filename,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
      });
      res.status(201).json(attachment);
    } catch (error) {
      console.error('Attachment create error:', error);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to save attachment' } });
    }
  });
});

// GET /api/tickets/:id/attachments
app.get('/api/tickets/:id/attachments', ...authOnly, authorize(Role.REQUESTER, Role.IT_STAFF), async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } }); return; }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }

    // Requester can only see own ticket's attachments
    if (req.user!.role === Role.REQUESTER && ticket.requesterId !== req.user!.userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return;
    }

    const attachments = await prisma.attachment.findMany({
      where: { ticketId },
      orderBy: { uploadedAt: 'asc' },
      select: { id: true, originalFilename: true, mimeType: true, size: true, isRemoved: true, removedReason: true, removedAt: true, uploadedAt: true, ticketId: true },
    });
    res.status(200).json(attachments);
  } catch (error) {
    console.error('Attachment list error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to fetch attachments' } });
  }
});

// GET /api/attachments/:id/download
app.get('/api/attachments/:id/download', ...authOnly, authorize(Role.REQUESTER, Role.IT_STAFF), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid attachment id' } }); return; }

  try {
    const attachment = await prisma.attachment.findUnique({ where: { id }, include: { ticket: true } });
    if (!attachment) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attachment not found' } }); return; }

    if (req.user!.role === Role.REQUESTER && attachment.ticket.requesterId !== req.user!.userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attachment not found' } }); return;
    }
    if (attachment.isRemoved) {
      res.status(403).json({ error: { code: 'REMOVED', message: 'This attachment has been removed and cannot be downloaded' } }); return;
    }

    const filePath = path.join(UPLOADS_DIR, attachment.storedFilename);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found on server' } }); return; }

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalFilename}"`);
    res.setHeader('Content-Type', attachment.mimeType);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to download attachment' } });
  }
});

// DELETE /api/attachments/:id
app.delete('/api/attachments/:id', ...requesterOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid attachment id' } }); return; }

  const { reason } = req.body;
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A removal reason is required' } }); return;
  }
  if (reason.trim().length > 500) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Reason must be 500 characters or less' } }); return;
  }

  try {
    const attachment = await prisma.attachment.findUnique({ where: { id }, include: { ticket: true } });
    if (!attachment) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attachment not found' } }); return; }
    if (attachment.ticket.requesterId !== req.user!.userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attachment not found' } }); return;
    }
    if (attachment.isRemoved) {
      res.status(400).json({ error: { code: 'ALREADY_REMOVED', message: 'Attachment is already removed' } }); return;
    }

    const updated = await prisma.attachment.update({
      where: { id },
      data: { isRemoved: true, removedReason: reason.trim(), removedAt: new Date() },
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Soft-remove error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to remove attachment' } });
  }
});

// ===========================================================================
// PUBLIC COMMENTS
// ===========================================================================

// POST /api/tickets/:id/comments — Requester (own) or IT Staff
app.post('/api/tickets/:id/comments', ...authOnly, authorize(Role.REQUESTER, Role.IT_STAFF), async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } }); return; }

  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Comment content is required' } }); return;
  }
  if (content.trim().length > 2000) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Comment content must be 2000 characters or less' } }); return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }

    // Requester can only comment on own ticket
    if (req.user!.role === Role.REQUESTER && ticket.requesterId !== req.user!.userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return;
    }

    const comment = await prisma.comment.create({
      data: { ticketId, authorId: req.user!.userId, content: content.trim() },
      select: {
        id: true,
        ticketId: true,
        authorId: true,
        author: { select: { name: true, role: true } },
        content: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      comment: {
        id: comment.id,
        ticketId: comment.ticketId,
        authorId: comment.authorId,
        authorName: comment.author.name,
        authorRole: comment.author.role,
        content: comment.content,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    console.error('Comment create error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to create comment' } });
  }
});

// GET /api/tickets/:id/comments — Requester (own) / IT Staff / Admin
app.get('/api/tickets/:id/comments', ...anyRole, async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } }); return; }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }

    if (req.user!.role === Role.REQUESTER && ticket.requesterId !== req.user!.userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return;
    }

    const raw = await prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        ticketId: true,
        authorId: true,
        author: { select: { name: true, role: true } },
        content: true,
        createdAt: true,
      },
    });

    const comments = raw.map(c => ({
      id: c.id, ticketId: c.ticketId, authorId: c.authorId,
      authorName: c.author.name, authorRole: c.author.role,
      content: c.content, createdAt: c.createdAt,
    }));

    res.status(200).json({ comments });
  } catch (error) {
    console.error('Comments list error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to fetch comments' } });
  }
});

// ===========================================================================
// IT STAFF ENDPOINTS
// ===========================================================================

// Status transition matrix (BR-16)
const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.NEW]:                   [TicketStatus.OPEN, TicketStatus.CANCELLED],
  [TicketStatus.OPEN]:                  [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  [TicketStatus.IN_PROGRESS]:           [TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.WAITING_FOR_REQUESTER]: [TicketStatus.IN_PROGRESS],
  [TicketStatus.RESOLVED]:              [TicketStatus.CLOSED, TicketStatus.REOPENED],
  [TicketStatus.CLOSED]:                [TicketStatus.REOPENED],
  [TicketStatus.REOPENED]:              [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  [TicketStatus.CANCELLED]:             [],
};

const STAFF_TICKET_SELECT = {
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  summary: true,
  description: true,
  requestedPriority: true,
  itPriority: true,
  status: true,
  requesterIndicatedResolved: true,
  category: { select: { id: true, name: true } },
  relatedSystem: { select: { id: true, name: true } },
  requester: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true } },
};

// GET /api/staff/tickets — IT Staff Ticket Queue
app.get('/api/staff/tickets', ...staffOnly, async (req: Request, res: Response) => {
  try {
    const { search, status, itPriority, ownerId, sort, page, pageSize } = req.query;

    const VALID_PAGE_SIZES = [10, 25, 50];
    const pageSizeNum = VALID_PAGE_SIZES.includes(Number(pageSize)) ? Number(pageSize) : 10;
    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const skip = (pageNum - 1) * pageSizeNum;

    const where: any = {};

    if (status && status !== '') {
      const statuses = String(status).split(',').filter(s => Object.values(TicketStatus).includes(s as TicketStatus));
      if (statuses.length > 0) where.status = { in: statuses };
    }
    if (itPriority && itPriority !== '') where.itPriority = String(itPriority);
    if (ownerId === 'unassigned') where.ownerId = null;
    else if (ownerId && ownerId !== '') {
      const ownerIdNum = parseInt(String(ownerId), 10);
      if (!isNaN(ownerIdNum)) where.ownerId = ownerIdNum;
    }
    if (search && String(search).trim() !== '') {
      where.OR = [
        { ticketNumber: { contains: String(search), mode: 'insensitive' } },
        { summary: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    // Sort parsing: e.g. "createdAt_desc", "itPriority_asc"
    let orderBy: any = { createdAt: 'desc' };
    if (sort && typeof sort === 'string') {
      const [field, dir] = String(sort).split('_');
      const allowedFields = ['createdAt', 'updatedAt', 'ticketNumber', 'itPriority', 'requestedPriority', 'status'];
      if (allowedFields.includes(field) && (dir === 'asc' || dir === 'desc')) {
        orderBy = { [field]: dir };
      }
    }

    const [totalCount, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where, orderBy, skip, take: pageSizeNum,
        select: { ...STAFF_TICKET_SELECT, description: false, requesterIndicatedResolved: false },
      }),
    ]);

    res.status(200).json({
      tickets,
      pagination: {
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSizeNum),
      },
    });
  } catch (error) {
    console.error('Staff queue error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to fetch ticket queue' } });
  }
});

// GET /api/staff/tickets/:id — IT Staff Ticket Detail
app.get('/api/staff/tickets/:id', ...staffOnly, async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } }); return; }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        ...STAFF_TICKET_SELECT,
        attachments: {
          orderBy: { uploadedAt: 'asc' },
          select: { id: true, originalFilename: true, mimeType: true, size: true, isRemoved: true, removedReason: true, removedAt: true, uploadedAt: true, ticketId: true },
        },
      },
    });

    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }

    const permittedStatuses = STATUS_TRANSITIONS[ticket.status] || [];

    res.status(200).json({ ticket: { ...ticket, permittedStatuses } });
  } catch (error) {
    console.error('Staff ticket detail error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to fetch ticket' } });
  }
});

// PATCH /api/staff/tickets/:id/owner — claim/assign/reassign owner
app.patch('/api/staff/tickets/:id/owner', ...staffOnly, async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } }); return; }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }

    let newOwnerId: number | null;
    const { ownerId } = req.body;

    if (ownerId === null) {
      newOwnerId = null;  // unassign
    } else if (ownerId === undefined || ownerId === 'self') {
      newOwnerId = req.user!.userId;  // self-claim
    } else if (typeof ownerId === 'number') {
      // Validate target user
      const targetUser = await prisma.user.findUnique({ where: { id: ownerId } });
      if (!targetUser || !targetUser.isActive || (targetUser.role !== Role.IT_STAFF && targetUser.role !== Role.ADMINISTRATOR)) {
        res.status(400).json({ error: { code: 'INVALID_OWNER', message: 'Target user must be an active IT Staff or Administrator' } }); return;
      }
      newOwnerId = ownerId;
    } else {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'ownerId must be a number, null, or "self"' } }); return;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { ownerId: newOwnerId },
      select: { id: true, owner: { select: { id: true, name: true } } },
    });
    res.status(200).json({ ticket: updated });
  } catch (error) {
    console.error('Assign owner error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to update ticket owner' } });
  }
});

// PATCH /api/staff/tickets/:id/priority — update IT Priority
app.patch('/api/staff/tickets/:id/priority', ...staffOnly, async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } }); return; }

  const { itPriority } = req.body;
  if (!itPriority || !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(itPriority)) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'itPriority must be LOW, MEDIUM, HIGH, or CRITICAL' } }); return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { itPriority },
      select: { id: true, itPriority: true, requestedPriority: true },
    });
    res.status(200).json({ ticket: updated });
  } catch (error) {
    console.error('Update priority error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to update priority' } });
  }
});

// PATCH /api/staff/tickets/:id/status — update status (validates transition matrix)
app.patch('/api/staff/tickets/:id/status', ...staffOnly, async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } }); return; }

  const { status } = req.body;
  if (!status || !Object.values(TicketStatus).includes(status as TicketStatus)) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid status value' } }); return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }

    const permitted = STATUS_TRANSITIONS[ticket.status];
    if (!permitted.includes(status as TicketStatus)) {
      res.status(400).json({
        error: { code: 'INVALID_TRANSITION', message: `Cannot transition from ${ticket.status} to ${status}` },
      }); return;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
      select: { id: true, status: true },
    });

    const permittedStatuses = STATUS_TRANSITIONS[updated.status as TicketStatus] || [];
    res.status(200).json({ ticket: { ...updated, permittedStatuses } });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to update status' } });
  }
});

// POST /api/staff/tickets/:id/notes — create internal note (IT Staff only)
app.post('/api/staff/tickets/:id/notes', ...staffOnly, async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } }); return; }

  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Note content is required' } }); return;
  }
  if (content.trim().length > 2000) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Note content must be 2000 characters or less' } }); return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }

    const note = await prisma.internalNote.create({
      data: { ticketId, authorId: req.user!.userId, content: content.trim() },
      select: {
        id: true, ticketId: true, authorId: true,
        author: { select: { name: true } },
        content: true, createdAt: true,
      },
    });

    res.status(201).json({
      note: {
        id: note.id, ticketId: note.ticketId, authorId: note.authorId,
        authorName: note.author.name, content: note.content, createdAt: note.createdAt,
      },
    });
  } catch (error) {
    console.error('Note create error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to create note' } });
  }
});

// GET /api/staff/tickets/:id/notes — IT Staff or Administrator (AC-04)
app.get('/api/staff/tickets/:id/notes', ...staffOrAdmin, async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  if (isNaN(ticketId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid ticket id' } }); return; }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }

    const raw = await prisma.internalNote.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, ticketId: true, authorId: true,
        author: { select: { name: true } },
        content: true, createdAt: true,
      },
    });

    const notes = raw.map(n => ({
      id: n.id, ticketId: n.ticketId, authorId: n.authorId,
      authorName: n.author.name, content: n.content, createdAt: n.createdAt,
    }));

    res.status(200).json({ notes });
  } catch (error) {
    console.error('Notes list error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to fetch notes' } });
  }
});

// ===========================================================================
// ADMINISTRATOR USER MANAGEMENT ENDPOINTS
// ===========================================================================

// GET /api/admin/users
app.get('/api/admin/users', ...adminOnly, async (req: Request, res: Response) => {
  try {
    const { search, role } = req.query;
    const where: any = {};

    if (role && Object.values(Role).includes(role as Role)) where.role = role;
    if (search && String(search).trim() !== '') {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    res.status(200).json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to fetch users' } });
  }
});

// POST /api/admin/users
app.post('/api/admin/users', ...adminOnly, async (req: Request, res: Response) => {
  try {
    const { name, email, role, password, isActive } = req.body;
    const errors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) errors.name = 'Name is required';
    else if (name.trim().length > 200) errors.name = 'Name must be 200 characters or less';
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'A valid email is required';
    if (!role || !Object.values(Role).includes(role as Role)) errors.role = 'Role must be REQUESTER, IT_STAFF, or ADMINISTRATOR';
    const pwError = validatePassword(password);
    if (pwError) errors.password = pwError;

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', fields: errors } }); return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
        isActive: isActive !== false,
        mustChangePassword: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, mustChangePassword: true, createdAt: true },
    });

    res.status(201).json({ user });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ error: { code: 'DUPLICATE_EMAIL', message: 'This email address is already in use' } }); return;
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to create user' } });
  }
});

// PATCH /api/admin/users/:id
app.patch('/api/admin/users/:id', ...adminOnly, async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid user id' } }); return; }

  try {
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }

    const { name, email, role, isActive } = req.body;
    const errors: Record<string, string> = {};

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) errors.name = 'Name is required';
    if (name !== undefined && name.trim().length > 200) errors.name = 'Name must be 200 characters or less';
    if (email !== undefined && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) errors.email = 'A valid email is required';
    if (role !== undefined && !Object.values(Role).includes(role as Role)) errors.role = 'Invalid role';

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', fields: errors } }); return;
    }

    // BR-22: Last active Administrator protection (evaluated before self-deactivation)
    if ((isActive === false || (role && role !== Role.ADMINISTRATOR)) && existingUser.role === Role.ADMINISTRATOR) {
      const activeAdminCount = await prisma.user.count({
        where: { role: Role.ADMINISTRATOR, isActive: true, id: { not: userId } },
      });
      if (activeAdminCount === 0) {
        res.status(409).json({ error: { code: 'LAST_ADMIN', message: 'Cannot deactivate or change role of the last active Administrator' } }); return;
      }
    }

    // BR-21: Cannot deactivate own account (when other active admins exist)
    if (isActive === false && userId === req.user!.userId) {
      res.status(403).json({ error: { code: 'SELF_DEACTIVATION', message: 'You cannot deactivate your own account' } }); return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.status(200).json({ user: updated });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ error: { code: 'DUPLICATE_EMAIL', message: 'This email address is already in use' } }); return;
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to update user' } });
  }
});

// POST /api/admin/users/:id/reset-password
app.post('/api/admin/users/:id/reset-password', ...adminOnly, async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid user id' } }); return; }

  try {
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }

    const { password, confirmPassword } = req.body;
    const errors: Record<string, string> = {};

    const pwError = validatePassword(password);
    if (pwError) errors.password = pwError;
    if (!confirmPassword) errors.confirmPassword = 'Confirm password is required';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', fields: errors } }); return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: true },
    });

    res.status(200).json({ message: 'Password reset successfully. The user must change their password at next login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unable to reset password' } });
  }
});

// ===========================================================================
// Start server
// ===========================================================================
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;