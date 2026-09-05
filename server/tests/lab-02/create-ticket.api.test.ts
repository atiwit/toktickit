

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/generated/prisma/client', () => {
  const mockRequester = { id: 1, name: 'Alice', email: 'alice@example.com', isActive: true };
  const mockCreatedTicket = {
    id: 1,
    ticketNumber: 'TKT-20260825-0001',
    status: 'NEW',
    requestedPriority: 'MEDIUM',
    summary: 'Cannot log in to VPN',
    description: 'I get an authentication error whenever I try to connect to the VPN from home.',
    createdAt: new Date('2026-08-25T07:00:00.000Z'),
    category: { id: 1, name: 'Account and Access' },
    relatedSystem: { id: 3, name: 'VPN' },
    requester: { id: 1, name: 'Alice' },
  };

  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      requesterUser: {
        findFirst: vi.fn().mockResolvedValue(mockRequester),
      },
      ticket: {
        findFirst: vi.fn().mockResolvedValue(null), // no previous ticket → sequence starts at 1
        create: vi.fn().mockResolvedValue(mockCreatedTicket),
      },
    })),
  };
});

import app from '../../src/index';

const VALID_PAYLOAD = {
  requesterId: 1,
  categoryId: 1,
  relatedSystemId: 3,
  requestedPriority: 'MEDIUM',
  summary: 'Cannot log in to VPN',
  description: 'I get an authentication error whenever I try to connect to the VPN from home.',
};

describe('API-01 — POST /api/tickets (valid body)', () => {
  it('returns HTTP 201', async () => {
    const res = await request(app).post('/api/tickets').send(VALID_PAYLOAD);
    expect(res.status).toBe(201);
  });

  it('returns a ticketNumber in the response body', async () => {
    const res = await request(app).post('/api/tickets').send(VALID_PAYLOAD);
    expect(res.body).toHaveProperty('ticketNumber');
    expect(typeof res.body.ticketNumber).toBe('string');
  });

  it('ticketNumber matches the TKT-YYYYMMDD-NNNN format', async () => {
    const res = await request(app).post('/api/tickets').send(VALID_PAYLOAD);
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{8}-\d{4}$/);
  });

  it('response includes status, summary, category, relatedSystem, requester', async () => {
    const res = await request(app).post('/api/tickets').send(VALID_PAYLOAD);
    expect(res.body).toHaveProperty('status', 'NEW');
    expect(res.body).toHaveProperty('summary', 'Cannot log in to VPN');
    expect(res.body.category).toHaveProperty('name');
    expect(res.body.relatedSystem).toHaveProperty('name');
    expect(res.body.requester).toHaveProperty('name');
  });
});

describe('API-02 — POST /api/tickets (missing summary)', () => {
  it('returns HTTP 400', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ ...VALID_PAYLOAD, summary: '' });
    expect(res.status).toBe(400);
  });

  it('returns error with "fields.summary" key', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ ...VALID_PAYLOAD, summary: '' });
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('fields');
    expect(res.body.fields).toHaveProperty('summary');
  });

  it('summary error message is a non-empty string', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ ...VALID_PAYLOAD, summary: '' });
    expect(typeof res.body.fields.summary).toBe('string');
    expect(res.body.fields.summary.length).toBeGreaterThan(0);
  });

  it('summary over 200 chars also returns 400 with summary error', async () => {
    const longSummary = 'A'.repeat(201);
    const res = await request(app)
      .post('/api/tickets')
      .send({ ...VALID_PAYLOAD, summary: longSummary });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('summary');
  });
});

describe('API-02 (extended) — POST /api/tickets (other missing fields)', () => {
  it('missing description → 400 + fields.description', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ ...VALID_PAYLOAD, description: '' });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('description');
  });

  it('missing requestedPriority → 400 + fields.requestedPriority', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ ...VALID_PAYLOAD, requestedPriority: '' });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('requestedPriority');
  });

  it('invalid requestedPriority value → 400 + fields.requestedPriority', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ ...VALID_PAYLOAD, requestedPriority: 'URGENT' }); // not in enum
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('requestedPriority');
  });

  it('multiple missing fields → 400 + multiple field errors', async () => {
    const res = await request(app).post('/api/tickets').send({
      requesterId: 1,
      categoryId: 1,
      relatedSystemId: 3,
    });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields).length).toBeGreaterThan(1);
  });
});

describe('API-03 — POST /api/tickets (invalid requesterId)', () => {
  it('missing requesterId → 400', async () => {
    const { requesterId: _removed, ...withoutId } = VALID_PAYLOAD;
    const res = await request(app).post('/api/tickets').send(withoutId);
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('requesterId');
  });

  it('requesterId as string instead of number → 400', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ ...VALID_PAYLOAD, requesterId: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('requesterId');
  });

  it('missing categoryId → 400 + fields.categoryId', async () => {
    const { categoryId: _removed, ...withoutCategory } = VALID_PAYLOAD;
    const res = await request(app).post('/api/tickets').send(withoutCategory);
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('categoryId');
  });
});
