# Lab 4 REST API Specification

## 1. Overview & Base Configuration

- **Base URL:** `http://localhost:3000`
- **Content-Type:** `application/json`
- **Authentication:** Cookie-based Session via `jwt_token` (HTTP-only, Secure in prod, SameSite=Lax/Strict)
- **Timezone Standard:** ISO 8601 UTC string (e.g., `2026-10-27T14:30:00.000Z`)

---

## 2. API Endpoints Summary

### Actions Taken Endpoints (New)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/tickets/:id/actions-taken` | Requester (own), IT Staff, Admin | Get all Actions Taken for a Ticket |
| `POST` | `/api/tickets/:id/actions-taken` | IT Staff, Admin | Create a new Action Taken under a Ticket |
| `PATCH` | `/api/tickets/:id/actions-taken/:actionId` | IT Staff, Admin | Update an existing Action Taken |

### Ticket Workflow & Resolution Gate (Updated)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `PATCH` | `/api/staff/tickets/:id/status` | IT Staff, Admin | Update Ticket status (enforces Transition Matrix, Resolution Gate, and Concurrency) |
| `PATCH` | `/api/tickets/:id/requester-resolved` | Requester (own) | Requester advisory indication that problem appears resolved |

### Dashboard Endpoints (New)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/dashboards/requester` | Requester | Get metrics and recent tickets for authenticated Requester |
| `GET` | `/api/dashboards/staff` | IT Staff, Admin | Get queue operational metrics and recent tickets for IT Staff |

---

## 3. Detailed Endpoint Specifications

### 3.1. `GET /api/tickets/:id/actions-taken`
ดึงรายการประวัติการปฏิบัติงาน (Actions Taken) ทั้งหมดของตั๋วใบนั้น เรียงตามเวลา `actionDateTime` จากเก่าไปใหม่

- **Authorization:** Authenticated User
  - Requester: เข้าถึงได้เฉพาะตั๋วที่ตนเองเป็นเจ้าของ (`requesterId = user.id`)
  - IT Staff & Administrator: เข้าถึงได้ทุกตั๋ว
