import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app  from './index';

describe('Server', () => {
  it('should return ok for health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
