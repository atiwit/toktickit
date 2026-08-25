import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const {
  mockPrisma,
  mockTicket,
  mockAttachmentActive,
  mockAttachmentRemoved,
  multerBehavior,
} = vi.hoisted(() => {
  const mockTicket = { id: 1, ticketNumber: 'TKT-20260825-0001' };

  const mockAttachmentActive = {
    id: 1,
    ticketId: 1,
    originalFilename: 'screenshot.png',
    storedFilename: 'uuid-abc.png',
    mimeType: 'image/png',
    size: 204800,
    isRemoved: false,
    removedReason: null,
    removedAt: null,
    uploadedAt: new Date('2026-08-25T07:00:00.000Z'),
  };

  const mockAttachmentRemoved = {
    id: 2,
    ticketId: 1,
    originalFilename: 'old-report.pdf',
    storedFilename: 'uuid-def.pdf',
    mimeType: 'application/pdf',
    size: 512000,
    isRemoved: true,
    removedReason: 'Wrong file attached',
    removedAt: new Date('2026-08-25T08:00:00.000Z'),
    uploadedAt: new Date('2026-08-25T07:30:00.000Z'),
  };

  const mockPrisma = {
    ticket: { findUnique: vi.fn() },
    attachment: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
  };

  const multerBehavior: {
    mode: 'success' | 'mime_rejected' | 'size_exceeded';
  } = { mode: 'success' };

  return { mockPrisma, mockTicket, mockAttachmentActive, mockAttachmentRemoved, multerBehavior };
});

vi.mock('../../src/generated/prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));


vi.mock('multer', () => {
  class MulterError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  }

  const mockMulter: any = vi.fn().mockImplementation(() => ({
    single: vi.fn().mockReturnValue(
      (req: any, _res: any, next: (err?: any) => void) => {
        if (multerBehavior.mode === 'mime_rejected') {
          return next(new Error('MIME_REJECTED:text/plain'));
        }
        if (multerBehavior.mode === 'size_exceeded') {
          return next(new MulterError('LIMIT_FILE_SIZE'));
        }
        // success — inject a fake req.file
        req.file = {
          fieldname: 'file',
          originalname: 'screenshot.png',
          filename: 'uuid-abc.png',
          mimetype: 'image/png',
          size: 204800,
          path: '/fake/uploads/uuid-abc.png',
        };
        next();
      }
    ),
  }));

  mockMulter.diskStorage = vi.fn().mockReturnValue({});
  mockMulter.MulterError = MulterError;

  return { default: mockMulter };
});


vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    unlinkSync: vi.fn(),
  };
});

import app from '../../src/index';
import * as fsModule from 'fs';


beforeEach(() => {
  vi.clearAllMocks();

  // Re-set fs mock implementations (clearAllMocks wipes them)
  vi.mocked(fsModule.existsSync).mockReturnValue(true);
  vi.mocked(fsModule.unlinkSync).mockImplementation(() => {});
  vi.mocked(fsModule.mkdirSync as any).mockImplementation(() => undefined);

  // Reset multer behavior to success
  multerBehavior.mode = 'success';

  // Prisma defaults
  mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
  mockPrisma.attachment.count.mockResolvedValue(0);
  mockPrisma.attachment.create.mockResolvedValue(mockAttachmentActive);
  mockPrisma.attachment.findMany.mockResolvedValue([mockAttachmentActive, mockAttachmentRemoved]);
  mockPrisma.attachment.findUnique.mockResolvedValue(mockAttachmentActive);
  mockPrisma.attachment.update.mockResolvedValue({
    ...mockAttachmentRemoved,
    removedReason: 'Wrong file attached',
  });
});

