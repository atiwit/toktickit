# Lab 3 UI Specification

## 1. Design System Continuation

Lab 3 ใช้ **Zen Green Theme** ต่อเนื่องจาก Lab 2 โดย CSS Variables, form conventions, cards, badges, buttons, validation placement, responsive rules, และ accessibility expectations ทั้งหมดยังคงใช้งานได้เหมือนเดิม

### CSS Variables (unchanged)
```css
--color-primary: #006B3C;
--color-secondary: #0B7A46;
--color-bg: #F5F7F6;
--color-surface: #FFFFFF;
--color-text: #1A1A1A;
--color-text-muted: #6B7280;
--color-border: #D1D5DB;
--color-danger: #DC2626;
--color-success: #16A34A;
--color-warning: #F59E0B;
```

### New Badge Tokens for Lab 3
```css
/* Ticket Status Badges */
--status-new: #3B82F6;          /* Blue */
--status-open: #F59E0B;          /* Amber */
--status-in-progress: #8B5CF6;   /* Purple */
--status-waiting: #F97316;       /* Orange */
--status-resolved: #16A34A;      /* Green */
--status-closed: #6B7280;        /* Gray */
--status-reopened: #EF4444;      /* Red */
--status-cancelled: #9CA3AF;     /* Light Gray */

/* Role Badges */
--role-requester: #3B82F6;
--role-it-staff: #8B5CF6;
--role-administrator: #DC2626;

/* IT Priority Badges — same palette as Requested Priority */
```

### Responsive Breakpoints (unchanged)
- **Desktop:** ≥ 992px
- **Tablet:** 768–991px
- **Mobile:** < 768px

---

## 2. Screen Specifications

### 2.1. Login Screen

**Layout:** Centered card on `--color-bg` background, max-width 480px

**Elements:**
- Application logo/name ("TokTickIT")
- Email input field (type="email", required)
- Password input field (type="password", required)
- Login button (primary, full-width)
- Field-level validation messages below each field

**States:**
| State | Behavior |
|---|---|
| Default | Empty form, Login button enabled |
| Validating | Field-level errors shown below each invalid field (e.g., "Email is required", "Password is required") |
| Submitting | Login button disabled + spinner text "Logging in…" |
| Success | Redirect to role-appropriate home screen (or Change Password if mustChangePassword) |
| Invalid Credentials | Safe generic error: "Invalid email or password" — no indication of which field is wrong |
| Inactive Account | Safe message: "Your account is inactive. Please contact an administrator." |
| API Failure | Generic error banner: "Unable to connect. Please try again later." |

**Responsive:**
- All breakpoints: single column, card auto-adjusts width with padding

---

### 2.2. Mandatory Change Password Screen

**Layout:** Centered card on `--color-bg` background, max-width 480px

