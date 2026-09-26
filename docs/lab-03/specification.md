# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal

Sprint 3 เปลี่ยนจากระบบ Development Requester selector ชั่วคราวไปเป็นระบบ Authentication จริง พร้อม Role-Based Authorization สำหรับ 3 บทบาท (Requester, IT Staff, Administrator) โดยเพิ่ม IT Staff Ticket workflow (Queue, Ticket Detail, ownership, IT Priority, Public Comments, Internal Notes, status transitions) และ Administrator User Management แบบ minimalist ทั้งหมดรันบน Zen Green Theme ที่ตอบสนองทุก breakpoint และ enforce authorization ทุก API endpoint ด้วย backend

---

## 2. Stakeholder Request Interpretation

Stakeholder ต้องการให้ระบบเปลี่ยนจากการเลือก Requester ชั่วคราวเป็นระบบ login จริงด้วย email/password โดย Administrator สามารถจัดการบัญชีผู้ใช้ได้ผ่านหน้า User Management แบบเรียบง่าย (สร้าง, แก้ไข, กำหนดบทบาท, activate/deactivate, ตั้ง initial password) ผู้ใช้ที่ login ด้วย initial password ต้องเปลี่ยนรหัสผ่านก่อนเข้าระบบ Requester ยังคงใช้ฟังก์ชัน Ticket จาก Lab 2 ได้ แต่ identity มาจากบัญชีที่ authenticated ส่วน IT Staff ต้องมี Ticket Queue สำหรับจัดลำดับงาน เปิดดู Ticket Detail, claim/reassign ownership, ตั้ง IT Priority, สื่อสารกับ Requester ผ่าน Public Comments, บันทึก Internal Notes, และเปลี่ยนสถานะ Ticket ตาม workflow ที่กำหนด ทุก API ต้อง enforce authorization ด้วย backend — การซ่อนปุ่มที่ frontend ไม่ใช่การรักษาความปลอดภัย

---

## 3. Scope

### Included
- Authentication (login, logout, current-user, mandatory first-login password change)
- Role-based navigation and server-side authorization for Requester, IT Staff, Administrator
- Migration from Development Requester identity to authenticated User model
- Continued Requester ownership protection for all Lab 2 Ticket and Attachment functions
- IT Staff Ticket Queue, Ticket Detail, ownership, IT Priority, Public Comments, Internal Notes, and status workflow
- Minimalist Administrator User Management (user listing, account creation, basic editing, one-role assignment, activation/deactivation, setting new initial password)
- Data model and REST API changes
- Zen Green UI extensions and reusable component rules
- Acceptance criteria, planned tests, migration/regression evidence, and Product Definition of Done

### Explicitly Excluded
- Email invitations, password-reset email, multi-factor authentication, social login, single sign-on
- Self-registration and Requester-created accounts
- Actions Taken by IT Staff
- Formal SLA calculation, escalation rules, notification services
- Dashboards and KPI analytics beyond simple queue counts
- Multi-tenant organizations, departments, customer administration
- Production-grade deployment or cloud infrastructure changes
- Multiple roles assigned to one user
- User deletion, bulk user operations, user import/export, account-history screens
- Department, organization, profile-photo, and other extended user-profile management
- Email delivery of initial passwords or reset links
- Account unlocking, administrator approval workflows, advanced identity-management
- Advanced user-list features (mandatory pagination, multi-column sorting, multiple simultaneous filters)

---

## 4. Functional Requirements

### Authentication & Session
- **FR-01** The system provides a Login screen where users authenticate with email and password.
- **FR-02** Only an active user with valid credentials may establish an authenticated session.
- **FR-03** A user marked as requiring a password change is redirected to the Change Password screen and cannot access normal application screens until a valid new password is saved.
- **FR-04** The system provides a Logout action that invalidates the authenticated session and redirects to the Login screen.
- **FR-05** The system provides a current-user API that returns the authenticated user's identity and role.

### Authorization & Navigation
- **FR-06** Each authenticated user sees only the navigation and actions permitted for their role (Requester, IT Staff, Administrator).
- **FR-07** Every protected API endpoint enforces role-based authorization on the backend; a hidden or disabled frontend control is not a security mechanism.
- **FR-08** Unauthenticated requests to protected endpoints return 401; authenticated but unauthorized requests return 403.

