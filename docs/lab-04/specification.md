# Lab 4 Sprint Engineering Specification

## 1. Sprint Goal

Sprint 4 ส่งมอบคุณค่าส่วนขยายที่ทำให้กระบวนการบริการของ TokTickIT สมบูรณ์ครบวงจร โดยเพิ่มการบันทึกประวัติการปฏิบัติงานจริง (Actions Taken) ใต้ Ticket พร้อมเชื่อมโยงกับผู้ปฏิบัติงานรายย่อย, บังคับใช้เงื่อนไขการแก้ไขปัญหา (Resolution Gate) และ Status Transitions อย่างเคร่งครัดที่ backend, จัดเตรียม Role-Based Dashboards ที่สรุปข้อมูลการดำเนินงานสำหรับ Requester, IT Staff และ Administrator พร้อมการ Drill-down ที่แม่นยำ, ป้องกันปัญหาการอัปเดตข้อมูลชนกัน (Optimistic Concurrency), และทดสอบ Final Regression ครอบคลุมฟังก์ชันทั้งหมดตั้งแต่ Lab 1 ถึง Lab 3 ภายใต้ Zen Green Design Language อย่างราบรื่น

---

## 2. Stakeholder Request Interpretation

Stakeholder ต้องการให้ TokTickIT ไม่ใช่เพียงแค่ระบบรับแจ้งและสื่อสารผ่านความคิดเห็น แต่สามารถใช้ วางแผน ติดตาม และตรวจสอบการลงมือแก้ปัญหาจริง ได้อย่างน่าเชื่อถือ จึงจำเป็นต้องเพิ่มส่วน Actions Taken ภายใต้แต่ละตั๋ว โดยบันทึกข้อมูลสำคัญ ได้แก่ วันที่/เวลา, รายละเอียดการปฏิบัติงาน, ผลลัพธ์, ผู้ดำเนินการ (บันทึกอัตโนมัติจากผู้ล็อกอิน), ความจำเป็นในการติดตามงาน (Follow-Up Required?) พร้อมบันทึกข้อความติดตามงานเมื่อต้องติดตาม, และบันทึกเกี่ยวกับไฟล์แนบอ้างอิง

Ticket Owner หลักยังคงทำหน้าที่กำกับดูแลตั๋วภาพรวม แต่เจ้าหน้าที่ IT Staff คนอื่นสามารถเข้ามาลงมือปฏิบัติงานและบันทึกใน Actions Taken ได้ และถึงแม้ Requester จะระบุว่าปัญหาได้รับการแก้ไขแล้ว (Problem Appears Resolved) แต่เจ้าหน้าที่ IT Staff จะต้องตรวจสอบงานและอัปเดตสถานะของตั๋วอย่างเป็นทางการเท่านั้น โดยระบบต้องมี Resolution Gate บังคับว่าตั๋วจะเปลี่ยนเป็น Resolved ได้ต้องมี Action Taken บันทึกไว้แล้วอย่างน้อย 1 รายการ นอกจากนี้ ต้องมีแดชบอร์ดสรุปสถิติที่กระชับและตรงตามบทบาท (Requester และ IT Staff) พร้อมลิงก์ Drill-down สู่หน้ารายละเอียด และสุดท้ายระบบเดิมทั้งหมดตั้งแต่ Lab 1 ถึง 3 ต้องยังคงทำงานได้ถูกต้อง 100% ภายใต้รูปลักษณ์ Zen Green ที่เป็นมาตรฐานเดียวกัน

---

## 3. Scope

### Included
- **Actions Taken Core Data & Workflow:**
  - สร้างโมเดล `ActionTaken` เชื่อมโยงกับ Ticket และ User (ผู้ปฏิบัติงาน)
  - รองรับฟิลด์: Action Date/Time, Action Description, Result, Performed by (auto), Follow-Up Required?, Follow-up Note (mandatory เมื่อ Follow-Up Required = true), Attachment Notes
  - IT Staff และ Administrator สามารถสร้างและแก้ไข Actions Taken ในตั๋วที่เข้าถึงได้
  - Requester สามารถเปิดดูประวัติ Actions Taken ของตั๋วตนเองได้แบบ Read-only
