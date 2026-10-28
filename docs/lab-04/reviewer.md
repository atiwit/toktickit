# PR Review Evidence — Lab 04

## My Information

| Field | Details |
| :--- | :--- |
| **Name** | Atiwit Thongngoen |
| **Student ID** | 67070501048 |
| **GitHub Username** | [@atiwit](https://github.com/atiwit) |

---

## First Reviewer Information

| Field | Details |
| :--- | :--- |
| **Name** | Alongkorn Kaewprom |
| **Student ID** | 67070501050 |
| **GitHub Username** | [@Alongkron1234](https://github.com/Alongkron1234) |

---

## Second Reviewer Information

| Field | Details |
| :--- | :--- |
| **Name** | NANTAKORN PINSUPAPORN |
| **Student ID** | 67070501028 |
| **GitHub Username** | [@copter549365](https://github.com/copter549365) |

---

## Third Reviewer Information

| Field | Details |
| :--- | :--- |
| **Name** | KITTITHAT DISTHANAKORNKUN |
| **Student ID** | 67070501004 |
| **GitHub Username** | [@JeffMerry](https://github.com/JeffMerry) |

---

## Fourth Reviewer Information

| Field | Details |
| :--- | :--- |
| **Name** | KRITTHAPHAT PANYASOMPHAN |
| **Student ID** | 67070501052 |
| **GitHub Username** | [@krittaphato3](https://github.com/krittaphato3) |

---

## GitHub Project & Repository Links

- **Repository:** https://github.com/atiwit/toktickit
- **GitHub Project (Kanban Board):** https://github.com/users/atiwit/projects/3
- **All Issues in Sprint 4:**
  - [Issue #55 - Lab4 docs-preparing](https://github.com/atiwit/toktickit/issues/55)
  - [Issue #56 - Lab4 Actions Taken Foundation (Database, Model, Seed & APIs)](https://github.com/atiwit/toktickit/issues/56)
  - [Issue #57 - Lab4 Ticket Workflow, Resolution Gate & Concurrency Handling](https://github.com/atiwit/toktickit/issues/57)
  - [Issue #58 - Lab4 Actions Taken UI on Ticket Detail](https://github.com/atiwit/toktickit/issues/58)
  - [Issue #59 - Lab4 Role-Based Dashboard APIs](https://github.com/atiwit/toktickit/issues/59)
  - [Issue #60 - Lab4 Role-Based Dashboard UIs & Navigation](https://github.com/atiwit/toktickit/issues/60)
  - [Issue #61 - Lab4 E2E Test Suites & Responsive Screenshots](https://github.com/atiwit/toktickit/issues/61)
  - [Issue #62 - Lab4 Final Regression, Hardening & Release Integration](https://github.com/atiwit/toktickit/issues/62)

---

## Pull Requests Plan & Tracking

| PR # | Title | Branch | Status | Link |
| :--- | :--- | :--- | :---: | :--- |
| #64 | docs-preparation for lab4 | `feature/lab4-docs-prepare` | Merged | [PR #64](https://github.com/atiwit/toktickit/pull/64) |
| #65 | feat(actions): Actions Taken model, migration, seed, and APIs | `feature/lab4-actions-foundation` | Merged | [PR #65](https://github.com/atiwit/toktickit/pull/65) |
| #66 | feat(workflow): Ticket workflow, Resolution Gate, and Concurrency | `feature/lab4-ticket-workflow` | Open (Under Review) | [PR #66](https://github.com/atiwit/toktickit/pull/66) |
| — | feat(ui): Actions Taken on Ticket Detail UI | `feature/lab4-actions-ui` | Planned | — |
| — | feat(dashboard): Role-based dashboard backend APIs | `feature/lab4-dashboards-api` | Planned | — |
| — | feat(dashboard-ui): Role-based dashboard screens and navigation | `feature/lab4-dashboards-ui` | Planned | — |
| — | test(e2e): Playwright E2E suites and responsive screenshots | `feature/lab4-e2e-screenshots` | Planned | — |
| — | chore(release): Final regression, hardening, and merge to main | `feature/lab4-release-integration` | Planned | — |

---

## Evidence: Partner Reviews & Approvals

### PR #64: docs-preparation for lab4 (`feature/lab4-docs-prepare`)
- **Reviewer:** [@Alongkron1234](https://github.com/Alongkron1234)
- **Review Summary:** ตรวจสอบเอกสาร Sprint 4 specification, api-spec, ui-spec, tests, reviewer, ai-use ครบถ้วนตาม Requirement
- **Status:** Approved & Merged into `lab4-staging`

---

### PR #65: feat(actions): Actions Taken model, migration, seed, and APIs (`feature/lab4-actions-foundation`)
- **Reviewer:** [@Alongkron1234](https://github.com/Alongkron1234)
- **Review Comment:**
  > "จากที่ดูๆนะครับ PATCH ไม่ validate attachmentNotes: ส่งเกิน 1000 ตัวหรือไม่ใช่ string แล้วได้ 500 แทน 400 ให้แยก validator ใช้ร่วมกับ POST
  > ไม่ใช้ transaction: actionTaken.create/update กับ ticket.update({ updatedAt }) แยกกัน ถ้าตัวที่สองล้ม action ถูกบันทึกแล้วแต่ client ได้ 500 และกดซ้ำจะเกิดรายการซ้ำ ให้ครอบด้วย prisma.$transaction ลองฝากเช็คอีกทีนะครับ"
- **Author Response & Resolution:**
  1. แยก shared validator function `validateActionTakenPayload(body, isUpdate, existing)` สำหรับใช้ร่วมกันทั้ง `POST /api/tickets/:id/actions-taken` และ `PATCH /api/tickets/:id/actions-taken/:actionId`
  2. เพิ่ม validation ตรวจสอบ `attachmentNotes` หากไม่ใช่ string หรือเกิน 1,000 ตัวอักษร ให้ตอบกลับด้วย HTTP 400 (`VALIDATION_ERROR`) แทนที่จะเกิด Server Error 500 พร้อม normalize ค่า whitespace-only ให้เป็น `null`
  3. ครอบคำสั่ง `actionTaken.create`/`update` ควบคู่กับ `ticket.update({ updatedAt: new Date() })` ให้อยู่ภายใน `prisma.$transaction([ ... ])` เพื่อให้เป็น Atomic operation ป้องกัน partial write และ duplicate records เมื่อเกิดข้อผิดพลาด
  4. เพิ่มชุดทดสอบใน `server/tests/lab-04/actions-taken.api.test.ts` (API-ACT-20, API-ACT-21, API-ACT-22, API-ACT-23, API-ACT-24) ทดสอบทั้ง error 400 และการเรียกใช้งาน `$transaction` ซึ่งผ่านทั้งหมด 23/23 tests (รวมทั้งโปรเจกต์ 183/183 tests)
  5. Push commits แก้ไขไปยัง PR #65 เรียบร้อยแล้ว (commits `d23e205` และ `5843740`)
- **Status:** Approved & Merged into `lab4-staging`

---

### PR #66: feat(workflow): Ticket workflow, Resolution Gate, and Concurrency (`feature/lab4-ticket-workflow`)
- **Reviewer:** [@Alongkron1234](https://github.com/Alongkron1234)
- **Review Scope & Summary:**
  1. **Resolution Gate (BR-08, FR-09):** บังคับใช้เงื่อนไขการเปลี่ยนสถานะเป็น `RESOLVED` บน `PATCH /api/staff/tickets/:id/status` โดยตรวจสอบว่ามี `ActionTaken` อย่างน้อย 1 รายการหรือไม่ หากไม่มีจะปฏิเสธด้วย HTTP 422 Unprocessable Entity (`RESOLUTION_GATE_BLOCKED`)
  2. **Permitted Status Transition Matrix (BR-10, BR-11, FR-08):** รองรับสถานะต้นทางและปลายทางครบทุกสถานะ โดยเปิดให้ `WAITING_FOR_REQUESTER` เปลี่ยนสถานะเป็น `[IN_PROGRESS, RESOLVED, CANCELLED]` และกำหนด `CANCELLED` เป็น Terminal State ที่ไม่สามารถเปลี่ยนสถานะต่อไปได้
  3. **Advisory Flag (FR-10, BR-09):** การกด "Problem Appears Resolved" ของ Requester (`PATCH /api/tickets/:id/requester-resolved`) บันทึกเฉพาะค่า `requesterIndicatedResolved = true` และไม่เปลี่ยนสถานะตั๋วไปเป็น Resolved โดยอัตโนมัติ
  4. **Optimistic Concurrency Control (OCC / BR-11, AC-09):** ตรวจสอบ `lastUpdatedAt` หรือ `updatedAt` ใน Request body หากพบว่าเวลาไม่ตรงกับ `ticket.updatedAt` ในฐานข้อมูล จะส่ง HTTP 409 Conflict ป้องกัน Stale Updates
  5. **Role-Based Authorization:** อนุญาตให้ทั้ง IT Staff และ Administrator เปลี่ยนสถานะตั๋วได้ ขณะที่ Requester หรือผู้ใช้ที่ไม่ได้รับอนุญาตจะถูกปฏิเสธด้วย HTTP 403 Forbidden / 401 Unauthenticated
  6. **Automated Test Suite:** พัฒนาชุดทดสอบใน `server/tests/lab-04/ticket-workflow.api.test.ts` ครอบคลุมการทดสอบ API-WF-01 ถึง API-WF-07 จำนวน 49 ข้อ ผ่านทั้งหมด 100%
- **Review Comment:**
  > "การทำ OCC ใน index.ts: ตอนนี้การเทียบ timestamp บน JS อาจยังมีช่องว่างเล็ก ๆ ให้เกิด race condition ได้ ถ้าดันการเช็ค updatedAt เข้าไปอยู่ใน where clause ของ Prisma updateMany จะทำให้การทำงานเป็น atomic แบบจริงจังขึ้นครับ
  > Response & Frontend: ฝากช่วยคลีนตัว ticket object ที่ซ้ำซ้อนใน response ของ status update ออกอีกนิด แล้วก็อย่าลืมอัปเดตฝั่ง frontend ให้รองรับโครงสร้าง success/data shape แบบใหม่ด้วยนะครับ!"
- **Author Response & Resolution:**
  1. ปรับปรุงการตรวจสอบ Optimistic Concurrency Control (OCC) ให้เป็น Atomic Operation ที่ระดับฐานข้อมูลอย่างแท้จริง โดยใช้ `prisma.ticket.updateMany({ where: { id: ticketId, updatedAt: expectedUpdatedAt }, data: { status, updatedAt: new Date() } })` ซึ่งดันเงื่อนไข `updatedAt` เข้าไปใน `WHERE` clause โดยตรง หากผลลัพธ์ได้ `count === 0` ระบบจะดึงข้อมูลล่าสุดและตอบกลับด้วย HTTP 409 Conflict ทันที ช่วยปิดช่องว่าง race condition ระหว่าง read และ write ได้ 100%
  2. คลีนโครงสร้าง JSON Response ของ `PATCH /api/staff/tickets/:id/status` โดยตัดฟิลด์ `ticket` ที่ซ้ำซ้อนออก ให้ตอบกลับเฉพาะ `{ success: true, message: "...", data: { id, ticketNumber, status, updatedAt, permittedStatuses } }` ตามมาตรฐาน API Specification
  3. อัปเดตฝั่ง Frontend ใน `client/src/pages/StaffTicketDetail.tsx` ให้ส่ง `lastUpdatedAt: ticket?.updatedAt` ใน Request body เพื่อเปิดใช้ OCC จากหน้าบ้าน และรองรับโครงสร้าง response แบบ `success`/`data` พร้อมดึงข้อมูลตั๋วใหม่ทันทีเมื่อเกิด 409 Conflict
  4. อัปเดตชุดทดสอบ `server/tests/lab-04/ticket-workflow.api.test.ts` และ `server/tests/lab-03/staff-ticket-detail.api.test.ts` ให้สอดคล้องกับ `updateMany` และโครงสร้าง `data` shape ใหม่ ผ่านครบถ้วน 159/159 tests
- **Status:** Open (รอ Reviewer ตรวจสอบรอบสองและกด Approve)


