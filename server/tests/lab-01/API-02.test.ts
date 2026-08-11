import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../server/src/index';

// Mock PrismaClient to avoid requiring a running database during tests
import { vi } from 'vitest';
vi.mock('../../server/src/generated/prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => {
      return {
        category: {
          findMany: vi.fn().mockResolvedValue([
            { id: 1, name: 'Account and Access' },
            { id: 2, name: 'Hardware' },
            { id: 3, name: 'Software' },
            { id: 4, name: 'Network' }
          ])
        }
      };
    })
  };
});
describe('GET /api/categories', () => {
  it('should return the seeded categories with status 200', async () => {
    const response = await request(app).get('/api/categories');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(4);
    
    // ตรวจสอบโครงสร้างข้อมูลว่ามี id และ name
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
  });
});