- **Ticket Workflow & Resolution Gate:**
  - บังคับใช้ State Transition Matrix ที่สมบูรณ์
  - Backend Resolution Gate: ไม่อนุญาตให้เปลี่ยนสถานะเป็น `RESOLVED` หากยังไม่มี Actions Taken ในตั๋วนั้นอย่างน้อย 1 รายการ (ป้องกันแม้ client จะ bypass หน้าจอ)
  - Requester indication ("Problem Appears Resolved") เป็นเพียง advisory flag ไม่เปลี่ยนสถานะตั๋วโดยตรง
  - การจัดการ Concurrency / Stale-update handling ด้วย timestamp/version เพื่อป้องกันการบันทึกสถานะทับซ้อน
- **Role-Based Dashboards:**
  - **Requester Dashboard:** สรุปตัวเลขตั๋วของตนเอง (My Open Tickets, In Progress, Resolved, Closed), รายการ Recent Tickets, Quick Actions (Create Ticket, View My Tickets) พร้อม Drill-down
  - **IT Staff Dashboard:** สรุปตัวเลขงานบริการ (New, Open, In Progress, Waiting for Requester, My Assigned), รายการ Recent Tickets, Quick Actions (Create Ticket, Search Tickets, My Queue) พร้อม Drill-down ไปยังฟิลเตอร์ที่เกี่ยวข้อง
  - **Administrator Dashboard:** รองรับการดูสถิติ IT Staff Dashboard พร้อมตัวเลขสรุปบัญชีผู้ใช้งานระบบ
  - ข้อมูล Metrics ทั้งหมดคำนวณจาก Database ในฝั่ง Backend โดยตรง พร้อมจัดการ Timezone และ Empty State อย่างถูกต้อง
- **UI Extensions & Final Hardening:**
  - การแสดงผล Actions Taken บนหน้า IT Staff Ticket Detail (Create/Edit mode) และ Requester Ticket Detail (Read-only)
  - Dashboard Navigation พร้อม Active-page indicator
  - ความสอดคล้องตาม Zen Green Design System (Cards, Badges, Modals, Responsive Breakpoints, A11y)
  - การทดสอบครอบคลุม Unit, API, Component, E2E และ Regression Test ทั้งระบบ (Labs 1–3)

### Explicitly Excluded
- การนับเวลา SLA Clock อัตโนมัติ, Escalation Engine, On-call scheduling, Breach Notifications
- บริการแจ้งเตือนภายนอกผ่าน Email, SMS, LINE Notify หรือ Push Notification
- ระบบสต็อกอะไหล่, Inventory consumption, ระบบจัดซื้อ และการคำนวณต้นทุนบริการ
- ระบบบันทึกเวลาทำงานเพื่อคิดค่าจ้าง (Timesheet billing, Payroll, Labor-cost calculation)
- Multi-level approval workflows และระบบลงลายมือชื่อดิจิทัล (Digital/Electronic Signature)
- เครื่องมือวิเคราะห์ข้อมูลขั้นสูง (Advanced BI Tools, Custom Report Builders, Data Warehouses)
- Multi-tenant organization และระบบ Cloud Deployment ระดับ Production
- ฟีเจอร์ใหม่นอกเหนือจากที่ตกลงใน Sprint 4 Engineering Contract

---

## 4. Functional Requirements

