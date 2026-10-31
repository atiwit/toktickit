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
| #72 | test(e2e): Playwright E2E suites and responsive screenshots | `feature/lab4-e2e-screenshots` | Merged | [PR #72](https://github.com/atiwit/toktickit/pull/72) |
| #73 | chore(release): Final regression, hardening, and merge to main | `feature/lab4-release-integration` | Ready for Review | [PR #73](https://github.com/atiwit/toktickit/pull/73) |

---

## Evidence: Partner Reviews & Approvals (My Repository)

### PR #64: docs-preparation for lab4 (`feature/lab4-docs-prepare`)
- **Reviewer:** [@Alongkron1234](https://github.com/Alongkron1234)
- **Review Comment from my partner (@Alongkron1234):**
  > "ไฟล์ document spec ต่างๆเขียนเรียบร้อยดีครับ"
- **My Response (@atiwit):**
  > "แน่นอนครับ อลงบอว ขอบคุณมากครับ"
- **Status:** Approved & Merged into `lab4-staging` (Merged in PR #64)

---

### PR #65: feat(actions): Actions Taken model, migration, seed, and APIs (`feature/lab4-actions-foundation`)
- **Reviewer:** [@Alongkron1234](https://github.com/Alongkron1234)
- **Review Comment from my partner (@Alongkron1234):**
  > "จากที่ดูๆนะครับ PATCH ไม่ validate attachmentNotes: ส่งเกิน 1000 ตัวหรือไม่ใช่ string แล้วได้ 500 แทน 400 ให้แยก validator ใช้ร่วมกับ POST
  > ไม่ใช้ transaction: actionTaken.create/update กับ ticket.update({ updatedAt }) แยกกัน ถ้าตัวที่สองล้ม action ถูกบันทึกแล้วแต่ client ได้ 500 และกดซ้ำจะเกิดรายการซ้ำ ให้ครอบด้วย prisma.$transaction ลองฝากเช็คอีกทีนะครับ"
- **My Response & Resolution (@atiwit):**
  > "ขอบคุณมากครับ ตอนนี้ผมได้แก้ไขแล้วนะครับ รบกวนเช็คให้ผมอีกรอบครับ
  > 
  > @Alongkron1234 ขอบคุณสำหรับ review comment ครับ ได้ทำการแก้ไขและปรับปรุงเรียบร้อยแล้วดังนี้:
  > 
  > 1. **Shared Validator (`validateActionTakenPayload`)**:
  >    - แยกฟังก์ชัน validation logic ออกมาเป็นโมดูลกลางสำหรับใช้งานร่วมกันระหว่าง `POST /api/tickets/:id/actions-taken` และ `PATCH /api/tickets/:id/actions-taken/:actionId`
  >    - ทำการ validate ฟิลด์ `attachmentNotes` ทั้งชนิดข้อมูล (ต้องเป็น string) และความยาว (สูงสุด 1,000 ตัวอักษร) หากไม่ถูกต้องจะ return HTTP 400 (`VALIDATION_ERROR`) แทน 500 พร้อม normalize ค่า whitespace-only ให้เป็น `null`
  > 2. **Database Transaction (`prisma.$transaction`)**:
  >    - ครอบการทำงานของ `actionTaken.create` / `actionTaken.update` ควบคู่กับการแตะ `ticket.update({ updatedAt: new Date() })` ให้อยู่ภายใต้ `prisma.$transaction([ ... ])`
  >    - การันตีคุณสมบัติ Atomicity: หากคำสั่งใดล้มเหลว Prisma จะทำการ Rollback ทั้งหมดทันที ป้องกัน inconsistent state และปัญหา duplicate actions เมื่อ client กด retry
  > 3. **Automated Integration Tests**:
  >    - เพิ่ม test cases ครอบคลุมเคสข้างต้นใน `server/tests/lab-04/actions-taken.api.test.ts` (API-ACT-20 ถึง API-ACT-24) ผ่านทั้งหมด 23/23 tests (รวมทั้งโปรเจกต์ 183/183 passing)
  > 
  > Commits: `d23e205` และ `5843740`
  > 
  > รบกวนตรวจสอบอีกครั้งได้เลยครับ ขอบคุณครับ!"
- **Follow-up Review from my partner (@Alongkron1234):**
  > "เช็คอีกรอบแล้วเห้นว่าแก้ตรงตามที่ comment ไว้เลยครับ ผ่านครับ"
  
  **Approval Status:** Approved (`approve`)
- **My Response (@atiwit):**
  > "ขอบคุณมากครับ"
- **Status:** Approved & Merged into `lab4-staging` (Merged in PR #65)

---

### PR #66: feat(workflow): Ticket workflow, Resolution Gate, and Concurrency (`feature/lab4-ticket-workflow`)
- **Reviewer:** [@krittaphato3](https://github.com/krittaphato3)
- **Review Comment from my partner (@krittaphato3):**
  > "ทำส่วน workflow logic กับ test suite ออกมาได้ดีมากเลยครับ! ตัว Resolution Gate กับ Transition Matrix ก็ทำมาได้ดีมากครับ ภาพรวมผ่านเลยครับ เดี๋ยวผมกด Approve ให้นะครับ แต่ขอฝากข้อเสนอแนะไว้พิจารณาปรับเพิ่มอีกนิดหน่อยก่อน merge ครับ:
  > - การทำ OCC ใน index.ts: ตอนนี้การเทียบ timestamp บน JS อาจยังมีช่องว่างเล็ก ๆ ให้เกิด race condition ได้ ถ้าดันการเช็ค updatedAt เข้าไปอยู่ใน where clause ของ Prisma updateMany จะทำให้การทำงานเป็น atomic แบบจริงจังขึ้นครับ
  > - Response & Frontend: ฝากช่วยคลีนตัว ticket object ที่ซ้ำซ้อนใน response ของ status update ออกอีกนิด แล้วก็อย่าลืมอัปเดตฝั่ง frontend ให้รองรับโครงสร้าง success/data shape แบบใหม่ด้วยนะครับ!"
- **My Response & Resolution (@atiwit):**
  > "ขอบคุณมากครับ ตอนนี้ผมได้เพิ่มตามที่คุณโอซวยแนะนำแล้วครับ
  > 
  > 1. **Atomic OCC ใน updateMany**: ปรับปรุงการตรวจสอบ Optimistic Concurrency Control (OCC) ให้เป็น Atomic Operation ที่ระดับฐานข้อมูลอย่างแท้จริง โดยใช้ `prisma.ticket.updateMany({ where: { id: ticketId, updatedAt: expectedUpdatedAt }, data: { status, updatedAt: new Date() } })` ซึ่งดันเงื่อนไข `updatedAt` เข้าไปใน `WHERE` clause โดยตรง หากผลลัพธ์ได้ `count === 0` ระบบจะดึงข้อมูลล่าสุดและตอบกลับด้วย HTTP 409 Conflict ทันที ช่วยปิดช่องว่าง race condition ระหว่าง read และ write ได้ 100%
  > 2. **Clean JSON Response**: คลีนโครงสร้าง JSON Response ของ `PATCH /api/staff/tickets/:id/status` โดยตัดฟิลด์ `ticket` ที่ซ้ำซ้อนออก ให้ตอบกลับเฉพาะ `{ success: true, message: "...", data: { id, ticketNumber, status, updatedAt, permittedStatuses } }` ตามมาตรฐาน API Specification
  > 3. **Frontend OCC Integration**: อัปเดตฝั่ง Frontend ใน `client/src/pages/StaffTicketDetail.tsx` ให้ส่ง `lastUpdatedAt: ticket?.updatedAt` ใน Request body เพื่อเปิดใช้ OCC จากหน้าบ้าน และรองรับโครงสร้าง response แบบ `success`/`data` พร้อมดึงข้อมูลตั๋วใหม่ทันทีเมื่อเกิด 409 Conflict
  > 4. **Automated Tests**: อัปเดตชุดทดสอบ `server/tests/lab-04/ticket-workflow.api.test.ts` และ `server/tests/lab-03/staff-ticket-detail.api.test.ts` ให้สอดคล้องกับ `updateMany` และโครงสร้าง `data` shape ใหม่ ผ่านครบถ้วน 159/159 tests"
- **Status:** Approved & Merged into `lab4-staging` (Merged in PR #66)

---

### PR #69: feat(ui): Actions Taken on Ticket Detail UI (`feature/lab4-actions-ui`)
- **Reviewer:** [@krittaphato3](https://github.com/krittaphato3)
- **Review Comment from my partner (@krittaphato3):**
  > "ทำงานได้ดีเยี่ยมมากครับสำหรับสปรินต์นี้! Test coverage ในส่วนของ workflow และ actions components ทำออกมาได้ดีมาก ไม่มีข้อติเลยครับ"
- **My Response (@atiwit):**
  > "ขอบคุณมากครับคุณ Ozonggggg"
- **Status:** Approved & Merged into `lab4-staging` (Merged in PR #69)

---

### PR #70: feat(dashboard): Role-based dashboard backend APIs (`feature/lab4-dashboards-api`)
- **Reviewer:** [@Alongkron1234](https://github.com/Alongkron1234)
- **Review Comment from my partner (@Alongkron1234):**
  > "จาที่ผมดูนะครับการ์ดนับเฉพาะสถานะ active แต่ link ?owner=me ไม่กรองสถานะ รายการที่เปิดจึงรวมตั๋ว RESOLVED, CLOSED, CANCELLED ด้วย ตัวเลขบนการ์ดจะน้อยกว่าที่เห็นในหน้ารายการ ผมว่าควรให้ link เติม status=open-group ด้วยนะครับ ฝากลองเช็คตรงนี้หน่อยนะๆ เหมือนจะผิด spec ข้อ AC-08 และ FR-14"
- **My Response & Resolution (@atiwit):**
  > "จริงด้วยครับคุณบอล ตอนนี้ผมแก้ไขแล้วนะครับรบกวนเช็คอีกทีนะครับ
  > 
  > 1. แก้ไข `drillDownLinks.myAssigned` ใน `server/src/index.ts` จาก `/staff/tickets?owner=me` เป็น `/staff/tickets?owner=me&status=open-group` เพื่อให้สอดคล้องกับข้อกำหนด AC-08 และ FR-14 ที่ตัวเลขบนการ์ดและผลลัพธ์ในหน้ารายการตั๋วต้องตรงกันอย่างสมบูรณ์
  > 2. อัปเดต `docs/lab-04/api-spec.md` ในส่วนตัวอย่าง Response ของ `GET /api/dashboards/staff` ให้ระบุ `myAssigned` เป็น `/staff/tickets?owner=me&status=open-group`
  > 3. ปรับปรุงชุดทดสอบ `server/tests/lab-04/staff-dashboard.api.test.ts` (API-DSH-05) ให้ assert ลิงก์ `myAssigned` ที่มี `status=open-group` ผ่านครบ 100%"
- **Follow-up Review from my partner (@Alongkron1234):**
  > "จากที่ตรวจดูอีกรอบก็ครบถ้วนหมดแล้วนะครับ ดีมากครับ"
  
  **Approval Status:** Approved
- **Status:** Approved & Merged into `lab4-staging` (Merged in PR #70)

---

### PR #71: feat(dashboard-ui): Role-based dashboard screens and navigation (`feature/lab4-dashboards-ui`)
- **Reviewer:** [@krittaphato3](https://github.com/krittaphato3)
- **Review Comment from my partner (@krittaphato3):**
  > "pr นี้มีการทำตาม issue ครบถ้วนนะครับ implement role-based dashboard ทำได้สวยงาม, navigation มีการทำ navigator ที่ดี, security hardening ได้ถูกต้อง ไม่มีปัญหาอะไร approve ครับ"
- **My Response (@atiwit):**
  > "ขอบคุณมากครับคุณโอซง"
- **Status:** Approved & Merged into `lab4-staging` (Merged in PR #71)

---

### PR #72: test(e2e): Playwright E2E suites and responsive screenshots (`feature/lab4-e2e-screenshots`)
- **Reviewer:** [@krittaphato3](https://github.com/krittaphato3)
- **Review Comment from my partner (@krittaphato3):**
  > "pr นี้ทำได้ดีมากเลยครับ ใน E2E แต่เหมือนว่าจะ Event Propagation Bug ใน StaffTicketQueue.tsx
  > การเพิ่ม `onClick` ลงใน `<tr>` โดยตรงโดยไม่คำนึงถึงการส่ง event bubbling หากภายในแถวนั้นมีองค์ประกอบที่โต้ตอบได้ (เช่น ปุ่ม "มอบหมายด่วน", ช่องทำเครื่องหมาย หรือเมนูแบบดร็อปดาวน์) การคลิกที่องค์ประกอบย่อยเหล่านั้นจะไปกระตุ้น `onClick` ของแถวไปด้วย ส่งผลให้ผู้ใช้งานถูกนำไปยังหน้าอื่นโดยไม่ได้ตั้งใจได้ ก็เลยอยากให้ลองตรวจเช็คว่าจำเป็นต่อการแก้ไขไหม แต่โดยรวม ผมให้ผ่านครับ"
- **My Response & Resolution (@atiwit):**
  > "รับทราบครับคุณ Ozong ผมได้ทำการแก้ไขแล้วนะครับ รบกวนเช็คอีกทีนะครับ
  > 
  > 1. ปรับปรุง `client/src/pages/StaffTicketQueue.tsx` โดยเพิ่ม `(e.target as HTMLElement).closest('button, a, input, select, textarea')` ตรวจจับองค์ประกอบที่โต้ตอบได้เพื่อสกัดกั้นการ trigger `onClick` ของแถว และเพิ่ม `e.stopPropagation()` บนปุ่ม "Open" ป้องกัน Event Bubbling 100%"
- **Follow-up Review from my partner (@krittaphato3):**
  > "ดีมากครับ ไม่มีอะไรติแล้วครับ เก่งมาก"
  
  **Approval Status:** Approved
- **Status:** Approved & Merged into `lab4-staging` (Merged in PR #72)

---

## Evidence: I Reviewed and Approved My Partner's PRs

---

### Repo: [Alongkron1234/toktickit](https://github.com/Alongkron1234/toktickit)

---

### [PR #63](https://github.com/Alongkron1234/toktickit/pull/63) — Lab4-01: Sprint 4 Engineering Contract (Spec, UI, API, Test Plan) · **Approved**

**My Review Comment:**
> เอกสารครบถ้วน และพร้อมสำหรับ Issue ต่อไปแล้วครับ สุดยอดมาก

**Partner's Response (@Alongkron1234):**
> เย่ๆๆ ขอบคุณครับ

**Review Result (me):** Approved

---

### [PR #65](https://github.com/Alongkron1234/toktickit/pull/65) — feat(lab-04): Ticket workflow and resolution gate · **Commented → Approved**

**My Review Comment (inline on `client/src/tests/lab-04/TicketWorkflow.test.tsx:68`):**
> `beforeEach(() => vi.restoreAllMocks())` ไม่ได้ restore global.fetch  
> `global.fetch = vi.fn(...)` เป็นการ assign ตรง ๆ ไม่ใช่ `vi.spyOn` ดังนั้น `restoreAllMocks` ไม่คืนค่าให้ และ fetch ของเทสก่อนหน้าจะค้างข้ามเทส (ตอนนี้ไม่พัง เพราะ setup assign ใหม่ทุกครั้ง แต่เสี่ยงถ้ามีเทสที่ไม่เรียก setup)  
> ลอง เช็คตรงนี้หน่อยนะครับ @Alongkron1234

**Partner's Response (@Alongkron1234 inline):**
> จริงด้วยครับมองได้เฉียบคมมาก เดี๋ยวจะลองเช็คและแก้ไขดูะครับ

**Partner's Follow-up (@Alongkron1234):**
> ผมได้ทำการแก้ตามที่คุณอิคคิวซังบอกแล้ว รบกวนเช็คอีกทีนะครับ @atiwit

**My Response (@atiwit):**
> เรียบร้อยแล้วครับ ลุยต่อเลยย

**Review Result (me):** Approved

---

### [PR #70](https://github.com/Alongkron1234/toktickit/pull/70) — test(lab-04): E2E, screenshots และ regression ทั้งชุด พร้อมบันทึก peer review และ AI use · **Approved**

**My Review Comment:**
> ทุกอย่างครบถ้วนสมบูรณ์ครับ แต่เหมือนจะไม่ได้อัพเดท AI-use.md

**Partner's Response (@Alongkron1234):**
> เดี๋ยวจัดการให้นะครับ

**My Follow-up Response (@atiwit):**
> เรียบร้อยทุกอย่างแล้วครับ

**Review Result (me):** Approved

---

### [PR #71](https://github.com/Alongkron1234/toktickit/pull/71) — Release: Lab 4 TokTickIT Actions Taken, Ticket Workflow, Dashboards and Hardening · **Approved**

**My Review Comment:**
> ยกให้เป็นมลิงกิงกองเลยครับ สุดยอดมาก

**Partner's Response (@Alongkron1234):**
> ขอบคุณทุกๆท่านที่เข้ามาร่วมแสดงความคิดเห็นเกี่ยวกับงานของผมนะครับ ทราบซึ้งเป็นอย่างยิงครับ

**Review Result (me):** Approved

---

### Repo: [krittaphato3/TokTickIT](https://github.com/krittaphato3/TokTickIT)

---

### [PR #64](https://github.com/krittaphato3/TokTickIT/pull/64) — [L4-4] Actions Taken UI on Ticket Detail · **Approved**

**My Review Comment (inline on `client/tests/lab-04/ActionsTaken.test.tsx:311`):**
> รวมๆแล้วดีมากครับ ผมมีข้อแนะนำ ในเคส UI-03 ที่มีการเรียก cleanup() แล้ว re-render 3 รอบ แนะนำแยกเป็น 3 it() ย่อยดีกว่า จะได้ debug ง่ายเวลา step ใด step หนึ่งพัง และไม่ปนกัน แต่คิดว่าแบบนี้ก็ได้เหมือนกันครับ

**Partner's Response (@krittaphato3):**
> ขอบคุณสำหรับคำแนะนำครับ ได้ทำการแยกเคสใน UI-03 ออกเป็นเทสย่อยที่โฟกัสแต่ละพฤติกรรมชัดเจนแล้วครับ:
> - UI-03a: renders actions sorted with performed-by, follow-up chip, and attachment notes in staff view
> - UI-03b: keeps requester view strictly read-only with no record action or edit buttons
> - UI-03c: renders the documented empty state when a ticket has no actions recorded
> - UI-03d: maintains BR-05 sort order (actionAt desc, then id desc) when backdated actions are created

**Review Result (me):** Approved

---

### [PR #65](https://github.com/krittaphato3/TokTickIT/pull/65) — [L4-5] Role dashboards (Requester + IT Staff/Admin) · **Approved**

**My Review Comment:**
> โค้ดโดยรวมโอเคครับ หน้า Staff และ Requester ตรงรตาม Requirement ลุยต่อโล้ด

**Review Result (me):** Approved

---

### [PR #66](https://github.com/krittaphato3/TokTickIT/pull/66) — [L4-6] Final hardening, regression, accessibility, evidence · **Approved**

**My Review Comment:**
> โดยรวมแล้วโอเคแล้วครับ ลุยต่อเลยครับ สุดยอดกมาก

**Review Result (me):** Approved

---

### [PR #67](https://github.com/krittaphato3/TokTickIT/pull/67) — [L4] Release: lab4-staging -> main · **Approved**

**My Review Comment:**
> ทุกอย่างครบถ้วนสมบูรณ์ ทั้ง E2E, a11y, performance และ regression ผ่าน 100% พร้อม merge เข้า main และ release lab 4 ครับ

**Review Result (me):** Approved

---

## Kanban Board — All Issues in Done

> **Status of Kanban board with all Sprint 4 issues completed:**

| Issue | Title | Status |
| :--- | :--- | :---: |
| #55 | Lab4 docs-preparing | Done |
| #56 | Lab4 Actions Taken Foundation (Database, Model, Seed & APIs) | Done |
| #57 | Lab4 Ticket Workflow, Resolution Gate & Concurrency Handling | Done |
| #58 | Lab4 Actions Taken UI on Ticket Detail | Done |
| #59 | Lab4 Role-Based Dashboard APIs | Done |
| #60 | Lab4 Role-Based Dashboard UIs & Navigation | Done |
| #61 | Lab4 E2E Test Suites & Responsive Screenshots | Done |
| #62 | Lab4 Final Regression, Hardening & Release Integration | Ready for Release |
