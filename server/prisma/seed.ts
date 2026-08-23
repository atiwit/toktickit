/// <reference types="node" />
import 'dotenv/config';
import { PrismaClient, Priority, TicketStatus } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

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

const REQUESTERS = [
  { name: 'Alice Johnson',   email: 'alice.johnson@example.com',   isActive: true  },
  { name: 'Bob Smith',       email: 'bob.smith@example.com',       isActive: true  },
  { name: 'Carol Williams',  email: 'carol.williams@example.com',  isActive: true  },
  { name: 'David Lee',       email: 'david.lee@example.com',       isActive: true  },
  // Inactive requester — must NOT appear in GET /api/requesters (BR-02)
  { name: 'Robert Taylor',   email: 'robert.taylor@example.com',   isActive: false },
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
    summary: `Cannot access ${RELATED_SYSTEMS[relatedSystemId - 1]} — issue #${index * 2 + 1}`,
    description: `Detailed description for ticket ${index * 2 + 1}. This is a sample support request raised during Lab 2 seed.`,
    requesterId,
    categoryId,
    relatedSystemId,
  },
  {
    ticketNumber: `TKT-${String(requesterId).padStart(3, '0')}-${String(index * 2 + 2).padStart(4, '0')}`,
    status: TicketStatus.NEW,
    requestedPriority: Priority.HIGH,
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

  // --- Categories ---
  console.log('Seeding categories...');
  for (const name of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    console.log(`  ✓ Category: ${cat.name} (id=${cat.id})`);
  }

  // --- Related Systems ---
  console.log('\n Seeding related systems...');
  for (const name of RELATED_SYSTEMS) {
    const sys = await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    console.log(`  ✓ RelatedSystem: ${sys.name} (id=${sys.id})`);
  }

  // --- Requesters ---
  console.log('\n👤 Seeding requesters...');
  const upsertedRequesters: { id: number; name: string; isActive: boolean }[] = [];
  for (const r of REQUESTERS) {
    const requester = await prisma.requesterUser.upsert({
      where: { email: r.email },
      update: { name: r.name, isActive: r.isActive },
      create: { name: r.name, email: r.email, isActive: r.isActive },
    });
    upsertedRequesters.push({ id: requester.id, name: requester.name, isActive: requester.isActive });
    const status = r.isActive ? '✓ Active  ' : '✗ Inactive';
    console.log(`  ${status}: ${requester.name} <${r.email}> (id=${requester.id})`);
  }

  // --- Sample Tickets (active requesters only) ---
  console.log('\n Seeding sample tickets...');
  const activeRequesters = upsertedRequesters.filter(r => r.isActive);

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

  console.log('\n Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });