-- CreateEnum: Role
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

-- AlterEnum: TicketStatus — add only new status values (OPEN, IN_PROGRESS, RESOLVED, CLOSED already exist)
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'OPEN';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'WAITING_FOR_REQUESTER';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'RESOLVED';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'CLOSED';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'REOPENED';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- CreateTable: User (replaces RequesterUser)
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'REQUESTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- MigrateData: Copy RequesterUser records into User with role=REQUESTER
-- Initial password hash for 'P@ssw0rd1' with bcrypt cost 10
-- This hash is pre-computed for migration purposes (dev only)
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive", "mustChangePassword", "createdAt", "updatedAt")
SELECT "id", "name", "email",
       '$2b$10$7pDIPEyv5SKFBRNoszrUzupQlNn0SO4XFaA7d6/yVzF1MZT7GgWuK',
       'REQUESTER', "isActive", true, "createdAt", "updatedAt"
FROM "RequesterUser";

-- Sync the User id sequence to avoid conflicts with future inserts
SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX("id") FROM "User"), 0) + 1, false);

-- AlterTable: Ticket — add new columns
ALTER TABLE "Ticket" ADD COLUMN "itPriority" "Priority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Ticket" ADD COLUMN "ownerId" INTEGER;
ALTER TABLE "Ticket" ADD COLUMN "requesterResolved" BOOLEAN NOT NULL DEFAULT false;

-- Set itPriority = requestedPriority for existing tickets (BR-13)
UPDATE "Ticket" SET "itPriority" = "requestedPriority";

-- Remove the default on itPriority (it should be set explicitly on create)
ALTER TABLE "Ticket" ALTER COLUMN "itPriority" DROP DEFAULT;

-- DropForeignKey: Ticket.requesterId → RequesterUser
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_requesterId_fkey";

-- AddForeignKey: Ticket.requesterId → User
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Ticket.ownerId → User (nullable)
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: Ticket.ownerId
CREATE INDEX "Ticket_ownerId_idx" ON "Ticket"("ownerId");

-- CreateTable: Comment
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_ticketId_idx" ON "Comment"("ticketId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: InternalNote
CREATE TABLE "InternalNote" (
    "id" SERIAL NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InternalNote_ticketId_idx" ON "InternalNote"("ticketId");

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropTable: RequesterUser (data already migrated to User)
DROP TABLE "RequesterUser";
