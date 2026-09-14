/// <reference types="node" />
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, Priority, TicketStatus, Role } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

const BCRYPT_COST = 10;
const INITIAL_PASSWORD = 'P@ssw0rd1';

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'Account & Access',
  'Hardware',
  'Software',
  'Network',
];

const RELATED_SYSTEMS = [
  'Email',
  'Campus Wi-Fi',
  'VPN',
  'LEB2 App',
  'Grade Submission App',
  'Printer',
  'Corporate Laptop',
];

// Users — all roles with initial password P@ssw0rd1 (documented for local dev only)
const USERS = [
  // Requesters (≥4 active + 1 inactive)
  { name: 'Alice Johnson',   email: 'alice.johnson@example.com',   role: Role.REQUESTER,      isActive: true,  mustChangePassword: false },
  { name: 'Bob Smith',       email: 'bob.smith@example.com',       role: Role.REQUESTER,      isActive: true,  mustChangePassword: false },
  { name: 'Carol Williams',  email: 'carol.williams@example.com',  role: Role.REQUESTER,      isActive: true,  mustChangePassword: false },
  { name: 'David Lee',       email: 'david.lee@example.com',       role: Role.REQUESTER,      isActive: true,  mustChangePassword: false },
  { name: 'Robert Taylor',   email: 'robert.taylor@example.com',   role: Role.REQUESTER,      isActive: false, mustChangePassword: true  },
  // IT Staff (≥3 active + 1 inactive)
  { name: 'Sarah Tech',      email: 'sarah.tech@example.com',      role: Role.IT_STAFF,       isActive: true,  mustChangePassword: false },
  { name: 'Mike Support',    email: 'mike.support@example.com',    role: Role.IT_STAFF,       isActive: true,  mustChangePassword: false },
  { name: 'Lisa Ops',        email: 'lisa.ops@example.com',        role: Role.IT_STAFF,       isActive: true,  mustChangePassword: false },
  { name: 'Tom Inactive',    email: 'tom.inactive@example.com',    role: Role.IT_STAFF,       isActive: false, mustChangePassword: true  },
  // Administrator (≥1 active)
  { name: 'Admin User',      email: 'admin@example.com',           role: Role.ADMINISTRATOR,  isActive: true,  mustChangePassword: false },
  // Test account for password change flow
  { name: 'Must Change',     email: 'mustchange@example.com',      role: Role.REQUESTER,      isActive: true,  mustChangePassword: true  },
];

// ---------------------------------------------------------------------------
// Sample tickets — created for each active requester
// ---------------------------------------------------------------------------
const SAMPLE_TICKETS = (
  requesterId: number,
  categoryId: number,
  relatedSystemId: number,
  index: number
) => [
  {
    ticketNumber: `TKT-${String(requesterId).padStart(3, '0')}-${String(index * 2 + 1).padStart(4, '0')}`,
    status: TicketStatus.NEW,
    requestedPriority: Priority.MEDIUM,
    itPriority: Priority.MEDIUM,
    summary: `Cannot access ${RELATED_SYSTEMS[relatedSystemId - 1]} — issue #${index * 2 + 1}`,
    description: `Detailed description for ticket ${index * 2 + 1}. This is a sample support request raised during Lab 3 seed.`,
    requesterId,
    categoryId,
    relatedSystemId,
  },
  {
    ticketNumber: `TKT-${String(requesterId).padStart(3, '0')}-${String(index * 2 + 2).padStart(4, '0')}`,
    status: TicketStatus.NEW,
    requestedPriority: Priority.HIGH,
    itPriority: Priority.HIGH,
    summary: `Urgent: ${RELATED_SYSTEMS[relatedSystemId - 1]} service degraded — issue #${index * 2 + 2}`,
    description: `Detailed description for ticket ${index * 2 + 2}. Users report intermittent failures. Needs immediate investigation.`,
    requesterId,
    categoryId,
    relatedSystemId,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Start seeding...\n');

  // --- Hash initial password once ---
  const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_COST);
  console.log(`🔑 Initial password: ${INITIAL_PASSWORD} (for local dev only)\n`);

  // --- Categories ---
  console.log('📂 Seeding categories...');
  for (const name of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    console.log(`  ✓ Category: ${cat.name} (id=${cat.id})`);
  }

  // --- Related Systems ---
  console.log('\n🖥️ Seeding related systems...');
  for (const name of RELATED_SYSTEMS) {
    const sys = await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    console.log(`  ✓ RelatedSystem: ${sys.name} (id=${sys.id})`);
  }

  // --- Users ---
  console.log('\n👤 Seeding users...');
  const upsertedUsers: { id: number; name: string; role: string; isActive: boolean }[] = [];
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, isActive: u.isActive, mustChangePassword: u.mustChangePassword },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
      },
    });
    upsertedUsers.push({ id: user.id, name: user.name, role: user.role, isActive: user.isActive });
    const status = u.isActive ? '✓ Active  ' : '✗ Inactive';
    const roleStr = u.role.padEnd(13);
    console.log(`  ${status} [${roleStr}]: ${user.name} <${u.email}> (id=${user.id})`);
  }

  // --- Sample Tickets (active requesters only) ---
  console.log('\n🎫 Seeding sample tickets...');
  const activeRequesters = upsertedUsers.filter(u => u.isActive && u.role === 'REQUESTER');

  // Fetch IDs for category and system to use in tickets
  const catIds = await prisma.category.findMany({ select: { id: true } });
  const sysIds = await prisma.relatedSystem.findMany({ select: { id: true } });

  for (let i = 0; i < activeRequesters.length; i++) {
    const requester = activeRequesters[i];
    const categoryId = catIds[i % catIds.length].id;
    const relatedSystemId = sysIds[i % sysIds.length].id;
    const tickets = SAMPLE_TICKETS(requester.id, categoryId, relatedSystemId, i);

    for (const ticket of tickets) {
      const t = await prisma.ticket.upsert({
        where: { ticketNumber: ticket.ticketNumber },
        update: {},
        create: ticket,
      });
      console.log(`  ✓ Ticket ${t.ticketNumber} for ${requester.name}`);
    }
  }

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Credentials for local development:');
  console.log(`   All users: password = ${INITIAL_PASSWORD}`);
  console.log(`   Admin:     admin@example.com`);
  console.log(`   IT Staff:  sarah.tech@example.com, mike.support@example.com, lisa.ops@example.com`);
  console.log(`   Requester: alice.johnson@example.com, bob.smith@example.com`);
  console.log(`   Must Change Password: mustchange@example.com`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });