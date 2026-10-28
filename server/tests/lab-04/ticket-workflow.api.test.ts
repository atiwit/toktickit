import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Hoisted mock data
// ---------------------------------------------------------------------------
const { mockPrismaInstance, sampleTicket } = vi.hoisted(() => {
  const sampleTicket = {
    id: 1,
    ticketNumber: 'TKT-20261027-0001',
    status: 'IN_PROGRESS',
    requestedPriority: 'HIGH',
    itPriority: 'HIGH',
    summary: 'Wi-Fi network drop',
    description: 'Intermittent disconnection in room 301.',
    requesterId: 99,
    ownerId: 1,
    requesterIndicatedResolved: false,
    createdAt: new Date('2026-10-27T08:00:00Z'),
    updatedAt: new Date('2026-10-27T09:00:00Z'),
    categoryId: 1,
    relatedSystemId: 1,
    category: { id: 1, name: 'Network' },
    relatedSystem: { id: 1, name: 'Campus Wi-Fi' },
    requester: { id: 99, name: 'Alice Requester', email: 'alice@example.com' },
    owner: { id: 1, name: 'IT Staff Alpha', email: 'staff.alpha@example.com' },
    attachments: [],
    actionsTaken: [],
  };

  const mockInstance = {
    user: {
      findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
        if (where?.id === 99) {
          return {
            id: 99,
            name: 'Alice Requester',
            email: 'alice@example.com',
            role: 'REQUESTER',
            isActive: true,
            mustChangePassword: false,
            passwordHash: '$2b$10$hashedpassword',
          };
        }
        if (where?.id === 88) {
          return {
            id: 88,
            name: 'Other Requester',
            email: 'other@example.com',
            role: 'REQUESTER',
            isActive: true,
            mustChangePassword: false,
            passwordHash: '$2b$10$hashedpassword',
          };
        }
        if (where?.id === 999) {
          return {
            id: 999,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'ADMINISTRATOR',
            isActive: true,
            mustChangePassword: false,
            passwordHash: '$2b$10$hashedpassword',
          };
        }
        return {
          id: 1,
          name: 'IT Staff Alpha',
          email: 'staff.alpha@example.com',
          role: 'IT_STAFF',
          isActive: true,
          mustChangePassword: false,
          passwordHash: '$2b$10$hashedpassword',
        };
      }),
    },
    ticket: {
      findUnique: vi.fn().mockResolvedValue(sampleTicket),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([sampleTicket]),
      count: vi.fn().mockResolvedValue(1),
      update: vi.fn().mockImplementation(async ({ data }: any) => ({
        ...sampleTicket,
        ...data,
        updatedAt: new Date('2026-10-27T10:00:00Z'),
      })),
    },
    actionTaken: {
      count: vi.fn().mockResolvedValue(1),
    },
    $transaction: vi.fn().mockImplementation(async (arg: any) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      if (typeof arg === 'function') return arg(mockInstance);
      return arg;
    }),
  };

  return { mockPrismaInstance: mockInstance, sampleTicket };
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
// JWT cookie helpers
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

