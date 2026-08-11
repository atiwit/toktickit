import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/src/index'; 

describe('Health Check API', () => {
  it('GET /api/health returns HTTP 200 and correct JSON', async () => {
    const response = await request(app).get('/api/health');
    
    // ตรวจสอบ HTTP Status
    expect(response.status).toBe(200);
    
    // ตรวจสอบข้อมูล JSON
    expect(response.body).toEqual({
      status: "ok",
      service: "Tok TickIT API"
    });
  });
});