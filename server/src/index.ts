import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from './generated/prisma/client';

const app = express();
app.use(cors()); // เปิด CORS ให้ Frontend เรียกใช้งานได้
app.use(express.json());
const prisma = new PrismaClient();

// สร้าง Endpoint สำหรับ Health Check
app.get('/api/health', (req: Request, res: Response) => {
  // ส่ง HTTP 200 พร้อม JSON ตาม Acceptance criteria
  res.status(200).json({ 
    status: "ok", 
    service: "Tok TickIT API" 
  });
});

// Issue4 Category API
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    // ดึงข้อมูลผ่าน Prisma และจัดเรียง ID ตามลำดับที่คาดเดาได้
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, name: true } // คืนค่าเฉพาะ id และ name
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Unable to fetch categories" });
  }
});

// Issue4 Related Systems API
app.get('/api/related-systems', async (req: Request, res: Response) => {
  try {
    const systems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, name: true }
    });
    res.status(200).json(systems);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Unable to fetch related systems" });
  }
});

// Issue3 Requesters API
app.get('/api/requesters', async (req: Request, res: Response) => {
  try {
    const requesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, name: true, email: true }
    });
    res.status(200).json(requesters);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Unable to fetch requesters" });
  }
});

// Issue4 Create Ticket API — POST /api/tickets
app.post('/api/tickets', async (req: Request, res: Response) => {
  try {
    const { requesterId, categoryId, relatedSystemId, requestedPriority, summary, description } = req.body;

    // --- Validation ---
    const errors: Record<string, string> = {};

    if (!requesterId || typeof requesterId !== 'number') {
      errors.requesterId = 'requesterId is required and must be a number';
    }
    if (!categoryId || typeof categoryId !== 'number') {
      errors.categoryId = 'categoryId is required and must be a number';
    }
    if (!relatedSystemId || typeof relatedSystemId !== 'number') {
      errors.relatedSystemId = 'relatedSystemId is required and must be a number';
    }
    if (!requestedPriority || !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(requestedPriority)) {
      errors.requestedPriority = 'requestedPriority must be LOW, MEDIUM, HIGH, or CRITICAL';
    }
    if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
      errors.summary = 'summary is required';
    } else if (summary.trim().length > 200) {
      errors.summary = 'summary must be 200 characters or less';
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      errors.description = 'description is required';
    } else if (description.trim().length > 2000) {
      errors.description = 'description must be 2000 characters or less';
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: 'Validation failed', fields: errors });
      return;
    }

    // ตรวจสอบว่า requester มีอยู่และ active 
    const requester = await prisma.requesterUser.findFirst({
      where: { id: requesterId, isActive: true },
    });
    if (!requester) {
      res.status(400).json({ error: 'Validation failed', fields: { requesterId: 'Requester not found or inactive' } });
      return;
    }

    // สร้าง Ticket Number แบบ TKT-YYYYMMDD-NNNN
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // "20260825"
    const prefix = `TKT-${dateStr}-`;

    // หา sequence สูงสุดของวันนี้
    const lastTicket = await prisma.ticket.findFirst({
      where: { ticketNumber: { startsWith: prefix } },
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    });

    let sequence = 1;
    if (lastTicket) {
      // TKT-20260825-0001 → last segment after final '-'
      const lastSeg = lastTicket.ticketNumber.slice(lastTicket.ticketNumber.lastIndexOf('-') + 1);
      const lastSeq = parseInt(lastSeg, 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }
    const ticketNumber = `${prefix}${String(sequence).padStart(4, '0')}`;

    // บันทึก Ticket ลงฐานข้อมูล
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId,
        categoryId,
        relatedSystemId,
        requestedPriority,
        summary: summary.trim(),
        description: description.trim(),
        status: 'NEW',
      },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        requestedPriority: true,
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
    console.error("Database error:", error);
    res.status(500).json({ error: "Unable to create ticket" });
  }
});

// ---------------------------------------------------------------------------
// Issue #5 — Attachment endpoints
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

// Ensure uploads dir exists at startup
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer — store to disk with UUID filename, validate before saving
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
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`MIME_REJECTED:${file.mimetype}`));
    }
  },
});

// POST /api/tickets/:id/attachments — upload a file
app.post('/api/tickets/:id/attachments', (req: Request, res: Response) => {
  const ticketId = parseInt(String(req.params.id), 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: 'Invalid ticket id' });
    return;
  }

  upload.single('file')(req, res, async (err) => {
    // Handle multer errors (file size, MIME rejection)
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File exceeds the 5 MB limit' });
        return;
      }
      if (err instanceof Error && err.message.startsWith('MIME_REJECTED')) {
        res.status(400).json({ error: 'File type not allowed. Accepted: JPG, PNG, WEBP, PDF' });
        return;
      }
      res.status(500).json({ error: 'Upload failed' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    try {
      // Verify ticket exists
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) {
        // Best-effort cleanup — ignore if file already gone
        try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      // Enforce ≤5 active attachments per ticket
      const activeCount = await prisma.attachment.count({
        where: { ticketId, isRemoved: false },
      });
      if (activeCount >= 5) {
        try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
        res.status(400).json({ error: 'Ticket already has 5 active attachments' });
        return;
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
      res.status(500).json({ error: 'Unable to save attachment' });
    }
  });
});

// GET /api/tickets/:id/attachments — list all attachments (active + removed metadata)
app.get('/api/tickets/:id/attachments', async (req: Request, res: Response) => {
  const ticketId = parseInt(String(req.params.id), 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: 'Invalid ticket id' });
    return;
  }
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    const attachments = await prisma.attachment.findMany({
      where: { ticketId },
      orderBy: { uploadedAt: 'asc' },
      select: {
        id: true,
        originalFilename: true,
        mimeType: true,
        size: true,
        isRemoved: true,
        removedReason: true,
        removedAt: true,
        uploadedAt: true,
        ticketId: true,
      },
    });
    res.status(200).json(attachments);
  } catch (error) {
    console.error('Attachment list error:', error);
    res.status(500).json({ error: 'Unable to fetch attachments' });
  }
});

// GET /api/attachments/:id/download — download active file; 403 for removed
app.get('/api/attachments/:id/download', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid attachment id' });
    return;
  }
  try {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }
    if (attachment.isRemoved) {
      res.status(403).json({ error: 'This attachment has been removed and cannot be downloaded' });
      return;
    }
    const filePath = path.join(UPLOADS_DIR, attachment.storedFilename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found on server' });
      return;
    }
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalFilename}"`);
    res.setHeader('Content-Type', attachment.mimeType);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Unable to download attachment' });
  }
});

// DELETE /api/attachments/:id — soft-remove (reason required)
app.delete('/api/attachments/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid attachment id' });
    return;
  }

  const { reason } = req.body;
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    res.status(400).json({ error: 'A removal reason is required' });
    return;
  }
  if (reason.trim().length > 500) {
    res.status(400).json({ error: 'Reason must be 500 characters or less' });
    return;
  }

  try {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }
    if (attachment.isRemoved) {
      res.status(400).json({ error: 'Attachment is already removed' });
      return;
    }

    const updated = await prisma.attachment.update({
      where: { id },
      data: {
        isRemoved: true,
        removedReason: reason.trim(),
        removedAt: new Date(),
      },
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Soft-remove error:', error);
    res.status(500).json({ error: 'Unable to remove attachment' });
  }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;