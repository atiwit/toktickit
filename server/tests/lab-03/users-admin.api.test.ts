import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import { PrismaClient } from '../../src/generated/prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_COST = 10;
const INITIAL_PASSWORD = 'P@ssw0rd1';

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------
let adminCookie: string;
let staffCookie: string;

let adminUserId: number;
let adminUser2Id: number; // second admin for last-admin tests
let staffUserId: number;
let requesterUserId: number;
let targetUserId: number;   // generic target for edits

// ---------------------------------------------------------------------------
// Cookie helper
// ---------------------------------------------------------------------------
const extractCookie = (res: any): string => {
  const cookieStr = res.headers['set-cookie']?.[0];
  if (!cookieStr) return '';
  return cookieStr.split(';')[0];
};

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------
beforeAll(async () => {
  // Wipe data that could conflict
  await prisma.internalNote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_COST);

  // Primary admin (will be used for all admin requests)
  const a1 = await prisma.user.create({
    data: { name: 'Admin One', email: 'admin1@test.com', passwordHash, role: 'ADMINISTRATOR', isActive: true, mustChangePassword: false },
  });
  adminUserId = a1.id;

  // Second admin (needed to test last-admin protection — deactivate a2 to leave a1 as last)
  const a2 = await prisma.user.create({
    data: { name: 'Admin Two', email: 'admin2@test.com', passwordHash, role: 'ADMINISTRATOR', isActive: true, mustChangePassword: false },
  });
  adminUser2Id = a2.id;

  // IT Staff (for non-admin access tests)
  const s1 = await prisma.user.create({
    data: { name: 'Staff One', email: 'staff1@test.com', passwordHash, role: 'IT_STAFF', isActive: true, mustChangePassword: false },
  });
  staffUserId = s1.id;

  // Requester (generic target user for edit / reset-password tests)
  const r1 = await prisma.user.create({
    data: { name: 'Requester One', email: 'req1@test.com', passwordHash, role: 'REQUESTER', isActive: true, mustChangePassword: false },
  });
  requesterUserId = r1.id;
  targetUserId = r1.id;

  // Obtain admin session cookie
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin1@test.com', password: INITIAL_PASSWORD });
  adminCookie = extractCookie(adminLogin);

  // Obtain IT Staff session cookie
  const staffLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'staff1@test.com', password: INITIAL_PASSWORD });
  staffCookie = extractCookie(staffLogin);
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ===========================================================================
// ADMIN-01: List all users
// ===========================================================================
describe('ADMIN-01 — List all users returns 200 with user array', () => {
  it('returns 200 and a users array', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  it('each user has required fields: id, name, email, role, isActive, createdAt', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminCookie);

    const user = res.body.users[0];
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('role');
    expect(user).toHaveProperty('isActive');
    expect(user).toHaveProperty('createdAt');
  });

  it('response never includes passwordHash', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminCookie);

    res.body.users.forEach((u: any) => {
      expect(u.passwordHash).toBeUndefined();
    });
  });
});

// ===========================================================================
// ADMIN-02: Search users by name
// ===========================================================================
describe('ADMIN-02 — Search users by name', () => {
  it('returns matching users when searching by partial name (case-insensitive)', async () => {
    const res = await request(app)
      .get('/api/admin/users?search=admin')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    res.body.users.forEach((u: any) => {
      const nameOrEmail = (u.name + u.email).toLowerCase();
      expect(nameOrEmail).toContain('admin');
    });
  });

  it('returns empty array when no name matches', async () => {
    const res = await request(app)
      .get('/api/admin/users?search=zzznomatch999')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(0);
  });
});

