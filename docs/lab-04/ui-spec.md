# Lab 4 UI Specification

## 1. Design System Continuation (Zen Green Theme)

Lab 4 สานต่อเอกลักษณ์การออกแบบ **Zen Green Design System** อย่างเคร่งครัด เพื่อสร้างความรู้สึกที่สะอาด สบายตา เป็นมืออาชีพ และสอดคล้องกันทุกหน้าจอ

### 1.1. Color Tokens & CSS Variables
```css
:root {
  /* Core Palette */
  --color-primary: #006B3C;        /* Deep Forest Green */
  --color-primary-hover: #005430;
  --color-secondary: #0B7A46;      /* Vibrant Zen Green */
  --color-bg: #F5F7F6;             /* Soft Off-White Background */
  --color-surface: #FFFFFF;        /* Pure White Cards & Panels */
  --color-border: #D1D5DB;         /* Subtle Divider Gray */
  --color-border-focus: #006B3C;
  
  /* Text Tokens */
  --color-text: #1A1A1A;           /* High Contrast Charcoal */
  --color-text-muted: #6B7280;     /* Neutral Secondary Text */
  --color-text-inverted: #FFFFFF;

  /* Feedback & Alerts */
  --color-danger: #DC2626;         /* Crimson Red */
  --color-warning: #F59E0B;        /* Warm Amber */
  --color-success: #16A34A;        /* Emerald Green */
  --color-info: #3B82F6;           /* Royal Blue */

  /* Status Badges */
  --status-new: #3B82F6;
  --status-open: #F59E0B;
  --status-in-progress: #8B5CF6;
  --status-waiting: #F97316;
  --status-resolved: #16A34A;
  --status-closed: #6B7280;
  --status-reopened: #EF4444;
  --status-cancelled: #9CA3AF;
}
```

### 1.2. Responsive Breakpoints
- **Desktop:** Viewport Width $\ge 992\text{px}$ (Multi-column layout, full tables, fixed sidebar or horizontal nav)
- **Tablet:** Viewport Width $768\text{px} - 991\text{px}$ (2-column grids, collapsible panels)
- **Mobile:** Viewport Width $< 768\text{px}$ (Single-column card stack, responsive bottom sheet or modal, full-width buttons)

---

## 2. IT Staff Dashboard UI Specification

### 2.1. Screen Layout & Components
- **Header Greeting Banner:**
  - ข้อความต้อนรับ "Welcome back, {Staff Name}!"
  - สรุปสถานะย่อ "Here's what's happening with your queue today."
  - ปุ่ม **Refresh Data** ทางขวามือ
- **Metric Cards Grid (5 Cards):**
  - **New:** ตัวเลขนับตั๋วสถานะ NEW พร้อมการคลิก Drill-down ไปที่ `/staff/tickets?status=NEW`
  - **Open:** ตัวเลขนับตั๋วสถานะ OPEN พร้อม Drill-down ไปที่ `/staff/tickets?status=OPEN`
  - **In Progress:** ตัวเลขนับตั๋วสถานะ IN_PROGRESS พร้อม Drill-down ไปที่ `/staff/tickets?status=IN_PROGRESS`
  - **Waiting for Requester:** ตัวเลขนับตั๋วที่รอ Requester ตอบกลับ พร้อม Drill-down
  - **My Assigned:** ตัวเลขนับตั๋วที่ตนเองเป็น Owner พร้อม Drill-down ไปที่ `/staff/tickets?owner=me`
- **Main Content Area (2 Columns on Desktop):**
  - **Left Column (Recent Tickets Widget):**
    - ตาราง/รายการตั๋ว 5 รายการล่าสุดในระบบที่มีการอัปเดต
    - แสดง Ticket Number (ลิงก์เปิดหน้า Ticket Detail), Summary, Status Badge, และวันที่อัปเดต
    - ปุ่ม "View all" นำไปสู่ IT Staff Queue
  - **Right Column (Quick Actions Box):**
    - ปุ่ม `+ Create Ticket` (ทางลัดเปิดหน้าสร้างตั๋ว)
    - ปุ่ม `🔍 Search Tickets` (Focus เข้าช่องค้นหาของ Queue)
    - ปุ่ม `📋 My Queue` (เปิดตั๋วที่ตนเองรับผิดชอบ)

---

## 3. Requester Dashboard UI Specification

### 3.1. Screen Layout & Components
- **Header Greeting Banner:**
  - "Welcome, {Requester Name}!"
  - "Here's the latest on your requests."
- **Metric Cards Grid (4 Cards):**
  - **My Open Tickets:** สรุปตั๋วที่ยังเปิดอยู่ทั้งหมด (New, Open, In Progress, Waiting, Reopened)
  - **In Progress:** สรุปตั๋วที่กำลังดำเนินการ
  - **Resolved:** สรุปตั๋วที่ได้รับการแก้ไขแล้ว
  - **Closed:** สรุปตั๋วที่ปิดเรียบร้อยแล้ว
  - ทุกการ์ดมีปุ่ม "View all" ด้านล่าง นำทางไปยัง `/tickets` พร้อม Filter ที่ตรงกัน
