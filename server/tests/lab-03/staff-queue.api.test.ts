import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// mockupdata
const { mockPrismaInstance, inlineTickets } = vi.hoisted(() => {
  const inlineTickets = [
    {
      id: 1,
      ticketNumber: 'TKT-20260913-0001',
      createdAt: new Date('2026-09-13T10:00:00Z'),
      updatedAt: new Date('2026-09-13T12:00:00Z'),
      summary: 'Printer not working on floor 3',
      status: 'IN_PROGRESS',
      requestedPriority: 'HIGH',
      itPriority: 'CRITICAL',
      ownerId: 2,
      category: { id: 1, name: 'Hardware' },
      requester: { id: 10, name: 'Jane Requester' },
      owner: { id: 2, name: 'IT Staff A' },
    },
    {
      id: 2,
      ticketNumber: 'TKT-20260913-0002',
      createdAt: new Date('2026-09-13T09:00:00Z'),
      updatedAt: new Date('2026-09-13T09:30:00Z'),
      summary: 'VPN login failure',
      status: 'NEW',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      ownerId: null,
      category: { id: 2, name: 'Network' },
      requester: { id: 11, name: 'Bob Requester' },
      owner: null,
    },
    {
      id: 3,
      ticketNumber: 'TKT-20260913-0003',
      createdAt: new Date('2026-09-13T08:00:00Z'),
      updatedAt: new Date('2026-09-13T08:45:00Z'),
      summary: 'Software installation request',
      status: 'OPEN',
      requestedPriority: 'LOW',
      itPriority: 'LOW',
      ownerId: 2,
      category: { id: 3, name: 'Software' },
      requester: { id: 12, name: 'Carol Requester' },
      owner: { id: 2, name: 'IT Staff A' },
    },
  ];

  const mockInstance = {
    user: {
      findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
        if (where?.id === 99) {
          return {
            id: 99,
            name: 'Requester User',
            email: 'req@example.com',
            role: 'REQUESTER',
            isActive: true,
            mustChangePassword: false,
            passwordHash: '$2b$10$hashedpassword',
          };
        }
        return {
          id: 1,
          name: 'Test IT Staff',
          email: 'staff@example.com',
          role: 'IT_STAFF',
          isActive: true,
          mustChangePassword: false,
          passwordHash: '$2b$10$hashedpassword',
        };
      }),
    },
    ticket: {
      findMany: vi.fn().mockResolvedValue(inlineTickets),
      count: vi.fn().mockResolvedValue(inlineTickets.length),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    requesterUser: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    category: { findMany: vi.fn().mockResolvedValue([]) },
    relatedSystem: { findMany: vi.fn().mockResolvedValue([]) },
    attachment: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    comment: { findMany: vi.fn().mockResolvedValue([]) },
    internalNote: { findMany: vi.fn().mockResolvedValue([]) },
  };

  return { mockPrismaInstance: mockInstance, inlineTickets };
});

vi.mock('../../src/generated/prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => mockPrismaInstance),
    Role: {
      REQUESTER: 'REQUESTER',
      IT_STAFF: 'IT_STAFF',
      ADMINISTRATOR: 'ADMINISTRATOR',
    },
    TicketStatus: {
      NEW: 'NEW',
      OPEN: 'OPEN',
      IN_PROGRESS: 'IN_PROGRESS',
      WAITING_FOR_REQUESTER: 'WAITING_FOR_REQUESTER',
      RESOLVED: 'RESOLVED',
      CLOSED: 'CLOSED',
      REOPENED: 'REOPENED',
      CANCELLED: 'CANCELLED',
    },
    Priority: {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
      CRITICAL: 'CRITICAL',
    },
  };
});

import app from '../../src/index';


// ---------------------------------------------------------------------------
// Helpers — generate signed JWT cookies
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

