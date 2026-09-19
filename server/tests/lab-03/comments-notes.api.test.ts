import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Hoisted mock data
// ---------------------------------------------------------------------------
const { mockPrismaInstance, sampleTicket, sampleComment, sampleNote } = vi.hoisted(() => {
  const sampleTicket = {
    id: 1,
    ticketNumber: 'TKT-20260913-0001',
    status: 'IN_PROGRESS',
    requestedPriority: 'HIGH',
    itPriority: 'HIGH',
    summary: 'Printer not working',
    description: 'The printer on floor 3 is not responding.',
    requesterId: 99,   // matches requester cookie userId
    ownerId: 1,
    requesterIndicatedResolved: false,
    createdAt: new Date('2026-09-13T10:00:00Z'),
    updatedAt: new Date('2026-09-13T12:00:00Z'),
    categoryId: 1,
    relatedSystemId: 1,
    category: { id: 1, name: 'Hardware' },
    relatedSystem: { id: 1, name: 'Printer System' },
    requester: { id: 99, name: 'Requester User' },
    owner: { id: 1, name: 'Test IT Staff' },
    attachments: [],
  };

  const sampleComment = {
    id: 1,
    ticketId: 1,
    authorId: 1,
    author: { name: 'Test IT Staff', role: 'IT_STAFF' },
    content: 'This is a public comment',
    createdAt: new Date('2026-09-13T12:00:00Z'),
  };

  const sampleNote = {
    id: 1,
    ticketId: 1,
    authorId: 1,
    author: { name: 'Test IT Staff' },
    content: 'This is an internal note',
    createdAt: new Date('2026-09-13T12:00:00Z'),
  };

  const mockInstance = {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Test IT Staff',
        email: 'staff@example.com',
        role: 'IT_STAFF',
        isActive: true,
        mustChangePassword: false,
        passwordHash: '$2b$10$hashedpassword',
      }),
    },
    ticket: {
      findUnique: vi.fn().mockResolvedValue(sampleTicket),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({
        id: 1,
        requesterIndicatedResolved: true,
        status: 'IN_PROGRESS',
      }),
    },
    comment: {
      create: vi.fn().mockResolvedValue(sampleComment),
      findMany: vi.fn().mockResolvedValue([sampleComment]),
    },
    internalNote: {
      create: vi.fn().mockResolvedValue(sampleNote),
      findMany: vi.fn().mockResolvedValue([sampleNote]),
    },
    category: { findMany: vi.fn().mockResolvedValue([]) },
    relatedSystem: { findMany: vi.fn().mockResolvedValue([]) },
    attachment: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  };

  return { mockPrismaInstance: mockInstance, sampleTicket, sampleComment, sampleNote };
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

