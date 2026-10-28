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
| #66 | feat(workflow): Ticket workflow, Resolution Gate, and Concurrency | `feature/lab4-ticket-workflow` | Merged | [PR #66](https://github.com/atiwit/toktickit/pull/66) |
| #67 | feat(ui): Actions Taken on Ticket Detail UI | `feature/lab4-actions-ui` | Ready for Review | — |
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
- **Status:** Approved & Merged into `lab4-staging` (Merged in PR #66)

---

### PR #67: feat(ui): Actions Taken on Ticket Detail UI (`feature/lab4-actions-ui`)
- **Reviewer:** [@krittaphato3](https://github.com/krittaphato3)
- **Review Scope & Summary:**
  1. **Actions Taken Section Component (`client/src/components/ActionsTakenSection.tsx`):**
     - สร้างคอมโพเนนต์ส่วนกลางรองรับทั้งโหมดโต้ตอบสำหรับ IT Staff (`readOnly=false`) และโหมดอ่านอย่างเดียวสำหรับ Requester (`readOnly=true`)
     - แสดงรายการบันทึกการทำงานพร้อมข้อมูลสำคัญครบถ้วน: วันที่/เวลา (`actionDateTime`), รายละเอียดงาน (`actionDescription`), ผลลัพธ์ (`result`), ชิปผู้ปฏิบัติงานอัตโนมัติ (`performedBy`), ป้ายกำกับ Follow-up Required (⚠️) พร้อมแสดง Follow-up Note, และโน้ตไฟล์แนบ (📎)
     - แสดง Badge ตัวเลขนับจำนวน Actions Taken ในส่วนหัว และแสดง Empty State เมื่อยังไม่มีรายการ
     - Modal Dialog (Add / Edit Action Taken) มีการป้องกันการกรอกข้อมูลครบถ้วน: Client-side validation (ตรวจสอบข้อความว่างเปล่าและความยาวไม่เกินกำหนด), ช่อง Performed By แสดงชื่อผู้ใช้ปัจจุบันแบบ disabled, และช่องบันทึก Follow-up Note จะปรากฏขึ้นเฉพาะเมื่อติ๊กเลือก Checkbox Follow-Up Required
  2. **IT Staff Ticket Detail Integration (`client/src/pages/StaffTicketDetail.tsx`):**
     - ฝัง `ActionsTakenSection` เข้าสู่คอลัมน์ซ้ายของหน้ารายละเอียดตั๋ว และดึงข้อมูลรายการการทำงานผ่าน `GET /api/tickets/:id/actions-taken`
     - **Resolution Gate UI Interception (BR-08, FR-09, AC-03):** เมื่อเจ้าหน้าที่กดปุ่ม "→ Resolved" ขณะที่ตั๋วยังไม่มีรายการ Actions Taken (actions count = 0) ระบบจะสกัดกั้นการเปลี่ยนสถานะทันที และแสดง Banner แจ้งเตือน:
       > ⚠️ **Cannot Resolve Ticket:** You must record at least one Action Taken describing the solution before marking this ticket as Resolved.
       พร้อมปุ่มทางลัด **"+ Add Action Taken Now"** เพื่อเปิด Modal บันทึก Action Taken ให้เจ้าหน้าที่ทำงานได้ต่อเนื่องทันที
     - รองรับการดักจับข้อผิดพลาด HTTP 422 `RESOLUTION_GATE_BLOCKED` จาก backend เพื่อแสดงข้อความแจ้งเตือนเดียวกันในกรณีที่เกิด race condition
  3. **Requester Ticket Detail Integration (`client/src/pages/TicketDetail.tsx`):**
     - ฝัง `ActionsTakenSection` ในโหมด `readOnly={true}` เพื่อให้ Requester มองเห็นขั้นตอนและผลลัพธ์การแก้ไขปัญหาของเจ้าหน้าที่ได้อย่างโปร่งใส
     - ซ่อนปุ่ม "+ Add Action Taken" และปุ่ม "Edit" ในฝั่ง Requester โดยสิ้นเชิงเพื่อป้องกันความสับสน
  4. **Automated Component Test Suites (`client/src/tests/lab-04/`):**
     - พัฒนาชุดทดสอบ `client/src/tests/lab-04/ActionsTaken.test.tsx` (9 tests) ครอบคลุม:
       - `UI-ACT-01`: การแสดงผลรายการ Actions Taken บน Staff Detail, การแสดง count badge, การเปิด Add/Edit modal, และชื่อผู้บันทึกอัตโนมัติ
       - `UI-ACT-02`: การทำงานของ Follow-up Checkbox ในการแสดง/ซ่อนช่อง Follow-up Note, การตรวจสอบ Required Validation, และการส่งข้อมูล POST สำเร็จ
       - `UI-ACT-03`: การแสดงผลแบบ Read-Only บน Requester Ticket Detail โดยซ่อนปุ่ม Add และ Edit ทั้งหมด
     - พัฒนาชุดทดสอบ `client/src/tests/lab-04/TicketWorkflow.test.tsx` (7 tests) ครอบคลุม:
       - `UI-WF-01`: การแจ้งเตือน Resolution Gate เมื่อพยายาม Resolve ตั๋วที่มี 0 actions, การคลิกปุ่มทางลัด "+ Add Action Taken Now" เพื่อเปิดฟอร์ม, และการยอมรับการเปลี่ยนสถานะเมื่อมี action แล้ว
       - `UI-WF-02`: การจำกัดปุ่มเปลี่ยนสถานะตาม Permitted Transition Matrix และการแสดง Confirmation Dialog สำหรับสถานะที่มีผลกระทบรุนแรง (Cancelled/Closed)
     - ผลการทดสอบผ่านครบ 16/16 tests (100%) และคงความเข้ากันได้ย้อนหลังกับชุดทดสอบของ Lab 1–3
- **Status:** Ready for Review (Code & Test suites implemented on branch `feature/lab4-actions-ui`, uncommitted per user request)