### Actions Taken
- **FR-01** ระบบอนุญาตให้ IT Staff และ Administrator เพิ่มรายการ Action Taken ภายใต้ Ticket ที่เข้าถึงได้
- **FR-02** ระบบบันทึกผู้ปฏิบัติงาน (Performed By) เป็นผู้ใช้งานที่กำลังล็อกอินอยู่โดยอัตโนมัติจาก Backend Session โดยไม่เปิดให้ Client ส่งระบุตัวตนเอง
- **FR-03** แต่ละ Action Taken ต้องมี Action Date/Time, รายละเอียดการปฏิบัติงาน (Action Description), และผลลัพธ์ (Result)
- **FR-04** ผู้ใช้สามารถทำเครื่องหมาย Follow-Up Required? หากเลือกเป็นจริง ระบบต้องบังคับให้ระบุ Follow-up Note เสมอ
- **FR-05** ผู้ใช้สามารถระบุ Attachment Notes เพื่อเป็นบันทึกช่วยจำอ้างอิงถึงไฟล์หรือภาพประกอบที่เกี่ยวข้อง
- **FR-06** IT Staff และ Administrator สามารถแก้ไขข้อมูล Action Taken ที่บันทึกไปแล้วได้
- **FR-07** Requester สามารถเปิดดูรายการ Actions Taken ในตั๋วของตนเองได้ แต่ไม่มีสิทธิ์สร้าง แก้ไข หรือลบ Actions Taken

### Ticket Workflow & Resolution Gate
- **FR-08** ระบบบังคับใช้การเปลี่ยนสถานะ Ticket ตาม Status Transition Matrix ที่กำหนดเท่านั้น
- **FR-09 (Resolution Gate)** ระบบต้องปฏิเสธการเปลี่ยนสถานะเป็น `RESOLVED` หาก Ticket ดังกล่าวไม่มี Actions Taken บันทึกอยู่อย่างน้อย 1 รายการ
- **FR-10** การกดแสดงความคิดเห็นหรือทำเครื่องหมาย "Problem Appears Resolved" ของ Requester จะเป็นเพียงสถานะแจ้งเตือน (Advisory Flag) และไม่ทำให้สถานะของตั๋วเปลี่ยนเป็น Resolved โดยอัตโนมัติ
- **FR-11** เมื่อมีการพยายามอัปเดตสถานะหรือบันทึกข้อมูลบน Ticket ที่ถูกแก้ไขโดยผู้อื่นไปแล้ว (Stale Update) ระบบต้องตรวจจับความขัดแย้งและแจ้งเตือนผู้ใช้ด้วย HTTP 409 Conflict

### Role Dashboards
- **FR-12** ระบบต้องจัดเตรียมหน้า Requester Dashboard แสดง Metrics ของผู้ใช้งานปัจจุบัน ได้แก่ My Open Tickets, In Progress, Resolved, Closed พร้อมรายการตั๋วล่าสุด
- **FR-13** ระบบต้องจัดเตรียมหน้า IT Staff Dashboard แสดง Metrics การปฏิบัติงาน ได้แก่ New, Open, In Progress, Waiting for Requester, My Assigned พร้อมรายการตั๋วล่าสุด
- **FR-14** Metric Cards บน Dashboard ต้องมีปุ่มหรือลิงก์ Drill-down ที่นำทางผู้ใช้ไปยังหน้ารายการตั๋วที่ตั้งค่า Filter ตรงตามการ์ดนั้นๆ
- **FR-15** ข้อมูลตัวเลขและรายการตั๋วทั้งหมดบน Dashboard ต้องคำนวณและดึงมาจาก Backend โดยตรง

### Final Hardening & Regression
- **FR-16** ระบบต้องรักษาฟังก์ชันการทำงานเดิมทั้งหมดจาก Lab 1-3 (Authentication, Authorization, Requester Ticket & Attachments, IT Staff Queue & Detail, Public Comments, Internal Notes, Admin User Management)
- **FR-17** แถบเมนูหลักของระบบ (App Shell) ต้องแสดงเมนู Dashboard ตามบทบาทของผู้ใช้ พร้อมระบุ Active-page indicator อย่างชัดเจน

---

## 5. Business Rules