function staffCookie(): string {
  const token = jwt.sign(
    { userId: 1, email: 'staff@example.com', role: 'IT_STAFF', mustChangePassword: false },
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
// CN-01: IT Staff posts Public Comment — AC-11
// ---------------------------------------------------------------------------
describe('CN-01 — POST /api/tickets/:id/comments — IT Staff posts Public Comment', () => {
  it('returns 201 with comment and author info', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce(sampleTicket);
    mockPrismaInstance.comment.create.mockResolvedValueOnce(sampleComment);

    const res = await request(app)
      .post('/api/tickets/1/comments')
      .set('Cookie', staffCookie())
      .send({ content: 'This is a public comment' });

    expect(res.status).toBe(201);
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment.authorName).toBeDefined();
    expect(res.body.comment.authorRole).toBeDefined();
    expect(res.body.comment.content).toBe('This is a public comment');
    expect(res.body.comment.id).toBeDefined();
    expect(res.body.comment.createdAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// CN-02: Requester posts Public Comment on own ticket — AC-11
// ---------------------------------------------------------------------------
describe('CN-02 — POST /api/tickets/:id/comments — Requester posts on own ticket', () => {
  it('returns 201 when requester posts on their own ticket', async () => {
    // requesterId: 99 matches requester cookie userId
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce({ ...sampleTicket, requesterId: 99 });
    mockPrismaInstance.comment.create.mockResolvedValueOnce({
      ...sampleComment,
      authorId: 99,
      author: { name: 'Requester User', role: 'REQUESTER' },
      content: 'I have a follow-up question',
    });

    const res = await request(app)
      .post('/api/tickets/1/comments')
      .set('Cookie', requesterCookie())
      .send({ content: 'I have a follow-up question' });

    expect(res.status).toBe(201);
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment.content).toBe('I have a follow-up question');
  });
});

// ---------------------------------------------------------------------------
// CN-03: Requester posts comment on another's ticket — 404 — AC-11
// ---------------------------------------------------------------------------
describe("CN-03 — POST /api/tickets/:id/comments — Requester posts on another's ticket", () => {
  it('returns 404 (no info leak) when requester posts on another requester\'s ticket', async () => {
    // requesterId: 10 (NOT 99 — different requester)
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce({ ...sampleTicket, requesterId: 10 });

    const res = await request(app)
      .post('/api/tickets/1/comments')
      .set('Cookie', requesterCookie())
      .send({ content: 'I should not post this' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// CN-04: IT Staff creates Internal Note — AC-11
// ---------------------------------------------------------------------------
describe('CN-04 — POST /api/staff/tickets/:id/notes — IT Staff creates Internal Note', () => {
  it('returns 201 with note and author info', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce(sampleTicket);
    mockPrismaInstance.internalNote.create.mockResolvedValueOnce(sampleNote);

    const res = await request(app)
      .post('/api/staff/tickets/1/notes')
      .set('Cookie', staffCookie())
      .send({ content: 'This is an internal note' });

    expect(res.status).toBe(201);
    expect(res.body.note).toBeDefined();
    expect(res.body.note.authorName).toBeDefined();
    expect(res.body.note.content).toBe('This is an internal note');
    expect(res.body.note.id).toBeDefined();
    expect(res.body.note.createdAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// CN-05: Requester requests Internal Notes — 403 — AC-04
// ---------------------------------------------------------------------------
describe('CN-05 — GET /api/staff/tickets/:id/notes — Requester is forbidden', () => {
  it('returns 403 when requester accesses internal notes', async () => {
    const res = await request(app)
      .get('/api/staff/tickets/1/notes')
      .set('Cookie', requesterCookie());

    expect(res.status).toBe(403);
  });

  it('does not reveal note content in the 403 response', async () => {
    const res = await request(app)
      .get('/api/staff/tickets/1/notes')
      .set('Cookie', requesterCookie());

    expect(res.body.notes).toBeUndefined();
    expect(res.body.note).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// CN-06: Empty comment content — 400
// ---------------------------------------------------------------------------
describe('CN-06 — POST /api/tickets/:id/comments — empty content', () => {
  it('returns 400 for empty string content', async () => {
    const res = await request(app)
      .post('/api/tickets/1/comments')
      .set('Cookie', staffCookie())
      .send({ content: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when content field is missing', async () => {
    const res = await request(app)
      .post('/api/tickets/1/comments')
      .set('Cookie', staffCookie())
      .send({});

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// CN-07: Whitespace-only comment — 400
// ---------------------------------------------------------------------------
describe('CN-07 — POST /api/tickets/:id/comments — whitespace-only content', () => {
  it('returns 400 for whitespace-only content', async () => {
    const res = await request(app)
      .post('/api/tickets/1/comments')
      .set('Cookie', staffCookie())
      .send({ content: '     ' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for tab-only content', async () => {
    const res = await request(app)
      .post('/api/tickets/1/comments')
      .set('Cookie', staffCookie())
      .send({ content: '\t\t\t' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// CN-08: Comment exceeding max length — 400
// ---------------------------------------------------------------------------
describe('CN-08 — POST /api/tickets/:id/comments — content exceeds 2000 chars', () => {
  it('returns 400 for comment with 2001 characters', async () => {
    const res = await request(app)
      .post('/api/tickets/1/comments')
      .set('Cookie', staffCookie())
      .send({ content: 'a'.repeat(2001) });

    expect(res.status).toBe(400);
  });

  it('returns 201 for comment with exactly 2000 characters', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce(sampleTicket);
    mockPrismaInstance.comment.create.mockResolvedValueOnce({
      ...sampleComment,
      content: 'a'.repeat(2000),
    });

    const res = await request(app)
      .post('/api/tickets/1/comments')
      .set('Cookie', staffCookie())
      .send({ content: 'a'.repeat(2000) });

    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// CN-09: Requester indicates "Problem Appears Resolved" — AC-16
// ---------------------------------------------------------------------------
describe('CN-09 — PATCH /api/tickets/:id/requester-resolved — Requester indicates resolved', () => {
  it('returns 200 with requesterIndicatedResolved = true', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce({
      ...sampleTicket,
      requesterId: 99,
      status: 'IN_PROGRESS',
      requesterIndicatedResolved: false,
    });
    mockPrismaInstance.ticket.update.mockResolvedValueOnce({
      id: 1,
      requesterIndicatedResolved: true,
      status: 'IN_PROGRESS',
    });

    const res = await request(app)
      .patch('/api/tickets/1/requester-resolved')
      .set('Cookie', requesterCookie());

    expect(res.status).toBe(200);
    expect(res.body.ticket.requesterIndicatedResolved).toBe(true);
  });

  it('ticket status does NOT change (still IN_PROGRESS)', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce({
      ...sampleTicket,
      requesterId: 99,
      status: 'IN_PROGRESS',
    });
    mockPrismaInstance.ticket.update.mockResolvedValueOnce({
      id: 1,
      requesterIndicatedResolved: true,
      status: 'IN_PROGRESS',
    });

    const res = await request(app)
      .patch('/api/tickets/1/requester-resolved')
      .set('Cookie', requesterCookie());

    // Status must remain IN_PROGRESS — NOT changed to RESOLVED or CLOSED (AC-16)
    expect(res.body.ticket.status).toBe('IN_PROGRESS');
  });

  it('also works when ticket is WAITING_FOR_REQUESTER', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce({
      ...sampleTicket,
      requesterId: 99,
      status: 'WAITING_FOR_REQUESTER',
    });
    mockPrismaInstance.ticket.update.mockResolvedValueOnce({
      id: 1,
      requesterIndicatedResolved: true,
      status: 'WAITING_FOR_REQUESTER',
    });

    const res = await request(app)
      .patch('/api/tickets/1/requester-resolved')
      .set('Cookie', requesterCookie());

    expect(res.status).toBe(200);
    expect(res.body.ticket.requesterIndicatedResolved).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CN-10: Requester indicates resolved on wrong status — 400 — AC-16
// ---------------------------------------------------------------------------
describe('CN-10 — PATCH /api/tickets/:id/requester-resolved — wrong status → 400', () => {
  it('returns 400 when ticket status is NEW', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce({
      ...sampleTicket,
      requesterId: 99,
      status: 'NEW',
    });

    const res = await request(app)
      .patch('/api/tickets/1/requester-resolved')
      .set('Cookie', requesterCookie());

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS');
  });

  it('returns 400 when ticket status is OPEN', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce({
      ...sampleTicket,
      requesterId: 99,
      status: 'OPEN',
    });

    const res = await request(app)
      .patch('/api/tickets/1/requester-resolved')
      .set('Cookie', requesterCookie());

    expect(res.status).toBe(400);
  });

  it('returns 400 when ticket status is RESOLVED', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce({
      ...sampleTicket,
      requesterId: 99,
      status: 'RESOLVED',
    });

    const res = await request(app)
      .patch('/api/tickets/1/requester-resolved')
      .set('Cookie', requesterCookie());

    expect(res.status).toBe(400);
  });

  it('returns 400 when ticket status is CANCELLED', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce({
      ...sampleTicket,
      requesterId: 99,
      status: 'CANCELLED',
    });

    const res = await request(app)
      .patch('/api/tickets/1/requester-resolved')
      .set('Cookie', requesterCookie());

    expect(res.status).toBe(400);
  });

  it('returns 404 when ticket belongs to different requester', async () => {
    // requesterId: 10 (NOT 99)
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce({
      ...sampleTicket,
      requesterId: 10,
      status: 'IN_PROGRESS',
    });

    const res = await request(app)
      .patch('/api/tickets/1/requester-resolved')
      .set('Cookie', requesterCookie());

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Additional: GET /api/tickets/:id/comments — list public comments
// ---------------------------------------------------------------------------
describe('Additional — GET /api/tickets/:id/comments — list public comments', () => {
  it('IT Staff can list all comments on any ticket', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce(sampleTicket);
    mockPrismaInstance.comment.findMany.mockResolvedValueOnce([sampleComment]);

    const res = await request(app)
      .get('/api/tickets/1/comments')
      .set('Cookie', staffCookie());

    expect(res.status).toBe(200);
    expect(res.body.comments).toBeDefined();
    expect(Array.isArray(res.body.comments)).toBe(true);
  });

  it('Requester can list comments on their own ticket', async () => {
    mockPrismaInstance.ticket.findUnique.mockResolvedValueOnce({ ...sampleTicket, requesterId: 99 });
    mockPrismaInstance.comment.findMany.mockResolvedValueOnce([sampleComment]);

    const res = await request(app)
      .get('/api/tickets/1/comments')
      .set('Cookie', requesterCookie());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.comments)).toBe(true);
  });
});
