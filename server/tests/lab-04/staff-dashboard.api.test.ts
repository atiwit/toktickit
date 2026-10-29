import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Hoisted mock data and Prisma mock
// ---------------------------------------------------------------------------
const { mockPrismaInstance, sampleRecentTickets } = vi.hoisted(() => {
  const sampleRecentTickets = [
    {
      id: 34,
      ticketNumber: 'TKT-20261027-0034',
      summary: 'Network switch failure floor 3',
      status: 'IN_PROGRESS',
      itPriority: 'CRITICAL',
      requestedPriority: 'HIGH',
      owner: { id: 1, name: 'Jane Technician' },
      updatedAt: new Date('2026-10-27T09:16:00Z'),
    },
    {
      id: 30,
      ticketNumber: 'TKT-20261027-0030',
      summary: 'Printer paper jam in accounting',
      status: 'OPEN',
      itPriority: null,
      requestedPriority: 'MEDIUM',
      owner: null,
      updatedAt: new Date('2026-10-27T08:50:00Z'),
    },
    {
      id: 28,
      ticketNumber: 'TKT-20261027-0028',
      summary: 'New staff email account request',
      status: 'NEW',
      itPriority: 'LOW',
      requestedPriority: 'LOW',
      owner: null,
      updatedAt: new Date('2026-10-27T08:00:00Z'),
    },
  ];

  const mockInstance = {
    user: {
      findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
        if (where?.id === 1) {
          return {
            id: 1,
            name: 'IT Staff Alpha',
            email: 'staff.alpha@example.com',
            role: 'IT_STAFF',
            isActive: true,
            mustChangePassword: false,
          };
        }
        if (where?.id === 2) {
          return {
            id: 2,
            name: 'Inactive Staff',
            email: 'inactive.staff@example.com',
            role: 'IT_STAFF',
            isActive: false,
            mustChangePassword: false,
          };
        }
        if (where?.id === 3) {
          return {
            id: 3,
            name: 'Password Change Staff',
            email: 'pwd.staff@example.com',
            role: 'IT_STAFF',
            isActive: true,
            mustChangePassword: true,
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
          };
        }
        if (where?.id === 99) {
          return {
            id: 99,
            name: 'Alice Requester',
            email: 'alice@example.com',
            role: 'REQUESTER',
            isActive: true,
            mustChangePassword: false,
          };
        }
        return null;
      }),
    },
    ticket: {
      count: vi.fn().mockImplementation(async ({ where }: any) => {
        if (where?.status === 'NEW') return 14;
        if (where?.status === 'OPEN') return 23;
        if (where?.status === 'IN_PROGRESS') return 18;
        if (where?.status === 'WAITING_FOR_REQUESTER') return 7;
        if (where?.ownerId === 1 && where?.status?.in) return 16;
        if (where?.ownerId === 999 && where?.status?.in) return 5;
        return 0;
      }),
      findMany: vi.fn().mockResolvedValue(sampleRecentTickets),
    },
  };

  return { mockPrismaInstance: mockInstance, sampleRecentTickets };
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

