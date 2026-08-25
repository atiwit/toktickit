# Lab 2 Test Plan and Results

---

## 1. Test Strategy

Tests are written **within each feature issue** (not a separate testing issue), derived from Acceptance Criteria in `specification.md`.

Coverage levels: Unit · API · UI Component · E2E · Visual/Responsive

---

## 2. Planned Tests

| Test ID | Level | Issue | AC(s) | What It Tests | Expected Result | Test File | Status |
|---|---|---|---|---|---|---|---|
| UNIT-01 | Unit | #4 | BR-01 | Ticket Number format TKT-YYYYMMDD-NNNN | Correct format, zero-padded, no duplicates | `server/tests/lab-02/utils.unit.test.ts` | — |
| API-01 | API | #4 | AC-01 | `POST /api/tickets` valid body | 201 + ticketNumber returned | `server/tests/lab-02/create-ticket.api.test.ts` | — |
| API-02 | API | #4 | AC-04 | `POST /api/tickets` missing summary | 400 + `fields.summary` error | `server/tests/lab-02/create-ticket.api.test.ts` | — |
| API-03 | API | #4 | AC-04 | `POST /api/tickets` invalid requesterId | 400 + `fields.requesterId` error | `server/tests/lab-02/create-ticket.api.test.ts` | — |
| API-04 | API | #6 | AC-05 | `GET /api/tickets` cross-requester ownership | 403 when requesterId mismatch | `server/tests/lab-02/my-tickets.api.test.ts` | — |
| API-05 | API | #6 | AC-05 | `GET /api/tickets` pagination metadata | totalCount, totalPages, currentPage returned | `server/tests/lab-02/my-tickets.api.test.ts` | — |
| API-06 | API | #7 | AC-03 | `GET /api/tickets/:id` wrong Requester | 403, no data leaked | `server/tests/lab-02/ticket-detail.api.test.ts` | — |
| API-07 | API | #7 | AC-03 | `GET /api/tickets/:id` owned ticket | 200 + full ticket data | `server/tests/lab-02/ticket-detail.api.test.ts` | — |
| API-08 | API | #5 | AC-06 | Upload valid attachment | 201 | `server/tests/lab-02/attachments.api.test.ts` | — |
| API-09 | API | #5 | AC-06 | Upload wrong MIME type | 400 | `server/tests/lab-02/attachments.api.test.ts` | — |
| API-10 | API | #5 | AC-06 | Upload over 5 MB | 400 | `server/tests/lab-02/attachments.api.test.ts` | — |
| API-11 | API | #5 | AC-06 | Upload >5 active per ticket | 400 | `server/tests/lab-02/attachments.api.test.ts` | — |
| API-12 | API | #5 | AC-07 | Download removed attachment | 403 | `server/tests/lab-02/attachments.api.test.ts` | — |
| API-13 | API | #5 | AC-07 | Soft-remove with reason | 200, isRemoved=true | `server/tests/lab-02/attachments.api.test.ts` | — |
| UI-01 | UI | #3 | AC-02 | Requester Selection renders dropdown | Dropdown present, inactive excluded | `client/src/__tests__/lab-02/RequesterSelection.test.tsx` | — |
| UI-02 | UI | #4 | AC-04 | Create Ticket — empty submit shows field errors | Error messages below each required field | `client/src/__tests__/lab-02/CreateTicket.test.tsx` | — |
| UI-03 | UI | #4 | AC-01 | Create Ticket — success state | Ticket Number displayed | `client/src/__tests__/lab-02/CreateTicket.test.tsx` | — |
| UI-04 | UI | #5 | AC-06 | Attachment section — active vs removed | Download on active, hidden on removed | `client/src/__tests__/lab-02/AttachmentSection.test.tsx` | — |
| UI-05 | UI | #6 | AC-05 | My Tickets — empty state | "No tickets yet" message shown | `client/src/__tests__/lab-02/MyTickets.test.tsx` | — |
| UI-06 | UI | #6 | AC-05 | My Tickets — requester switch reloads | List refreshes with new requester's tickets | `client/src/__tests__/lab-02/MyTickets.test.tsx` | — |
| UI-07 | UI | #7 | AC-03 | Ticket Detail — wrong requester state | Error shown, no ticket data displayed | `client/src/__tests__/lab-02/RequesterTicketDetail.test.tsx` | — |
| E2E-01 | E2E | #7 | AC-01, AC-05 | Select Requester → Create Ticket → find in My Tickets | Ticket visible in list with correct number | `e2e/lab-02/requester-ticket-flow.spec.ts` | — |
| VIS-01 | Visual | #7 | UI | Create Ticket at 1280 px, 768 px, 375 px | No scroll, no clipping, all controls accessible | Playwright screenshot | — |
| VIS-02 | Visual | #7 | UI | My Tickets at 1280 px, 768 px, 375 px | No scroll, no clipping | Playwright screenshot | — |
| VIS-03 | Visual | #7 | UI | Ticket Detail at 1280 px, 768 px, 375 px | No scroll, no clipping | Playwright screenshot | — |

---

## 3. Acceptance-Criterion Traceability

| AC | Description (short) | Covering Tests |
|---|---|---|
| AC-01 | Valid submit → Ticket Number shown | API-01, UI-03, E2E-01 |
| AC-02 | No Requester → redirect to selection | UI-01 |
| AC-03 | Wrong Requester → 403 / error shown | API-06, UI-07 |
| AC-04 | Invalid form → field-level errors | API-02, API-03, UI-02 |
| AC-05 | My Tickets — ownership + pagination | API-04, API-05, UI-05, UI-06, E2E-01 |
| AC-06 | Attachment rules (type/size/limit) | API-08, API-09, API-10, API-11, UI-04 |
| AC-07 | Soft-remove — block download, keep metadata | API-12, API-13, UI-04 |

---

## 4. Responsive and Visual Checklist

> Completed with Playwright screenshots at 1280 px, 768 px, 375 px (VIS-01 through VIS-03 in Issue #7).

- [ ] No horizontal scroll at any viewport
- [ ] No label clipping or element overlap
- [ ] All buttons and controls accessible (not hidden or cut off)
- [ ] Create Ticket form — desktop multi-column, tablet two-column, mobile stacked
- [ ] My Tickets — table (desktop), card (mobile)
- [ ] Ticket Detail — ticket info section + attachment section clearly separated

---

## 5. Test Commands

```bash
# Server unit + API tests
cd server && npm test

# Client UI component tests
cd client && npm test

# E2E + visual (Playwright)
npx playwright test e2e/lab-02/
```

---

## 6. Final Results

> To be filled after all tests pass in `main`.

| Suite | Total | Passed | Failed |
|---|---|---|---|
| Unit (UNIT-xx) | — | — | — |
| API (API-xx) | — | — | — |
| UI (UI-xx) | — | — | — |
| E2E (E2E-xx) | — | — | — |
| Visual (VIS-xx) | — | — | — |

---

## 7. Known Limitations or Deferred Tests

- Auth-layer ownership tests deferred to Lab 3 (real JWT auth).
- Cross-browser visual tests deferred; Chromium only for Lab 2.
