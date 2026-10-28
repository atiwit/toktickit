# Lab 4 Test Plan & Traceability Matrix

## 1. Test Strategy & Engineering Framework

แผนการทดสอบนี้สร้างขึ้นก่อนการเริ่ม Implementation ตามหลักการ **Spec DD, Test DD, และ TDD** เพื่อให้มั่นใจว่าทุกฟังก์ชันการทำงานมีชุดทดสอบรองรับอย่างสมบูรณ์แบบ ทั้งในระดับ Backend API, Frontend UI Components, Role Authorization, Concurrency Handling, Regression จากแล็บก่อนหน้า, และ End-to-End (E2E) Browser Workflows

### Test Frameworks
- **Backend API & Integration:** Vitest + Supertest
- **Frontend Component & UI:** Vitest + React Testing Library + @testing-library/jest-dom
- **End-to-End & Visual Regression:** Playwright Browser Automation

---

## 2. Test Traceability Matrix

### 2.1. Actions Taken API Tests (`server/tests/lab-04/actions-taken.api.test.ts`)
| Test ID | Type | AC / Req | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|:---:|
| API-ACT-01 | API | AC-01 | Create valid Action Taken by IT Staff | 201 Created; action saved with logged-in user as `performedBy` | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-ACT-02 | API | AC-01 | Create Action Taken by Admin | 201 Created; saved successfully | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-ACT-03 | API | AC-05 | Create Action Taken by Requester | 403 Forbidden; Requester blocked from write operations | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-ACT-04 | API | AC-02 | Create Action with `followUpRequired=true` but missing `followUpNote` | 400 Bad Request; validation error returned | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-ACT-05 | API | AC-02 | Create Action with `followUpRequired=true` and valid `followUpNote` | 201 Created; note persisted | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-ACT-06 | API | AC-01 | Create Action with empty description or result | 400 Bad Request; validation failure | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-ACT-07 | API | AC-05 | Get Actions Taken for owned ticket as Requester | 200 OK; returns list of actions | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-ACT-08 | API | AC-05 | Get Actions Taken for another requester's ticket | 403 / 404 Forbidden or Not Found; ownership enforced | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-ACT-09 | API | AC-01 | Get Actions Taken as IT Staff | 200 OK; returns full list with user metadata | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-ACT-10 | API | AC-01 | Update existing Action Taken as IT Staff | 200 OK; updated fields persisted | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-ACT-11 | API | AC-05 | Update existing Action Taken as Requester | 403 Forbidden; write blocked | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |

---

### 2.2. Ticket Workflow & Resolution Gate Tests (`server/tests/lab-04/ticket-workflow.api.test.ts`)
| Test ID | Type | AC / Req | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|:---:|
| API-WF-01 | API | AC-03 | Transition to RESOLVED on ticket with 0 Actions Taken | 422 Unprocessable Entity; Resolution Gate blocks update | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| API-WF-02 | API | AC-04 | Transition to RESOLVED on ticket with ≥ 1 Action Taken | 200 OK; ticket status updated to RESOLVED | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| API-WF-03 | API | BR-11 | Valid transitions (e.g. NEW -> OPEN -> IN_PROGRESS) | 200 OK; follows Permitted Transition Matrix | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| API-WF-04 | API | BR-11 | Invalid transitions (e.g. NEW -> CLOSED directly) | 400 Bad Request; disallowed transition | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| API-WF-05 | API | BR-10 | Attempt to transition from CANCELLED (Terminal) | 400 Bad Request; terminal status immutable | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| API-WF-06 | API | FR-10 | Requester marks Problem Appears Resolved | 200 OK; `requesterIndicatedResolved=true` set, status unchanged | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| API-WF-07 | API | AC-09 | Concurrent status update with stale `updatedAt` | 409 Conflict; prevents overwriting recent changes | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |

---

