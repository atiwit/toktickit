import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    ticket: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../src/generated/prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/tickets — My Tickets', () => {
  it('API-04: owned tickets → 200 with correct pagination metadata', async () => {
    mockPrisma.ticket.count.mockResolvedValue(12);
    mockPrisma.ticket.findMany.mockResolvedValue([
      { id: 1, ticketNumber: 'TKT-20260825-0001', summary: 'Ticket 1' },
      { id: 2, ticketNumber: 'TKT-20260825-0002', summary: 'Ticket 2' },
    ]);

    const res = await request(app)
      .get('/api/tickets?page=2&limit=10')
      .set('X-Requester-Id', '1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({
      totalCount: 12,
      totalPages: 2,
      currentPage: 2,
    });
    
    // verify findMany skip/take
    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: { requesterId: 1 }
      })
    );
  });

  it('Search/filter returns filtered results', async () => {
    mockPrisma.ticket.count.mockResolvedValue(1);
    mockPrisma.ticket.findMany.mockResolvedValue([
      { id: 3, ticketNumber: 'TKT-20260825-0003', summary: 'Login issue' },
    ]);

    const res = await request(app)
      .get('/api/tickets?search=Login&status=OPEN&category=2&sort=date_asc')
      .set('X-Requester-Id', '1');

    expect(res.status).toBe(200);
    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          requesterId: 1,
          status: 'OPEN',
          categoryId: 2,
          OR: [
            { ticketNumber: { contains: 'Login', mode: 'insensitive' } },
            { summary: { contains: 'Login', mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'asc' }
      })
    );
  });

  it('Cross-requester access → 403', async () => {
    const res = await request(app)
      .get('/api/tickets?requesterId=2')
      .set('X-Requester-Id', '1');

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/cross-requester/i);
  });
  
  it('Missing requester context returns 401', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
  });
});