// ===========================================================================
// ADMIN-03: Search users by email
// ===========================================================================
describe('ADMIN-03 — Search users by email', () => {
  it('returns matching users when searching by partial email', async () => {
    const res = await request(app)
      .get('/api/admin/users?search=req1@test')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThanOrEqual(1);
    const found = res.body.users.find((u: any) => u.email === 'req1@test.com');
    expect(found).toBeDefined();
  });

  it('search is case-insensitive for email', async () => {
    const res = await request(app)
      .get('/api/admin/users?search=REQ1@TEST')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================================================
// ADMIN-04: Filter users by role
// ===========================================================================
describe('ADMIN-04 — Filter users by role', () => {
  it('filters to ADMINISTRATOR only', async () => {
    const res = await request(app)
      .get('/api/admin/users?role=ADMINISTRATOR')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    res.body.users.forEach((u: any) => {
      expect(u.role).toBe('ADMINISTRATOR');
    });
  });

  it('filters to IT_STAFF only', async () => {
    const res = await request(app)
      .get('/api/admin/users?role=IT_STAFF')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    res.body.users.forEach((u: any) => {
      expect(u.role).toBe('IT_STAFF');
    });
  });

  it('filters to REQUESTER only', async () => {
    const res = await request(app)
      .get('/api/admin/users?role=REQUESTER')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    res.body.users.forEach((u: any) => {
      expect(u.role).toBe('REQUESTER');
    });
  });

  it('ignores invalid role filter and returns all users', async () => {
    const res = await request(app)
      .get('/api/admin/users?role=INVALID_ROLE')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    // All users returned since invalid role is ignored
    expect(res.body.users.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// ADMIN-05: Create user with valid data
// ===========================================================================
describe('ADMIN-05 — Create user with valid data', () => {
  it('creates a new user and returns 201 with mustChangePassword: true', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'New User',
        email: 'newuser.admin05@test.com',
        role: 'REQUESTER',
        password: 'Valid@Pass1',
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('New User');
    expect(res.body.user.email).toBe('newuser.admin05@test.com');
    expect(res.body.user.role).toBe('REQUESTER');
    expect(res.body.user.isActive).toBe(true);
    expect(res.body.user.mustChangePassword).toBe(true); // BR-24
    expect(res.body.user.passwordHash).toBeUndefined();   // BR-11
  });

  it('sets isActive to true by default when omitted', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Default Active User',
        email: 'defaultactive.admin05@test.com',
        role: 'IT_STAFF',
        password: 'Valid@Pass1',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.isActive).toBe(true);
  });

  it('can create an inactive user when isActive: false', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Inactive New User',
        email: 'inactivenew.admin05@test.com',
        role: 'REQUESTER',
        password: 'Valid@Pass1',
        isActive: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.user.isActive).toBe(false);
  });
});

// ===========================================================================
// ADMIN-06: Create user with duplicate email — AC-12
// ===========================================================================
describe('ADMIN-06 — Create user with duplicate email returns 409', () => {
  it('returns 409 DUPLICATE_EMAIL when email already exists', async () => {
    // First create a user
    await request(app)
      .post('/api/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Original User',
        email: 'duplicate.admin06@test.com',
        role: 'REQUESTER',
        password: 'Valid@Pass1',
      });

    // Try to create another with same email
    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Duplicate User',
        email: 'duplicate.admin06@test.com',
        role: 'IT_STAFF',
        password: 'Valid@Pass1',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
    expect(res.body.error.message).toMatch(/already in use/i);
  });

  it('duplicate email check is case-insensitive', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Case Dup',
        email: 'DUPLICATE.ADMIN06@TEST.COM',
        role: 'REQUESTER',
        password: 'Valid@Pass1',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });
});

// ===========================================================================
// ADMIN-07: Create user with invalid role — validation
// ===========================================================================
describe('ADMIN-07 — Create user with invalid role returns 400', () => {
  it('returns 400 when role is invalid', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Bad Role User',
        email: 'badrole.admin07@test.com',
        role: 'SUPERUSER',
        password: 'Valid@Pass1',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.role).toBeDefined();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', adminCookie)
      .send({ email: 'noname.admin07@test.com', role: 'REQUESTER', password: 'Valid@Pass1' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.name).toBeDefined();
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', adminCookie)
      .send({ name: 'No Email', role: 'REQUESTER', password: 'Valid@Pass1' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.email).toBeDefined();
  });

  it('returns 400 when password is too weak (no uppercase)', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', adminCookie)
      .send({ name: 'Weak Pw', email: 'weakpw.admin07@test.com', role: 'REQUESTER', password: 'weakpass1' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.password).toBeDefined();
  });
});

// ===========================================================================
// ADMIN-08: Edit user name and email
// ===========================================================================
describe('ADMIN-08 — Edit user name and email returns 200', () => {
  it('updates name and email successfully', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}`)
      .set('Cookie', adminCookie)
      .send({ name: 'Updated Name', email: 'updated.admin08@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
    expect(res.body.user.email).toBe('updated.admin08@test.com');
  });

  it('partial update: only name changed, email untouched', async () => {
    const before = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminCookie);
    const target = before.body.users.find((u: any) => u.id === targetUserId);

    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}`)
      .set('Cookie', adminCookie)
      .send({ name: 'Partial Name Change' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Partial Name Change');
    expect(res.body.user.email).toBe(target?.email ?? res.body.user.email);
  });

  it('returns 404 when user does not exist', async () => {
    const res = await request(app)
      .patch('/api/admin/users/999999')
      .set('Cookie', adminCookie)
      .send({ name: 'Ghost User' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ===========================================================================
// ADMIN-09: Edit user — duplicate email on update — AC-12
// ===========================================================================
describe('ADMIN-09 — Edit user duplicate email returns 409', () => {
  it('returns 409 DUPLICATE_EMAIL when updating to an existing email', async () => {
    // admin2 email is 'admin2@test.com'; try to set targetUser to that email
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}`)
      .set('Cookie', adminCookie)
      .send({ email: 'admin2@test.com' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });
});

// ===========================================================================
// ADMIN-10: Change user role
// ===========================================================================
describe('ADMIN-10 — Change user role returns 200', () => {
  it('changes a REQUESTER to IT_STAFF successfully', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}`)
      .set('Cookie', adminCookie)
      .send({ role: 'IT_STAFF' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('IT_STAFF');
  });

  it('changes IT_STAFF back to REQUESTER successfully', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}`)
      .set('Cookie', adminCookie)
      .send({ role: 'REQUESTER' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('REQUESTER');
  });
});

// ===========================================================================
// ADMIN-11: Deactivate user
// ===========================================================================
describe('ADMIN-11 — Deactivate user returns 200 with isActive: false', () => {
  it('deactivates a user successfully', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}`)
      .set('Cookie', adminCookie)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.user.isActive).toBe(false);
  });

  it('can reactivate a deactivated user', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}`)
      .set('Cookie', adminCookie)
      .send({ isActive: true });

    expect(res.status).toBe(200);
    expect(res.body.user.isActive).toBe(true);
  });
});

// ===========================================================================
// ADMIN-12: Admin deactivates own account — AC-13 / BR-21
// ===========================================================================
describe('ADMIN-12 — Admin cannot deactivate own account (self-deactivation)', () => {
  it('returns 403 SELF_DEACTIVATION when admin tries to deactivate their own account', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminUserId}`)
      .set('Cookie', adminCookie)
      .send({ isActive: false });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SELF_DEACTIVATION');
    expect(res.body.error.message).toMatch(/cannot deactivate your own account/i);
  });
});

// ===========================================================================
// ADMIN-13: Deactivate last active Administrator — AC-13 / BR-22
// ===========================================================================
describe('ADMIN-13 — Cannot deactivate the last active Administrator', () => {
  it('returns 409 LAST_ADMIN when deactivating the last active admin (after deactivating admin2)', async () => {
    // 1. Deactivate admin2 so admin1 is the only active admin remaining
    await request(app)
      .patch(`/api/admin/users/${adminUser2Id}`)
      .set('Cookie', adminCookie)
      .send({ isActive: false });

    // 2. admin1 (last active admin) tries to deactivate admin1 → triggers 409 LAST_ADMIN
    const res = await request(app)
      .patch(`/api/admin/users/${adminUserId}`)
      .set('Cookie', adminCookie)
      .send({ isActive: false });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('LAST_ADMIN');
    expect(res.body.error.message).toMatch(/last active administrator/i);

    // Cleanup: restore admin2
    await request(app)
      .patch(`/api/admin/users/${adminUser2Id}`)
      .set('Cookie', adminCookie)
      .send({ isActive: true });
  });

  it('immediately invalidates session when a user is deactivated (session invalidation)', async () => {
    // 1. Create a test staff user and login
    const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_COST);
    const testStaff = await prisma.user.create({
      data: { name: 'Session Test Staff', email: 'session.staff@test.com', passwordHash, role: 'IT_STAFF', isActive: true, mustChangePassword: false },
    });

    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'session.staff@test.com', password: INITIAL_PASSWORD });
    const staffCookie = extractCookie(staffLogin);

    // Verify session works initially
    const meResBefore = await request(app)
      .get('/api/auth/me')
      .set('Cookie', staffCookie);
    expect(meResBefore.status).toBe(200);

    // 2. Admin deactivates testStaff
    await request(app)
      .patch(`/api/admin/users/${testStaff.id}`)
      .set('Cookie', adminCookie)
      .send({ isActive: false });

    // 3. testStaff tries to make request with existing cookie → must be rejected with 401
    const meResAfter = await request(app)
      .get('/api/auth/me')
      .set('Cookie', staffCookie);
    expect(meResAfter.status).toBe(401);
    expect(meResAfter.body.error.code).toBe('UNAUTHENTICATED');

    // Cleanup
    await prisma.user.delete({ where: { id: testStaff.id } });
  });
});

