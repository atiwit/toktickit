import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Hoisted mock data
// ---------------------------------------------------------------------------
const { mockPrismaInstance, sampleTicket, sampleAction } = vi.hoisted(() => {
  const sampleTicket = {
    id: 1,
    ticketNumber: 'TKT-20261027-0001',
    status: 'IN_PROGRESS',
    requestedPriority: 'HIGH',
    itPriority: 'HIGH',
    summary: 'Wi-Fi network drop',
    description: 'Intermittent disconnection in room 301.',
    requesterId: 99, // Owned by Requester 99
    ownerId: 1,      // Primary owner is IT Staff 1
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

  const sampleAction = {
    id: 101,
    ticketId: 1,
    actionDateTime: new Date('2026-10-27T09:30:00Z'),
    actionDescription: 'Replaced patch cable and restarted the access point.',
    result: 'AP is back online and ping latency is under 5ms.',
    performedById: 1,
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: 'ap-log.txt',
    createdAt: new Date('2026-10-27T09:35:00Z'),
    updatedAt: new Date('2026-10-27T09:35:00Z'),
    performedBy: {
      id: 1,
      name: 'IT Staff Alpha',
      email: 'staff.alpha@example.com',
      role: 'IT_STAFF',
    },
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
        if (where?.id === 2) {
          return {
            id: 2,
            name: 'IT Staff Beta',
            email: 'staff.beta@example.com',
            role: 'IT_STAFF',
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
      update: vi.fn().mockResolvedValue({ ...sampleTicket, updatedAt: new Date() }),
    },
    actionTaken: {
      create: vi.fn().mockResolvedValue(sampleAction),
      findMany: vi.fn().mockResolvedValue([sampleAction]),
      findFirst: vi.fn().mockResolvedValue(sampleAction),
      update: vi.fn().mockResolvedValue(sampleAction),
    },
    $transaction: vi.fn().mockImplementation(async (arg: any) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      if (typeof arg === 'function') {
        return arg(mockInstance);
      }
      return arg;
    }),
  };

  return { mockPrismaInstance: mockInstance, sampleTicket, sampleAction };
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

function adminCookie(): string {
  const token = jwt.sign(
    { userId: 999, email: 'admin@example.com', role: 'ADMINISTRATOR', mustChangePassword: false },
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
describe('Lab 4 Actions Taken API Tests (server/tests/lab-04/actions-taken.api.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaInstance.ticket.findUnique.mockResolvedValue(sampleTicket);
    mockPrismaInstance.actionTaken.create.mockResolvedValue(sampleAction);
    mockPrismaInstance.actionTaken.findMany.mockResolvedValue([sampleAction]);
    mockPrismaInstance.actionTaken.findFirst.mockResolvedValue(sampleAction);
    mockPrismaInstance.actionTaken.update.mockResolvedValue(sampleAction);
  });

  // -------------------------------------------------------------------------
  // POST /api/tickets/:id/actions-taken
  // -------------------------------------------------------------------------
  describe('POST /api/tickets/:id/actions-taken', () => {
    it('API-ACT-01: IT Staff creates a valid Action Taken (201, auto-performedBy)', async () => {
      const res = await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', staffCookie(1))
        .send({
          actionDescription: 'Replaced patch cable and restarted the access point.',
          result: 'AP is back online and ping latency is under 5ms.',
          followUpRequired: false,
          attachmentNotes: 'ap-log.txt',
        });

      expect(res.status).toBe(201);
      expect(res.body.action).toBeDefined();
      expect(mockPrismaInstance.actionTaken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketId: 1,
            performedById: 1, // Auto-recorded from session
            actionDescription: 'Replaced patch cable and restarted the access point.',
            result: 'AP is back online and ping latency is under 5ms.',
            followUpRequired: false,
          }),
        })
      );
      expect(mockPrismaInstance.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } })
      );
    });

    it('API-ACT-02: Administrator can create Action Taken (201)', async () => {
      const res = await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', adminCookie())
        .send({
          actionDescription: 'Admin intervention: adjusted switch port VLAN settings.',
          result: 'VLAN 10 is active and IP leased via DHCP.',
        });

      expect(res.status).toBe(201);
      expect(mockPrismaInstance.actionTaken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            performedById: 999, // Admin user id
          }),
        })
      );
    });

    it('API-ACT-03: Requester cannot create Action Taken (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', requesterCookie(99))
        .send({
          actionDescription: 'Requester trying to record action',
          result: 'Should fail',
        });

      expect(res.status).toBe(403);
      expect(mockPrismaInstance.actionTaken.create).not.toHaveBeenCalled();
    });

    it('API-ACT-04: Returns 400 when followUpRequired is true but followUpNote is missing', async () => {
      const res = await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', staffCookie())
        .send({
          actionDescription: 'Changed battery pack.',
          result: 'Holding charge.',
          followUpRequired: true,
          // followUpNote is omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrismaInstance.actionTaken.create).not.toHaveBeenCalled();
    });

    it('API-ACT-05: Succeeds when followUpRequired is true and followUpNote is provided', async () => {
      const res = await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', staffCookie())
        .send({
          actionDescription: 'Applied temporary thermal paste.',
          result: 'Temperatures dropped 10C.',
          followUpRequired: true,
          followUpNote: 'Order new copper heatsink and check back in 48 hours.',
        });

      expect(res.status).toBe(201);
      expect(mockPrismaInstance.actionTaken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            followUpRequired: true,
            followUpNote: 'Order new copper heatsink and check back in 48 hours.',
          }),
        })
      );
    });

    it('API-ACT-06: Returns 400 when actionDescription or result is empty', async () => {
      const res1 = await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', staffCookie())
        .send({
          actionDescription: '   ',
          result: 'Some result',
        });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', staffCookie())
        .send({
          actionDescription: 'Some description',
          result: '   ',
        });
      expect(res2.status).toBe(400);
    });

    it('API-ACT-13: Returns 404 when ticket does not exist', async () => {
      mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/tickets/9999/actions-taken')
        .set('Cookie', staffCookie())
        .send({
          actionDescription: 'Work done',
          result: 'Done',
        });

      expect(res.status).toBe(404);
      expect(mockPrismaInstance.actionTaken.create).not.toHaveBeenCalled();
    });

    it('API-ACT-15 (BR-02): Staff Beta can record action even when Staff Alpha is Ticket Owner', async () => {
      // sampleTicket ownerId is 1 (Alpha). Staff Beta (id: 2) records an action:
      const res = await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', staffCookie(2))
        .send({
          actionDescription: 'Covering for Alpha: inspected switch rack.',
          result: 'Power supply B has a red LED.',
        });

      expect(res.status).toBe(201);
      expect(mockPrismaInstance.actionTaken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            performedById: 2, // Auto recorded as Beta
          }),
        })
      );
    });

    it('API-ACT-16: Returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/tickets/1/actions-taken')
        .send({
          actionDescription: 'Unauthenticated attempt',
          result: 'None',
        });

      expect(res.status).toBe(401);
    });

    it('API-ACT-17: Returns 400 when description exceeds 2000 characters', async () => {
      const longText = 'a'.repeat(2001);
      const res = await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', staffCookie())
        .send({
          actionDescription: longText,
          result: 'Normal result',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/tickets/:id/actions-taken
  // -------------------------------------------------------------------------
  describe('GET /api/tickets/:id/actions-taken', () => {
    it('API-ACT-07: Requester can view Actions Taken for their owned ticket (200)', async () => {
      // sampleTicket requesterId is 99
      const res = await request(app)
        .get('/api/tickets/1/actions-taken')
        .set('Cookie', requesterCookie(99));

      expect(res.status).toBe(200);
      expect(res.body.actions).toBeDefined();
      expect(Array.isArray(res.body.actions)).toBe(true);
      expect(mockPrismaInstance.actionTaken.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ticketId: 1 } })
      );
    });

    it('API-ACT-08: Requester cannot view Actions Taken for another user ticket (404 no leak)', async () => {
      // Requester 88 requesting ticket owned by 99
      const res = await request(app)
        .get('/api/tickets/1/actions-taken')
        .set('Cookie', requesterCookie(88));

      expect(res.status).toBe(404);
      expect(mockPrismaInstance.actionTaken.findMany).not.toHaveBeenCalled();
    });

    it('API-ACT-09: IT Staff can view Actions Taken for any ticket (200)', async () => {
      const res = await request(app)
        .get('/api/tickets/1/actions-taken')
        .set('Cookie', staffCookie(1));

      expect(res.status).toBe(200);
      expect(res.body.actions).toBeDefined();
      expect(mockPrismaInstance.actionTaken.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ticketId: 1 } })
      );
    });

    it('API-ACT-09 (Admin): Administrator can view Actions Taken for any ticket (200)', async () => {
      const res = await request(app)
        .get('/api/tickets/1/actions-taken')
        .set('Cookie', adminCookie());

      expect(res.status).toBe(200);
      expect(res.body.actions).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // PATCH /api/tickets/:id/actions-taken/:actionId
  // -------------------------------------------------------------------------
  describe('PATCH /api/tickets/:id/actions-taken/:actionId', () => {
    it('API-ACT-10: IT Staff can update an existing Action Taken (200)', async () => {
      const res = await request(app)
        .patch('/api/tickets/1/actions-taken/101')
        .set('Cookie', staffCookie(1))
        .send({
          actionDescription: 'Updated: Replaced patch cable and certified signal.',
          result: 'Latency under 2ms.',
        });

      expect(res.status).toBe(200);
      expect(mockPrismaInstance.actionTaken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 101 },
          data: expect.objectContaining({
            actionDescription: 'Updated: Replaced patch cable and certified signal.',
            result: 'Latency under 2ms.',
          }),
        })
      );
    });

    it('API-ACT-11: Requester cannot update Action Taken (403 Forbidden)', async () => {
      const res = await request(app)
        .patch('/api/tickets/1/actions-taken/101')
        .set('Cookie', requesterCookie(99))
        .send({
          actionDescription: 'Hacked description',
        });

      expect(res.status).toBe(403);
      expect(mockPrismaInstance.actionTaken.update).not.toHaveBeenCalled();
    });

    it('API-ACT-12: Updating followUpRequired to true without followUpNote returns 400', async () => {
      mockPrismaInstance.actionTaken.findFirst.mockResolvedValueOnce({
        ...sampleAction,
        followUpRequired: false,
        followUpNote: null,
      });

      const res = await request(app)
        .patch('/api/tickets/1/actions-taken/101')
        .set('Cookie', staffCookie())
        .send({
          followUpRequired: true,
          // followUpNote omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('API-ACT-14: Returns 404 when Action Taken does not exist', async () => {
      mockPrismaInstance.actionTaken.findFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .patch('/api/tickets/1/actions-taken/999')
        .set('Cookie', staffCookie())
        .send({
          actionDescription: 'Non-existent update',
        });

      expect(res.status).toBe(404);
      expect(mockPrismaInstance.actionTaken.update).not.toHaveBeenCalled();
    });

    it('API-ACT-20: PATCH returns 400 when attachmentNotes is not a string', async () => {
      const res = await request(app)
        .patch('/api/tickets/1/actions-taken/101')
        .set('Cookie', staffCookie())
        .send({
          attachmentNotes: 12345, // invalid type
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/must be a string/i);
    });

    it('API-ACT-21: PATCH returns 400 when attachmentNotes exceeds 1000 characters', async () => {
      const res = await request(app)
        .patch('/api/tickets/1/actions-taken/101')
        .set('Cookie', staffCookie())
        .send({
          attachmentNotes: 'x'.repeat(1001),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/1000 characters or less/i);
    });

    it('API-ACT-22: POST and PATCH wrap create/update in prisma.$transaction', async () => {
      expect(mockPrismaInstance.$transaction).toBeDefined();

      await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', staffCookie())
        .send({
          actionDescription: 'Transaction test action',
          result: 'All good',
        });

      expect(mockPrismaInstance.$transaction).toHaveBeenCalled();

      await request(app)
        .patch('/api/tickets/1/actions-taken/101')
        .set('Cookie', staffCookie())
        .send({
          actionDescription: 'Updated in transaction',
        });

      expect(mockPrismaInstance.$transaction).toHaveBeenCalledTimes(2);
    });

    it('API-ACT-23: POST returns 400 when attachmentNotes exceeds 1000 characters or is not a string', async () => {
      const res1 = await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', staffCookie())
        .send({
          actionDescription: 'Testing invalid attachmentNotes',
          result: 'Failed',
          attachmentNotes: 99999,
        });

      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('VALIDATION_ERROR');

      const res2 = await request(app)
        .post('/api/tickets/1/actions-taken')
        .set('Cookie', staffCookie())
        .send({
          actionDescription: 'Testing invalid attachmentNotes',
          result: 'Failed',
          attachmentNotes: 'a'.repeat(1001),
        });

      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('API-ACT-24: PATCH returns 400 when actionDateTime is invalid or null/empty', async () => {
      const res1 = await request(app)
        .patch('/api/tickets/1/actions-taken/101')
        .set('Cookie', staffCookie())
        .send({
          actionDateTime: 'not-a-valid-date',
        });

      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('VALIDATION_ERROR');

      const res2 = await request(app)
        .patch('/api/tickets/1/actions-taken/101')
        .set('Cookie', staffCookie())
        .send({
          actionDateTime: '',
        });

      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