function staffCookie(overrides: Record<string, unknown> = {}): string {
  const token = jwt.sign(
    { userId: 1, email: 'staff@example.com', role: 'IT_STAFF', mustChangePassword: false, ...overrides },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `token=${token}`;
}

function requesterCookie(): string {
  const token = jwt.sign(
    { userId: 99, email: 'req@example.com', role: 'REQUESTER', mustChangePassword: false },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `token=${token}`;
}

// ---------------------------------------------------------------------------
// QUEUE-01: GET queue returns all tickets — AC-07
// ---------------------------------------------------------------------------
describe('QUEUE-01 — GET /api/staff/tickets returns all tickets', () => {
  it('returns HTTP 200 for IT Staff', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
  });

  it('response body has a tickets array', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', staffCookie());
    expect(res.body).toHaveProperty('tickets');
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });

  it('response body has pagination metadata', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', staffCookie());
    expect(res.body).toHaveProperty('pagination');
    const p = res.body.pagination;
    expect(p).toHaveProperty('currentPage');
    expect(p).toHaveProperty('pageSize');
    expect(p).toHaveProperty('totalCount');
    expect(p).toHaveProperty('totalPages');
  });

  it('each ticket has id, ticketNumber, createdAt, updatedAt, summary, status, requestedPriority, itPriority, category', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', staffCookie());
    const t = res.body.tickets[0];
    expect(t).toHaveProperty('id');
    expect(t).toHaveProperty('ticketNumber');
    expect(t).toHaveProperty('createdAt');
    expect(t).toHaveProperty('updatedAt');
    expect(t).toHaveProperty('summary');
    expect(t).toHaveProperty('status');
    expect(t).toHaveProperty('requestedPriority');
    expect(t).toHaveProperty('itPriority');
    expect(t).toHaveProperty('category');
  });

  it('returns 403 when accessed by a Requester', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', requesterCookie());
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/staff/tickets');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// QUEUE-02: Queue search by ticket number — AC-07
// ---------------------------------------------------------------------------
describe('QUEUE-02 — GET /api/staff/tickets?search=<ticketNumber>', () => {
  it('returns 200 with search param matching ticket number', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?search=TKT-20260913-0001')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
  });

  it('response contains tickets array', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?search=TKT-20260913-0001')
      .set('Cookie', staffCookie());
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// QUEUE-03: Queue search by summary — AC-07
// ---------------------------------------------------------------------------
describe('QUEUE-03 — GET /api/staff/tickets?search=<summary>', () => {
  it('returns 200 with search param matching summary text', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?search=Printer')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
  });

  it('response contains tickets array', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?search=Printer')
      .set('Cookie', staffCookie());
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// QUEUE-04: Queue filter by status — AC-07
// ---------------------------------------------------------------------------
describe('QUEUE-04 — GET /api/staff/tickets?status=IN_PROGRESS', () => {
  it('returns 200 with status filter', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?status=IN_PROGRESS')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
  });

  it('response includes pagination metadata', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?status=IN_PROGRESS')
      .set('Cookie', staffCookie());
    expect(res.body).toHaveProperty('pagination');
  });
});

// ---------------------------------------------------------------------------
// QUEUE-05: Queue filter by IT Priority — AC-07
// ---------------------------------------------------------------------------
describe('QUEUE-05 — GET /api/staff/tickets?itPriority=CRITICAL', () => {
  it('returns 200 with itPriority filter', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?itPriority=CRITICAL')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
  });

  it('returns 200 with itPriority=HIGH filter', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?itPriority=HIGH')
      .set('Cookie', staffCookie());
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// QUEUE-06: Queue filter by owner — unassigned — AC-07
// ---------------------------------------------------------------------------
describe('QUEUE-06 — GET /api/staff/tickets?ownerId=unassigned', () => {
  it('returns 200 with ownerId=unassigned', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?ownerId=unassigned')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
  });

  it('response contains tickets array', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?ownerId=unassigned')
      .set('Cookie', staffCookie());
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });

  it('response contains pagination metadata', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?ownerId=unassigned')
      .set('Cookie', staffCookie());
    expect(res.body).toHaveProperty('pagination');
  });
});

// ---------------------------------------------------------------------------
// QUEUE-07: Queue sorting — AC-07
// ---------------------------------------------------------------------------
describe('QUEUE-07 — GET /api/staff/tickets?sort=<field>_<dir>', () => {
  it('returns 200 with sort=createdAt_desc (default)', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?sort=createdAt_desc')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
  });

  it('returns 200 with sort=itPriority_asc', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?sort=itPriority_asc')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
  });

  it('returns 200 with sort=status_desc', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?sort=status_desc')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
  });

  it('returns 200 with sort=updatedAt_asc', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?sort=updatedAt_asc')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
  });

  it('returns 200 with sort=ownerId_asc', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?sort=ownerId_asc')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// QUEUE-08: Queue pagination — correct page metadata — AC-07
// ---------------------------------------------------------------------------
describe('QUEUE-08 — GET /api/staff/tickets pagination', () => {
  it('pagination.currentPage defaults to 1', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', staffCookie());
    expect(res.body.pagination.currentPage).toBe(1);
  });

  it('pagination.pageSize defaults to 10', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', staffCookie());
    expect(res.body.pagination.pageSize).toBe(10);
  });

  it('pagination.totalCount is a non-negative number', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', staffCookie());
    expect(typeof res.body.pagination.totalCount).toBe('number');
    expect(res.body.pagination.totalCount).toBeGreaterThanOrEqual(0);
  });

  it('pagination.totalPages is a non-negative number', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', staffCookie());
    expect(typeof res.body.pagination.totalPages).toBe('number');
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(0);
  });

  it('page=2&pageSize=25 is reflected in pagination response', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?page=2&pageSize=25')
      .set('Cookie', staffCookie());
    expect(res.body.pagination.currentPage).toBe(2);
    expect(res.body.pagination.pageSize).toBe(25);
  });

  it('pageSize=50 is accepted and reflected', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?pageSize=50')
      .set('Cookie', staffCookie());
    expect(res.body.pagination.pageSize).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// QUEUE-09: Queue with invalid page size falls back to 10 — AC-07
// ---------------------------------------------------------------------------
describe('QUEUE-09 — GET /api/staff/tickets invalid pageSize falls back to 10', () => {
  it('pageSize=7 (not in [10,25,50]) falls back to 10', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?pageSize=7')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
    expect(res.body.pagination.pageSize).toBe(10);
  });

  it('pageSize=abc (non-numeric) falls back to 10', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?pageSize=abc')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
    expect(res.body.pagination.pageSize).toBe(10);
  });

  it('pageSize=100 (out of range) falls back to 10', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?pageSize=100')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
    expect(res.body.pagination.pageSize).toBe(10);
  });

  it('pageSize=0 falls back to 10', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?pageSize=0')
      .set('Cookie', staffCookie());
    expect(res.status).toBe(200);
    expect(res.body.pagination.pageSize).toBe(10);
  });

  it('no pageSize param defaults to 10', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', staffCookie());
    expect(res.body.pagination.pageSize).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// QUEUE-10: Empty results & page boundary handling — AC-07
// ---------------------------------------------------------------------------
describe('QUEUE-10 — GET /api/staff/tickets empty results and page boundary handling', () => {
  it('returns empty tickets array and totalCount: 0 when no tickets match', async () => {
    mockPrismaInstance.ticket.findMany.mockResolvedValueOnce([]);
    mockPrismaInstance.ticket.count.mockResolvedValueOnce(0);

    const res = await request(app)
      .get('/api/staff/tickets?search=nonexistent')
      .set('Cookie', staffCookie());

    expect(res.status).toBe(200);
    expect(res.body.tickets).toEqual([]);
    expect(res.body.pagination.totalCount).toBe(0);
    expect(res.body.pagination.totalPages).toBe(0);
    expect(res.body.pagination.currentPage).toBe(1);
  });

  it('page=0 falls back to page=1', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?page=0')
      .set('Cookie', staffCookie());

    expect(res.status).toBe(200);
    expect(res.body.pagination.currentPage).toBe(1);
  });

  it('page=-5 (negative number) falls back to page=1', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?page=-5')
      .set('Cookie', staffCookie());

    expect(res.status).toBe(200);
    expect(res.body.pagination.currentPage).toBe(1);
  });

  it('page=xyz (non-numeric) falls back to page=1', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?page=xyz')
      .set('Cookie', staffCookie());

    expect(res.status).toBe(200);
    expect(res.body.pagination.currentPage).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// QUEUE-11: Database / Server error handling — AC-07
// ---------------------------------------------------------------------------
describe('QUEUE-11 — GET /api/staff/tickets server error (500) handling', () => {
  it('returns 500 when database count query rejects', async () => {
    mockPrismaInstance.ticket.count.mockRejectedValueOnce(new Error('Prisma database connection lost'));

    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', staffCookie());

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('SERVER_ERROR');
    expect(res.body.error.message).toBe('Unable to fetch ticket queue');
  });

  it('returns 500 when database findMany query rejects', async () => {
    mockPrismaInstance.ticket.findMany.mockRejectedValueOnce(new Error('Prisma query timeout'));

    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Cookie', staffCookie());

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('SERVER_ERROR');
    expect(res.body.error.message).toBe('Unable to fetch ticket queue');
  });
});

