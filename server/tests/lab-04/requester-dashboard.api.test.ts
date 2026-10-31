import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Hoisted mock data and Prisma mock
// ---------------------------------------------------------------------------
const { mockPrismaInstance, sampleRecentTickets } = vi.hoisted(() => {
  const sampleRecentTickets = [
    {
      id: 10,
      ticketNumber: 'TKT-20261027-0010',
      summary: 'Laptop battery drains quickly',
      status: 'IN_PROGRESS',
      requestedPriority: 'HIGH',
      updatedAt: new Date('2026-10-27T09:14:00Z'),
    },
    {
      id: 8,
      ticketNumber: 'TKT-20261027-0008',
      summary: 'Monitor flickers intermittently',
      status: 'RESOLVED',
      requestedPriority: 'MEDIUM',
      updatedAt: new Date('2026-10-27T08:30:00Z'),
    },
    {
      id: 5,
      ticketNumber: 'TKT-20261027-0005',
      summary: 'VPN client fails to connect',
      status: 'CLOSED',
      requestedPriority: 'CRITICAL',
      updatedAt: new Date('2026-10-26T15:00:00Z'),
    },
  ];

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
          };
        }
        if (where?.id === 88) {
          return {
            id: 88,
            name: 'Inactive Requester',
            email: 'inactive@example.com',
            role: 'REQUESTER',
            isActive: false,
            mustChangePassword: false,
          };
        }
        if (where?.id === 77) {
          return {
            id: 77,
            name: 'Password Change Requester',
            email: 'pwd@example.com',
            role: 'REQUESTER',
            isActive: true,
            mustChangePassword: true,
          };
        }
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
        return null;
      }),
    },
    ticket: {
      count: vi.fn().mockImplementation(async ({ where }: any) => {
        // Isolation check: if requesterId is 99
        if (where?.requesterId === 99) {
          if (where?.status?.in) {
            // openStatuses: NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED
            return 3;
          }
          if (where?.status === 'IN_PROGRESS') return 1;
          if (where?.status === 'RESOLVED') return 4;
          if (where?.status === 'CLOSED') return 12;
        }
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

function requesterCookie(userId = 99, role = 'REQUESTER', mustChangePassword = false): string {
  const token = jwt.sign(
    { userId, email: `user${userId}@example.com`, role, mustChangePassword },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `token=${token}`;
}

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

const defaultRequesterTicketCount = async ({ where }: any) => {
  if (where?.requesterId === 99) {
    if (where?.status?.in) return 3;
    if (where?.status === 'IN_PROGRESS') return 1;
    if (where?.status === 'RESOLVED') return 4;
    if (where?.status === 'CLOSED') return 12;
  }
  return 0;
};

// ---------------------------------------------------------------------------
// Tests Suite: Requester Dashboard API (server/tests/lab-04/requester-dashboard.api.test.ts)
// ---------------------------------------------------------------------------
describe('Requester Dashboard API Tests (server/tests/lab-04/requester-dashboard.api.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaInstance.ticket.count.mockImplementation(defaultRequesterTicketCount);
    mockPrismaInstance.ticket.findMany.mockResolvedValue(sampleRecentTickets);
  });

  // API-DSH-01: GET Requester Dashboard as authenticated Requester
  it('API-DSH-01: GET /api/dashboards/requester as authenticated Requester returns 200 OK and metrics isolated to caller', async () => {
    const res = await request(app)
      .get('/api/dashboards/requester')
      .set('Cookie', requesterCookie(99));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify response contains both top-level and data envelope
    const data = res.body.data;
    expect(data).toBeDefined();
    expect(data.metrics).toBeDefined();
    expect(data.metrics.myOpenTickets).toBe(3);
    expect(data.metrics.inProgress).toBe(1);
    expect(data.metrics.resolved).toBe(4);
    expect(data.metrics.closed).toBe(12);

    // Verify drillDownLinks are provided correctly
    expect(data.drillDownLinks).toEqual({
      myOpenTickets: '/tickets?status=open-group',
      inProgress: '/tickets?status=IN_PROGRESS',
      resolved: '/tickets?status=RESOLVED',
      closed: '/tickets?status=CLOSED',
    });

    // Verify Prisma query was isolated to req.user.userId
    expect(mockPrismaInstance.ticket.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ requesterId: 99 }),
      })
    );
    expect(mockPrismaInstance.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ requesterId: 99 }),
        orderBy: { updatedAt: 'desc' },
        take: 5,
      })
    );
  });

  // API-DSH-02: Verify Requester Dashboard metrics match database counts
  it('API-DSH-02: Verify Requester Dashboard metrics accurately match database query counts', async () => {
    mockPrismaInstance.ticket.count.mockImplementation(async ({ where }: any) => {
      if (where?.requesterId === 99) {
        if (where?.status?.in) return 7;
        if (where?.status === 'IN_PROGRESS') return 2;
        if (where?.status === 'RESOLVED') return 5;
        if (where?.status === 'CLOSED') return 10;
      }
      return 0;
    });

    const res = await request(app)
      .get('/api/dashboards/requester')
      .set('Cookie', requesterCookie(99));

    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toEqual({
      myOpenTickets: 7,
      inProgress: 2,
      resolved: 5,
      closed: 10,
    });
  });

  // API-DSH-03: Requester Dashboard recent tickets list length <= 5 and sorted by updatedAt desc
  it('API-DSH-03: Requester Dashboard recent tickets list has length <= 5 and maps required fields', async () => {
    const res = await request(app)
      .get('/api/dashboards/requester')
      .set('Cookie', requesterCookie(99));

    expect(res.status).toBe(200);
    const recent = res.body.data.recentTickets;
    expect(Array.isArray(recent)).toBe(true);
    expect(recent.length).toBeLessThanOrEqual(5);
    expect(recent.length).toBe(3);

    // Verify fields
    expect(recent[0]).toMatchObject({
      id: 10,
      ticketNumber: 'TKT-20261027-0010',
      summary: 'Laptop battery drains quickly',
      status: 'IN_PROGRESS',
      requestedPriority: 'HIGH',
    });
    expect(recent[0].updatedAt).toBeDefined();
  });

  // API-DSH-04: IT Staff requesting Requester Dashboard returns 403 Forbidden
  it('API-DSH-04: IT Staff requesting Requester Dashboard receives 403 Forbidden due to role mismatch', async () => {
    const res = await request(app)
      .get('/api/dashboards/requester')
      .set('Cookie', staffCookie(1));

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // Additional Security & Edge Cases
  it('SEC-01: Administrator requesting Requester Dashboard receives 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/dashboards/requester')
      .set('Cookie', adminCookie(999));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('SEC-02: Unauthenticated request receives 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/dashboards/requester');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('SEC-03: Inactive user account receives 401 Unauthorized (session invalidated)', async () => {
    const res = await request(app)
      .get('/api/dashboards/requester')
      .set('Cookie', requesterCookie(88));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('SEC-04: User requiring password change receives 403 PASSWORD_CHANGE_REQUIRED', async () => {
    const res = await request(app)
      .get('/api/dashboards/requester')
      .set('Cookie', requesterCookie(77, 'REQUESTER', true));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
  });

  it('EDGE-01: Empty database state returns 0 for all metrics and empty array for recentTickets (BR-14)', async () => {
    mockPrismaInstance.ticket.count.mockResolvedValue(0);
    mockPrismaInstance.ticket.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/dashboards/requester')
      .set('Cookie', requesterCookie(99));

    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toEqual({
      myOpenTickets: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    });
    expect(res.body.data.recentTickets).toEqual([]);
  });
});