function staffCookie(userId = 1): string {
  const token = jwt.sign(
    { userId, email: `staff${userId}@example.com`, role: 'IT_STAFF', mustChangePassword: false },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `token=${token}`;
}

function adminCookie(userId = 999): string {
  const token = jwt.sign(
    { userId, email: `admin${userId}@example.com`, role: 'ADMINISTRATOR', mustChangePassword: false },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `token=${token}`;
}

function requesterCookie(userId = 99): string {
  const token = jwt.sign(
    { userId, email: `req${userId}@example.com`, role: 'REQUESTER', mustChangePassword: false },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `token=${token}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Lab 4 Ticket Workflow, Resolution Gate & Concurrency Tests (server/tests/lab-04/ticket-workflow.api.test.ts)', () => {
  let currentTicketState: any;

  beforeEach(() => {
    vi.clearAllMocks();
    currentTicketState = {
      ...sampleTicket,
      updatedAt: new Date('2026-10-27T09:00:00Z'),
    };
    mockPrismaInstance.ticket.findUnique.mockImplementation(async () => currentTicketState);
    mockPrismaInstance.ticket.update.mockImplementation(async ({ data }: any) => {
      currentTicketState = {
        ...currentTicketState,
        ...data,
        updatedAt: new Date('2026-10-27T10:00:00Z'),
      };
      return currentTicketState;
    });
    mockPrismaInstance.actionTaken.count.mockResolvedValue(1);
  });

  // -------------------------------------------------------------------------
  // API-WF-01: Resolution Gate Blocks Transition with 0 Actions Taken
  // -------------------------------------------------------------------------
  describe('API-WF-01: Transition to RESOLVED on ticket with 0 Actions Taken', () => {
    it('returns 422 Unprocessable Entity when ticket has 0 actions taken', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue({
        ...sampleTicket,
        status: 'IN_PROGRESS',
      });
      mockPrismaInstance.actionTaken.count.mockResolvedValue(0);

      const res = await request(app)
        .patch('/api/staff/tickets/1/status')
        .set('Cookie', staffCookie())
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(422);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('RESOLUTION_GATE_BLOCKED');
      expect(res.body.error.message).toMatch(/at least one/i);
      expect(mockPrismaInstance.ticket.update).not.toHaveBeenCalled();
    });

    it('returns 422 when transitioning from WAITING_FOR_REQUESTER to RESOLVED with 0 actions taken', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue({
        ...sampleTicket,
        status: 'WAITING_FOR_REQUESTER',
      });
      mockPrismaInstance.actionTaken.count.mockResolvedValue(0);

      const res = await request(app)
        .patch('/api/staff/tickets/1/status')
        .set('Cookie', staffCookie())
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('RESOLUTION_GATE_BLOCKED');
    });
  });

  // -------------------------------------------------------------------------
  // API-WF-02: Resolution Gate Allows Transition with >= 1 Action Taken
  // -------------------------------------------------------------------------
  describe('API-WF-02: Transition to RESOLVED on ticket with >= 1 Action Taken', () => {
    it('returns 200 and updates status to RESOLVED when >= 1 action exists', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue({
        ...sampleTicket,
        status: 'IN_PROGRESS',
      });
      mockPrismaInstance.actionTaken.count.mockResolvedValue(2);

      const res = await request(app)
        .patch('/api/staff/tickets/1/status')
        .set('Cookie', staffCookie())
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.status).toBe('RESOLVED');
      expect(res.body.data.status).toBe('RESOLVED');
      expect(res.body.ticket.permittedStatuses).toEqual(['CLOSED', 'REOPENED']);
      expect(mockPrismaInstance.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { status: 'RESOLVED' },
        })
      );
    });

    it('allows Administrator to transition to RESOLVED with >= 1 action', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue({
        ...sampleTicket,
        status: 'IN_PROGRESS',
      });
      mockPrismaInstance.actionTaken.count.mockResolvedValue(1);

      const res = await request(app)
        .patch('/api/staff/tickets/1/status')
        .set('Cookie', adminCookie())
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(200);
      expect(res.body.ticket.status).toBe('RESOLVED');
    });
  });

  // -------------------------------------------------------------------------
  // API-WF-03: Valid Transitions According to Status Transition Matrix (BR-11)
  // -------------------------------------------------------------------------
  describe('API-WF-03: Valid transitions following Permitted Transition Matrix', () => {
    const validCases = [
      { from: 'NEW', to: 'OPEN' },
      { from: 'NEW', to: 'CANCELLED' },
      { from: 'OPEN', to: 'IN_PROGRESS' },
      { from: 'OPEN', to: 'CANCELLED' },
      { from: 'IN_PROGRESS', to: 'WAITING_FOR_REQUESTER' },
      { from: 'IN_PROGRESS', to: 'CANCELLED' },
      { from: 'WAITING_FOR_REQUESTER', to: 'IN_PROGRESS' },
      { from: 'WAITING_FOR_REQUESTER', to: 'RESOLVED' }, // with action taken
      { from: 'WAITING_FOR_REQUESTER', to: 'CANCELLED' },
      { from: 'RESOLVED', to: 'CLOSED' },
      { from: 'RESOLVED', to: 'REOPENED' },
      { from: 'CLOSED', to: 'REOPENED' },
      { from: 'REOPENED', to: 'IN_PROGRESS' },
      { from: 'REOPENED', to: 'CANCELLED' },
    ];

    for (const { from, to } of validCases) {
      it(`permits transition from ${from} to ${to}`, async () => {
        mockPrismaInstance.ticket.findUnique.mockResolvedValue({
          ...sampleTicket,
          status: from,
        });
        mockPrismaInstance.actionTaken.count.mockResolvedValue(1);

        const res = await request(app)
          .patch('/api/staff/tickets/1/status')
          .set('Cookie', staffCookie())
          .send({ status: to });

        expect(res.status).toBe(200);
        expect(res.body.ticket.status).toBe(to);
        expect(res.body.ticket).toHaveProperty('permittedStatuses');
      });
    }
  });

  // -------------------------------------------------------------------------
  // API-WF-04: Invalid Transitions Blocked with 400 Bad Request (BR-11)
  // -------------------------------------------------------------------------
  describe('API-WF-04: Invalid transitions rejected with 400 Bad Request', () => {
    const invalidCases = [
      { from: 'NEW', to: 'CLOSED' },
      { from: 'NEW', to: 'RESOLVED' },
      { from: 'NEW', to: 'IN_PROGRESS' },
      { from: 'OPEN', to: 'RESOLVED' },
      { from: 'OPEN', to: 'CLOSED' },
      { from: 'RESOLVED', to: 'OPEN' },
      { from: 'RESOLVED', to: 'IN_PROGRESS' },
      { from: 'CLOSED', to: 'IN_PROGRESS' },
      { from: 'CLOSED', to: 'OPEN' },
      { from: 'CLOSED', to: 'CANCELLED' },
      { from: 'REOPENED', to: 'RESOLVED' },
      { from: 'REOPENED', to: 'CLOSED' },
    ];

    for (const { from, to } of invalidCases) {
      it(`rejects invalid transition from ${from} to ${to}`, async () => {
        mockPrismaInstance.ticket.findUnique.mockResolvedValue({
          ...sampleTicket,
          status: from,
        });

        const res = await request(app)
          .patch('/api/staff/tickets/1/status')
          .set('Cookie', staffCookie())
          .send({ status: to });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_TRANSITION');
        expect(res.body.error.message).toContain(`Cannot transition from ${from} to ${to}`);
        expect(mockPrismaInstance.ticket.update).not.toHaveBeenCalled();
      });
    }
  });

  // -------------------------------------------------------------------------
  // API-WF-05: CANCELLED is Terminal State (BR-10)
  // -------------------------------------------------------------------------
  describe('API-WF-05: CANCELLED is a terminal state (no transitions permitted)', () => {
    const targets = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED'];

    for (const target of targets) {
      it(`rejects transition from CANCELLED to ${target}`, async () => {
        mockPrismaInstance.ticket.findUnique.mockResolvedValue({
          ...sampleTicket,
          status: 'CANCELLED',
        });

        const res = await request(app)
          .patch('/api/staff/tickets/1/status')
          .set('Cookie', staffCookie())
          .send({ status: target });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_TRANSITION');
        expect(mockPrismaInstance.ticket.update).not.toHaveBeenCalled();
      });
    }
  });

  // -------------------------------------------------------------------------
  // API-WF-06: Requester "Problem Appears Resolved" Advisory Flag (FR-10, BR-09)
  // -------------------------------------------------------------------------
  describe('API-WF-06: Requester marks Problem Appears Resolved (advisory only)', () => {
    it('sets requesterIndicatedResolved=true and leaves ticket status unchanged', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue({
        ...sampleTicket,
        status: 'IN_PROGRESS',
        requesterId: 99,
        requesterIndicatedResolved: false,
      });

      const res = await request(app)
        .patch('/api/tickets/1/requester-resolved')
        .set('Cookie', requesterCookie(99));

      expect(res.status).toBe(200);
      expect(res.body.ticket.requesterIndicatedResolved).toBe(true);
      expect(res.body.ticket.status).toBe('IN_PROGRESS'); // Status is NOT changed to RESOLVED
      expect(mockPrismaInstance.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { requesterIndicatedResolved: true },
        })
      );
    });

    it('works when ticket is in WAITING_FOR_REQUESTER status', async () => {
      const waitingTicket = {
        ...sampleTicket,
        status: 'WAITING_FOR_REQUESTER',
        requesterId: 99,
        requesterIndicatedResolved: false,
      };
      mockPrismaInstance.ticket.findUnique.mockResolvedValue(waitingTicket);
      mockPrismaInstance.ticket.update.mockResolvedValue({
        ...waitingTicket,
        requesterIndicatedResolved: true,
      });

      const res = await request(app)
        .patch('/api/tickets/1/requester-resolved')
        .set('Cookie', requesterCookie(99));

      expect(res.status).toBe(200);
      expect(res.body.ticket.requesterIndicatedResolved).toBe(true);
      expect(res.body.ticket.status).toBe('WAITING_FOR_REQUESTER');
    });

    it('returns 404 when requested by a different requester', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue({
        ...sampleTicket,
        requesterId: 99,
      });

      const res = await request(app)
        .patch('/api/tickets/1/requester-resolved')
        .set('Cookie', requesterCookie(88)); // Different user 88

      expect(res.status).toBe(404);
      expect(mockPrismaInstance.ticket.update).not.toHaveBeenCalled();
    });

    it('returns 400 when ticket is in an invalid status like NEW or CLOSED', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue({
        ...sampleTicket,
        status: 'NEW',
        requesterId: 99,
      });

      const res = await request(app)
        .patch('/api/tickets/1/requester-resolved')
        .set('Cookie', requesterCookie(99));

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS');
    });
  });

  // -------------------------------------------------------------------------
  // API-WF-07: Optimistic Concurrency Control (OCC) / Stale Updates (BR-11, AC-09)
  // -------------------------------------------------------------------------
  describe('API-WF-07: Optimistic Concurrency Control (OCC) and stale update detection', () => {
    const dbUpdatedAt = new Date('2026-10-27T09:00:00.000Z');

    it('returns 409 Conflict when lastUpdatedAt is older than ticket.updatedAt', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue({
        ...sampleTicket,
        status: 'OPEN',
        updatedAt: dbUpdatedAt,
      });

      const staleTimestamp = new Date('2026-10-27T08:30:00.000Z').toISOString();

      const res = await request(app)
        .patch('/api/staff/tickets/1/status')
        .set('Cookie', staffCookie())
        .send({
          status: 'IN_PROGRESS',
          lastUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toMatch(/(updated|modified) by another user/i);
      expect(res.body.currentStatus).toBe('OPEN');
      expect(mockPrismaInstance.ticket.update).not.toHaveBeenCalled();
    });

    it('returns 409 Conflict when updatedAt field is stale in body', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue({
        ...sampleTicket,
        status: 'OPEN',
        updatedAt: dbUpdatedAt,
      });

      const staleTimestamp = new Date('2026-10-27T08:00:00.000Z').toISOString();

      const res = await request(app)
        .patch('/api/staff/tickets/1/status')
        .set('Cookie', staffCookie())
        .send({
          status: 'IN_PROGRESS',
          updatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('succeeds with 200 OK when lastUpdatedAt matches ticket.updatedAt', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue({
        ...sampleTicket,
        status: 'OPEN',
        updatedAt: dbUpdatedAt,
      });

      const res = await request(app)
        .patch('/api/staff/tickets/1/status')
        .set('Cookie', staffCookie())
        .send({
          status: 'IN_PROGRESS',
          lastUpdatedAt: dbUpdatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.ticket.status).toBe('IN_PROGRESS');
      expect(mockPrismaInstance.ticket.update).toHaveBeenCalled();
    });

    it('succeeds when no concurrency token is provided (backward compatibility)', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue({
        ...sampleTicket,
        status: 'OPEN',
        updatedAt: dbUpdatedAt,
      });

      const res = await request(app)
        .patch('/api/staff/tickets/1/status')
        .set('Cookie', staffCookie())
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.ticket.status).toBe('IN_PROGRESS');
    });
  });

  // -------------------------------------------------------------------------
  // Authorization & Input Validation Tests
  // -------------------------------------------------------------------------
  describe('Authorization and Input Validation for PATCH /api/staff/tickets/:id/status', () => {
    it('returns 403 Forbidden when a Requester attempts to update status', async () => {
      const res = await request(app)
        .patch('/api/staff/tickets/1/status')
        .set('Cookie', requesterCookie())
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 401 Unauthenticated when no auth cookie is provided', async () => {
      const res = await request(app)
        .patch('/api/staff/tickets/1/status')
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 400 for non-numeric ticket id', async () => {
      const res = await request(app)
        .patch('/api/staff/tickets/abc/status')
        .set('Cookie', staffCookie())
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for invalid status value', async () => {
      const res = await request(app)
        .patch('/api/staff/tickets/1/status')
        .set('Cookie', staffCookie())
        .send({ status: 'NOT_A_VALID_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 if ticket does not exist', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/staff/tickets/9999/status')
        .set('Cookie', staffCookie())
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
