# Lab 2 Test Plan and Results

---

## 1. Test Strategy

Tests are written before or alongside implementation, derived from Acceptance Criteria in `specification.md`.

Coverage levels: Unit · API · UI Component · UI Style · Responsive · E2E

---

## 2. Planned Tests

| Test ID | Level | AC(s) | What It Tests | Expected Result | Test File | Status |
|---|---|---|---|---|---|---|
| UNIT-01 | Unit | BR-01 | Ticket Number generator returns unique formatted string | Correct format, no duplicates | `server/tests/lab-02/utils.unit.test.ts` | — |
| API-01 | API | AC-01 | `POST /api/tickets` valid body | 201 + ticketNumber returned | `server/tests/lab-02/create-ticket.api.test.ts` | — |
| API-02 | API | AC-04 | `POST /api/tickets` missing summary | 400 + field error | `server/tests/lab-02/create-ticket.api.test.ts` | — |
| API-03 | API | AC-03 | `GET /api/tickets/:id` wrong Requester | 403 | `server/tests/lab-02/ticket-detail.api.test.ts` | — |
| UI-01 | UI | AC-02 | Requester Selection renders dropdown | Dropdown present | `client/src/__tests__/lab-02/RequesterSelection.test.tsx` | — |
| UI-02 | UI | AC-04 | Create Ticket — empty submit shows field errors | Error messages below fields | `client/src/__tests__/lab-02/CreateTicket.test.tsx` | — |
| E2E-01 | E2E | AC-01, AC-09 | Select Requester → Create Ticket → find in My Tickets | Ticket visible in list | `e2e/lab-02/requester-ticket-flow.spec.ts` | — |

> TODO: Expand planned-test table as specification is finalised.

---

## 3. Acceptance-Criterion Traceability

| AC | Description (short) | Covering Tests |
|---|---|---|
| AC-01 | Valid submit → Ticket Number shown | API-01, E2E-01 |
| AC-02 | No Requester → redirect to selection | UI-01 |
| AC-03 | Wrong Requester → 403 | API-03 |
| AC-04 | Invalid form → field-level errors | API-02, UI-02 |

> TODO: Add rows as ACs are finalised.

---

## 4. Responsive and Visual Checklist

> To be completed with Playwright screenshots at 1280 px, 768 px, 375 px.

- [ ] No horizontal scroll
- [ ] No clipping or overlap
- [ ] All buttons accessible

---

## 5. Test Commands

```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test

# E2E
npx playwright test e2e/lab-02/
```

---

## 6. Final Results

> To be filled after all tests pass in `main`.

| Suite | Total | Passed | Failed |
|---|---|---|---|
| Unit | — | — | — |
| API | — | — | — |
| UI | — | — | — |
| E2E | — | — | — |

---

## 7. Known Limitations or Deferred Tests

- Auth-layer ownership tests deferred to Lab 3.