- **URL Parameters:**
  - `id` (integer, required): ID ของ Ticket
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ticketId": 10,
      "actionDateTime": "2026-10-27T08:30:00.000Z",
      "actionDescription": "Checked the Wi-Fi access point in Room 301. Rebooted switch and updated firmware.",
      "result": "Access point is back online and transmitting SSID.",
      "performedBy": {
        "id": 2,
        "name": "Jane Technician",
        "email": "jane@toktickit.local",
        "role": "IT_STAFF"
      },
      "followUpRequired": true,
      "followUpNote": "Monitor signal strength tomorrow morning during peak hours.",
      "attachmentNotes": "wifi-signal-scan-room301.png",
      "createdAt": "2026-10-27T08:35:00.000Z",
      "updatedAt": "2026-10-27T08:35:00.000Z"
    }
  ]
}
```
- **Error Responses:**
  - `401 Unauthorized`: ไม่ได้เข้าสู่ระบบ
  - `403 Forbidden`: Requester พยายามเข้าถึงตั๋วของผู้อื่น
  - `404 Not Found`: ไม่พบตั๋วตาม ID ที่ระบุ

---

### 3.2. `POST /api/tickets/:id/actions-taken`
บันทึกการปฏิบัติงานใหม่ภายใต้ Ticket

- **Authorization:** IT Staff, Administrator เท่านั้น (Requester ได้ 403 Forbidden)
- **URL Parameters:**
  - `id` (integer, required): ID ของ Ticket
- **Request Body:**
```json
{
  "actionDateTime": "2026-10-27T09:00:00.000Z", // optional, defaults to now()
  "actionDescription": "Replaced the faulty DDR5 RAM stick with a new 16GB module.",
  "result": "System passed MemTest86 with 0 errors.",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "invoice-ram-16gb.pdf"
}
```
- **Validation Rules:**
  - `actionDescription`: String, non-empty, max 2000 chars.
  - `result`: String, non-empty, max 2000 chars.
  - `performedById`: ระบบบันทึกอัตโนมัติจาก `req.user.id` (ห้าม client ส่งมาเอง).
  - หาก `followUpRequired = true`: `followUpNote` ต้องเป็น string ไม่ว่างเปล่า (max 2000 chars).
  - `attachmentNotes`: Optional string, max 1000 chars.
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Action Taken recorded successfully",
  "data": {
    "id": 2,
    "ticketId": 10,
    "actionDateTime": "2026-10-27T09:00:00.000Z",
    "actionDescription": "Replaced the faulty DDR5 RAM stick with a new 16GB module.",
    "result": "System passed MemTest86 with 0 errors.",
    "performedBy": {
      "id": 2,
      "name": "Jane Technician",
      "role": "IT_STAFF"
    },
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "invoice-ram-16gb.pdf",
    "createdAt": "2026-10-27T09:05:00.000Z",
    "updatedAt": "2026-10-27T09:05:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: ข้อมูลไม่ครบถ้วน หรือ `followUpRequired=true` แต่ไม่มี `followUpNote`
  - `401 Unauthorized`: ไม่ได้เข้าสู่ระบบ
  - `403 Forbidden`: Requester พยายามสร้าง Action Taken
  - `404 Not Found`: ไม่พบ Ticket

---

### 3.3. `PATCH /api/tickets/:id/actions-taken/:actionId`
แก้ไขรายละเอียดของ Action Taken ที่บันทึกไปแล้ว

- **Authorization:** IT Staff, Administrator เท่านั้น
- **URL Parameters:**
  - `id` (integer, required): ID ของ Ticket
  - `actionId` (integer, required): ID ของ Action Taken
- **Request Body:**
```json
{
  "actionDescription": "Updated: Replaced faulty DDR5 RAM and tested memory slots.",
  "result": "System booted smoothly and passed full diagnostic.",
  "followUpRequired": true,
  "followUpNote": "Check customer machine after 24 hours of usage.",
  "attachmentNotes": "diagnostic-report.pdf"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Action Taken updated successfully",
  "data": {
    "id": 2,
    "ticketId": 10,
    "actionDescription": "Updated: Replaced faulty DDR5 RAM and tested memory slots.",
    "result": "System booted smoothly and passed full diagnostic.",
    "followUpRequired": true,
    "followUpNote": "Check customer machine after 24 hours of usage.",
    "attachmentNotes": "diagnostic-report.pdf",
    "updatedAt": "2026-10-27T09:30:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: ข้อมูล validation ไม่ผ่าน (เช่น `followUpNote` ว่างขณะ `followUpRequired=true`)
  - `403 Forbidden`: ไม่มีสิทธิ์แก้ไข
  - `404 Not Found`: ไม่พบ Action Taken หรือ Ticket

---

### 3.4. `PATCH /api/staff/tickets/:id/status` (Updated with Resolution Gate & Concurrency)
อัปเดตสถานะของ Ticket ตาม Status Transition Matrix พร้อมตรวจสอบ Resolution Gate และ Optimistic Concurrency Control

- **Authorization:** IT Staff, Administrator
- **Request Body:**
```json
{
  "status": "RESOLVED",
  "lastUpdatedAt": "2026-10-27T08:00:00.000Z" // Concurrency Token (ISO String หรือ Version)
}
```
- **Business Rules Enforcement:**
  1. **Status Transition Matrix:** สถานะปลายทางต้องได้รับอนุญาตจากสถานะปัจจุบันตามตาราง BR-11
  2. **Resolution Gate (BR-08):** หาก `status == "RESOLVED"` ระบบจะตรวจสอบว่ามีรายการ `ActionTaken` อย่างน้อย 1 รายการภายใต้ตั๋วหรือไม่ หากไม่มี จะปฏิเสธทันทีด้วยรหัส **`422 Unprocessable Entity`**
  3. **Optimistic Concurrency (BR-11):** หากมีการส่ง `lastUpdatedAt` มา แล้วไม่ตรงกับ `ticket.updatedAt` ในฐานข้อมูล ระบบจะส่ง **`409 Conflict`**
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Ticket status updated to RESOLVED",
  "data": {
    "id": 10,
    "ticketNumber": "TICK-2026-00010",
    "status": "RESOLVED",
    "updatedAt": "2026-10-27T09:40:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: สถานะไม่ถูกต้อง หรือผิด transition matrix
  - `409 Conflict`: ตั๋วถูกอัปเดตโดยผู้ใช้อื่นไปแล้ว (Stale Update)
  - `422 Unprocessable Entity`: การปิดงานถูกปฏิเสธเนื่องจากไม่มี Action Taken บันทึกไว้
  - `403 Forbidden`: บทบาท Requester ไม่สามารถเปลี่ยนสถานะได้

---

### 3.5. `GET /api/dashboards/requester`
ดึงข้อมูลสถิติและตั๋วล่าสุดสำหรับ Requester ที่กำลังล็อกอิน

- **Authorization:** Requester เท่านั้น
- **Query Parameters:** ไม่มี (คำนวณจาก `req.user.id`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "myOpenTickets": 3,
      "inProgress": 1,
      "resolved": 4,
      "closed": 12
    },
    "recentTickets": [
      {
        "id": 10,
        "ticketNumber": "TICK-2026-00010",
        "summary": "Laptop battery drains quickly",
        "status": "IN_PROGRESS",
        "requestedPriority": "HIGH",
        "updatedAt": "2026-10-27T09:14:00.000Z"
      }
    ],
    "drillDownLinks": {
      "myOpenTickets": "/tickets?status=open-group",
      "inProgress": "/tickets?status=IN_PROGRESS",
      "resolved": "/tickets?status=RESOLVED",
      "closed": "/tickets?status=CLOSED"
    }
  }
}
```

---

### 3.6. `GET /api/dashboards/staff`
ดึงข้อมูลสถิติการปฏิบัติงานศูนย์บริการ IT สำหรับ IT Staff และ Administrator

- **Authorization:** IT Staff, Administrator
- **Query Parameters:** ไม่มี
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "new": 14,
      "open": 23,
      "inProgress": 18,
      "waitingForRequester": 7,
      "myAssigned": 16
    },
    "recentTickets": [
      {
        "id": 34,
        "ticketNumber": "TICK-2026-00034",
        "summary": "Network switch failure floor 3",
        "status": "IN_PROGRESS",
        "itPriority": "CRITICAL",
        "ownerName": "Jane Technician",
        "updatedAt": "2026-10-27T09:16:00.000Z"
      }
    ],
    "drillDownLinks": {
      "new": "/staff/tickets?status=NEW",
      "open": "/staff/tickets?status=OPEN",
      "inProgress": "/staff/tickets?status=IN_PROGRESS",
      "waitingForRequester": "/staff/tickets?status=WAITING_FOR_REQUESTER",
      "myAssigned": "/staff/tickets?owner=me"
    }
  }
}
```

---

## 4. Error Response Format Standard

ทุก API ใน TokTickIT จะส่ง Response Error ในรูปแบบมาตรฐานดังนี้:

```json
{
  "success": false,
  "error": {
    "code": "RESOLUTION_GATE_FAILED",
    "message": "Cannot resolve ticket without at least one Action Taken recorded.",
    "details": null
  }
}
```

### ตารางรหัสสถานะ HTTP ที่ใช้ใน Lab 4:
| HTTP Status | ความหมายในบริบทระบบ |
|---|---|
| `200 OK` | ดำเนินการสำเร็จ ส่งข้อมูลกลับ |
| `201 Created` | สร้าง Action Taken สำเร็จ |
| `400 Bad Request` | ข้อมูล input ไม่ถูกต้อง เช่น ขาด field บังคับ |
| `401 Unauthorized` | ผู้ใช้ยังไม่ได้เข้าสู่ระบบ หรือ Session หมดอายุ |
| `403 Forbidden` | ผู้ใช้ไม่มีสิทธิ์ใน endpoint นั้น เช่น Requester สร้าง Action Taken |
| `404 Not Found` | ไม่พบ Ticket หรือ Action Taken |
| `409 Conflict` | มีการแก้ไขข้อมูลชนกัน (Stale Concurrency Update) |
| `422 Unprocessable Entity` | ละเมิด Business Rule (เช่น Resolution Gate ขาด Action Taken) |
| `500 Internal Error` | ข้อผิดพลาดที่ไม่คาดคิดฝั่ง Server (Safe failure ไม่ leak stack trace) |
