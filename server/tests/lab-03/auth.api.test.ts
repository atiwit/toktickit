import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import { PrismaClient } from '../../src/generated/prisma/client';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const BCRYPT_COST = 10;
const INITIAL_PASSWORD = 'P@ssw0rd1';

let activeRequesterId: number;
let activeItStaffId: number;
let inactiveUserId: number;
let mustChangeUserId: number;
let testCategoryId: number;
let testSystemId: number;

const extractCookie = (res: any) => {
  const cookieStr = res.headers['set-cookie']?.[0];
  if (!cookieStr) return '';
  return cookieStr.split(';')[0];
};

describe('Lab 3: Authentication and Regression Tests', () => {
  beforeAll(async () => {
    // Clean up existing data for test stability
    await prisma.internalNote.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();
    await prisma.relatedSystem.deleteMany();

    // Create reference data
    const cat = await prisma.category.create({ data: { name: 'Test Category', isActive: true } });
    testCategoryId = cat.id;

    const sys = await prisma.relatedSystem.create({ data: { name: 'Test System', isActive: true } });
    testSystemId = sys.id;

    const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_COST);

    // Create users
    const u1 = await prisma.user.create({
      data: { name: 'Active Req', email: 'req1@test.com', passwordHash, role: 'REQUESTER', isActive: true, mustChangePassword: false }
    });
    activeRequesterId = u1.id;

    const u2 = await prisma.user.create({
      data: { name: 'Active IT', email: 'it1@test.com', passwordHash, role: 'IT_STAFF', isActive: true, mustChangePassword: false }
    });
    activeItStaffId = u2.id;

    const u3 = await prisma.user.create({
      data: { name: 'Inactive User', email: 'inactive@test.com', passwordHash, role: 'REQUESTER', isActive: false, mustChangePassword: false }
    });
    inactiveUserId = u3.id;

    const u4 = await prisma.user.create({
      data: { name: 'Must Change User', email: 'mustchange@test.com', passwordHash, role: 'REQUESTER', isActive: true, mustChangePassword: true }
    });
    mustChangeUserId = u4.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- Auth APIs ---

  it('API-01: Valid login should return 200, user object, and httpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'req1@test.com', password: INITIAL_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('req1@test.com');
    expect(res.body.user.passwordHash).toBeUndefined(); // BR-11
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('API-02: Wrong password should return 401 with safe message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'req1@test.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('API-03: Non-existent email should return 401 with safe message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: INITIAL_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('API-04: Inactive account should return 403', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inactive@test.com', password: INITIAL_PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
    expect(res.body.error.message).toContain('inactive');
  });

  it('API-05 & API-07: Login with mustChangePassword=true, block endpoints, then change password', async () => {
    // 1. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mustchange@test.com', password: INITIAL_PASSWORD });
    expect(loginRes.status).toBe(200);
    const cookie = extractCookie(loginRes);

    // 2. Try accessing a protected route -> should be blocked by guard
    const protectRes = await request(app)
      .get('/api/tickets')
      .set('Cookie', cookie);
    expect(protectRes.status).toBe(403);
    expect(protectRes.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
    expect(protectRes.body.error.message).toBe('You must change your password before continuing.');

    // 3. Change password
    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ newPassword: 'NewP@ssw0rd123', confirmPassword: 'NewP@ssw0rd123' });
    expect(changeRes.status).toBe(200);
    expect(changeRes.body.user.mustChangePassword).toBe(false);
    const newCookie = extractCookie(changeRes);

    // 4. Access protected route -> should succeed
    const protectRes2 = await request(app)
      .get('/api/tickets')
      .set('Cookie', newCookie);
    expect(protectRes2.status).toBe(200);
  });

  it('API-08: Change password with too short password should return 400', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'req1@test.com', password: INITIAL_PASSWORD });
    const cookie = extractCookie(loginRes);

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ newPassword: 'Short1!', confirmPassword: 'Short1!' });
    expect(res.status).toBe(400);
  });

  it('API-09: Change password with mismatch should return 400', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'req1@test.com', password: INITIAL_PASSWORD });
    const cookie = extractCookie(loginRes);

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ newPassword: 'NewP@ssw0rd123', confirmPassword: 'Different123' });
    expect(res.status).toBe(400);
  });

  it('API-06: Logout should clear cookie and invalidate session', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'req1@test.com', password: INITIAL_PASSWORD });
    const cookie = extractCookie(loginRes);

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);
    expect(logoutRes.status).toBe(200);

    const protectRes = await request(app).get('/api/auth/me'); // no cookie sent
    expect(protectRes.status).toBe(401);
  });

  it('API-10 & API-11: /api/auth/me returns user if authenticated, 401 if not', async () => {
    // Unauthenticated
    const res1 = await request(app).get('/api/auth/me');
    expect(res1.status).toBe(401);

    // Authenticated
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'req1@test.com', password: INITIAL_PASSWORD });
    const cookie = extractCookie(loginRes);
    const res2 = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res2.status).toBe(200);
    expect(res2.body.user.email).toBe('req1@test.com');
  });

  // --- Regression Tests ---

  let reqCookie: string;
  let createdTicketId: number;

  it('REG-01: Create ticket as authenticated Requester', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'req1@test.com', password: INITIAL_PASSWORD });
    reqCookie = extractCookie(loginRes);

    const res = await request(app)
      .post('/api/tickets')
      .set('Cookie', reqCookie)
      .send({
        categoryId: testCategoryId,
        relatedSystemId: testSystemId,
        requestedPriority: 'HIGH',
        summary: 'Regression Test Ticket',
        description: 'Testing ticket creation with JWT',
      });

    expect(res.status).toBe(201);
    createdTicketId = res.body.id;
  });

  it('REG-02: List own tickets after migration', async () => {
    const res = await request(app).get('/api/tickets').set('Cookie', reqCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].summary).toBe('Regression Test Ticket');
  });

  it('REG-03: Ticket detail after migration', async () => {
    const res = await request(app).get(`/api/tickets/${createdTicketId}`).set('Cookie', reqCookie);
    expect(res.status).toBe(200);
    expect(res.body.ticketNumber).toBeDefined();
  });

  it('REG-04: Attachment upload after migration', async () => {
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // Create a dummy file for testing
    const testFilePath = path.join(__dirname, 'test.txt');
    fs.writeFileSync(testFilePath, 'Hello World');

    // Wait, test.txt is not allowed. Allowed types are images and PDF.
    const validTestFilePath = path.join(__dirname, 'test.png');
    fs.writeFileSync(validTestFilePath, 'fake-png-content');

    const res = await request(app)
      .post(`/api/tickets/${createdTicketId}/attachments`)
      .set('Cookie', reqCookie)
      .attach('file', validTestFilePath, { contentType: 'image/png' });
    
    expect(res.status).toBe(201);
    expect(res.body.originalFilename).toBe('test.png');

    // cleanup
    fs.unlinkSync(validTestFilePath);
  });

  it('REG-05: Attachment download after migration', async () => {
    // Get attachment id
    const ticketRes = await request(app).get(`/api/tickets/${createdTicketId}`).set('Cookie', reqCookie);
    const attachmentId = ticketRes.body.attachments[0].id;

    const res = await request(app).get(`/api/attachments/${attachmentId}/download`).set('Cookie', reqCookie);
    expect(res.status).toBe(200);
  });
});
