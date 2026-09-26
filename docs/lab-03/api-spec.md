# Lab 3 REST API Specification

## 1. General Conventions

### Authentication
- **Mechanism:** JWT stored in an httpOnly, SameSite=Strict cookie named `token`
- **Token Payload:** `{ userId, email, role, mustChangePassword }`
- **Token Expiry:** 24 hours
- **Password Hashing:** bcrypt with cost factor 10

### Standard Error Response Shape
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable safe message",
    "fields": {
      "fieldName": "Field-specific error message"
    }
  }
}
```

### HTTP Status Codes
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error / Bad request |
| 401 | Unauthenticated (no valid session) |
| 403 | Forbidden (authenticated but unauthorized) |
| 404 | Not found (or resource belongs to another user — no info leak) |
| 409 | Conflict (e.g., duplicate email) |
| 500 | Internal server error |

### Authorization Middleware
All protected endpoints pass through:
1. **Authentication middleware:** Validates JWT cookie → 401 if invalid/missing
2. **Password-change guard:** If `mustChangePassword === true`, only `/api/auth/change-password` and `/api/auth/logout` are permitted → 403 for all other endpoints
3. **Role authorization middleware:** Checks user role against endpoint permission → 403 if unauthorized

---

## 2. Authentication Endpoints

### POST `/api/auth/login`
**Auth Required:** None

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd1"
}
```

**Validation:**
- `email`: required, valid email format
- `password`: required, non-empty

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "REQUESTER",
    "mustChangePassword": false
  }
}
```
- Sets `token` httpOnly cookie

**Error Responses:**
| Status | Condition | Body |
|---|---|---|
| 400 | Missing/invalid fields | `{ error: { code: "VALIDATION_ERROR", fields: {...} } }` |
| 401 | Invalid credentials | `{ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } }` |
| 403 | Account inactive | `{ error: { code: "ACCOUNT_INACTIVE", message: "Your account is inactive. Please contact an administrator." } }` |

---

### POST `/api/auth/logout`
**Auth Required:** Authenticated

**Request Body:** None

**Success Response (200):**
```json
{ "message": "Logged out successfully" }
```
- Clears `token` cookie

---

### GET `/api/auth/me`
**Auth Required:** Authenticated

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "REQUESTER",
    "mustChangePassword": false
  }
}
```

**Error:** 401 if not authenticated

---

### POST `/api/auth/change-password`
**Auth Required:** Authenticated (specifically for users with `mustChangePassword = true`)

**Request Body:**
```json
{
  "newPassword": "NewP@ssw0rd1",
  "confirmPassword": "NewP@ssw0rd1"
}
```

