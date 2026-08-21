# Lab 2 API Specification — TokTickIT

> All endpoints prefixed with `/api`. JSON bodies unless noted (multipart for file upload).

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
| PATCH | `/api/attachments/:id/remove` | Soft-remove an Attachment |

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Successful retrieval or update |
| 201 | Resource created |
| 400 | Invalid input |
| 403 | Wrong Requester (ownership check failed) |
| 404 | Resource not found |
| 409 | Business-rule conflict |
| 410 | Resource removed / no longer accessible |
| 500 | Unexpected server error |

---

> TODO: Fill in request/response shapes, validation rules, and error cases for each endpoint as implementation begins.