### Actions Taken Rules
- **BR-01** แต่ละ Action Taken ต้องสังกัดอยู่ภายใต้ Ticket 1 ใบเท่านั้น
- **BR-02** Ticket มี Owner หลักได้เพียง 1 คน แต่ผู้บันทึก Action Taken (`performedById`) สามารถเป็น IT Staff หรือ Administrator คนใดก็ได้ที่ยังมีสถานะ Active
- **BR-03** Identity ของผู้ปฏิบัติงาน (`performedById`) ต้องถูกกำหนดจาก Token/Session ของผู้ใช้งานที่ Authenticated เท่านั้น ห้ามรับมาจาก Request Body
- **BR-04** `actionDescription` และ `result` ต้องเป็นข้อความที่ไม่ว่างเปล่า (Non-empty) ความยาวไม่เกิน 2,000 ตัวอักษร
- **BR-05** หาก `followUpRequired` เป็น `true`, ฟิลด์ `followUpNote` ต้องมีข้อความระบุความยาวไม่เกิน 2,000 ตัวอักษร หากเป็น `false` ฟิลด์นี้สามารถเป็นค่าว่าง (`null`) ได้
- **BR-06** `attachmentNotes` เป็นฟิลด์ทางเลือก (Optional) ความยาวไม่เกิน 1,000 ตัวอักษร
- **BR-07** Actions Taken สามารถอ่านได้โดย Requester เจ้าของตั๋ว, IT Staff ทุกคน และ Administrator; การสร้างหรือแก้ไขกระทำได้โดย IT Staff และ Administrator เท่านั้น

### Ticket Status & Resolution Gate Rules
- **BR-08 (Resolution Gate)**: ตั๋วจะเปลี่ยนสถานะเป็น `RESOLVED` ได้ **ต้องมี Action Taken อย่างน้อย 1 รายการ** หากไม่มี ระบบจะตอบกลับด้วยรหัส 422 Unprocessable Entity
- **BR-09**: Requester ไม่สามารถเปลี่ยนสถานะตั๋วได้ การกด "Problem Appears Resolved" เป็นเพียงการบันทึกสถานะ `requesterIndicatedResolved = true` เพื่อให้ IT Staff ทราบ
- **BR-10**: ตั๋วที่มีสถานะเป็น `CANCELLED` ถือเป็น Terminal State ไม่สามารถเปลี่ยนสถานะต่อไปได้
- **BR-11 (Concurrency Control)**: การอัปเดตสถานะของ Ticket ต้องส่งเวลา `updatedAt` หรือ Version ล่าสุดที่ฝั่ง Client ถืออยู่ หากไม่ตรงกับใน Database ให้ปฏิเสธด้วย HTTP 409 Conflict

### 5.1. Permitted Status Transition Matrix

| สถานะเริ่มต้น (From) | สถานะถัดไปที่อนุญาต (To) | บทบาทที่อนุญาต | เงื่อนไขเพิ่มเติม |
|---|---|---|---|
| **NEW** | OPEN, CANCELLED | IT Staff, Administrator | - |
| **OPEN** | IN_PROGRESS, CANCELLED | IT Staff, Administrator | - |
| **IN_PROGRESS** | WAITING_FOR_REQUESTER, RESOLVED, CANCELLED | IT Staff, Administrator | เปลี่ยนเป็น RESOLVED ต้องมี Action Taken ≥ 1 (BR-08) |
| **WAITING_FOR_REQUESTER** | IN_PROGRESS, RESOLVED, CANCELLED | IT Staff, Administrator | เปลี่ยนเป็น RESOLVED ต้องมี Action Taken ≥ 1 (BR-08) |
| **RESOLVED** | CLOSED, REOPENED | IT Staff, Administrator | - |
| **CLOSED** | REOPENED | IT Staff, Administrator | - |
| **REOPENED** | IN_PROGRESS, CANCELLED | IT Staff, Administrator | - |
| **CANCELLED** | _(ไม่มี - Terminal State)_ | — | — |

### Dashboard Rules
- **BR-12 (Requester Dashboard)**:
  - `My Open Tickets`: นับตั๋วที่เป็นของ Requester ปัจจุบัน ที่มีสถานะอยู่ในกลุ่ม `[NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED]`
  - `In Progress`: นับตั๋วของตนเองที่มีสถานะ `IN_PROGRESS`
  - `Resolved`: นับตั๋วของตนเองที่มีสถานะ `RESOLVED`
  - `Closed`: นับตั๋วของตนเองที่มีสถานะ `CLOSED`
  - `Recent Tickets`: แสดงรายการตั๋วไม่เกิน 5 รายการล่าสุด เรียงตาม `updatedAt` จากใหม่ไปเก่า
- **BR-13 (IT Staff Dashboard)**:
  - `New`: นับตั๋วทั้งหมดในระบบที่มีสถานะ `NEW`
  - `Open`: นับตั๋วทั้งหมดในระบบที่มีสถานะ `OPEN`
  - `In Progress`: นับตั๋วทั้งหมดในระบบที่มีสถานะ `IN_PROGRESS`
  - `Waiting for Requester`: นับตั๋วทั้งหมดในระบบที่มีสถานะ `WAITING_FOR_REQUESTER`
  - `My Assigned`: นับตั๋วที่ตนเองเป็น Owner (`ownerId = currentUserId`) ที่มีสถานะยังไม่สิ้นสุด (`NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED`)
  - `Recent Tickets`: แสดงรายการตั๋วไม่เกิน 5 รายการล่าสุดในระบบที่มีการอัปเดต เรียงตาม `updatedAt` ล่าสุด
- **BR-14**: การคำนวณวันและเวลาทั้งหมดบน Dashboard ต้องใช้ Timezone ของระบบ (UTC+7 หรือ ISO Standard) และกรณีไม่มีข้อมูล ต้องแสดงค่าเลข 0 หรือ Empty State ชัดเจน ไม่ error

---

## 6. Authorization Matrix

| ฟังก์ชัน / Operation | Requester | IT Staff | Administrator |
|---|---|---|---|
| ดู Requester Dashboard (`GET /api/dashboards/requester`) | ✅ (ตั๋วตนเอง) | ❌ | ❌ |
| ดู IT Staff Dashboard (`GET /api/dashboards/staff`) | ❌ | ✅ | ✅ |
| ดู Actions Taken ใต้ตั๋ว (`GET /api/tickets/:id/actions-taken`) | ✅ (ตั๋วตนเอง) | ✅ | ✅ |
| สร้าง Action Taken (`POST /api/tickets/:id/actions-taken`) | ❌ | ✅ | ✅ |
| แก้ไข Action Taken (`PATCH /api/tickets/:id/actions-taken/:actionId`) | ❌ | ✅ | ✅ |
| เปลี่ยนสถานะ Ticket (`PATCH /api/staff/tickets/:id/status`) | ❌ | ✅ | ✅ |
| เปลี่ยนสถานะเป็น RESOLVED โดยไม่มี Action Taken | ❌ (403) | ❌ (422) | ❌ (422) |
| แจ้ง Problem Appears Resolved (`PATCH /api/tickets/:id/requester-resolved`) | ✅ (ตั๋วตนเอง) | ❌ | ❌ |
| ฟังก์ชันเดิมทั้งหมดของ Lab 1–3 (Auth, Tickets, Attachments, Notes, Users) | ✅ (ตามสิทธิ์เดิม) | ✅ (ตามสิทธิ์เดิม) | ✅ (ตามสิทธิ์เดิม) |

---

## 7. UI Specification Summary

ทุกหน้าจอสร้างขึ้นและปรับปรุงต่อเนื่องด้วย **Zen Green Theme** โดยใช้โทนสี:
- Primary: `#006B3C`, Secondary: `#0B7A46`, Background: `#F5F7F6`, Surface: `#FFFFFF`
- Responsive Breakpoints: Desktop (≥992px), Tablet (768–991px), Mobile (<768px)