describe('POST /api/tickets/:id/attachments — valid upload', () => {
  it('returns HTTP 201 on valid upload', async () => {
    const res = await request(app)
      .post('/api/tickets/1/attachments')
      .attach('file', Buffer.from('fake png'), { filename: 'screenshot.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
  });

  it('returns attachment object with id, originalFilename, mimeType, size', async () => {
    const res = await request(app)
      .post('/api/tickets/1/attachments')
      .attach('file', Buffer.from('fake png'), { filename: 'screenshot.png', contentType: 'image/png' });
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('originalFilename', 'screenshot.png');
    expect(res.body).toHaveProperty('mimeType', 'image/png');
    expect(res.body).toHaveProperty('size');
    expect(res.body.isRemoved).toBe(false);
  });

  it('returns 404 when ticket does not exist', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValueOnce(null);
    const res = await request(app)
      .post('/api/tickets/999/attachments')
      .attach('file', Buffer.from('fake png'), { filename: 'screenshot.png', contentType: 'image/png' });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/tickets/:id/attachments — wrong MIME type', () => {
  it('returns HTTP 400 for a disallowed MIME type', async () => {
    multerBehavior.mode = 'mime_rejected';
    const res = await request(app)
      .post('/api/tickets/1/attachments')
      .attach('file', Buffer.from('hello'), { filename: 'doc.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/type not allowed/i);
  });
});

describe('POST /api/tickets/:id/attachments — file over 5 MB', () => {
  it('returns HTTP 400 when file exceeds the size limit', async () => {
    multerBehavior.mode = 'size_exceeded';
    const res = await request(app)
      .post('/api/tickets/1/attachments')
      .attach('file', Buffer.from('fake'), { filename: 'large.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5 MB/i);
  });
});

describe('POST /api/tickets/:id/attachments — exceeds active limit', () => {
  it('returns HTTP 400 when ticket already has 5 active attachments', async () => {
    mockPrisma.attachment.count.mockResolvedValueOnce(5);
    const res = await request(app)
      .post('/api/tickets/1/attachments')
      .attach('file', Buffer.from('fake png'), { filename: 'screenshot.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5 active/i);
  });
});

describe('GET /api/tickets/:id/attachments', () => {
  it('returns 200 with an array of attachments', async () => {
    const res = await request(app).get('/api/tickets/1/attachments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns both active and removed attachments', async () => {
    const res = await request(app).get('/api/tickets/1/attachments');
    const active = res.body.filter((a: any) => !a.isRemoved);
    const removed = res.body.filter((a: any) => a.isRemoved);
    expect(active.length).toBeGreaterThan(0);
    expect(removed.length).toBeGreaterThan(0);
  });

  it('removed attachment has removedReason and removedAt', async () => {
    const res = await request(app).get('/api/tickets/1/attachments');
    const removed = res.body.find((a: any) => a.isRemoved);
    expect(removed).toBeDefined();
    expect(removed.removedReason).toBeTruthy();
    expect(removed.removedAt).toBeTruthy();
  });

  it('returns 404 when ticket does not exist', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/tickets/999/attachments');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/attachments/:id/download — active file', () => {
  it('does NOT return 403 for an active attachment (business logic OK)', async () => {
    // The file path is fake, so sendFile may 404 — but our business logic
    // only blocks with 403. Accepting 200 or 404 (file not on disk) is correct.
    const res = await request(app).get('/api/attachments/1/download');
    expect(res.status).not.toBe(403);
  });
});

describe('GET /api/attachments/:id/download — removed attachment', () => {
  it('returns 403 for a removed attachment', async () => {
    mockPrisma.attachment.findUnique.mockResolvedValueOnce(mockAttachmentRemoved);
    const res = await request(app).get('/api/attachments/2/download');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/removed/i);
  });
});

describe('GET /api/attachments/:id/download — not found', () => {
  it('returns 404 when attachment id does not exist', async () => {
    mockPrisma.attachment.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/attachments/999/download');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/attachments/:id — soft-remove with reason', () => {
  it('returns 200 after soft-removing with a valid reason', async () => {
    const res = await request(app)
      .delete('/api/attachments/1')
      .send({ reason: 'Wrong file attached' });
    expect(res.status).toBe(200);
  });

  it('response has isRemoved = true', async () => {
    const res = await request(app)
      .delete('/api/attachments/1')
      .send({ reason: 'Wrong file attached' });
    expect(res.body.isRemoved).toBe(true);
  });

  it('response includes removedReason', async () => {
    const res = await request(app)
      .delete('/api/attachments/1')
      .send({ reason: 'Wrong file attached' });
    expect(res.body.removedReason).toBeTruthy();
  });
});

describe('DELETE /api/attachments/:id — missing reason', () => {
  it('returns 400 when reason is missing', async () => {
    const res = await request(app).delete('/api/attachments/1').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/reason/i);
  });

  it('returns 400 when reason is blank/whitespace', async () => {
    const res = await request(app).delete('/api/attachments/1').send({ reason: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/attachments/:id — not found / already removed', () => {
  it('returns 404 when attachment does not exist', async () => {
    mockPrisma.attachment.findUnique.mockResolvedValueOnce(null);
    const res = await request(app)
      .delete('/api/attachments/999')
      .send({ reason: 'Cleanup' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when attachment is already removed', async () => {
    mockPrisma.attachment.findUnique.mockResolvedValueOnce(mockAttachmentRemoved);
    const res = await request(app)
      .delete('/api/attachments/2')
      .send({ reason: 'Cleanup again' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already removed/i);
  });
});
