# Lab 2 UI Specification — TokTickIT Zen Green Theme

---

## 1. Color Tokens

| CSS Variable | Hex | Usage |
|---|---|---|
| `--color-primary` | `#006B3C` | Header, primary buttons, strong emphasis |
| `--color-secondary` | `#0B7A46` | Active tabs, links, hover states |
| `--color-pale` | `#EAF6EF` | Selected, success, subtle sections |
| `--color-bg` | `#F5F7F6` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, form surfaces |
| `--color-error` | `#B91C1C` | Error text and border |
| `--color-warning` | `#D97706` | Warning badges |
| `--color-readonly-bg` | `#F0F4F2` | Read-only field background |

---

## 2. Responsive Breakpoints

| Viewport | Behavior |
|---|---|
| Desktop ≥ 992 px | Multi-column layout, max-width 1200 px centered |
| Tablet 768–991 px | Two-column where practical |
| Mobile < 768 px | Single column stacked, no horizontal scroll |

---

## 3. Screens

### Requester Selection Screen

**Route:** `/login`

**Layout:** Card กึ่งกลางหน้า (max-width 800px) บน background `--color-bg`

**Elements:**
- Icon วงกลม Zen Green (UserCog) ด้านบนกึ่งกลาง
- Heading: "Select Development Requester"
- Subtext: บอกว่าเป็น Dev/Testing context ไม่ใช่ Login จริง
- `<select>` dropdown: Active Requesters เท่านั้น (จาก `GET /api/requesters`)
- Info alert (pale green): "Only active development requesters are shown."
- Notice card: "Authentication coming in Lab 3"
- Buttons: **Cancel** (reload page), **Continue** (submit → redirect `/`)

**States:**

| State | UI |
|---|---|
| Loading | Spinner สี success กึ่งกลาง |
| API Error | Alert danger + error message |
| Empty | Alert warning "No active requesters found" |
| Normal | Form + Dropdown + Buttons |

---

### Create Ticket Screen

**Route:** `/create-ticket`

**Layout:** Form Card (max-width 800px), field-level error messages ใต้แต่ละ field

**Fields:**

| Field | Type | Rules |
|---|---|---|
| Category | select | Required |
| Related System | select | Required |
| Requested Priority | select (LOW/MEDIUM/HIGH/CRITICAL) | Required |
| Summary | text input | Required, max 200 chars + counter |
| Description | textarea | Required, max 2000 chars + counter |
| Attachments | file input (multiple) | Optional, JPG/PNG/WEBP/PDF, ≤ 5 MB |

**States:**

| State | UI |
|---|---|
| Default | Form active, Submit enabled |
| Submitting | Submit disabled + spinner |
| Validation Error | Red messages ใต้ field ที่ผิด |
| API Error | Alert บนสุด, ค่า form ยังคงอยู่ |
| Success | Redirect ไป Ticket Detail |

---

### My Tickets Screen

**Route:** `/` (protected)

**Layout:**
- Header: "My Tickets" + ปุ่ม Create Ticket
- Filter Bar: Search + Status + Category + Priority + Sort + Page size
- Desktop ≥ 992 px: Table (Ticket No. / Summary / Status / Priority / Category / Date)
- Mobile < 768 px: Card stack

**Pagination:** "Showing X–Y of Z", Previous/Next, page numbers

**States:**

| State | UI |
|---|---|
| Loading | Spinner |
| Empty | Empty state + "Create your first ticket" |
| No Results | No-results state + "Clear Filters" button |
| Normal | Table / Card list + pagination |

---

### Ticket Detail Screen (View Mode)

**Route:** `/tickets/:id`

**Layout:** Read-only grid (2-col Desktop / 1-col Mobile) + Attachment section

**Fields (read-only):** Ticket Number, Status badge, Priority badge, Category, Related System, Summary, Description, Created At

**Attachment Section:**
- **Active:** ชื่อไฟล์ + ขนาด + Download + Remove button
- **Removed:** ชื่อไฟล์ + "Removed" badge + เหตุผล + วันที่ลบ (ไม่มี Download)
- Upload button (disabled เมื่อ active ≥ 5)
- Remove dialog: textarea reason (max 500 chars) + Confirm / Cancel

**States:**

| State | UI |
|---|---|
| Loading | Spinner |
| Not Found | Error card "Ticket not found" |
| Access Denied | Error card "You do not have permission" |
| Normal | Read-only detail + Attachment list |

---

## 4. Visual Checklist

> Screenshots อยู่ใน `artifacts/lab-02/screenshots/` (สร้างระหว่าง E2E testing)

- [x] No horizontal scroll at any breakpoint
- [x] No label clipping or overlap
- [x] Error messages below correct field
- [x] Read-only fields visually distinct from editable
- [x] Priority and Status badges consistent
- [x] Requester name visible in header