### 2.3. Dashboard APIs Tests (`server/tests/lab-04/requester-dashboard.api.test.ts` & `staff-dashboard.api.test.ts`)
| Test ID | Type | AC / Req | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|:---:|
| API-DSH-01 | API | AC-06 | GET Requester Dashboard as authenticated Requester | 200 OK; returns metrics isolated to caller | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| API-DSH-02 | API | AC-06 | Verify Requester Dashboard metrics match database counts | Accurate counts for Open, In Progress, Resolved, Closed | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| API-DSH-03 | API | AC-06 | Requester Dashboard recent tickets list length ≤ 5 | 200 OK; sorted by updatedAt descending | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| API-DSH-04 | API | AC-06 | IT Staff requesting Requester Dashboard | 403 Forbidden; role mismatch | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| API-DSH-05 | API | AC-07 | GET Staff Dashboard as IT Staff | 200 OK; operational metrics returned | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| API-DSH-06 | API | AC-07 | Verify Staff Dashboard counts match DB queries | Accurate counts for New, Open, In Progress, Waiting, My Assigned | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| API-DSH-07 | API | AC-07 | GET Staff Dashboard as Administrator | 200 OK; admin has full staff dashboard access | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| API-DSH-08 | API | AC-07 | Requester requesting Staff Dashboard | 403 Forbidden; unauthorized role blocked | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |

---

### 2.4. Frontend Component Tests (`client/src/tests/lab-04/`)
| Test ID | Type | AC / Req | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|:---:|
| UI-DSH-01 | Component | AC-07 | Render IT Staff Dashboard with metrics cards | Cards render correct values and labels | `client/src/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| UI-DSH-02 | Component | AC-08 | IT Staff Dashboard metric cards click drill-down | Navigates to queue with appropriate filter query | `client/src/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| UI-DSH-03 | Component | AC-06 | Render Requester Dashboard with cards & recent tickets | Displays Requester's tickets and status badges | `client/src/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| UI-DSH-04 | Component | AC-08 | Requester Dashboard drill-down navigation | Navigates to My Tickets filtered | `client/src/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| UI-ACT-01 | Component | AC-01 | Render Actions Taken list on Staff Ticket Detail | Displays date, description, result, actor badge | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| UI-ACT-02 | Component | AC-02 | Follow-up checkbox toggles Follow-up Note input | Dynamic input visibility and required validation | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| UI-ACT-03 | Component | AC-05 | Actions Taken rendered on Requester Ticket Detail | Read-only mode, no Add/Edit buttons rendered | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| UI-WF-01 | Component | AC-03 | Resolution Gate UI alert when resolving without action | Displays clear error and prompts to add action | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | Pass |
| UI-WF-02 | Component | AC-04 | Status dropdown options restricted by matrix | Only permitted next statuses are selectable | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | Pass |

---

### 2.5. Playwright E2E Tests (`e2e/lab-04/`)
| Test ID | Type | AC / Req | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|:---:|
| E2E-ACT-01 | E2E | AC-01 | Full flow: Login Staff -> Open Ticket -> Add Action Taken | Action appears in list with auto-performed by | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| E2E-ACT-02 | E2E | AC-05 | Login Requester -> View own ticket Actions Taken | Requester sees actions in read-only mode | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| E2E-RES-01 | E2E | AC-03 | Attempt to resolve ticket with no actions taken | Blocked by UI and backend; alert shown | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| E2E-RES-02 | E2E | AC-04 | Add action -> Transition status to RESOLVED | Status successfully updates to Resolved | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| E2E-DSH-01 | E2E | AC-07 | Staff Dashboard login, metric check, and drill-down | Navigates to filtered queue matching card | `e2e/lab-04/dashboards.spec.ts` | Planned |
| E2E-DSH-02 | E2E | AC-06 | Requester Dashboard login, metrics, and quick action | Navigates to Create Ticket and My Tickets | `e2e/lab-04/dashboards.spec.ts` | Planned |

---

### 2.6. Full System Regression Tests (Labs 1–3)
| Test ID | Module | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|:---:|
| REG-01 | Authentication | Login, logout, mustChangePassword flow, session cookie | Passes 100% | `server/tests/lab-03/auth.api.test.ts` | Planned |
| REG-02 | Authorization | Role route protection, 401 unauth, 403 forbidden | Passes 100% | `server/tests/lab-03/authorization.api.test.ts` | Planned |
| REG-03 | Comments & Notes | Public comments append-only, internal notes staff-only | Passes 100% | `server/tests/lab-03/comments-notes.api.test.ts` | Planned |
| REG-04 | Staff Queue & Ops | Search, filter, sort, pagination, claim ticket, priority | Passes 100% | `server/tests/lab-03/staff-queue.api.test.ts` | Planned |
| REG-05 | Admin User Mgmt | User list, create, edit, activate/deactivate, last-admin block | Passes 100% | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