**Validation:**
- `newPassword`: required, min 8 chars, 1 uppercase, 1 lowercase, 1 number
- `confirmPassword`: required, must match `newPassword`

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "REQUESTER",
    "mustChangePassword": false
  }
}
```
- Updates password hash, sets `mustChangePassword = false`

**Error Responses:**
| Status | Condition |
|---|---|
| 400 | Validation errors (weak password, mismatch) |
| 401 | Not authenticated |

---

## 3. Requester Ticket Endpoints (Lab 2 Continuation)

All endpoints now use the authenticated user identity from the JWT instead of `X-Requester-Id` header.

### POST `/api/tickets`
**Auth Required:** Requester

**Request Body:** Same as Lab 2 (without `requesterId` — derived from session)

**Behavior:**
- `requesterId` is set from `req.user.id`
- `itPriority` defaults to same value as `requestedPriority`
- Status defaults to `NEW`

---

### GET `/api/tickets`
**Auth Required:** Requester

**Query Parameters:** Same as Lab 2 (`search`, `status`, `category`, `priority`, `sort`, `page`, `pageSize`)

**Behavior:** Returns only tickets owned by the authenticated Requester

---

### GET `/api/tickets/:id`
**Auth Required:** Requester

**Behavior:** Returns 404 (not 403) if the ticket belongs to another Requester (no info leak)

---

### Attachment Endpoints
Same as Lab 2 but using authenticated identity. Ownership checks use `req.user.id`.

---

### PATCH `/api/tickets/:id/requester-resolved`
**Auth Required:** Requester (owner only)

**Request Body:** None (or empty)

**Behavior:**
- Sets `requesterIndicatedResolved = true` on the Ticket
- Does NOT change the Ticket status
- Only permitted when status is `IN_PROGRESS` or `WAITING_FOR_REQUESTER`

**Success Response (200):**
```json
{
  "ticket": {
    "id": 1,
    "requesterIndicatedResolved": true,
    "status": "IN_PROGRESS"
  }
}
```

**Errors:**
| Status | Condition |
|---|---|
| 400 | Status does not permit this action |
| 404 | Ticket not found or not owned by Requester |

---

## 4. Public Comments Endpoints

### POST `/api/tickets/:id/comments`
**Auth Required:** Requester (own ticket) or IT Staff

**Request Body:**
```json
{
  "content": "Comment text here"
}
```

**Validation:**
- `content`: required, non-empty after trim, max 2000 characters

**Success Response (201):**
```json
{
  "comment": {
    "id": 1,
    "ticketId": 1,
    "authorId": 1,
    "authorName": "John Doe",
    "authorRole": "REQUESTER",
    "content": "Comment text here",
    "createdAt": "2026-09-13T12:00:00Z"
  }
}
```

**Errors:**
| Status | Condition |
|---|---|
| 400 | Empty or too long content |
| 404 | Ticket not found (Requester: not own ticket) |

---

### GET `/api/tickets/:id/comments`
**Auth Required:** Requester (own ticket) or IT Staff or Administrator

**Success Response (200):**
```json
{
  "comments": [
    {
      "id": 1,
      "ticketId": 1,
      "authorId": 1,
      "authorName": "John Doe",
      "authorRole": "REQUESTER",
      "content": "Comment text",
      "createdAt": "2026-09-13T12:00:00Z"
    }
  ]
}
```

---

## 5. IT Staff Endpoints

### GET `/api/staff/tickets`
**Auth Required:** IT Staff

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `search` | string | Searches `ticketNumber` and `summary` (case-insensitive partial match) |
| `status` | string | Filter by status (single value or comma-separated) |
| `itPriority` | string | Filter by IT Priority |
| `ownerId` | string | Filter by owner (`unassigned` for null, user id for specific) |
| `sort` | string | Sort field and direction (e.g., `createdAt_desc`, `itPriority_asc`) |
| `page` | number | Page number (1-based, default: 1) |
| `pageSize` | number | Items per page (default: 10, allowed: 10, 25, 50) |

**Success Response (200):**
```json
{
  "tickets": [
    {
      "id": 1,
      "ticketNumber": "TKT-20260913-0001",
      "createdAt": "2026-09-13T10:00:00Z",
      "updatedAt": "2026-09-13T12:00:00Z",
      "summary": "Printer not working",
      "category": { "id": 1, "name": "Hardware" },
      "requestedPriority": "HIGH",
      "itPriority": "CRITICAL",
      "status": "IN_PROGRESS",
      "owner": { "id": 2, "name": "IT Staff A" },
      "requester": { "id": 1, "name": "Jane Requester" }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalCount": 42,
    "totalPages": 5
  }
}
```

**Invalid Query Params:** Ignored or use defaults; invalid `pageSize` falls back to 10.

---

### GET `/api/staff/tickets/:id`
**Auth Required:** IT Staff

**Success Response (200):**
```json
{
  "ticket": {
    "id": 1,
    "ticketNumber": "TKT-20260913-0001",
    "createdAt": "2026-09-13T10:00:00Z",
    "updatedAt": "2026-09-13T12:00:00Z",
    "summary": "Printer not working",
    "description": "The printer on floor 3 is not responding...",
    "category": { "id": 1, "name": "Hardware" },
    "relatedSystem": { "id": 1, "name": "Printer System" },
    "requestedPriority": "HIGH",
    "itPriority": "CRITICAL",
    "status": "IN_PROGRESS",
    "owner": { "id": 2, "name": "IT Staff A" },
    "requester": { "id": 1, "name": "Jane Requester" },
    "requesterIndicatedResolved": false,
    "attachments": [...],
    "permittedStatuses": ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"]
  }
}
```

---

### PATCH `/api/staff/tickets/:id/owner`
**Auth Required:** IT Staff

**Request Body:**
```json
{
  "ownerId": 2
}
```
- Set `ownerId` to a valid active IT Staff or Administrator user ID
- Set `ownerId` to `null` to unassign
- Omit `ownerId` or send `"self"` to claim (self-assign)

**Success Response (200):**
```json
{
  "ticket": {
    "id": 1,
    "owner": { "id": 2, "name": "IT Staff A" }
  }
}
```

**Errors:**
| Status | Condition |
|---|---|
| 400 | Target user is not IT Staff/Admin or is inactive |
| 404 | Ticket not found |

---

### PATCH `/api/staff/tickets/:id/priority`
**Auth Required:** IT Staff

**Request Body:**
```json
{
  "itPriority": "CRITICAL"
}
```

**Validation:** `itPriority` must be one of: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

**Success Response (200):**
```json
{
  "ticket": {
    "id": 1,
    "itPriority": "CRITICAL",
    "requestedPriority": "HIGH"
  }
}
```

---

### PATCH `/api/staff/tickets/:id/status`
**Auth Required:** IT Staff

**Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Validation:** The transition from current status to requested status must be permitted per the transition matrix.

**Success Response (200):**
```json
{
  "ticket": {
    "id": 1,
    "status": "IN_PROGRESS",
    "permittedStatuses": ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"]
  }
}
```

**Errors:**
| Status | Condition |
|---|---|
| 400 | Invalid transition (e.g., NEW → RESOLVED) with message: "Cannot transition from {current} to {requested}" |
| 404 | Ticket not found |

---

### POST `/api/staff/tickets/:id/notes`
**Auth Required:** IT Staff

**Request Body:**
```json
{
  "content": "Internal note text"
}
```

**Validation:** Same as Public Comments (non-empty, max 2000 chars)

**Success Response (201):**
```json
{
  "note": {
    "id": 1,
    "ticketId": 1,
    "authorId": 2,
    "authorName": "IT Staff A",
    "content": "Internal note text",
    "createdAt": "2026-09-13T12:00:00Z"
  }
}
```

---

### GET `/api/staff/tickets/:id/notes`
**Auth Required:** IT Staff or Administrator

**Success Response (200):**
```json
{
  "notes": [
    {
      "id": 1,
      "ticketId": 1,
      "authorId": 2,
      "authorName": "IT Staff A",
      "content": "Internal note text",
      "createdAt": "2026-09-13T12:00:00Z"
    }
  ]
}
```

---

## 6. Administrator Endpoints

### GET `/api/admin/users`
**Auth Required:** Administrator

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `search` | string | Search by name or email (case-insensitive partial match) |
| `role` | string | Filter by role (REQUESTER, IT_STAFF, ADMINISTRATOR) |

**Success Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "REQUESTER",
      "isActive": true,
      "createdAt": "2026-09-01T00:00:00Z"
    }
  ]
}
```

---

### POST `/api/admin/users`
**Auth Required:** Administrator

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "IT_STAFF",
  "password": "InitialP@ss1",
  "isActive": true
}
```

**Validation:**
- `name`: required, non-empty, max 200 chars
- `email`: required, valid email format, unique
- `role`: required, one of `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`
- `password`: required, min 8 chars, 1 uppercase, 1 lowercase, 1 number
- `isActive`: optional, default `true`

**Success Response (201):**
```json
{
  "user": {
    "id": 5,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "IT_STAFF",
    "isActive": true,
    "mustChangePassword": true,
    "createdAt": "2026-09-13T12:00:00Z"
  }
}
```
- Password is hashed; `mustChangePassword = true` is set automatically.

**Errors:**
| Status | Condition |
|---|---|
| 400 | Validation errors |
| 409 | Duplicate email: `{ error: { code: "DUPLICATE_EMAIL", message: "This email address is already in use" } }` |

---

### PATCH `/api/admin/users/:id`
**Auth Required:** Administrator

**Request Body (partial update):**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "ADMINISTRATOR",
  "isActive": false
}
```

**Business Rule Checks:**
- Cannot deactivate own account → 403
- Cannot deactivate/change-role of the last active Administrator → 409
- Email must remain unique → 409

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "ADMINISTRATOR",
    "isActive": false
  }
}
```

**Errors:**
| Status | Condition |
|---|---|
| 400 | Validation errors |
| 403 | Self-deactivation attempt |
| 404 | User not found |
| 409 | Duplicate email OR last active Administrator protection |

---

### POST `/api/admin/users/:id/reset-password`
**Auth Required:** Administrator

**Request Body:**
```json
{
  "password": "NewInitial@1",
  "confirmPassword": "NewInitial@1"
}
```

**Behavior:**
- Hashes new password, sets `mustChangePassword = true`

**Success Response (200):**
```json
{
  "message": "Password reset successfully. The user must change their password at next login."
}
```

**Errors:**
| Status | Condition |
|---|---|
| 400 | Validation errors (weak password, mismatch) |
| 404 | User not found |