### สรุปหน้าจอหลักของ Lab 4:
1. **IT Staff Dashboard (`/staff/dashboard`):**
   - การ์ดสรุปจำนวนตั๋ว 5 ใบ: New, Open, In Progress, Waiting for Requester, My Assigned
   - รายการ Recent Tickets พร้อม Status Badge และวันที่
   - กล่อง Quick Actions: Create Ticket, Search Tickets, My Queue
   - การ์ดทั้งหมดสามารถคลิก Drill-down ไปเปิดหน้า IT Staff Queue พร้อมเซ็ต Query Params ตัวกรองได้
2. **Requester Dashboard (`/requester/dashboard`):**
   - การ์ดสรุป 4 ใบ: My Open Tickets, In Progress, Resolved, Closed
   - รายการ Recent Tickets ของผู้ใช้
   - Quick Actions: Create Ticket, View My Tickets พร้อมคลิก Drill-down ไปยัง My Tickets Filter
3. **Actions Taken Section บนหน้า Ticket Detail (`/staff/tickets/:id` และ `/tickets/:id`):**
   - สำหรับ IT Staff: มีตาราง/การ์ดแสดงรายการ Actions Taken, ปุ่ม "+ Add Action Taken" เปิด Modal/Drawer แบบฟอร์มบันทึก, ปุ่ม Edit ในแต่ละแถว, แสดงผู้ปฏิบัติงานและวันที่ชัดเจน
   - สำหรับ Requester: แสดงรายการ Actions Taken แบบ Read-only เพื่อติดตามความคืบหน้าการซ่อมบำรุง
   - ฟอร์มตรวจสอบความถูกต้อง: เมื่อติ๊กเลือก Follow-Up Required จะแสดงช่องกรอก Follow-up Note ทันที
4. **Ticket Workflow & Resolution Feedback:**
   - Dropdown หรือปุ่มเลือกสถานะแสดงเฉพาะสถานะที่อนุญาตให้เปลี่ยนตาม Matrix
   - เมื่อเลือก Resolved ระบบตรวจสอบ Actions Taken หากไม่มีจะแจ้งเตือนข้อผิดพลาดชัดเจน

*(รายละเอียดเต็มและ Responsive Layout อยู่ใน [`ui-spec.md`](./ui-spec.md))*

---

## 8. Data Changes

### 8.1. New Model: `ActionTaken`
```prisma
model ActionTaken {
  id                Int      @id @default(autoincrement())
  ticketId          Int
  actionDateTime    DateTime @default(now())
  actionDescription String   @db.VarChar(2000)
  result            String   @db.VarChar(2000)
  performedById     Int
  followUpRequired  Boolean  @default(false)
  followUpNote      String?  @db.VarChar(2000)
  attachmentNotes   String?  @db.VarChar(1000)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  ticket            Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performedBy       User     @relation(fields: [performedById], references: [id])

  @@index([ticketId])
  @@index([performedById])
  @@index([actionDateTime])
}
```

### 8.2. Modification to Existing Models
- **`Ticket` Model:**
  - เพิ่ม Relation: `actionsTaken ActionTaken[]`
  - ดัชนีและการเชื่อมโยงเดิม (`requesterId`, `ownerId`, `categoryId`, `relatedSystemId`, `status`, `ticketNumber`) ยังคงอยู่ครบถ้วน
- **`User` Model:**
  - เพิ่ม Relation: `actionsTaken ActionTaken[]`

### 8.3. การตัดสินใจเชิงการออกแบบฐานข้อมูล (2 Decisions Justification)
1. **การแยก Foreign Key `performedById` ออกจาก `Ticket.ownerId`:**
   - *เหตุผล:* เพื่อให้สอดคล้องกับพฤติกรรมจริงในงาน IT Service Desk ที่ Ticket มี Ticket Owner หลักเพียงคนเดียวสำหรับประสานงาน แต่การปฏิบัติงานจริงอาจมีช่างเทคนิคหรือผู้เชี่ยวชาญหลายคนสลับกันมาดำเนินการแก้ไข การออกแบบนี้ทำให้ระบบเก็บ Audit Trail ว่าใครเป็นคนทำ Action ใดได้อย่างโปร่งใสโดยไม่ต้องเปลี่ยน Owner ของตั๋วไปมา