### Requester Continuation
- **FR-09** All Lab 2 Requester functions (Create Ticket, My Tickets, Ticket Detail, Attachments) continue to work using the authenticated Requester identity instead of the Development Requester selector.
- **FR-10** The Development Requester selector and Change Requester action are removed.
- **FR-11** A Requester can post Public Comments on their own Tickets.
- **FR-12** A Requester can indicate that the reported problem appears resolved but cannot formally set the Ticket to Resolved or Closed.

### IT Staff Operations
- **FR-13** IT Staff can view a shared Ticket Queue with search, filters, sorting, and pagination.
- **FR-14** IT Staff can open a Ticket Detail screen from the Queue showing all ticket information with permitted operational fields editable.
- **FR-15** IT Staff can claim an unassigned Ticket (self-assign) or reassign ownership to another active IT Staff or Administrator user.
- **FR-16** IT Staff can set or change IT Priority on a Ticket.
- **FR-17** IT Staff can perform permitted status transitions according to the approved transition matrix.
- **FR-18** IT Staff can post Public Comments visible to Requester, IT Staff, and Administrator.
- **FR-19** IT Staff can create Internal Notes visible only to IT Staff and Administrator.

### Administrator User Management
- **FR-20** An Administrator can view a user list showing Name, Email, Role, Status, and an Edit action.
- **FR-21** An Administrator can search users by name or email and optionally filter by role.
- **FR-22** An Administrator can create a user with name, email address, one permitted role, activation state, and an initial password.
- **FR-23** An Administrator can edit a user's name, email address, role, and activation state.
- **FR-24** An Administrator can set a new initial password that the user must change at their next login.
- **FR-25** The system prevents duplicate email addresses.
- **FR-26** The system prevents an Administrator from deactivating their own account.
- **FR-27** The system prevents removal or deactivation of the last active Administrator.
- **FR-28** The system uses deactivation instead of deleting users.

---

## 5. Business Rules

- **BR-01** Only an active user with valid credentials may authenticate.
- **BR-02** A user marked as requiring a password change cannot enter the normal application until a new valid password is saved.
- **BR-03** The authenticated user identity, not a requesterId supplied by the client, determines ownership of Requester operations.
- **BR-04** Public Comments are visible to the Requester, IT Staff, and Administrator. Internal Notes are visible only to IT Staff and Administrator.
- **BR-05** A Requester may indicate that the problem appears resolved, but cannot formally set the Ticket to Resolved or Closed.
- **BR-06** Login attempts with invalid credentials return a safe generic error message (e.g., "Invalid email or password") without revealing whether the email exists.
- **BR-07** Login attempts with an inactive account return a clear but safe response without exposing unnecessary account information.
- **BR-08** Passwords must be hashed using bcrypt (cost factor ≥ 10) and must never be stored in plaintext.
- **BR-09** Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, and one number.
- **BR-10** Logout invalidates the session/token; subsequent requests with the invalidated session are treated as unauthenticated (401).
- **BR-11** The current-user endpoint returns the authenticated user's id, name, email, and role; it never returns password-related data.
- **BR-12** Each Ticket may have zero or one primary Ticket Owner who is an active IT Staff or Administrator user. A Ticket may initially be unassigned.
- **BR-13** Requested Priority remains the value submitted by the Requester. IT Priority initially copies Requested Priority and may later be changed only by IT Staff or Administrator.
- **BR-14** IT Priority values are the same as Requested Priority: LOW, MEDIUM, HIGH, CRITICAL.
- **BR-15** Required Ticket statuses: New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled.
- **BR-16** Status transitions must follow the approved transition matrix (see §5.1).
- **BR-17** Public Comments and Internal Notes are append-only in Lab 3; editing and deletion are excluded.
- **BR-18** Each Comment or Note records its author and creation time from the backend.
- **BR-19** Empty or whitespace-only Comment/Note content is rejected.
- **BR-20** Comment/Note content has a maximum length of 2000 characters.
- **BR-21** An Administrator cannot deactivate their own account.
- **BR-22** The system must always have at least one active Administrator; the last active Administrator cannot be deactivated or have their role changed.
- **BR-23** Duplicate email addresses are rejected on both create and update.
- **BR-24** New users created by an Administrator receive an initial password and are marked as requiring password change at first login.
- **BR-25** All Lab 2 Requester functions (Ticket creation, listing, detail, attachment upload/download/remove) continue to work without the Development Requester selector.
- **BR-26** Existing Categories, Related Systems, Tickets, and Attachments remain valid after migration from Lab 2.

### 5.1. Status Transition Matrix

| From Status | Permitted Next Status(es) | Permitted Role(s) |
|---|---|---|
| New | Open, Cancelled | IT Staff, Administrator |
| Open | In Progress, Cancelled | IT Staff, Administrator |
| In Progress | Waiting for Requester, Resolved, Cancelled | IT Staff, Administrator |
| Waiting for Requester | In Progress | IT Staff, Administrator |
| Resolved | Closed, Reopened | IT Staff, Administrator |
| Closed | Reopened | IT Staff, Administrator |
| Reopened | In Progress, Cancelled | IT Staff, Administrator |
| Cancelled | _(terminal state)_ | — |

> **Note:** A Requester may indicate "Problem Appears Resolved" but this does **not** change the status directly. IT Staff must formally transition to Resolved.

---

## 6. Authorization Matrix

| Operation | Requester | IT Staff | Administrator |
|---|---|---|---|
| Login / Logout / Current User | ✅ | ✅ | ✅ |
| Change Password (first login) | ✅ | ✅ | ✅ |
| Create Ticket | ✅ (own) | ❌ | ❌ |
| View My Tickets (list) | ✅ (own) | ❌ | ❌ |
| View Ticket Detail (own) | ✅ (own) | ❌ | ❌ |
| Upload/Download/Remove Attachment (own) | ✅ (own) | ❌ | ❌ |
| Post Public Comment (own Ticket) | ✅ (own) | ✅ | ❌ |
| Indicate Problem Appears Resolved | ✅ (own) | ❌ | ❌ |
| View IT Staff Ticket Queue | ❌ | ✅ | ❌ |
| Open Ticket Detail (IT Staff) | ❌ | ✅ | ❌ |
| Claim / Reassign Ticket Owner | ❌ | ✅ | ❌ |
| Set IT Priority | ❌ | ✅ | ❌ |
| Change Ticket Status | ❌ | ✅ | ❌ |
| Post Public Comment (any Ticket) | ❌ | ✅ | ❌ |
| Create Internal Notes | ❌ | ✅ | ❌ |
| View Internal Notes | ❌ | ✅ | ✅ |
| View User List | ❌ | ❌ | ✅ |
| Create / Edit / Activate / Deactivate User | ❌ | ❌ | ✅ |
| Set Initial Password | ❌ | ❌ | ✅ |

---

## 7. UI Specification Summary

ทุกหน้าใช้ **Zen Green Theme** ต่อเนื่องจาก Lab 2 โดยมี CSS Variables เดิม (`--color-primary: #006B3C`, `--color-secondary: #0B7A46`, `--color-bg: #F5F7F6`, `--color-surface: #FFFFFF`)

| Screen | Layout | Key States |
|---|---|---|
| Login | Centered card (max-width 480px) | Validation, busy/disabled button, safe failure, inactive account |
| Change Password | Centered card (max-width 480px) | Validation, password rules, confirmation mismatch, success redirect |
| App Shell | Header with user name/role, logout, role-specific nav | Authenticated, role-based menu |
| Requester screens | Same as Lab 2 (without dev selector) | + Public Comments section, Problem Appears Resolved action |
| IT Staff Ticket Queue | Table (desktop) / Card stack (mobile) | Search, filters, sort, pagination, empty, no-results, loading |
| IT Staff Ticket Detail | Grouped fields + operations panel + comments/notes | Ownership, IT Priority, status change, comments, notes, attachments |
| Admin User Management | User list table + Create/Edit form (modal or inline) | Search, role filter, validation, duplicate email, safety rules |

รายละเอียดครบถ้วนอยู่ใน [`ui-spec.md`](./ui-spec.md)

---

## 8. Data Changes

### New/Modified Models

| Model | Description |
|---|---|
| `User` | Replaces `RequesterUser`. Fields: `id`, `name`, `email` (unique), `passwordHash`, `role` (enum), `isActive`, `mustChangePassword`, `createdAt`, `updatedAt` |
| `Ticket` (modified) | Add `ownerId` (FK → User, nullable), `itPriority` (enum Priority), expand `status` enum |
| `Comment` (new) | Public Comment: `id`, `ticketId` (FK), `authorId` (FK → User), `content`, `createdAt` |
| `InternalNote` (new) | Internal Note: `id`, `ticketId` (FK), `authorId` (FK → User), `content`, `createdAt` |

### Enums

| Enum | Values |
|---|---|
| `Role` | `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR` |
| `Priority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` (unchanged) |
| `TicketStatus` | `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED` |

### Indexes
- `User`: unique index on `email`
- `Ticket`: index on `ownerId`, index on `status` (existing indexes on `requesterId`, `ticketNumber` preserved)
- `Comment`: index on `ticketId`
- `InternalNote`: index on `ticketId`

### Migration Strategy
- `RequesterUser` records are migrated into the `User` model with role = `REQUESTER`
- Each migrated Requester gets an initial hashed password and `mustChangePassword = true`
- `Ticket.requesterId` FK target changes from `RequesterUser` to `User`
- Existing Ticket ownership remains correct after migration
- The `RequesterUser` table is dropped after successful data migration
- The Development Requester selector and its client-side state are removed

### Seed Data
- Idempotent seed (safe to run repeatedly)
- ≥ 4 active Requester accounts + 1 inactive Requester
- ≥ 3 active IT Staff accounts + 1 inactive IT Staff
- ≥ 1 active Administrator account
- Realistic Tickets distributed across Requesters, statuses, priorities, and assigned/unassigned ownership
- Example Public Comments and Internal Notes
- Seeded credentials for local development only, clearly documented

---

## 9. API Contract

รายละเอียดครบถ้วนอยู่ใน [`api-spec.md`](./api-spec.md)

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Login | None |
| POST | `/api/auth/logout` | Logout | Authenticated |
| GET | `/api/auth/me` | Current authenticated user | Authenticated |
| POST | `/api/auth/change-password` | Mandatory password change | Authenticated (must-change) |
| GET | `/api/categories` | List active categories | Authenticated |
| GET | `/api/related-systems` | List active related systems | Authenticated |
| POST | `/api/tickets` | Create Ticket | Requester |
| GET | `/api/tickets` | List own Tickets (Requester) | Requester |
| GET | `/api/tickets/:id` | Get Ticket detail (Requester: own only) | Requester |
| POST | `/api/tickets/:id/attachments` | Upload Attachment | Requester (own) |
| GET | `/api/tickets/:id/attachments` | List Attachments | Requester (own) / IT Staff |
| GET | `/api/attachments/:id/download` | Download active Attachment | Requester (own) / IT Staff |
| DELETE | `/api/attachments/:id` | Soft-remove Attachment | Requester (own) |
| GET | `/api/staff/tickets` | IT Staff Ticket Queue | IT Staff |
| GET | `/api/staff/tickets/:id` | IT Staff Ticket Detail | IT Staff |
| PATCH | `/api/staff/tickets/:id/owner` | Claim/Assign/Reassign owner | IT Staff |
| PATCH | `/api/staff/tickets/:id/priority` | Update IT Priority | IT Staff |
| PATCH | `/api/staff/tickets/:id/status` | Update Ticket status | IT Staff |
| POST | `/api/tickets/:id/comments` | Create Public Comment | Requester (own) / IT Staff |
| GET | `/api/tickets/:id/comments` | List Public Comments | Requester (own) / IT Staff |
| POST | `/api/staff/tickets/:id/notes` | Create Internal Note | IT Staff |
| GET | `/api/staff/tickets/:id/notes` | List Internal Notes | IT Staff / Administrator |
| PATCH | `/api/tickets/:id/requester-resolved` | Requester indicates resolved | Requester (own) |
| GET | `/api/admin/users` | List users (search + role filter) | Administrator |
| POST | `/api/admin/users` | Create user | Administrator |
| PATCH | `/api/admin/users/:id` | Update user (name, email, role, isActive) | Administrator |
| POST | `/api/admin/users/:id/reset-password` | Set new initial password | Administrator |

---

## 10. Acceptance Criteria

- **AC-01** Given an active user with valid credentials, when the user logs in, then the backend establishes authenticated access and returns the permitted user identity and role.
- **AC-02** Given a user who must change the initial password, when login succeeds, then normal application screens remain unavailable until a valid new password is saved.
- **AC-03** Given an authenticated Requester, when the client supplies another requesterId, then the backend still applies the authenticated identity and does not return another Requester's data.
- **AC-04** Given a Requester account, when an Internal Note endpoint is requested, then the operation is rejected without exposing note content.
- **AC-05** Given an inactive user, when the user attempts login, then the system returns a safe rejection without revealing whether the email exists.
- **AC-06** Given a valid login, when the user logs out, then the session is invalidated and subsequent requests return 401.
- **AC-07** Given an IT Staff user, when viewing the Ticket Queue, then all tickets across Requesters are shown with search, filter, sort, and pagination.
- **AC-08** Given an IT Staff user, when claiming an unassigned Ticket, then the Ticket's owner is set to the authenticated IT Staff user.
- **AC-09** Given an IT Staff user, when updating IT Priority, then the Requested Priority remains unchanged and IT Priority is updated.
- **AC-10** Given an IT Staff user, when performing a permitted status transition, then the status is updated; when performing a forbidden transition, then the request is rejected with a clear error.
- **AC-11** Given an IT Staff user, when posting a Public Comment, then the Requester can see it; when posting an Internal Note, then the Requester cannot see it.
- **AC-12** Given an Administrator, when creating a user with a duplicate email, then the operation is rejected with a conflict error.
- **AC-13** Given the last active Administrator, when attempting to deactivate themselves, then the operation is rejected.
- **AC-14** Given any screen, when viewed on mobile (< 768px), tablet (768–991px), and desktop (≥ 992px), then no horizontal scroll, clipping, or overlap occurs.
- **AC-15** Given all Lab 2 Requester functions, when used after migration, then they continue to work identically using the authenticated identity.
- **AC-16** Given a Requester, when indicating "Problem Appears Resolved", then the indication is recorded but the Ticket status does not change to Resolved or Closed.
- **AC-17** Given an Administrator, when setting a new initial password for a user, then the user must change the password at next login.

---

## 11. Definition of Done

- [ ] All FRs (FR-01 through FR-28) implemented
- [ ] All BRs (BR-01 through BR-26) enforced
- [ ] All ACs (AC-01 through AC-17) satisfied with passing tests
- [ ] Migration from RequesterUser to User model completed without data loss
- [ ] Seed data created with required minimum accounts and test data
- [ ] All docs committed before main implementation PRs merged
- [ ] All tests passing on main branch (unit, API, UI component, E2E, authorization, regression)
- [ ] README setup instructions updated for Lab 3
- [ ] All Kanban Issues moved to Done
- [ ] ui-spec.md screenshots captured for all major screens across desktop, tablet, and mobile
- [ ] reviewer.md completed with reviewer identity, PR links, comments, and approvals
- [ ] ai-use.md completed with LLM details and 6–10 key prompts

---

## 12. Assumptions and Decisions

- **Authentication Mechanism:** ใช้ JWT stored in httpOnly cookie สำหรับ session management เพื่อป้องกัน XSS; token มี expiration 24 ชั่วโมง
- **Password Hashing:** ใช้ bcrypt กับ cost factor 10 ตามมาตรฐาน OWASP สำหรับ local development
- **CSRF Protection:** เนื่องจากใช้ httpOnly cookie จึงใช้ SameSite=Strict attribute เป็นการป้องกัน CSRF เบื้องต้น
- **Migration Strategy:** RequesterUser records ถูก migrate ไปเป็น User model โดยอัตโนมัติผ่าน Prisma migration script ทุก Requester ได้รับ initial password `P@ssw0rd1` (documented for dev only) และ `mustChangePassword = true`
- **IT Priority Default:** เมื่อสร้าง Ticket ใหม่ IT Priority จะ copy ค่าจาก Requested Priority โดยอัตโนมัติ
- **Status Transition:** Actions Taken rule ที่บล็อก resolution ถูก defer ไป Lab 4 ตามที่ระบุในข้อกำหนด
- **Ticket Owner Scope:** Owner ต้องเป็น active IT Staff หรือ Administrator; ถ้า owner ถูก deactivate ในภายหลัง Ticket ยังคง reference อยู่แต่ owner ถือว่า inactive
- **Comment/Note Length:** กำหนด max 2000 characters สำหรับ content ของทั้ง Public Comments และ Internal Notes เพื่อ consistency กับ Ticket description