function staffCookie(userId = 1, mustChangePassword = false): string {
  const token = jwt.sign(
    { userId, email: `staff${userId}@example.com`, role: 'IT_STAFF', mustChangePassword },
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

const defaultTicketCount = async ({ where }: any) => {
  if (where?.status === 'NEW') return 14;
  if (where?.status === 'OPEN') return 23;
  if (where?.status === 'IN_PROGRESS') return 18;
  if (where?.status === 'WAITING_FOR_REQUESTER') return 7;
  if (where?.ownerId === 1 && where?.status?.in) return 16;
  if (where?.ownerId === 999 && where?.status?.in) return 5;
  return 0;
};

// ---------------------------------------------------------------------------
// Tests Suite: Staff Dashboard API (server/tests/lab-04/staff-dashboard.api.test.ts)
// ---------------------------------------------------------------------------
describe('Staff Dashboard API Tests (server/tests/lab-04/staff-dashboard.api.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaInstance.ticket.count.mockImplementation(defaultTicketCount);
    mockPrismaInstance.ticket.findMany.mockResolvedValue(sampleRecentTickets);
  });

  // API-DSH-05: GET Staff Dashboard as IT Staff
  it('API-DSH-05: GET /api/dashboards/staff as IT Staff returns 200 OK and operational metrics', async () => {
    const res = await request(app)
      .get('/api/dashboards/staff')
      .set('Cookie', staffCookie(1));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data).toBeDefined();
    expect(data.metrics).toEqual({
      new: 14,
      open: 23,
      inProgress: 18,
      waitingForRequester: 7,
      myAssigned: 16,
    });

    // Verify drillDownLinks are accurate
    expect(data.drillDownLinks).toEqual({
      new: '/staff/tickets?status=NEW',
      open: '/staff/tickets?status=OPEN',
      inProgress: '/staff/tickets?status=IN_PROGRESS',
      waitingForRequester: '/staff/tickets?status=WAITING_FOR_REQUESTER',
      myAssigned: '/staff/tickets?owner=me&status=open-group',
    });
  });

  // API-DSH-06: Verify Staff Dashboard counts match DB queries
  it('API-DSH-06: Verify Staff Dashboard counts accurately match DB queries for all metrics', async () => {
    mockPrismaInstance.ticket.count.mockImplementation(async ({ where }: any) => {
      if (where?.status === 'NEW') return 5;
      if (where?.status === 'OPEN') return 12;
      if (where?.status === 'IN_PROGRESS') return 8;
      if (where?.status === 'WAITING_FOR_REQUESTER') return 3;
      if (where?.ownerId === 1 && where?.status?.in) return 9;
      return 0;
    });

    const res = await request(app)
      .get('/api/dashboards/staff')
      .set('Cookie', staffCookie(1));

    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toEqual({
      new: 5,
      open: 12,
      inProgress: 8,
      waitingForRequester: 3,
      myAssigned: 9,
    });

    // Verify myAssigned query filtered by ownerId and non-terminal active statuses
    expect(mockPrismaInstance.ticket.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerId: 1,
          status: {
            in: expect.arrayContaining(['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED']),
          },
        }),
      })
    );
  });

  // API-DSH-07: GET Staff Dashboard as Administrator
  it('API-DSH-07: GET Staff Dashboard as Administrator returns 200 OK with full staff dashboard access', async () => {
    const res = await request(app)
      .get('/api/dashboards/staff')
      .set('Cookie', adminCookie(999));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.myAssigned).toBe(5);
  });

  // API-DSH-08: Requester requesting Staff Dashboard receives 403 Forbidden
  it('API-DSH-08: Requester requesting Staff Dashboard receives 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/dashboards/staff')
      .set('Cookie', requesterCookie(99));

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // Recent tickets formatting and null owner fallback
  it('DSH-REC-01: Recent tickets formats ownerName correctly and falls back to requestedPriority if itPriority is null', async () => {
    const res = await request(app)
      .get('/api/dashboards/staff')
      .set('Cookie', staffCookie(1));

    expect(res.status).toBe(200);
    const recent = res.body.data.recentTickets;
    expect(recent).toHaveLength(3);

    // Ticket 1: has owner and itPriority
    expect(recent[0]).toMatchObject({
      id: 34,
      ticketNumber: 'TKT-20261027-0034',
      summary: 'Network switch failure floor 3',
      status: 'IN_PROGRESS',
      itPriority: 'CRITICAL',
      ownerName: 'Jane Technician',
    });

    // Ticket 2: no owner (null) and fallback priority
    expect(recent[1]).toMatchObject({
      id: 30,
      ticketNumber: 'TKT-20261027-0030',
      summary: 'Printer paper jam in accounting',
      status: 'OPEN',
      itPriority: 'MEDIUM',
      ownerName: null,
    });
  });

  // Additional Security & Edge Cases
  it('SEC-05: Unauthenticated request receives 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/dashboards/staff');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('SEC-06: Inactive staff account receives 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/dashboards/staff')
      .set('Cookie', staffCookie(2));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('SEC-07: Staff requiring password change receives 403 PASSWORD_CHANGE_REQUIRED', async () => {
    const res = await request(app)
      .get('/api/dashboards/staff')
      .set('Cookie', staffCookie(3, true));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
  });

  it('EDGE-02: Empty database state returns 0 for all metrics and empty array for recentTickets (BR-14)', async () => {
    mockPrismaInstance.ticket.count.mockResolvedValue(0);
    mockPrismaInstance.ticket.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/dashboards/staff')
      .set('Cookie', staffCookie(1));

    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toEqual({
      new: 0,
      open: 0,
      inProgress: 0,
      waitingForRequester: 0,
      myAssigned: 0,
    });
    expect(res.body.data.recentTickets).toEqual([]);
  });
});