- **Main Content Area:**
  - **My Recent Tickets:** รายการตั๋วของตนเองที่อัปเดตล่าสุด แสดง Ticket Number, หัวข้อปัญหา, สถานะ, และเวลา
  - **Quick Actions:** ปุ่ม `+ Create Ticket` และ `📁 View My Tickets`

---

## 4. Actions Taken on Ticket Detail UI

### 4.1. IT Staff Ticket Detail Screen
เพิ่มส่วน **"Actions Taken"** ใต้ข้อมูลตั๋วและเหนือส่วน Comments/Notes:
- **Header Section:**
  - หัวข้อ "Actions Taken" พร้อมตัวเลขจำนวนรายการ เช่น `Actions Taken (2)`
  - ปุ่ม **`+ Add Action Taken`** โทน Zen Green (`--color-primary`)
- **Actions Taken List / Table:**
  - ตารางแสดงคอลัมน์:
    1. **Date / Time:** รูปแบบอ่านง่าย เช่น `Oct 27, 2026 09:30 AM`
    2. **Action Description:** รายละเอียดงานที่ทำ
    3. **Result:** ผลลัพธ์ที่ได้
    4. **Performed By:** ชิปแสดงชื่อเจ้าหน้าที่ผู้ลงมือทำ
    5. **Follow-Up:** สัญลักษณ์หรือ Badge แสดงสถานะ (หากมี จะแสดง Follow-up Note ต่อท้าย)
    6. **Attachment Notes:** ข้อความช่วยจำระบุไฟล์แนบ (ถ้ามี)
    7. **Action Menu:** ปุ่ม Edit (ไอคอนดินสอ) สำหรับเปิดแก้ไขข้อมูล
- **Add / Edit Action Modal (Dialog):**
  - **Action Date/Time:** Input แบบ datetime-local (Default เป็นเวลาปัจจุบัน)
  - **Action Description:** Textarea บังคับกรอก (Validation ข้อความว่างเปล่า)
  - **Result:** Textarea บังคับกรอก
  - **Performed By (auto):** Input disabled แสดงชื่อผู้ใช้งานปัจจุบันเพื่อความโปร่งใส
  - **Follow-Up Required?**: Checkbox สลับเปิด/ปิด
  - **Follow-up Note:** Textarea ปรากฏขึ้นอัตโนมัติเมื่อติ๊ก Checkbox (บังคับกรอก)
  - **Attachment Notes:** Input text สำหรับโน้ตชื่อไฟล์ที่เกี่ยวข้อง
  - ปุ่ม Action: "Cancel" และ "Save Action"

### 4.2. Requester Ticket Detail Screen
- เพิ่มแท็บหรือส่วน "Actions Taken" แบบ **Read-Only**
- แสดงตารางหรือการ์ดประวัติการปฏิบัติงาน เพื่อให้ผู้แจ้งตั๋วสามารถรับทราบความคืบหน้าอย่างละเอียด
- ซ่อนปุ่ม Add/Edit โดยสิ้นเชิง เพื่อป้องกันความสับสน

---

## 5. Ticket Workflow & Resolution Feedback UI

- **Status Transition Controls:**
  - เมนูดรอปดาวน์เปลี่ยนสถานะ จะแสดงเฉพาะสถานะที่อนุญาตให้เปลี่ยนตาม Permitted Status Transition Matrix
- **Resolution Gate Interception & Feedback:**
  - หากเจ้าหน้าที่เลือกสถานะเป็น **"Resolved"** บนตั๋วที่ยังไม่มี Actions Taken เลย:
    - Frontend แสดง Banner หรือ Alert Modal แจ้งเตือน:
      > ⚠️ **Cannot Resolve Ticket:** You must record at least one Action Taken describing the solution before marking this ticket as Resolved.
    - มีปุ่มทางลัด **"+ Add Action Taken Now"** เพื่อนำผู้ใช้เข้าสู่แบบฟอร์มบันทึกการทำงานทันที
  - เมื่อบันทึก Action Taken แล้ว การเปลี่ยนสถานะเป็น Resolved จะทำได้สำเร็จ และหน้าจอจะ Refresh สถานะเป็น Badge สีเขียว "Resolved" ทันที

---

## 6. Accessibility & Polish Checklist (A11y)

- [x] **Keyboard Navigation:** สามารถใช้ปุ่ม `Tab` เพื่อ Focus การ์ด Metric, รายการตั๋ว, และปุ่มกดได้อย่างราบรื่น
- [x] **Focus Ring:** ทุก Interactive Elements มี Focus Ring เด่นชัด (`--color-border-focus: #006B3C` หนา 2px)
- [x] **Non-Color Status Cues:** สถานะตั๋วและ Action Taken ทุกตัวมีข้อความกำกับ (Text Label) ควบคู่กับสีเสมอ
- [x] **Screen Reader Support:** เพิ่ม `aria-label` ให้กับปุ่มไอคอน เช่น ปุ่ม Edit Action, ปุ่ม Refresh Dashboard
- [x] **No Horizontal Scroll / Clipping:** ตารางบนหน้าจอ Mobile จะปรับเป็นการ์ดแบบ Stack เพื่อไม่ให้เกิดแถบเลื่อนแนวนอนหรือข้อความตกขอบ
- [x] **Form Protection:** แบบฟอร์มบันทึก Action Taken มีการเก็บ state และแจ้งเตือน Field-level validation ก่อนส่งข้อมูล
