import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Hoisted mock data
// ---------------------------------------------------------------------------
const { mockPrismaInstance, sampleTicket, activeItStaff2, inactiveUser, requesterUser } = vi.hoisted(() => {
  const sampleTicket = {
    id: 1,
    ticketNumber: 'TKT-20260913-0001',
    status: 'NEW',
    requestedPriority: 'HIGH',
    itPriority: 'CRITICAL',
    summary: 'Printer not working on floor 3',
    description: 'The printer on floor 3 is not responding.',
    requesterId: 10,
    ownerId: null,
    requesterIndicatedResolved: false,
    createdAt: new Date('2026-09-13T10:00:00Z'),
    updatedAt: new Date('2026-09-13T12:00:00Z'),
    categoryId: 1,
    relatedSystemId: 1,
    category: { id: 1, name: 'Hardware' },
    relatedSystem: { id: 1, name: 'Printer System' },
    requester: { id: 10, name: 'Jane Requester' },
    owner: null,
    attachments: [],
  };

  const activeItStaff2 = {
    id: 3,
    name: 'IT Staff B',
    email: 'staff2@example.com',
    role: 'IT_STAFF',
    isActive: true,
    mustChangePassword: false,
    passwordHash: '$2b$10$hash',
  };

  const inactiveUser = {
    id: 4,
    name: 'Inactive Staff',
    email: 'inactive@example.com',
    role: 'IT_STAFF',
    isActive: false,
    mustChangePassword: false,
    passwordHash: '$2b$10$hash',
  };

  const requesterUser = {
    id: 5,
    name: 'Requester User',
    email: 'req@example.com',
    role: 'REQUESTER',
    isActive: true,
    mustChangePassword: false,
    passwordHash: '$2b$10$hash',
  };

  const mockInstance = {
    user: {
      findUnique: vi.fn(),
    },
    ticket: {
      findUnique: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn(),
    },
    comment: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
    },
    internalNote: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
    },
    category: { findMany: vi.fn().mockResolvedValue([]) },
    relatedSystem: { findMany: vi.fn().mockResolvedValue([]) },
    attachment: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  };

  return { mockPrismaInstance: mockInstance, sampleTicket, activeItStaff2, inactiveUser, requesterUser };
});

vi.mock('../../src/generated/prisma/client', () => ({
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
}));

import app from '../../src/index';

// ---------------------------------------------------------------------------
// JWT helpers
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

// Reset all mocks before each test to ensure clean state
beforeEach(() => {
  vi.clearAllMocks();
  // Re-establish default fallback implementations
  mockPrismaInstance.ticket.findFirst.mockResolvedValue(null);
  mockPrismaInstance.ticket.findMany.mockResolvedValue([]);
  mockPrismaInstance.ticket.count.mockResolvedValue(0);
  mockPrismaInstance.ticket.create.mockResolvedValue({});
  mockPrismaInstance.comment.findMany.mockResolvedValue([]);
  mockPrismaInstance.comment.create.mockResolvedValue({});
  mockPrismaInstance.internalNote.findMany.mockResolvedValue([]);
  mockPrismaInstance.internalNote.create.mockResolvedValue({});
  mockPrismaInstance.category.findMany.mockResolvedValue([]);
  mockPrismaInstance.relatedSystem.findMany.mockResolvedValue([]);
  mockPrismaInstance.attachment.findMany.mockResolvedValue([]);
  mockPrismaInstance.attachment.count.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// STAFF-01: IT Staff claims unassigned ticket (self-assign) — AC-08
// ---------------------------------------------------------------------------
describe('STAFF-01 — PATCH /api/staff/tickets/:id/owner — claim self', () => {
  it('returns 200 and sets owner to authenticated user', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, ownerId: null, owner: null });
    mockPrismaInstance.ticket.update.mockResolvedValue({
      id: 1,
      owner: { id: 1, name: 'Test IT Staff' },
    });

    const res = await request(app)
      .patch('/api/staff/tickets/1/owner')
      .set('Cookie', staffCookie())
      .send({ ownerId: 'self' });

    expect(res.status).toBe(200);
    expect(res.body.ticket).toBeDefined();
    expect(res.body.ticket.owner).toBeDefined();
    expect(res.body.ticket.owner.id).toBe(1);
  });

  it('response ticket has owner with id and name', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, ownerId: null, owner: null });
    mockPrismaInstance.ticket.update.mockResolvedValue({
      id: 1,
      owner: { id: 1, name: 'Test IT Staff' },
    });

    const res = await request(app)
      .patch('/api/staff/tickets/1/owner')
      .set('Cookie', staffCookie())
      .send({ ownerId: 'self' });

    expect(res.body.ticket.owner.name).toBe('Test IT Staff');
  });
});