2. **การคงอยู่ของ Legacy Tickets และ Backfill Strategy (Non-destructive Migration):**
   - *เหตุผล:* การเพิ่มตาราง `ActionTaken` เป็นตารางลูกแบบ 1-to-Many โดยไม่มีการใส่ foreign key บังคับในตาราง `Ticket` ทำให้ตั๋วเดิมใน Lab 1–3 ไม่เสียหาย (Backward-compatible) และตั๋วเก่าจะถูกนับใน Dashboard ได้อย่างสมบูรณ์ สำหรับการปิดตั๋ว (Resolution Gate) จะมีผลบังคับใช้กับการเปลี่ยนสถานะใหม่ตั้งแต่นี้เป็นต้นไป

### 8.4. Seed Data Requirement
- ข้อมูล Seed ต้องเป็น Idempotent (รันซ้ำได้ปลอดภัย)
- ตั๋วตัวอย่างต้องมีครบทุกสถานะ และครอบคลุมทั้งตั๋วที่มี 0 Action, 1 Action, และหลาย Actions Taken เพื่อใช้ทดสอบ Dashboard Metrics และ Resolution Gate ทั้งเคสบวกและลบ

---

## 9. API Contract Summary

*(รายละเอียด Schema, Request, Response และ Status Code ครบถ้วนอยู่ใน [`api-spec.md`](./api-spec.md))*

| Method | Path | หน้าที่ | สิทธิ์ที่อนุญาต |
|---|---|---|---|
| `GET` | `/api/tickets/:id/actions-taken` | ดึงรายการ Actions Taken ของตั๋ว | Requester (own), IT Staff, Admin |
| `POST` | `/api/tickets/:id/actions-taken` | บันทึก Action Taken ใหม่ | IT Staff, Admin |
| `PATCH` | `/api/tickets/:id/actions-taken/:actionId` | แก้ไขข้อมูล Action Taken | IT Staff, Admin |
| `GET` | `/api/dashboards/requester` | ดึงข้อมูลสรุป Requester Dashboard | Requester |
| `GET` | `/api/dashboards/staff` | ดึงข้อมูลสรุป IT Staff Dashboard | IT Staff, Admin |
| `PATCH` | `/api/staff/tickets/:id/status` | เปลี่ยนสถานะตั๋ว (มี Resolution Gate & OCC) | IT Staff, Admin |

---

## 10. Acceptance Criteria (AC)

