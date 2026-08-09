import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(cors()); // เปิด CORS ให้ Frontend เรียกใช้งานได้
app.use(express.json());

// สร้าง Endpoint สำหรับ Health Check
app.get('/api/health', (req: Request, res: Response) => {
  // ส่ง HTTP 200 พร้อม JSON ตาม Acceptance criteria
  res.status(200).json({ 
    status: "ok", 
    service: "Tok TickIT API" 
  });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app; // export app เพื่อนำไปใช้กับ Supertest