// ===========================================================================
// ADMIN-14: Reset user password — AC-17 / BR-24
// ===========================================================================
describe('ADMIN-14 — Reset user password sets mustChangePassword to true', () => {
  it('resets password and returns success message', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${targetUserId}/reset-password`)
      .set('Cookie', adminCookie)
      .send({ password: 'NewReset@1', confirmPassword: 'NewReset@1' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Password reset successfully/i);
  });

  it('mustChangePassword is set to true in the database after reset', async () => {
    await request(app)
      .post(`/api/admin/users/${targetUserId}/reset-password`)
      .set('Cookie', adminCookie)
      .send({ password: 'NewReset@2', confirmPassword: 'NewReset@2' });

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    expect(user?.mustChangePassword).toBe(true);
  });

  it('returns 400 when passwords do not match', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${targetUserId}/reset-password`)
      .set('Cookie', adminCookie)
      .send({ password: 'Valid@Pass1', confirmPassword: 'Different@Pass2' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.confirmPassword).toBeDefined();
  });

  it('returns 400 when password is too weak', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${targetUserId}/reset-password`)
      .set('Cookie', adminCookie)
      .send({ password: 'weakpass', confirmPassword: 'weakpass' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.password).toBeDefined();
  });

  it('returns 404 when user does not exist', async () => {
    const res = await request(app)
      .post('/api/admin/users/999999/reset-password')
      .set('Cookie', adminCookie)
      .send({ password: 'Valid@Pass1', confirmPassword: 'Valid@Pass1' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ===========================================================================
// ADMIN-15: Non-admin access is forbidden — AUTH-05 / AUTH-06
// ===========================================================================
describe('ADMIN-15 — Non-admin access to user management returns 403', () => {
  it('IT Staff cannot list users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', staffCookie);

    expect(res.status).toBe(403);
  });

  it('IT Staff cannot create a user', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Cookie', staffCookie)
      .send({ name: 'Hack Attempt', email: 'hack@test.com', role: 'REQUESTER', password: 'Valid@Pass1' });

    expect(res.status).toBe(403);
  });

  it('IT Staff cannot update a user', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${requesterUserId}`)
      .set('Cookie', staffCookie)
      .send({ name: 'Hacked Name' });

    expect(res.status).toBe(403);
  });

  it('IT Staff cannot reset password', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${requesterUserId}/reset-password`)
      .set('Cookie', staffCookie)
      .send({ password: 'Valid@Pass1', confirmPassword: 'Valid@Pass1' });

    expect(res.status).toBe(403);
  });

  it('unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// ADMIN-16: Change last admin's role to non-admin — AC-13 / BR-22
// ===========================================================================
describe('ADMIN-16 — Cannot change role of the last active Administrator', () => {
  it('returns 409 LAST_ADMIN when changing last active admin role to non-admin', async () => {
    // 1. Deactivate admin2 so admin1 is the only active admin remaining
    await request(app)
      .patch(`/api/admin/users/${adminUser2Id}`)
      .set('Cookie', adminCookie)
      .send({ isActive: false });

    // 2. admin1 (last active admin) tries to change role to IT_STAFF → triggers 409 LAST_ADMIN
    const res = await request(app)
      .patch(`/api/admin/users/${adminUserId}`)
      .set('Cookie', adminCookie)
      .send({ role: 'IT_STAFF' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('LAST_ADMIN');

    // Cleanup: restore admin2
    await request(app)
      .patch(`/api/admin/users/${adminUser2Id}`)
      .set('Cookie', adminCookie)
      .send({ isActive: true });
  });
});
