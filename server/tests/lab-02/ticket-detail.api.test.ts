import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

// ── Prisma mock ───────────────────────────────────────────────────────────────

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    ticket: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../src/generated/prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockTicket = {
  id: 1,
  ticketNumber: 'TKT-20260825-0001',
  status: 'NEW',
  requestedPriority: 'HIGH',
  summary: 'Laptop screen flickering',
  description: 'The screen flickers when on battery power.',
  requesterId: 1,
  categoryId: 1,
  relatedSystemId: 2,
  createdAt: new Date('2026-08-25T10:00:00Z'),
  updatedAt: new Date('2026-08-25T10:00:00Z'),
  category: { id: 1, name: 'Hardware' },
  relatedSystem: { id: 2, name: 'ERP System' },
  requester: { id: 1, name: 'Alice', email: 'alice@example.com' },
  attachments: [],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/tickets/:id — Ticket Detail', () => {
  it('API-05: owned ticket → 200 with full data', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);

    const res = await request(app)
      .get('/api/tickets/1')
      .set('X-Requester-Id', '1');

    expect(res.status).toBe(200);
    expect(res.body.ticketNumber).toBe('TKT-20260825-0001');
    expect(res.body.summary).toBe('Laptop screen flickering');
    expect(res.body.description).toBeDefined();
    expect(res.body.category).toEqual({ id: 1, name: 'Hardware' });
    expect(res.body.relatedSystem).toEqual({ id: 2, name: 'ERP System' });
    expect(res.body.requester).toMatchObject({ id: 1, name: 'Alice' });
    expect(Array.isArray(res.body.attachments)).toBe(true);

    expect(mockPrisma.ticket.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
  });

  it('API-06 / AC-03: wrong Requester → 403, data NOT returned', async () => {
    // Ticket belongs to requesterId: 1, but request comes from requesterId: 2
    mockPrisma.ticket.findUnique.mockResolvedValue({ ...mockTicket, requesterId: 1 });

    const res = await request(app)
      .get('/api/tickets/1')
      .set('X-Requester-Id', '2');

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/permission/i);
    // Ensure no ticket data is leaked
    expect(res.body.ticketNumber).toBeUndefined();
    expect(res.body.summary).toBeUndefined();
  });

  it('Ticket not found → 404', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/tickets/9999')
      .set('X-Requester-Id', '1');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Ticket not found');
  });

  it('Missing requester context → 401', async () => {
    const res = await request(app).get('/api/tickets/1');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing requester/i);
  });

  it('Invalid ticket id → 400', async () => {
    const res = await request(app)
      .get('/api/tickets/not-a-number')
      .set('X-Requester-Id', '1');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid ticket id/i);
  });
});
