/// <reference types="node" />
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, Priority, TicketStatus, Role } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BCRYPT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'P@ssw0rd1'; // dev only — documented

// ---------------------------------------------------------------------------
// Reference Data
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

// ---------------------------------------------------------------------------
// Users  (dev credentials — all use password: P@ssw0rd1)
// ---------------------------------------------------------------------------
const USERS = [
  // ≥1 Administrator
  { name: 'Admin User',       email: 'admin@toktickit.dev',        role: Role.ADMINISTRATOR, isActive: true,  mustChangePassword: false },

  // ≥3 active IT Staff + 1 inactive
  { name: 'IT Staff Alpha',   email: 'it.alpha@toktickit.dev',     role: Role.IT_STAFF,      isActive: true,  mustChangePassword: false },
  { name: 'IT Staff Beta',    email: 'it.beta@toktickit.dev',      role: Role.IT_STAFF,      isActive: true,  mustChangePassword: false },
  { name: 'IT Staff Gamma',   email: 'it.gamma@toktickit.dev',     role: Role.IT_STAFF,      isActive: true,  mustChangePassword: false },
  { name: 'IT Staff Inactive',email: 'it.inactive@toktickit.dev',  role: Role.IT_STAFF,      isActive: false, mustChangePassword: true  },

  // ≥4 active Requesters + 1 inactive
  { name: 'Alice Johnson',    email: 'alice.johnson@example.com',  role: Role.REQUESTER,     isActive: true,  mustChangePassword: false },
  { name: 'Bob Smith',        email: 'bob.smith@example.com',      role: Role.REQUESTER,     isActive: true,  mustChangePassword: false },
  { name: 'Carol Williams',   email: 'carol.williams@example.com', role: Role.REQUESTER,     isActive: true,  mustChangePassword: false },
  { name: 'David Lee',        email: 'david.lee@example.com',      role: Role.REQUESTER,     isActive: true,  mustChangePassword: false },
  { name: 'Robert Taylor',    email: 'robert.taylor@example.com',  role: Role.REQUESTER,     isActive: false, mustChangePassword: true  },
  // Extra: user that must change password at next login
  { name: 'New Hire Staff',   email: 'newhire@toktickit.dev',      role: Role.IT_STAFF,      isActive: true,  mustChangePassword: true  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Start seeding (Lab 3)...\n');

  // --- Hash default password once ---
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);
  console.log(`Password hash generated for "${DEFAULT_PASSWORD}"`);

  // --- Categories ---
  console.log('\nSeeding categories...');
  for (const name of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    console.log(`  ✓ Category: ${cat.name} (id=${cat.id})`);
  }

  // --- Related Systems ---
  console.log('\nSeeding related systems...');
  for (const name of RELATED_SYSTEMS) {
    const sys = await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    console.log(`  ✓ RelatedSystem: ${sys.name} (id=${sys.id})`);
  }

  // --- Users ---
  console.log('\nSeeding users...');
  const upsertedUsers: { id: number; name: string; email: string; role: Role; isActive: boolean }[] = [];
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash,
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
      },
    });
    upsertedUsers.push({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive });
    const status = u.isActive ? '✓ Active  ' : '✗ Inactive';
    const mustChange = u.mustChangePassword ? ' [mustChange]' : '';
    console.log(`  ${status}: [${u.role}] ${user.name} <${u.email}> (id=${user.id})${mustChange}`);
  }

  // --- Sample Tickets ---
  console.log('\nSeeding tickets...');
  const catIds = await prisma.category.findMany({ select: { id: true } });
  const sysIds = await prisma.relatedSystem.findMany({ select: { id: true } });

  const requesters = upsertedUsers.filter(u => u.role === Role.REQUESTER && u.isActive);
  const staffList  = upsertedUsers.filter(u => (u.role === Role.IT_STAFF || u.role === Role.ADMINISTRATOR) && u.isActive);

  // Seed ticket data: varied statuses and priorities
  const TICKET_TEMPLATES = [
    { status: TicketStatus.NEW,                   priority: Priority.HIGH,     ownerIdx: null },
    { status: TicketStatus.OPEN,                  priority: Priority.MEDIUM,   ownerIdx: 0    },
    { status: TicketStatus.IN_PROGRESS,           priority: Priority.CRITICAL, ownerIdx: 1    },
    { status: TicketStatus.WAITING_FOR_REQUESTER, priority: Priority.LOW,      ownerIdx: 0    },
    { status: TicketStatus.RESOLVED,              priority: Priority.MEDIUM,   ownerIdx: 1    },
    { status: TicketStatus.CLOSED,                priority: Priority.LOW,      ownerIdx: 0    },
    { status: TicketStatus.REOPENED,              priority: Priority.HIGH,     ownerIdx: null },
    { status: TicketStatus.CANCELLED,             priority: Priority.MEDIUM,   ownerIdx: null },
  ];

  const seededTickets: { id: number; ticketNumber: string }[] = [];

  for (let ri = 0; ri < requesters.length; ri++) {
    const requester = requesters[ri];
    for (let ti = 0; ti < 2; ti++) {
      const tmpl = TICKET_TEMPLATES[(ri * 2 + ti) % TICKET_TEMPLATES.length];
      const categoryId     = catIds[(ri + ti) % catIds.length].id;
      const relatedSystemId = sysIds[(ri + ti) % sysIds.length].id;
      const ownerUser      = tmpl.ownerIdx !== null ? staffList[tmpl.ownerIdx % staffList.length] : null;

      const ticketNumber = `TKT-SEED-${String(ri * 2 + ti + 1).padStart(4, '0')}`;
      const ticket = await prisma.ticket.upsert({
        where: { ticketNumber },
        update: {},
        create: {
          ticketNumber,
          requesterId: requester.id,
          ownerId: ownerUser?.id ?? null,
          categoryId,
          relatedSystemId,
          requestedPriority: tmpl.priority,
          itPriority: tmpl.priority,
          status: tmpl.status,
          summary: `[${tmpl.status}] Issue with ${RELATED_SYSTEMS[(ri + ti) % RELATED_SYSTEMS.length]} — ticket ${ri * 2 + ti + 1}`,
          description: `Detailed description for seeded ticket ${ri * 2 + ti + 1}. Requester: ${requester.name}. Status: ${tmpl.status}. Priority: ${tmpl.priority}.`,
          requesterIndicatedResolved: tmpl.status === TicketStatus.IN_PROGRESS && ti === 0,
        },
      });
      seededTickets.push({ id: ticket.id, ticketNumber: ticket.ticketNumber });
      const ownerLabel = ownerUser ? ownerUser.name : 'Unassigned';
      console.log(`  ✓ ${ticket.ticketNumber} [${tmpl.status}] → Requester: ${requester.name}, Owner: ${ownerLabel}`);
    }
  }

  // --- Sample Comments ---
  console.log('\nSeeding comments...');
  if (seededTickets.length > 0) {
    const t1 = seededTickets[0];
    const requester = requesters[0];
    const staffMember = staffList[0];

    // Check if comment already exists for this ticket
    const existingComments = await prisma.comment.count({ where: { ticketId: t1.id } });
    if (existingComments === 0) {
      await prisma.comment.create({
        data: {
          ticketId: t1.id,
          authorId: requester.id,
          content: 'I still cannot access the system. The issue persists after trying the suggested steps.',
        },
      });
      await prisma.comment.create({
        data: {
          ticketId: t1.id,
          authorId: staffMember.id,
          content: 'Thank you for the update. We are investigating the issue and will get back to you shortly.',
        },
      });
      console.log(`  ✓ Added 2 public comments to ${t1.ticketNumber}`);
    } else {
      console.log(`  ↩ Comments already exist for ${t1.ticketNumber}`);
    }
  }

  // --- Sample Internal Notes ---
  console.log('\nSeeding internal notes...');
  if (seededTickets.length > 1) {
    const t2 = seededTickets[1];
    const staffMember = staffList[0];

    const existingNotes = await prisma.internalNote.count({ where: { ticketId: t2.id } });
    if (existingNotes === 0) {
      await prisma.internalNote.create({
        data: {
          ticketId: t2.id,
          authorId: staffMember.id,
          content: '[Internal] Checked the server logs — root cause is a misconfigured LDAP binding. Escalating to network team.',
        },
      });
      console.log(`  ✓ Added 1 internal note to ${t2.ticketNumber}`);
    } else {
      console.log(`  ↩ Notes already exist for ${t2.ticketNumber}`);
    }
  }

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Dev credentials (all use password: P@ssw0rd1)');
  console.log('   admin@toktickit.dev         — Administrator');
  console.log('   it.alpha@toktickit.dev      — IT Staff');
  console.log('   alice.johnson@example.com   — Requester');
  console.log('   newhire@toktickit.dev       — IT Staff (mustChangePassword=true)');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });