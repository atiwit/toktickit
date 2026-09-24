# Lab 3 Test Plan

## 1. Test Strategy

ทุก test ถูกวางแผนก่อนหรือพร้อมกับ implementation ตาม Test DD และ TDD approach ที่กำหนดใน Lab 3 handout แผนนี้ครอบคลุม unit, API/integration, UI component, authorization/security, migration/regression, responsive, และ end-to-end tests

### Test Frameworks
- **API/Integration:** Vitest + Supertest
- **UI Component:** Vitest + React Testing Library
- **E2E:** Playwright
- **Coverage Target:** All acceptance criteria (AC-01 through AC-17) must have at least one mapped test

---

## 2. Test Matrix

### 2.1. Authentication API Tests

| Test ID | Type | AC | What It Tests | Expected Result | File | Status |
|---|---|---|---|---|---|---|
| API-01 | API | AC-01 | Valid login with correct credentials | 200; user object returned; httpOnly cookie set | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| API-02 | API | AC-01 | Login with wrong password | 401; safe "Invalid email or password" message | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| API-03 | API | AC-01 | Login with non-existent email | 401; same safe message (no info leak) | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| API-04 | API | AC-05 | Login with inactive account | 403; safe inactive account message | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| API-05 | API | AC-02 | Login with mustChangePassword user | 200; user.mustChangePassword = true; normal endpoints blocked | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| API-06 | API | AC-06 | Logout invalidates session | 200; subsequent requests return 401 | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| API-07 | API | AC-02 | Change password with valid new password | 200; mustChangePassword = false; normal endpoints accessible | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| API-08 | API | AC-02 | Change password: too short | 400; validation error | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| API-09 | API | AC-02 | Change password: mismatch | 400; passwords don't match error | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| API-10 | API | AC-01 | GET /api/auth/me returns authenticated user | 200; user object without password data | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| API-11 | API | AC-01 | GET /api/auth/me without session | 401; unauthenticated | `server/tests/lab-03/auth.api.test.ts` | ☐ |

### 2.2. Authorization API Tests

| Test ID | Type | AC | What It Tests | Expected Result | File | Status |
|---|---|---|---|---|---|---|
| AUTH-01 | API | AC-03 | Requester accessing another Requester's ticket | 404 (no info leak) | `server/tests/lab-03/authorization.api.test.ts` | ☐ |
| AUTH-02 | API | AC-04 | Requester requesting Internal Notes endpoint | 403; no note data | `server/tests/lab-03/authorization.api.test.ts` | ☐ |
| AUTH-03 | API | AC-03 | Requester supplying another requesterId in body | Backend uses authenticated identity; ignores supplied id | `server/tests/lab-03/authorization.api.test.ts` | ☐ |
| AUTH-04 | API | - | Requester accessing IT Staff Queue | 403 | `server/tests/lab-03/authorization.api.test.ts` | ☐ |
| AUTH-05 | API | - | IT Staff accessing Admin user management | 403 | `server/tests/lab-03/authorization.api.test.ts` | ☐ |
| AUTH-06 | API | - | Requester accessing Admin user management | 403 | `server/tests/lab-03/authorization.api.test.ts` | ☐ |
| AUTH-07 | API | - | Unauthenticated access to protected endpoint | 401 | `server/tests/lab-03/authorization.api.test.ts` | ☐ |
| AUTH-08 | API | AC-02 | mustChangePassword user accessing normal endpoint | 403 | `server/tests/lab-03/authorization.api.test.ts` | ☐ |

### 2.3. IT Staff Ticket Queue API Tests

| Test ID | Type | AC | What It Tests | Expected Result | File | Status |
|---|---|---|---|---|---|---|
| QUEUE-01 | API | AC-07 | GET queue returns all tickets | 200; paginated list with all tickets | `server/tests/lab-03/staff-queue.api.test.ts` | ☐ |
| QUEUE-02 | API | AC-07 | Queue search by ticket number | 200; matching tickets only | `server/tests/lab-03/staff-queue.api.test.ts` | ☐ |
| QUEUE-03 | API | AC-07 | Queue search by summary | 200; matching tickets only | `server/tests/lab-03/staff-queue.api.test.ts` | ☐ |
| QUEUE-04 | API | AC-07 | Queue filter by status | 200; filtered results | `server/tests/lab-03/staff-queue.api.test.ts` | ☐ |
| QUEUE-05 | API | AC-07 | Queue filter by IT Priority | 200; filtered results | `server/tests/lab-03/staff-queue.api.test.ts` | ☐ |
| QUEUE-06 | API | AC-07 | Queue filter by owner (unassigned) | 200; only unassigned tickets | `server/tests/lab-03/staff-queue.api.test.ts` | ☐ |
| QUEUE-07 | API | AC-07 | Queue sorting | 200; correctly sorted results | `server/tests/lab-03/staff-queue.api.test.ts` | ☐ |
| QUEUE-08 | API | AC-07 | Queue pagination | 200; correct page metadata | `server/tests/lab-03/staff-queue.api.test.ts` | ☐ |
| QUEUE-09 | API | AC-07 | Queue with invalid page size | Falls back to default 10 | `server/tests/lab-03/staff-queue.api.test.ts` | ☐ |

### 2.4. IT Staff Ticket Detail API Tests

| Test ID | Type | AC | What It Tests | Expected Result | File | Status |
|---|---|---|---|---|---|---|
| STAFF-01 | API | AC-08 | IT Staff claims unassigned ticket | 200; owner = authenticated user | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ☐ |
| STAFF-02 | API | AC-08 | IT Staff reassigns ticket to another IT Staff | 200; owner updated | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ☐ |
| STAFF-03 | API | - | Assign to inactive user | 400; rejected | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ☐ |
| STAFF-04 | API | - | Assign to Requester (wrong role) | 400; rejected | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ☐ |
| STAFF-05 | API | AC-09 | Update IT Priority | 200; IT Priority changed; Requested Priority unchanged | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ☐ |
| STAFF-06 | API | AC-09 | Invalid IT Priority value | 400; validation error | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ☐ |
| STAFF-07 | API | AC-10 | Permitted status transition (New → Open) | 200; status updated | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ☐ |
| STAFF-08 | API | AC-10 | Forbidden status transition (New → Resolved) | 400; invalid transition error | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ☐ |
| STAFF-09 | API | AC-10 | Transition from Cancelled (terminal) | 400; cannot transition from Cancelled | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ☐ |
| STAFF-10 | API | - | GET staff ticket detail | 200; full ticket with permittedStatuses | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | ☐ |

### 2.5. Comments and Notes API Tests

| Test ID | Type | AC | What It Tests | Expected Result | File | Status |
|---|---|---|---|---|---|---|
| CN-01 | API | AC-11 | IT Staff posts Public Comment | 201; comment created with author info | `server/tests/lab-03/comments-notes.api.test.ts` | ☐ |
| CN-02 | API | AC-11 | Requester posts Public Comment on own ticket | 201; comment created | `server/tests/lab-03/comments-notes.api.test.ts` | ☐ |
| CN-03 | API | AC-11 | Requester posts comment on another's ticket | 404; rejected | `server/tests/lab-03/comments-notes.api.test.ts` | ☐ |
| CN-04 | API | AC-11 | IT Staff creates Internal Note | 201; note created | `server/tests/lab-03/comments-notes.api.test.ts` | ☐ |
| CN-05 | API | AC-04 | Requester requests Internal Notes | 403; no note data | `server/tests/lab-03/comments-notes.api.test.ts` | ☐ |
| CN-06 | API | - | Empty comment content | 400; validation error | `server/tests/lab-03/comments-notes.api.test.ts` | ☐ |
| CN-07 | API | - | Whitespace-only comment | 400; validation error | `server/tests/lab-03/comments-notes.api.test.ts` | ☐ |
| CN-08 | API | - | Comment exceeding max length | 400; validation error | `server/tests/lab-03/comments-notes.api.test.ts` | ☐ |
| CN-09 | API | AC-16 | Requester indicates "Problem Appears Resolved" | 200; indicator set; status unchanged | `server/tests/lab-03/comments-notes.api.test.ts` | ☐ |
| CN-10 | API | AC-16 | Requester indicates resolved on wrong status | 400; rejected | `server/tests/lab-03/comments-notes.api.test.ts` | ☐ |

### 2.6. Administrator User Management API Tests

| Test ID | Type | AC | What It Tests | Expected Result | File | Status |
|---|---|---|---|---|---|---|
| ADMIN-01 | API | - | List all users | 200; user array returned | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-02 | API | - | Search users by name | 200; matching users | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-03 | API | - | Search users by email | 200; matching users | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-04 | API | - | Filter users by role | 200; filtered users | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-05 | API | - | Create user with valid data | 201; user created with mustChangePassword = true | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-06 | API | AC-12 | Create user with duplicate email | 409; duplicate email error | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-07 | API | - | Create user with invalid role | 400; validation error | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-08 | API | - | Edit user name and email | 200; user updated | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-09 | API | AC-12 | Edit user: duplicate email on update | 409; conflict | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-10 | API | - | Change user role | 200; role updated | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-11 | API | - | Deactivate user | 200; isActive = false | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-12 | API | AC-13 | Admin deactivates own account | 403; self-deactivation blocked | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-13 | API | AC-13 | Deactivate last active Administrator | 409; last admin protection | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-14 | API | AC-17 | Reset user password | 200; mustChangePassword set to true | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-15 | API | - | Non-admin accesses user management | 403 | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |
| ADMIN-16 | API | AC-13 | Change last admin's role to non-admin | 409; last admin protection | `server/tests/lab-03/users-admin.api.test.ts` | ☐ |

### 2.7. Migration / Regression Tests

| Test ID | Type | AC | What It Tests | Expected Result | File | Status |
|---|---|---|---|---|---|---|
| REG-01 | API | AC-15 | Create ticket as authenticated Requester | 201; ticket created with authenticated identity | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| REG-02 | API | AC-15 | List own tickets after migration | 200; existing tickets returned | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| REG-03 | API | AC-15 | Ticket detail after migration | 200; all data intact | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| REG-04 | API | AC-15 | Attachment upload after migration | 201; upload succeeds | `server/tests/lab-03/auth.api.test.ts` | ☐ |
| REG-05 | API | AC-15 | Attachment download after migration | 200; download succeeds | `server/tests/lab-03/auth.api.test.ts` | ☐ |

### 2.8. UI Component Tests

| Test ID | Type | AC | What It Tests | Expected Result | File | Status |
|---|---|---|---|---|---|---|
| UI-01 | Component | AC-01 | Login form renders email, password, submit | All elements present | `client/.../lab-03/tests/Login.test.tsx` | ☐ |
| UI-02 | Component | AC-01 | Login form shows validation on empty submit | Error messages visible | `client/.../lab-03/tests/Login.test.tsx` | ☐ |
| UI-03 | Component | AC-01 | Login form disables button during submission | Button disabled + loading state | `client/.../lab-03/tests/Login.test.tsx` | ☐ |
| UI-04 | Component | AC-01 | Login form shows safe error on invalid credentials | Generic error message | `client/.../lab-03/tests/Login.test.tsx` | ☐ |
| UI-05 | Component | AC-02 | ChangePassword form validates password rules | Rule violations shown | `client/.../lab-03/tests/ChangePassword.test.tsx` | ☐ |
| UI-06 | Component | AC-02 | ChangePassword form validates mismatch | "Passwords don't match" error | `client/.../lab-03/tests/ChangePassword.test.tsx` | ☐ |
| UI-07 | Component | AC-07 | StaffTicketQueue renders table with data | Columns and rows visible | `client/.../lab-03/tests/StaffTicketQueue.test.tsx` | ☐ |
| UI-08 | Component | AC-07 | StaffTicketQueue shows empty state | "No tickets" message | `client/.../lab-03/tests/StaffTicketQueue.test.tsx` | ☐ |
| UI-09 | Component | AC-07 | StaffTicketQueue search updates list | Filtered results shown | `client/.../lab-03/tests/StaffTicketQueue.test.tsx` | ☐ |
| UI-10 | Component | - | StaffTicketDetail renders all sections | Ticket info, operations, comments, notes | `client/.../lab-03/tests/StaffTicketDetail.test.tsx` | ☐ |
| UI-11 | Component | AC-11 | StaffTicketDetail distinguishes comments vs notes | Different visual styling | `client/.../lab-03/tests/StaffTicketDetail.test.tsx` | ☐ |
| UI-12 | Component | - | UserManagement renders user list | Table with all columns | `client/.../lab-03/tests/UserManagement.test.tsx` | ☐ |
| UI-13 | Component | AC-12 | UserManagement shows duplicate email error | Error message displayed | `client/.../lab-03/tests/UserManagement.test.tsx` | ☐ |
| UI-14 | Component | AC-13 | UserManagement blocks self-deactivation UI | Toggle disabled for own account | `client/.../lab-03/tests/UserManagement.test.tsx` | ☐ |

### 2.9. End-to-End Tests

| Test ID | Type | AC | What It Tests | Expected Result | File | Status |
|---|---|---|---|---|---|---|
| E2E-01 | E2E | AC-01 | Valid login flow | User redirected to role-appropriate home | `e2e/lab-03/authentication.spec.ts` | ☑ |
| E2E-02 | E2E | AC-02 | Initial password login and mandatory change | Normal app opens only after valid change | `e2e/lab-03/authentication.spec.ts` | ☑ |
| E2E-03 | E2E | AC-05 | Invalid login (wrong credentials) | Safe error message shown | `e2e/lab-03/authentication.spec.ts` | ☑ |
| E2E-04 | E2E | AC-05 | Inactive account login | Safe rejection shown | `e2e/lab-03/authentication.spec.ts` | ☑ |
| E2E-05 | E2E | AC-06 | Logout and re-access blocked | Redirected to login | `e2e/lab-03/authentication.spec.ts` | ☑ |
| E2E-06 | E2E | AC-07 | IT Staff opens queue, searches, filters, paginates | Correct data shown | `e2e/lab-03/staff-ticket-flow.spec.ts` | ☑ |
| E2E-07 | E2E | AC-08, AC-09, AC-10 | IT Staff claims ticket, sets priority, changes status | Updates persisted | `e2e/lab-03/staff-ticket-flow.spec.ts` | ☑ |
| E2E-08 | E2E | AC-11 | IT Staff posts comment and note | Comment visible to all; note restricted | `e2e/lab-03/staff-ticket-flow.spec.ts` | ☑ |
| E2E-09 | E2E | AC-16 | Requester indicates problem appears resolved | Indicator set; status unchanged | `e2e/lab-03/staff-ticket-flow.spec.ts` | ☑ |
| E2E-10 | E2E | AC-12, AC-13, AC-17 | Admin creates user, edits, resets password | User management flow works correctly | `e2e/lab-03/user-administration.spec.ts` | ☑ |
| E2E-11 | E2E | AC-13 | Admin cannot deactivate self or last admin | Error messages shown | `e2e/lab-03/user-administration.spec.ts` | ☑ |
| E2E-12 | E2E | AC-14 | Responsive check across breakpoints | No overflow, clipping, or hidden controls | `e2e/lab-03/authentication.spec.ts` | ☑ |
| E2E-13 | E2E | AC-15 | Requester Lab 2 functions after migration | All ticket operations work | `e2e/lab-03/staff-ticket-flow.spec.ts` | ☑ |

---

## 3. AC Traceability Matrix

| AC ID | Test IDs |
|---|---|
| AC-01 | API-01, API-02, API-03, API-10, API-11, UI-01–04, E2E-01 |
| AC-02 | API-05, API-07, API-08, API-09, AUTH-08, UI-05, UI-06, E2E-02 |
| AC-03 | AUTH-01, AUTH-03, REG-01 |
| AC-04 | AUTH-02, CN-05 |
| AC-05 | API-04, E2E-03, E2E-04 |
| AC-06 | API-06, E2E-05 |
| AC-07 | QUEUE-01–09, UI-07–09, E2E-06 |
| AC-08 | STAFF-01, STAFF-02, E2E-07 |
| AC-09 | STAFF-05, STAFF-06, E2E-07 |
| AC-10 | STAFF-07, STAFF-08, STAFF-09, E2E-07 |
| AC-11 | CN-01–05, UI-10, UI-11, E2E-08 |
| AC-12 | ADMIN-06, ADMIN-09, UI-13, E2E-10 |
| AC-13 | ADMIN-12, ADMIN-13, ADMIN-16, UI-14, E2E-10, E2E-11 |
| AC-14 | E2E-12 |
| AC-15 | REG-01–05, E2E-13 |
| AC-16 | CN-09, CN-10, E2E-09 |
| AC-17 | ADMIN-14, E2E-10 |
