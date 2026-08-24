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
      orderBy: { id: 'asc' },
      select: { id: true, name: true } // คืนค่าเฉพาะ id และ name
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Unable to fetch categories" });
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

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app; // export app เพื่อนำไปใช้กับ Supertest