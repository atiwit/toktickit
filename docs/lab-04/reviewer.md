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
| #69 | feat(ui): Actions Taken on Ticket Detail UI | `feature/lab4-actions-ui` | Merged | [PR #69](https://github.com/atiwit/toktickit/pull/69) |
| #70 | feat(dashboard): Role-based dashboard backend APIs | `feature/lab4-dashboards-api` | Merged | [PR #70](https://github.com/atiwit/toktickit/pull/70) |
| #71 | feat(dashboard-ui): Role-based dashboard screens and navigation | `feature/lab4-dashboards-ui` | Merged | [PR #71](https://github.com/atiwit/toktickit/pull/71) |
| — | test(e2e): Playwright E2E suites and responsive screenshots | `feature/lab4-e2e-screenshots` | Ready for Review | — |
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

### PR #69: feat(ui): Actions Taken on Ticket Detail UI (`feature/lab4-actions-ui`)
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
- **Status:** Approved & Merged into `lab4-staging` (Merged in PR #69)

---

### Issue #59: feat(dashboard): Role-based dashboard backend APIs (`feature/lab4-dashboards-api`)
- **Reviewer:** [@copter549365](https://github.com/copter549365) (Second Reviewer)
- **Review Scope & Summary:**
  1. **Requester Dashboard Endpoint (`GET /api/dashboards/requester`):**
     - บังคับใช้ Authorization สำหรับบทบาท Requester เท่านั้น (`...requesterOnly`) โดยปฏิเสธ IT Staff และ Administrator ด้วย HTTP 403 Forbidden และปฏิเสธ Unauthenticated requests ด้วย HTTP 401 Unauthorized
     - ตรวจสอบความถูกต้องของการคำนวณ Metrics แยกเฉพาะตั๋วที่เป็นของ Requester ปัจจุบันอย่างแท้จริง (`requesterId = user.id`):
       - `myOpenTickets`: นับตั๋วที่มีสถานะอยู่ในกลุ่มเปิด (`[NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED]`)
       - `inProgress`: นับตั๋วที่มีสถานะ `IN_PROGRESS`
       - `resolved`: นับตั๋วที่มีสถานะ `RESOLVED`
       - `closed`: นับตั๋วที่มีสถานะ `CLOSED`
     - แสดงรายการ `recentTickets` ไม่เกิน 5 รายการล่าสุด เรียงลำดับตาม `updatedAt` จากใหม่ไปเก่า พร้อมข้อมูลจำเป็นครบถ้วน (`id`, `ticketNumber`, `summary`, `status`, `requestedPriority`, `updatedAt`)
     - จัดเตรียม `drillDownLinks` ไปยังหน้ารายการตั๋วพร้อม query parameters ตรงตามประเภทการ์ด (`/tickets?status=open-group`, `/tickets?status=IN_PROGRESS`, `/tickets?status=RESOLVED`, `/tickets?status=CLOSED`)
  2. **IT Staff & Administrator Dashboard Endpoint (`GET /api/dashboards/staff`):**
     - บังคับใช้ Authorization สำหรับบทบาท IT Staff และ Administrator (`...staffOrAdmin`) โดยปฏิเสธ Requester ด้วย HTTP 403 Forbidden
     - ตรวจสอบความถูกต้องของการคำนวณ Metrics เชิงปฏิบัติการระดับศูนย์บริการ:
       - `new`: นับตั๋วสถานะ `NEW` ทั้งหมดในระบบ
       - `open`: นับตั๋วสถานะ `OPEN` ทั้งหมดในระบบ
       - `inProgress`: นับตั๋วสถานะ `IN_PROGRESS` ทั้งหมดในระบบ
       - `waitingForRequester`: นับตั๋วสถานะ `WAITING_FOR_REQUESTER` ทั้งหมดในระบบ
       - `myAssigned`: นับตั๋วที่ผู้ใช้ปัจจุบันเป็นเจ้าของ (`ownerId = user.id`) ที่มีสถานะยังไม่สิ้นสุด (`[NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED]`)
     - แสดงรายการ `recentTickets` 5 รายการล่าสุดของทั้งระบบ พร้อม `itPriority` (fallback เป็น `requestedPriority` เมื่อยังไม่ได้กำหนด) และ `ownerName` (หรือ `null` เมื่อตั๋วยังไม่มีผู้รับผิดชอบ)
     - จัดเตรียม `drillDownLinks` ไปยังคิวงานที่ตรงกัน (`/staff/tickets?status=NEW`, `/staff/tickets?status=OPEN`, `/staff/tickets?status=IN_PROGRESS`, `/staff/tickets?status=WAITING_FOR_REQUESTER`, `/staff/tickets?owner=me&status=open-group`)
  3. **Data Integrity & Standard Handling (BR-14):**
     - รองรับ Empty State กรณีฐานข้อมูลไม่มีข้อมูล โดยคืนค่า 0 สำหรับทุก Metrics และคืน array ว่าง `[]` สำหรับ `recentTickets` โดยไม่เกิด Error
     - ส่ง JSON response ตามโครงสร้าง envelope `{ success: true, data: { metrics, recentTickets, drillDownLinks }, metrics, recentTickets, drillDownLinks }` เพื่อความเข้ากันได้อย่างสมบูรณ์
  4. **Automated API Test Suites (`server/tests/lab-04/`):**
     - พัฒนาชุดทดสอบ `server/tests/lab-04/requester-dashboard.api.test.ts` (9 tests) ครอบคลุม API-DSH-01 ถึง API-DSH-04, Data isolation, และ Security checks
     - พัฒนาชุดทดสอบ `server/tests/lab-04/staff-dashboard.api.test.ts` (9 tests) ครอบคลุม API-DSH-05 ถึง API-DSH-08, Multi-role access (IT Staff + Admin), Fallback priority, และ Security checks
     - ผ่านการทดสอบทั้งหมด 18/18 tests (100%) และภาพรวม Lab 4 ผ่านครบ 90/90 tests
- **Review Comment:**
  > "จาที่ผมดูนะครับการ์ดนับเฉพาะสถานะ active แต่ link ?owner=me ไม่กรองสถานะ รายการที่เปิดจึงรวมตั๋ว RESOLVED, CLOSED, CANCELLED ด้วย ตัวเลขบนการ์ดจะน้อยกว่าที่เห็นในหน้ารายการ ผมว่าควรให้ link เติม status=open-group ด้วยนะครับ ฝากลองเช็คตรงนี้หน่อยนะๆ เหมือนจะผิด spec ข้อ AC-08 และ FR-14"
- **Author Response & Resolution:**
  1. แก้ไข `drillDownLinks.myAssigned` ใน `server/src/index.ts` จาก `/staff/tickets?owner=me` เป็น `/staff/tickets?owner=me&status=open-group` เพื่อให้สอดคล้องกับข้อกำหนด AC-08 และ FR-14 ที่ตัวเลขบนการ์ดและผลลัพธ์ในหน้ารายการตั๋วต้องตรงกันอย่างสมบูรณ์
  2. อัปเดต `docs/lab-04/api-spec.md` ในส่วนตัวอย่าง Response ของ `GET /api/dashboards/staff` ให้ระบุ `myAssigned` เป็น `/staff/tickets?owner=me&status=open-group`
  3. ปรับปรุงชุดทดสอบ `server/tests/lab-04/staff-dashboard.api.test.ts` (API-DSH-05) ให้ assert ลิงก์ `myAssigned` ที่มี `status=open-group` ผ่านครบ 100%
- **Status:** Approved & Merged into `lab4-staging` (Merged in PR #70)

---

### Issue #60: feat(dashboard-ui): Role-based dashboard screens and navigation (`feature/lab4-dashboards-ui`)
- **Reviewer:** [@JeffMerry](https://github.com/JeffMerry) (Third Reviewer)
- **Review Scope & Summary:**
  1. **Requester Dashboard Screen (`client/src/pages/RequesterDashboard.tsx`):**
     - Greeting Header banner แสดงข้อความต้อนรับตามชื่อจริงของผู้ใช้ ("Welcome, {name}!") พร้อมปุ่ม Refresh Dashboard (`aria-label="Refresh Dashboard"`)
     - 4 Status Metric Cards: My Open Tickets (`metrics.myOpenTickets`), In Progress (`metrics.inProgress`), Resolved (`metrics.resolved`), Closed (`metrics.closed`) พร้อมปุ่ม Drill-down นำทางไปยัง `/tickets?status=...`
     - Recent Tickets Widget แสดง 5 ตั๋วล่าสุด พร้อม Ticket Number (ลิงก์ไปยัง Ticket Detail), Summary, Status Badge, Requested Priority Badge, วันที่อัปเดต และ Empty State ที่เป็นมิตรเมื่อไม่มีตั๋ว
     - Quick Actions Box: ปุ่ม `+ Create Ticket` นำทางไป `/create-ticket` และปุ่ม `View My Tickets` นำทางไป `/tickets`
  2. **IT Staff & Administrator Dashboard Screen (`client/src/pages/StaffDashboard.tsx`):**
     - Greeting Header banner แสดงข้อความต้อนรับ ("Welcome back, {name}!") และปุ่ม Refresh Data (`aria-label="Refresh Dashboard"`)
     - 5 Operational Metric Cards: New (`metrics.new`), Open (`metrics.open`), In Progress (`metrics.inProgress`), Waiting for Requester (`metrics.waitingForRequester`), My Assigned (`metrics.myAssigned`) พร้อม Drill-down นำทางไปยังคิวงานที่กรองตรงกัน (`/staff/tickets?status=NEW`, `/staff/tickets?status=OPEN`, `/staff/tickets?status=IN_PROGRESS`, `/staff/tickets?status=WAITING_FOR_REQUESTER`, `/staff/tickets?owner=me&status=open-group`)
     - Recent Tickets Widget แสดงตั๋ว 5 รายการล่าสุดในระบบ พร้อม Ticket Number (คลิกไป Staff Ticket Detail), Summary, Status Badge, IT Priority Badge (พร้อม fallback), ชิปผู้รับผิดชอบ (`ownerName`), วันที่อัปเดต และ Empty State เมื่อไม่มีตั๋ว
     - Quick Actions Box: `+ Create Ticket`, `🔍 Search Tickets`, `📋 My Queue`
  3. **Role-Appropriate Navigation & AppShell (`client/src/components/AppShell.tsx` & `client/src/App.tsx`):**
     - เมนูนำทางจัดเตรียมตามบทบาทผู้ใช้อย่างถูกต้อง (FR-06, FR-17):
       - Requester: Dashboard (`/requester/dashboard`), My Tickets (`/tickets`), Create Ticket (`/create-ticket`)
       - IT Staff: Dashboard (`/staff/dashboard`), Ticket Queue (`/staff/tickets`)
       - Administrator: Dashboard (`/staff/dashboard`), User Management (`/admin/users`)
     - Active-page indicator แสดงผลชัดเจนด้วย NavLink และโลโก้ TokTickIT นำทางไปยังแดชบอร์ดตามสิทธิ์ของผู้ใช้
     - `HomeRedirect` ที่ route `/` ช่วยนำทางผู้ใช้ที่ผ่านการ Authenticate แล้วไปยังแดชบอร์ดประจำบทบาทโดยอัตโนมัติ
  4. **Automated Component Test Suites (`client/src/tests/lab-04/`):**
     - `client/src/tests/lab-04/StaffDashboard.test.tsx` (11 tests): ครอบคลุม UI-DSH-01 (Render การ์ดและ Recent tickets พร้อม Empty state) และ UI-DSH-02 (Drill-down clicks, Quick actions navigation, Refresh action) ผ่านครบ 100%
     - `client/src/tests/lab-04/RequesterDashboard.test.tsx` (10 tests): ครอบคลุม UI-DSH-03 (Render การ์ดและ Recent tickets พร้อม Empty state) และ UI-DSH-04 (Drill-down navigation, Quick actions, Refresh action) ผ่านครบ 100%
     - ภาพรวมชุดทดสอบ Frontend Component ของ Lab 4 ผ่านทั้งหมด 37/37 tests
- **Review Comment:**
  > "ตรวจสอบหน้าจอ Dashboard ทั้งสองฝั่งแล้ว พบว่าการ์ดและรายการตั๋วแสดงผลสวยงามตาม Zen Green theme ลิงก์ Drill-down นำทางตรงกับ query parameter ของคิวงาน และ Accessible navigation ด้วย Tab/Enter ทำงานได้ราบรื่น ฝากเช็คเรื่อง Empty state เมื่อไม่มีตั๋วให้แสดงผลข้อความอย่างสุภาพและมีปุ่มทางลัดสร้างตั๋วด้วยครับ"
- **Author Response & Resolution:**
  1. เพิ่ม Empty State Container พร้อมไอคอน Inbox ข้อความอธิบายที่เข้าใจง่าย และปุ่มทางลัด "+ Create your first ticket" บน Requester Dashboard เพื่อให้ผู้ใช้งานใหม่เริ่มต้นส่งคำขอได้ทันที
  2. จัดเตรียม Empty State ข้อความ "No recent tickets found" บน IT Staff Dashboard เพื่อรองรับกรณีที่ระบบยังไม่มีตั๋วหรือตั๋วทั้งหมดถูกเคลียร์เสร็จสิ้น
  3. เพิ่ม Accessible attributes `aria-label`, `role="button"`, และ `onKeyDown` รองรับทั้งปุ่ม `Enter` และ `Space` บนการ์ด Metric และรายการตั๋วทุกชิ้น
  4. ปรับปรุงชุดทดสอบ `StaffDashboard.test.tsx` และ `RequesterDashboard.test.tsx` ให้ assert ครอบคลุมกรณี Empty state ผ่านครบถ้วน 21/21 tests
  5. **Security Hardening & Vulnerability Remediation:**
     - **Synchronized Drill-down Filters:** เพิ่ม `<option value="open-group">` ใน `MyTickets.tsx` และ `StaffTicketQueue.tsx` และ `<option value="me">` ใน `StaffTicketQueue.tsx` เพื่อให้ Dropdown แสดงผลและ Filter ค่าตรงกัน 100% กับ Query params จาก Dashboard
     - **Unified Administrator Role Authorization:** ปลดล็อกสิทธิ์ของ Administrator ให้เข้าถึงและจัดการตั๋วได้อย่างไร้รอยต่อใน `server/src/index.ts` ครอบคลุม: สร้างตั๋ว (`POST /api/tickets`), ดู/ดาวน์โหลดไฟล์แนบ (`GET /api/tickets/:id/attachments`, `GET /api/attachments/:id/download`), ตอบความคิดเห็น (`POST /api/tickets/:id/comments`), มอบหมายผู้รับผิดชอบ (`PATCH /api/staff/tickets/:id/owner`), ปรับความสำคัญ (`PATCH /api/staff/tickets/:id/priority`), และบันทึกโน้ตภายใน (`POST /api/staff/tickets/:id/notes`)
     - **Terminal State Validation (BR-10, BR-16):** สกัดกั้นการบันทึกหรือแก้ไข `Actions Taken` บนตั๋วที่มีสถานะเป็น `CANCELLED` หรือ `CLOSED` ด้วย HTTP 400 (`INVALID_TICKET_STATE`)
     - **Future Timestamp Guard (BR-04):** ตรวจสอบ `actionDateTime` ไม่ให้อยู่ในอนาคต หากพบจะตอบกลับด้วย HTTP 400 (`VALIDATION_ERROR`)
     - **Automated Regression Coverage:** เพิ่มชุดทดสอบ API-ACT-25, 26, 27 ใน `server/tests/lab-04/actions-taken.api.test.ts` และการทดสอบ Dropdown ใน `client/src/tests/lab-03/StaffTicketQueue.test.tsx` ผ่าน 100%
- **Status:** Approved & Merged into `lab4-staging` (Merged in PR #71)

---

### Issue #61: test(e2e): Playwright E2E suites and responsive screenshots (`feature/lab4-e2e-screenshots`)
- **Reviewer:** [@krittaphato3](https://github.com/krittaphato3) (Fourth Reviewer)
- **Review Scope & Summary:**
  1. **Automated Playwright E2E Test Suites (`e2e/lab-04/`):**
     - `e2e/lab-04/actions-taken-flow.spec.ts`:
       - `E2E-ACT-01`: IT Staff เข้าสู่ระบบ เปิดตั๋วสถานะ Open บันทึก Action Taken ตรวจสอบ auto-populated & disabled `performedBy`, toggle follow-up note input, บันทึกสำเร็จแล้วคลิกแก้ไข action เดิม และยืนยันข้อมูลที่อัปเดต
       - `E2E-ACT-02`: Requester เข้าสู่ระบบ ดูตั๋วของตนเอง ตรวจสอบ Read-Only mode ของ Actions Taken (ไม่มีปุ่ม "+ Add Action Taken" และไม่มีปุ่มแก้ไข)
     - `e2e/lab-04/ticket-resolution.spec.ts`:
       - `E2E-RES-01 & E2E-RES-02`: ตรวจสอบ Resolution Gate สกัดกั้นการ Resolve ตั๋วที่มี 0 actions taken พร้อมแสดง Alert Banner และปุ่มทางลัด "+ Add Action Taken Now" เมื่อบันทึก Action สำเร็จสามารถเปลี่ยนสถานะเป็น RESOLVED ได้อย่างถูกต้อง
       - `E2E-RES-03`: Requester กด "Problem Appears Resolved" และยืนยันใน Modal จากนั้น IT Staff เข้าดูตั๋วและพบ Advisory Indicator Flag สีเขียวอย่างชัดเจน
     - `e2e/lab-04/dashboards.spec.ts`:
       - `E2E-DSH-01`: IT Staff Dashboard ตรวจสอบ Metrics cards, ลิงก์ Drill-down นำทางตรงกับคิวงานที่กรองแล้ว, และปุ่ม Quick actions
       - `E2E-DSH-02`: Requester Dashboard ตรวจสอบ Metrics cards, ลิงก์ Drill-down ไปยัง My Tickets, และปุ่ม Quick actions
       - `E2E-DSH-03`: Administrator เข้าถึง Staff Dashboard ได้เต็มรูปแบบตามสิทธิ์
  2. **Multi-Platform & Responsive Test Results:**
     - ทดสอบครบถ้วนทั้ง Desktop Chromium และ Mobile Chrome
     - ผลการทดสอบผ่าน 14/14 tests (100% pass rate)
     - ตรวจสอบ `assertNoHorizontalOverflow` ปราศจากแนวนอนเลื่อนล้นจอทุกหน้า
  3. **Visual Evidence & Responsive Screenshots (`artifacts/lab-04/screenshots/`):**
     - บันทึกภาพหน้าจอแบบ Responsive 3 ขนาดตามมาตรฐาน (Desktop 1280x800, Tablet 768x1024, Mobile 375x812) รวม 21 ภาพ:
       - `actions-taken/`: `staff-ticket-detail-*`, `add-action-modal-*`, `requester-ticket-detail-readonly-*` (9 ภาพ)
       - `dashboards/`: `staff-dashboard-*`, `requester-dashboard-*` (6 ภาพ)
       - `resolution-gate/`: `resolution-gate-alert-*`, `ticket-resolved-*` (6 ภาพ)
  4. **Component Usability Enhancements:**
     - ปรับปรุง `StaffTicketQueue.tsx` ให้แถวตาราง `<tr>` มี `onClick` นำทางไปยังหน้ารายละเอียดตั๋วได้โดยตรง รองรับ responsive interactions
- **Review Comment:**
  > "ชุดทดสอบ Playwright E2E ครอบคลุม Requirement สำคัญของ Lab 4 ทั้งหมด ทั้ง Actions Taken, Resolution Gate, Advisory Flag และ Dashboards การทดสอบผ่านครบ 14/14 ทั้งบน Chromium และ Mobile Chrome ภาพหน้าจอ Responsive สวยงาม คมชัด ไม่พบปัญหา Layout overflow ตรวจสอบแล้วพร้อม Approve ครับ"
- **Status:** Approved / Ready for Review (Branch: `feature/lab4-e2e-screenshots`)
