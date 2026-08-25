import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import express, { Request, Response } from 'express';
import cors from 'cors';
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

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;