- **AC-01 (Create Action Taken)**: เมื่อ IT Staff หรือ Administrator ส่งข้อมูลที่ถูกต้องไปยัง `POST /api/tickets/:id/actions-taken`, Action Taken จะถูกบันทึกภายใต้ Ticket ดังกล่าว โดยมี `performedById` ตรงกับผู้ล็อกอิน
- **AC-02 (Follow-up Validation)**: เมื่อส่ง Action Taken ที่มี `followUpRequired = true` แต่ไม่มี `followUpNote` ระบบต้องปฏิเสธด้วย HTTP 400 Bad Request
- **AC-03 (Resolution Gate Block)**: เมื่อ IT Staff พยายามเปลี่ยนสถานะตั๋วเป็น `RESOLVED` บนตั๋วที่ยังไม่มี Action Taken ใดๆ ระบบต้องปฏิเสธด้วย HTTP 422 Unprocessable Entity
- **AC-04 (Resolution Gate Success)**: เมื่อตั๋วมี Action Taken อย่างน้อย 1 รายการ IT Staff สามารถเปลี่ยนสถานะเป็น `RESOLVED` ได้สำเร็จ
- **AC-05 (Requester Action Taken View Only)**: Requester สามารถเรียกดู Actions Taken ของตั๋วตนเองได้สำเร็จ แต่หากพยายามเรียก `POST` หรือ `PATCH` Actions Taken ระบบต้องปฏิเสธด้วย HTTP 403 Forbidden
- **AC-06 (Requester Dashboard Isolation)**: เมื่อ Requester เรียกดูข้อมูลแดชบอร์ด ตัวเลขสรุปและรายการตั๋วต้องสะท้อนเฉพาะตั๋วที่ตนเองเป็นเจ้าของเท่านั้น
- **AC-07 (Staff Dashboard Metrics Accuracy)**: เมื่อ IT Staff เรียกดูข้อมูลแดชบอร์ด ตัวเลขนับ New, Open, In Progress, Waiting for Requester และ My Assigned ต้องตรงกับผลการค้นหาจริงในฐานข้อมูล
- **AC-08 (Dashboard Drill-Down)**: เมื่อผู้ใช้กดที่การ์ด Metric บนแดชบอร์ด ระบบต้องนำทางไปยังหน้าตารางตั๋วพร้อมใส่ตัวกรองที่ตรงกับ Metric นั้น
- **AC-09 (Optimistic Concurrency Detection)**: เมื่อส่งอัปเดตสถานะตั๋วด้วย timestamp หรือ version ที่เก่ากว่าในฐานข้อมูล ระบบต้องส่ง HTTP 409 Conflict พร้อมข้อมูลสถานะล่าสุด
- **AC-10 (Full System Regression)**: ระบบ Authentication, Role-based Nav, Attachments, Public Comments, Internal Notes และ Admin User Management จาก Lab 1-3 ต้องผ่านการทดสอบทั้งหมด 100%

---

## 11. Definition of Done (DoD)

1. เอกสารครบถ้วนใน `docs/lab-04/` (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`, `reviewer.md`, `ai-use.md`)
2. โมเดล `ActionTaken` ถูกสร้างผ่าน Prisma migration และรัน Seed Idempotent ได้สำเร็จ
3. API endpoints ทั้งหมดของ Actions Taken และ Dashboards ผ่านการทดสอบ Automated API Tests
4. Resolution Gate และ Concurrency Control ทำงานถูกต้องและป้องกันการละเมิดกฎได้จริง
5. หน้าจอ UI ทั้ง Requester Dashboard, IT Staff Dashboard, และ Actions Taken บน Ticket Detail ทำงานราบรื่นและตอบสนองทุก Viewport (Desktop, Tablet, Mobile)
6. Automated Tests ครบทุกหมวด (Unit, API, Component, E2E) ผ่าน 100%
7. การทดสอบ Regression ของ Lab 1-3 รันผ่านทั้งหมดโดยไม่มีข้อผิดพลาด
8. Pull Requests ถูก Review และ Approve โดย Peer Reviewer ครบถ้วนตามกระบวนการ Git Workflow
9. จัดเตรียมหลักฐานการส่งงานครบ 9 ส่วนตามโครงสร้าง “Answer Part 1” ถึง “Answer Part 9” ในเล่มรายงาน PDF

---

## 12. Assumptions and Decisions

- **A-01**: การแสดงผลแดชบอร์ดของผู้ดูแลระบบ (Administrator) ให้ใช้โครงสร้างเดียวกับ IT Staff Dashboard โดยอนุญาตให้ดูข้อมูลการปฏิบัติงานของศูนย์บริการ IT ได้เช่นเดียวกัน
- **A-02**: การตรวจสอบ Concurrency Control ฝั่งเซิร์ฟเวอร์จะอ้างอิงฟิลด์ `updatedAt` ของตั๋ว เมื่อมีการแก้ไขสถานะ หากค่าที่ส่งมาไม่ตรงกับปัจจุบัน เซิร์ฟเวอร์จะตอบกลับ 409 Conflict เพื่อให้หน้าบ้าน Refresh ข้อมูลล่าสุด
- **A-03**: Actions Taken ไม่เปิดให้มีการลบข้อมูล (No Delete) เพื่อคงความสมบูรณ์ของประวัติการปฏิบัติงาน (Audit Trail)