**Elements:**
- Header: "Change Your Password"
- Informational text: "You must change your password before continuing."
- New Password input (type="password", required)
- Confirm Password input (type="password", required)
- Password rules hint text (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
- Save button (primary, full-width)

**States:**
| State | Behavior |
|---|---|
| Default | Empty form |
| Validating | Field-level errors (too short, missing requirements, mismatch) |
| Submitting | Save button disabled + spinner |
| Success | Redirect to role-appropriate home screen |
| API Failure | Error banner preserved, form values kept |

**Security:**
- No "back" or navigation available — user must complete password change
- Session from login step remains valid during password change

---

### 2.3. Application Shell (Authenticated)

**Layout:** Persistent header + role-specific sidebar/nav + content area

**Header Elements:**
- Application name: "TokTickIT"
- Authenticated user display: "{Name} ({Role})"
- Logout button/action

**Role-Specific Navigation:**

| Role | Navigation Items |
|---|---|
| Requester | My Tickets, Create Ticket |
| IT Staff | Ticket Queue |
| Administrator | User Management |

**Behavior:**
- Navigation items for unauthorized roles are not rendered (not merely hidden)
- Direct URL access to unauthorized pages shows a Forbidden message
- Logout clears session and redirects to Login

**Responsive:**
- Desktop: horizontal nav bar in header
- Tablet/Mobile: hamburger menu with slide-out nav panel

---

### 2.4. Requester Screens (Regression from Lab 2)

All Lab 2 screens continue to function identically with these changes:

**Removed:**
- Development Requester Selection screen
- "Change Requester" action in header
- `X-Requester-Id` header usage

**Added to Ticket Detail:**
- **Public Comments section** at the bottom of Ticket Detail:
  - Chronological list of comments showing author name, timestamp, and content
  - Text area + "Post Comment" button for adding a new comment
  - Empty state: "No comments yet"
- **"Problem Appears Resolved" button:**
  - Shown only when Ticket status is In Progress or Waiting for Requester
  - Confirmation dialog: "Are you sure? This indicates to IT Staff that the issue appears resolved."
  - On success: visual indicator updated, button becomes disabled with "Marked as Appears Resolved"

---

### 2.5. IT Staff Ticket Queue

**Layout:** Full-width content area with search/filter bar + data table (desktop) or card stack (tablet/mobile)

**Search & Filter Bar:**
- Search input: searches ticket number, summary (case-insensitive partial match)
- Status filter dropdown (multi-select or single: all statuses + "All")
- Priority filter dropdown (IT Priority: all priorities + "All")
- Owner filter dropdown ("All", "Unassigned", "Assigned to me", specific staff names)
- Clear Filters button

**Desktop Table Columns:**
| Column | Sortable | Description |
|---|---|---|
| Ticket # | ✅ | Ticket number |
| Created | ✅ | Created date (default sort: descending) |
| Summary | ❌ | Ticket summary (truncated) |
| Category | ❌ | Category name |
| Req. Priority | ✅ | Requested Priority badge |
| IT Priority | ✅ | IT Priority badge |
| Status | ✅ | Status badge |
| Owner | ✅ | Owner name or "Unassigned" |
| Last Updated | ✅ | Updated timestamp |
| Action | ❌ | "Open" link/button |

**Tablet/Mobile Card Stack:**
- Each card shows: Ticket #, Summary, Status badge, IT Priority badge, Owner
- Tap card to open Ticket Detail

**Pagination:**
- Page controls at bottom (Previous / Next / page numbers)
- Page size selector: 10, 25, 50
- Total count display: "Showing X–Y of Z tickets"

**States:**
| State | Behavior |
|---|---|
| Loading | Skeleton loader or spinner |
| Data Loaded | Table/cards with data |
| Empty | "No tickets in the queue" message |
| No Results | "No tickets match your search or filters" + Clear Filters button |
| API Failure | Error banner with retry action |
| Forbidden | "Access Denied — IT Staff access required" |

---

### 2.6. IT Staff Ticket Detail

**Layout:** Extends the Lab 2 Ticket Detail layout with operational sections

**Sections:**

#### Ticket Information (read-only for IT Staff)
- Ticket Number, Created Date, Requester Name
- Category, Related System
- Summary, Description
- Requested Priority (badge, read-only)

#### IT Staff Operations Panel
- **Owner:** Dropdown to claim (self-assign), assign, or reassign to active IT Staff/Admin users
  - Shows current owner or "Unassigned"
  - "Claim" quick-action button for self-assignment
- **IT Priority:** Dropdown selector (LOW, MEDIUM, HIGH, CRITICAL) with badge preview
- **Status:** Dropdown showing only permitted next statuses from current state
  - Confirmation dialog for destructive transitions (Cancel, Close)
- **Save Changes** button for owner/priority/status updates

#### Attachments (read-only for IT Staff)
- List of attachments with download links (active) and metadata (removed)
- IT Staff can download but cannot upload or remove attachments

#### Public Comments
- Chronological list: author name, role badge, timestamp, content
- "Post Comment" text area + button
- Visual style: light card with left border `--color-primary`

#### Internal Notes
- Chronological list: author name, timestamp, content
- "Add Note" text area + button
- Visual style: **distinct** card with left border `--color-warning` and subtle yellow background tint
- Clear label: "Internal — Not visible to Requester"

**States:**
| State | Behavior |
|---|---|
| Loading | Skeleton loader |
| View | All sections rendered with current data |
| Saving | Save button disabled + spinner |
| Success | Toast/banner "Changes saved successfully" |
| Validation Error | Field-level errors (e.g., empty comment) |
| Conflict | "This ticket has been modified. Please refresh." |
| Not Found | "Ticket not found" message |
| API Failure | Error banner |

---

### 2.7. Administrator User Management

**Layout:** Single page with user list table + modal/slide-out for Create/Edit

#### User List
**Columns (desktop table):**
| Column | Description |
|---|---|
| Name | User's full name |
| Email | Email address |
| Role | Role badge (Requester / IT Staff / Administrator) |
| Status | Active (green) / Inactive (gray) badge |
| Actions | Edit button |

**Search & Filter:**
- Search input: searches by name or email
- Role filter dropdown: All, Requester, IT Staff, Administrator

**Tablet/Mobile:** Card stack showing Name, Email, Role badge, Status badge, Edit button

#### Create User Modal/Form
**Fields:**
- Name (required, text)
- Email (required, email format, unique)
- Role (required, dropdown: Requester, IT Staff, Administrator)
- Initial Password (required, must meet password rules)
- Confirm Password (required, must match)
- Active (checkbox, default: checked)

#### Edit User Modal/Form
**Fields:**
- Name (editable)
- Email (editable, unique validation)
- Role (editable, dropdown)
- Active (toggle/checkbox)
  - Disabled if: editing own account OR would remove last active Administrator
  - Warning text shown when applicable

#### Set New Initial Password (separate action or section)
- New Initial Password (required, must meet password rules)
- Confirm Password (required)
- Warning: "This will require the user to change their password at next login."

**States:**
| State | Behavior |
|---|---|
| Loading | Skeleton loader |
| List View | Table with data |
| Empty | "No users found" |
| No Search Results | "No users match your search" + Clear button |
| Create/Edit Modal | Form with validation |
| Saving | Save button disabled + spinner |
| Success | Toast "User created/updated successfully", list refreshes |
| Duplicate Email | Error: "This email address is already in use" |
| Self-Deactivation Blocked | Error: "You cannot deactivate your own account" |
| Last Admin Blocked | Error: "Cannot deactivate the last active Administrator" |
| Forbidden | "Access Denied — Administrator access required" |
| API Failure | Error banner |

---

## 3. Visual Checklist

| Check | Applied |
|---|---|
| Zen Green design tokens used consistently | ☐ |
| Role-specific navigation (no unauthorized items) | ☐ |
| Status badges with distinct colors per status | ☐ |
| IT Priority badges consistent with Requested Priority | ☐ |
| Role badges with distinct colors | ☐ |
| Editable vs read-only fields clearly styled | ☐ |
| Validation messages below fields (not alerts) | ☐ |
| Loading/skeleton states for async operations | ☐ |
| Empty and no-results states with clear messaging | ☐ |
| Forbidden state with clear "Access Denied" message | ☐ |
| Focus management for modals and form fields | ☐ |
| No clipping, overlap, or horizontal overflow at any breakpoint | ☐ |
| Public Comments vs Internal Notes visually distinct | ☐ |
| Internal Notes clearly marked "Not visible to Requester" | ☐ |
| Confirmation dialogs for destructive actions (Cancel, Close) | ☐ |
| Responsive: desktop table → mobile card stack | ☐ |