// ---------------------------------------------------------------------------
// STAFF-02: IT Staff reassigns ticket to another IT Staff — AC-08
// ---------------------------------------------------------------------------
describe('STAFF-02 — PATCH /api/staff/tickets/:id/owner — reassign to another IT Staff', () => {
  it('returns 200 and updates owner to target user', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue(sampleTicket);
    mockPrismaInstance.user.findUnique.mockResolvedValue(activeItStaff2);
    mockPrismaInstance.ticket.update.mockResolvedValue({
      id: 1,
      owner: { id: 3, name: 'IT Staff B' },
    });

    const res = await request(app)
      .patch('/api/staff/tickets/1/owner')
      .set('Cookie', staffCookie())
      .send({ ownerId: 3 });

    expect(res.status).toBe(200);
    expect(res.body.ticket.owner.id).toBe(3);
    expect(res.body.ticket.owner.name).toBe('IT Staff B');
  });
});

// ---------------------------------------------------------------------------
// STAFF-03: Assign to inactive user — rejected 400
// ---------------------------------------------------------------------------
describe('STAFF-03 — PATCH /api/staff/tickets/:id/owner — assign to inactive user', () => {
  it('returns 400 when target user is inactive', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue(sampleTicket);
    mockPrismaInstance.user.findUnique.mockResolvedValue(inactiveUser);

    const res = await request(app)
      .patch('/api/staff/tickets/1/owner')
      .set('Cookie', staffCookie())
      .send({ ownerId: 4 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_OWNER');
  });
});

// ---------------------------------------------------------------------------
// STAFF-04: Assign to Requester (wrong role) — rejected 400
// ---------------------------------------------------------------------------
describe('STAFF-04 — PATCH /api/staff/tickets/:id/owner — assign to Requester', () => {
  it('returns 400 when target user is a Requester (not IT Staff/Admin)', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue(sampleTicket);
    mockPrismaInstance.user.findUnique.mockResolvedValue(requesterUser);

    const res = await request(app)
      .patch('/api/staff/tickets/1/owner')
      .set('Cookie', staffCookie())
      .send({ ownerId: 5 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OWNER');
  });
});

// ---------------------------------------------------------------------------
// STAFF-05: Update IT Priority — AC-09
// ---------------------------------------------------------------------------
describe('STAFF-05 — PATCH /api/staff/tickets/:id/priority — update IT Priority', () => {
  it('returns 200 with updated itPriority and unchanged requestedPriority', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue(sampleTicket);
    mockPrismaInstance.ticket.update.mockResolvedValue({
      id: 1,
      itPriority: 'CRITICAL',
      requestedPriority: 'HIGH',
    });

    const res = await request(app)
      .patch('/api/staff/tickets/1/priority')
      .set('Cookie', staffCookie())
      .send({ itPriority: 'CRITICAL' });

    expect(res.status).toBe(200);
    expect(res.body.ticket.itPriority).toBe('CRITICAL');
    expect(res.body.ticket.requestedPriority).toBe('HIGH'); // unchanged
  });

  it('works for all valid priority values', async () => {
    for (const p of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue(sampleTicket);
      mockPrismaInstance.ticket.update.mockResolvedValue({ id: 1, itPriority: p, requestedPriority: 'HIGH' });

      const res = await request(app)
        .patch('/api/staff/tickets/1/priority')
        .set('Cookie', staffCookie())
        .send({ itPriority: p });

      expect(res.status).toBe(200);
    }
  });
});

// ---------------------------------------------------------------------------
// STAFF-06: Invalid IT Priority value — AC-09
// ---------------------------------------------------------------------------
describe('STAFF-06 — PATCH /api/staff/tickets/:id/priority — invalid value', () => {
  it('returns 400 for invalid priority string', async () => {
    const res = await request(app)
      .patch('/api/staff/tickets/1/priority')
      .set('Cookie', staffCookie())
      .send({ itPriority: 'VERY_HIGH' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when itPriority is missing', async () => {
    const res = await request(app)
      .patch('/api/staff/tickets/1/priority')
      .set('Cookie', staffCookie())
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 403 when accessed by a Requester', async () => {
    const res = await request(app)
      .patch('/api/staff/tickets/1/priority')
      .set('Cookie', requesterCookie())
      .send({ itPriority: 'HIGH' });

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// STAFF-07: Permitted status transition (New → Open) — AC-10
// ---------------------------------------------------------------------------
describe('STAFF-07 — PATCH /api/staff/tickets/:id/status — permitted transition New → Open', () => {
  it('returns 200 with updated status', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, status: 'NEW' });
    mockPrismaInstance.ticket.update.mockResolvedValue({ id: 1, status: 'OPEN' });

    const res = await request(app)
      .patch('/api/staff/tickets/1/status')
      .set('Cookie', staffCookie())
      .send({ status: 'OPEN' });

    expect(res.status).toBe(200);
    expect(res.body.ticket.status).toBe('OPEN');
  });

  it('response includes permittedStatuses array', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, status: 'NEW' });
    mockPrismaInstance.ticket.update.mockResolvedValue({ id: 1, status: 'OPEN' });

    const res = await request(app)
      .patch('/api/staff/tickets/1/status')
      .set('Cookie', staffCookie())
      .send({ status: 'OPEN' });

    expect(res.body.ticket).toHaveProperty('permittedStatuses');
    expect(Array.isArray(res.body.ticket.permittedStatuses)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// STAFF-08: Forbidden status transition (New → Resolved) — AC-10
// ---------------------------------------------------------------------------
describe('STAFF-08 — PATCH /api/staff/tickets/:id/status — forbidden transition New → Resolved', () => {
  it('returns 400 with INVALID_TRANSITION error code', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, status: 'NEW' });

    const res = await request(app)
      .patch('/api/staff/tickets/1/status')
      .set('Cookie', staffCookie())
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('error message describes the invalid transition', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, status: 'NEW' });

    const res = await request(app)
      .patch('/api/staff/tickets/1/status')
      .set('Cookie', staffCookie())
      .send({ status: 'RESOLVED' });

    expect(res.body.error.message).toContain('Cannot transition from NEW to RESOLVED');
  });

  it('returns 400 for New → Closed (also forbidden)', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, status: 'NEW' });

    const res = await request(app)
      .patch('/api/staff/tickets/1/status')
      .set('Cookie', staffCookie())
      .send({ status: 'CLOSED' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// STAFF-09: Transition from Cancelled (terminal) — AC-10
// ---------------------------------------------------------------------------
describe('STAFF-09 — PATCH /api/staff/tickets/:id/status — Cancelled is terminal', () => {
  it('returns 400 when transitioning from CANCELLED', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, status: 'CANCELLED' });

    const res = await request(app)
      .patch('/api/staff/tickets/1/status')
      .set('Cookie', staffCookie())
      .send({ status: 'OPEN' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('cannot transition Cancelled → In Progress either', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, status: 'CANCELLED' });

    const res = await request(app)
      .patch('/api/staff/tickets/1/status')
      .set('Cookie', staffCookie())
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(400);
  });

  it('cannot transition Cancelled → Resolved', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, status: 'CANCELLED' });

    const res = await request(app)
      .patch('/api/staff/tickets/1/status')
      .set('Cookie', staffCookie())
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// STAFF-10: GET staff ticket detail — full ticket with permittedStatuses
// ---------------------------------------------------------------------------
describe('STAFF-10 — GET /api/staff/tickets/:id — full ticket detail', () => {
  it('returns 200', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, attachments: [] });

    const res = await request(app)
      .get('/api/staff/tickets/1')
      .set('Cookie', staffCookie());

    expect(res.status).toBe(200);
  });

  it('response wraps ticket in { ticket: ... }', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, attachments: [] });

    const res = await request(app)
      .get('/api/staff/tickets/1')
      .set('Cookie', staffCookie());

    expect(res.body.ticket).toBeDefined();
  });

  it('ticket has all required fields', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, attachments: [] });

    const res = await request(app)
      .get('/api/staff/tickets/1')
      .set('Cookie', staffCookie());

    const t = res.body.ticket;
    expect(t).toHaveProperty('id');
    expect(t).toHaveProperty('ticketNumber');
    expect(t).toHaveProperty('summary');
    expect(t).toHaveProperty('description');
    expect(t).toHaveProperty('status');
    expect(t).toHaveProperty('requestedPriority');
    expect(t).toHaveProperty('itPriority');
    expect(t).toHaveProperty('category');
    expect(t).toHaveProperty('requester');
    expect(t).toHaveProperty('requesterIndicatedResolved');
    expect(t).toHaveProperty('attachments');
  });

  it('ticket includes permittedStatuses array', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, attachments: [] });

    const res = await request(app)
      .get('/api/staff/tickets/1')
      .set('Cookie', staffCookie());

    expect(res.body.ticket).toHaveProperty('permittedStatuses');
    expect(Array.isArray(res.body.ticket.permittedStatuses)).toBe(true);
  });

  it('permittedStatuses for NEW ticket are OPEN and CANCELLED', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue({ ...sampleTicket, status: 'NEW', attachments: [] });

    const res = await request(app)
      .get('/api/staff/tickets/1')
      .set('Cookie', staffCookie());

    const permitted = res.body.ticket.permittedStatuses;
    expect(permitted).toContain('OPEN');
    expect(permitted).toContain('CANCELLED');
    expect(permitted).not.toContain('RESOLVED');
  });

  it('returns 404 for non-existent ticket', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/staff/tickets/9999')
      .set('Cookie', staffCookie());

    expect(res.status).toBe(404);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/staff/tickets/1');
    expect(res.status).toBe(401);
  });

  it('returns 403 when accessed by a Requester', async () => {
    const res = await request(app)
      .get('/api/staff/tickets/1')
      .set('Cookie', requesterCookie());

    expect(res.status).toBe(403);
  });
});
