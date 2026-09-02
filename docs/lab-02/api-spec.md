# Lab 2 API Specification — TokTickIT

> All endpoints prefixed with `/api`. JSON bodies unless noted (multipart for file upload).
> Requester identity is passed via **`X-Requester-Id: <id>`** header on all ownership-checked endpoints.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/requesters` | List active Development Requesters |
| GET | `/api/categories` | List active Categories |
| GET | `/api/related-systems` | List active Related Systems |
| POST | `/api/tickets` | Create a Ticket |
| GET | `/api/tickets` | List owned Tickets (paginated + search/filter/sort) |
| GET | `/api/tickets/:id` | Get one owned Ticket detail |
| POST | `/api/tickets/:id/attachments` | Upload Attachment |
| GET | `/api/tickets/:id/attachments` | List Attachment metadata |
| GET | `/api/attachments/:id/download` | Download active Attachment |
| DELETE | `/api/attachments/:id` | Soft-remove an Attachment |

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Successful retrieval or update |
| 201 | Resource created |
| 400 | Invalid input |
| 401 | Missing requester context (`X-Requester-Id` absent) |
| 403 | Wrong Requester (ownership check failed) |
| 404 | Resource not found |
| 409 | Business-rule conflict |
| 410 | Resource removed / no longer accessible |
| 500 | Unexpected server error |

---

## Endpoint Details

### GET `/api/health`

Health check — ไม่ต้องการ authentication

**Response 200:**
```json
{ "status": "ok", "service": "Tok TickIT API" }
```

---

### GET `/api/requesters`

List active `RequesterUser` records สำหรับ Requester Selection screen

**Response 200:** Array of requesters
```json
[
  { "id": 1, "name": "Alice Smith", "email": "alice@example.com" }
]
```

**Response 500:** `{ "error": "Unable to fetch requesters" }`

---

### GET `/api/categories`

List active `Category` reference data

**Response 200:**
```json
[
  { "id": 1, "name": "Hardware" },
  { "id": 2, "name": "Software" }
]
```

---

### GET `/api/related-systems`

List active `RelatedSystem` reference data

**Response 200:**
```json
[
  { "id": 1, "name": "ERP System" },
  { "id": 2, "name": "HR Portal" }
]
```

---

### POST `/api/tickets`

Create a new Ticket. `ticketNumber` และ `status` ถูก generate โดย backend (ห้าม frontend ส่งมา)

**Request Body (JSON):**
```json
{
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 3,
  "requestedPriority": "HIGH",
  "summary": "Cannot print from HR Portal",
  "description": "When clicking Print button, nothing happens..."
}
```

**Validation Rules:**
| Field | Rules |
|---|---|
| `requesterId` | Required, integer, must exist and be active |
| `categoryId` | Required, integer |
| `relatedSystemId` | Required, integer |
| `requestedPriority` | Required, one of: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `summary` | Required, 1–200 chars (trimmed) |
| `description` | Required, 1–2000 chars (trimmed) |

**Response 201:**
```json
{
  "id": 42,
  "ticketNumber": "TKT-20260901-0001",
  "status": "NEW",
  "requestedPriority": "HIGH",
  "summary": "Cannot print from HR Portal",
  "description": "When clicking Print button, nothing happens...",
  "createdAt": "2026-09-01T10:00:00.000Z",
  "category": { "id": 2, "name": "Software" },
  "relatedSystem": { "id": 3, "name": "HR Portal" },
  "requester": { "id": 1, "name": "Alice Smith" }
}
```

**Response 400:**
```json
{
  "error": "Validation failed",
  "fields": {
    "summary": "summary is required",
    "requestedPriority": "requestedPriority must be LOW, MEDIUM, HIGH, or CRITICAL"
  }
}
```

---

### GET `/api/tickets`

List Tickets ที่ owned โดย Requester ที่ระบุใน `X-Requester-Id`

**Headers:** `X-Requester-Id: <id>` (required)

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `search` | string | — | Case-insensitive partial match บน `ticketNumber` และ `summary` |
| `status` | string | — | Filter by TicketStatus (e.g. `NEW`, `OPEN`) |
| `category` | number | — | Filter by `categoryId` |
| `requestedPriority` | string | — | Filter by Priority (e.g. `HIGH`) |
| `sort` | string | `date_desc` | `date_asc` หรือ `date_desc` |
| `page` | number | `1` | Page number (1-based) |
| `limit` | number | `10` | Items per page (10, 25, 50) |

**Response 200:**
```json
{
  "data": [
    {
      "id": 42,
      "ticketNumber": "TKT-20260901-0001",
      "status": "NEW",
      "requestedPriority": "HIGH",
      "summary": "Cannot print from HR Portal",
      "createdAt": "2026-09-01T10:00:00.000Z",
      "category": { "id": 2, "name": "Software" },
      "relatedSystem": { "id": 3, "name": "HR Portal" },
      "requester": { "id": 1, "name": "Alice Smith" }
    }
  ],
  "meta": {
    "totalCount": 1,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

**Response 401:** `{ "error": "Missing requester context" }`  
**Response 403:** `{ "error": "Cross-requester access forbidden" }`

---

### GET `/api/tickets/:id`

Get Ticket detail (รวม Attachments ทั้ง active และ removed)

**Headers:** `X-Requester-Id: <id>` (required)

**Response 200:**
```json
{
  "id": 42,
  "ticketNumber": "TKT-20260901-0001",
  "status": "NEW",
  "requestedPriority": "HIGH",
  "summary": "Cannot print from HR Portal",
  "description": "When clicking Print button, nothing happens...",
  "createdAt": "2026-09-01T10:00:00.000Z",
  "updatedAt": "2026-09-01T10:00:00.000Z",
  "category": { "id": 2, "name": "Software" },
  "relatedSystem": { "id": 3, "name": "HR Portal" },
  "requester": { "id": 1, "name": "Alice Smith", "email": "alice@example.com" },
  "attachments": [
    {
      "id": 1,
      "originalFilename": "screenshot.png",
      "mimeType": "image/png",
      "size": 204800,
      "isRemoved": false,
      "removedReason": null,
      "removedAt": null,
      "uploadedAt": "2026-09-01T10:05:00.000Z",
      "ticketId": 42
    }
  ]
}
```

**Response 400:** `{ "error": "Invalid ticket id" }`  
**Response 401:** `{ "error": "Missing requester context" }`  
**Response 403:** `{ "error": "You do not have permission to view this ticket" }`  
**Response 404:** `{ "error": "Ticket not found" }`

---

### POST `/api/tickets/:id/attachments`

Upload a file attachment (multipart/form-data)

**Headers:** `X-Requester-Id: <id>` (required)  
**Content-Type:** `multipart/form-data`  
**Form field:** `file` (binary)

**Constraints:**
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Max file size: 5 MB
- Max active attachments per ticket: 5

**Response 201:**
```json
{
  "id": 1,
  "ticketId": 42,
  "originalFilename": "screenshot.png",
  "storedFilename": "c3d4e5f6-uuid.png",
  "mimeType": "image/png",
  "size": 204800,
  "isRemoved": false,
  "removedReason": null,
  "removedAt": null,
  "uploadedAt": "2026-09-01T10:05:00.000Z"
}
```

**Response 400 (no file):** `{ "error": "No file provided" }`  
**Response 400 (size exceeded):** `{ "error": "File exceeds the 5 MB limit" }`  
**Response 400 (wrong type):** `{ "error": "File type not allowed. Accepted: JPG, PNG, WEBP, PDF" }`  
**Response 400 (limit reached):** `{ "error": "Ticket already has 5 active attachments" }`  
**Response 401:** `{ "error": "Missing requester context" }`  
**Response 403:** `{ "error": "You do not have permission to upload to this ticket" }`  
**Response 404:** `{ "error": "Ticket not found" }`

---

### GET `/api/tickets/:id/attachments`

List all Attachment metadata สำหรับ Ticket (ทั้ง active และ removed)

**Headers:** `X-Requester-Id: <id>` (required)

**Response 200:** Array ของ Attachment objects (เหมือน shape ใน Ticket Detail)

**Response 401:** `{ "error": "Missing requester context" }`  
**Response 403:** `{ "error": "You do not have permission to view these attachments" }`  
**Response 404:** `{ "error": "Ticket not found" }`

---

### GET `/api/attachments/:id/download`

Download ไฟล์ Attachment ที่ยังไม่ถูก removed

**Headers:** `X-Requester-Id: <id>` (required)

**Response 200:** Binary file พร้อม headers:
- `Content-Disposition: attachment; filename="<originalFilename>"`
- `Content-Type: <mimeType>`

**Response 403 (removed):** `{ "error": "This attachment has been removed and cannot be downloaded" }`  
**Response 403 (wrong owner):** `{ "error": "You do not have permission to download this attachment" }`  
**Response 404:** `{ "error": "Attachment not found" }` หรือ `{ "error": "File not found on server" }`

---

### DELETE `/api/attachments/:id`

Soft-remove an Attachment (ตั้งค่า `isRemoved = true`, บันทึก reason และ timestamp)

**Headers:** `X-Requester-Id: <id>` (required)

**Request Body (JSON):**
```json
{ "reason": "Uploaded wrong file" }
```

**Validation:**
- `reason`: Required, non-empty string, max 500 chars

**Response 200:** Updated Attachment object
```json
{
  "id": 1,
  "isRemoved": true,
  "removedReason": "Uploaded wrong file",
  "removedAt": "2026-09-01T11:00:00.000Z",
  ...
}
```

**Response 400 (no reason):** `{ "error": "A removal reason is required" }`  
**Response 400 (already removed):** `{ "error": "Attachment is already removed" }`  
**Response 401:** `{ "error": "Missing requester context" }`  
**Response 403:** `{ "error": "You do not have permission to remove this attachment" }`  
**Response 404:** `{ "error": "Attachment not found" }`
