# PR Review Evidence — Lab 03

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
- **All Issues:**
  - [Issue #1 - Sprint Specification & Documentation](#)
  - [Issue #2 - Database Migration & Seed Data (User model)](#)
  - [Issue #3 - Authentication (Login, Logout, Change Password)](#)
  - [Issue #4 - Role-Based Authorization & Lab 2 Migration](#)
  - [Issue #5 - IT Staff Ticket Queue & Detail Operations](#)
  - [Issue #6 - Administrator User Management](#)
  - [Issue #7 - E2E Tests & Responsive Screenshots](#)
  - [Issue #8 - Release Integration](#)

---

## Pull Requests Submitted

| PR | Title | Branch | Link |
| :--- | :--- | :--- | :--- |
| #44 | docs-preparation for lab3 | `feature/lab3-docs` | [#44](https://github.com/atiwit/toktickit/pull/44) |
| #45 | feat(auth): complete Lab 3 authentication and user model migration | `feature/lab3-auth` | [#45](https://github.com/atiwit/toktickit/pull/45) |
| #46 | feat(auth): implement role-based authorization and role-specific navigation | `feature/lab3-auth-full` | [#46](https://github.com/atiwit/toktickit/pull/46) |
| #47 | Feature/lab3 staff queue | `feature/lab3-staff-queue` | [#47](https://github.com/atiwit/toktickit/pull/47) |
| #48 | feat(lab-03): add IT staff ticket detail tests, confirmation dialog | `feature/lab3-staff-ops` | [#48](https://github.com/atiwit/toktickit/pull/48) |
| #49 | feat(admin): implement Administrator User Management screen and test suite | `feature/lab3-admin` | [#49](https://github.com/atiwit/toktickit/pull/49) |
| #50 | add Playwright E2E test suites, visual evidence, and confirmation modal enhancements | `feature/lab3-e2e` | [#50](https://github.com/atiwit/toktickit/pull/50) |

---

## Evidence: My Partner Reviewed and Approved My PRs

### Partner who reviewed my PRs: @Alongkron1234, @copter549365, @krittaphato3

---

### [PR #44](https://github.com/atiwit/toktickit/pull/44) — docs-preparation for lab3 · **Approved by @krittaphato3, @Alongkron1234**

**Review Comment from my partner (@krittaphato3):**
> Specification ครบถ้วนดีมาก ในส่วนของ ui test กับ api specs ก็มีการ plan ที่ดีและถูกต้องตามหลักการไม่ได้บกพร่องตรงไหน ยอดเยี่ยมมาก

**My Response:**
> ขอบคุณมากครับคุณ @krittaphato3

**Review Comment from my partner (@Alongkron1234):**
> ไฟล์ docs ใน lab นี้ครบถ้วนดีครับ ผ่านน

**My Response:**
> ขอบคุณมากครับคุณ @Alongkron1234

**Review Result (@krittaphato3):** Approved

**Review Result (@Alongkron1234):** Approved

---

### [PR #45](https://github.com/atiwit/toktickit/pull/45) — feat(auth): complete Lab 3 authentication and user model migration · **Approved by @krittaphato3, @Alongkron1234**

**Review Comment from my partner (@krittaphato3):**
> PR นี้ทำส่วน Authentication, JWT httpOnly Cookie, และการ Migrate จาก Requester ไปเป็น User ได้ดีและถูกต้องตาม Spec ในส่วนการทำ passwordChangeGuard และ requireRole middleware ช่วยจัดการเรื่อง Server-side authorization (BR-03) ได้ดี และ Test coverage ก็ครอบคลุมทั้ง Auth API และ Regression tests ของ Requester ดังนั้น ในส่วน PR นี้ถือว่าผ่านฉลุยเลยครับ

**Review Comment from my partner (@Alongkron1234):**
> อยากทราบว่าตรง current password อะครับตรงหน้า UI ตอนส่งฟอรมไป มันได้นำค่า currentPassword ไปใช้หรือส่งไปที่ API หรือป่าวครับ

**My Response:**
> ตอนนี้ผมทำเป็นโครงไว้เฉยๆครับ ไม่ได้ใช้และไม่ได้ส่งไปที่ API ครับ เพราะผมจะไปทำใน PR issue ถัดไปที่เป็นของ role-base และทำตัว change password ครับ

**Partner's Response (@Alongkron1234):**
> โอเกย์ๆ เกย์คับๆ

**My Response:**
> ขอบคุณครับ เกย์บอล

**Review Result (@krittaphato3):** Approved

**Review Result (@Alongkron1234):** Approved - ผ่านๆ ทำได้ดีมากอธิบายมาได้เข้าใจดี

---

### [PR #46](https://github.com/atiwit/toktickit/pull/46) — feat(auth): implement role-based authorization and role-specific navigation · **Approved by @krittaphato3, @Alongkron1234**

**Review Comment from my partner (@krittaphato3):**
> โครงสร้างและ Foundation ของ Lab 3 ใน Issue นี้มาถูกทางแล้วครับ รบกวนเช็คเรื่อง **Data Migration** เป็นพิเศษที่สุด เพราะถ้าข้อมูลเก่าหายจะผิดสเปคข้อ 5.2 ทันทีนะครับ อยากให้ระวังไว่

**My Response:**
> จริงด้วยครับ ขอบใจมากที่ทัก ไปเช็คดูปรากฏว่า Prisma มัน gen โค้ดไป drop table ทิ้งซะงั้น โค้ด SQL สำหรับย้ายข้อมูลมันเลยไม่ทำงาน ตอนนี้เราไปไล่แก้ Migration script ให้มันดึงข้อมูลจาก RequesterUser เก่าย้ายเข้าตาราง User ให้ถูกตาม Spec 5.2 เรียบร้อยแล้ว ข้อมูลเก่าไม่หายแน่นอน

**Review Comment from my partner (@Alongkron1234):**
> โครงสร้างและ Foundation ของ Lab 3 ใน Issue นี้มาถูกทางแล้วครับ รบกวนเช็คเรื่อง **Data Migration** เป็นพิเศษที่สุด เพราะถ้าข้อมูลเก่าหายจะผิดสเปคข้อ 5.2 ทันทีนะครับ อยากให้ระวังไว่
>
> ผมเห็นด้วยกับคุณโอซาน เอ้ย โฮโซนครับ

**My Response:**
> ขอบคุณครับตอนนี้ผมได้ทำการแก้ไขแล้วนะครับ ลองเช็คอีกทีนะครับ

**Review Result (@krittaphato3):** Approved

**Review Result (@Alongkron1234):** Approved - ให้ผ่านนะครับแต่เช็คตามที่บอกด้วยนะ

---

### [PR #47](https://github.com/atiwit/toktickit/pull/47) — Feature/lab3 staff queue · **Approved by @Alongkron1234, @krittaphato3**

**Review Comment from my partner (@krittaphato3):**
> ดูจาก Codebase แล้วครบถ้วนดีนะครับ เก่งมากครับ แต่รบกวนเช็คว่า tests ครอบคลุม edge cases หรือยัง เช่น:
> การเปลี่ยนหน้า (pagination) แล้ว state ของ filter/search ยังอยู่หรือไม่
> การทดสอบ responsive behavior (mock viewport)
> การ mock API ให้ return error หรือ empty array
> ถ้าเรียบร้อยแล้วเดี๋ยวจะมา Approve ให้นะครับ

**My Response:**
> จริงด้วยครับคุณโอโซน ตอนนี้่ผมลองไล่ดูแล้วเช็ค edge cases ทั้งหมดแล้วรบกวนลองเช็คให้ผมอีกทีนะครับ

**Comment from my partner (@Alongkron1234):**
> ผมเห็นด้วยกับคุณโอโซนนะครับ และผมก็ทำการเช็คให้คุณอติวิชญ์เรียบร้อยแล้วครับ

**Review Result (@Alongkron1234):** Approved - ผมให้ผ่านนะๆ

**My Response:**
> ขอบคุณมากครับ

**Review Result (@krittaphato3):** Approved - ผ่านครับ

**My Response:**
> ขอบคุณครับ

---

### [PR #48](https://github.com/atiwit/toktickit/pull/48) — feat(lab-03): add IT staff ticket detail tests, confirmation dialog · **Approved by @krittaphato3, @Alongkron1234**

**Review Comment from my partner (@krittaphato3):**
> ครบถ้วนดีมากครับไม่มีข้อติเตียนเลย ถือว่าเป็น PR ที่ทำตาม spec และ issue ได้ดีมากครับ

**My Response:**
> ขอบคุณมากครับคุณ โอโซน

**Review Result (@krittaphato3):** Approved - ผ่านครับ

**Review Comment from my partner (@Alongkron1234):**
> ตรวจทานโค้ดและชุดทดสอบของ PR นี้เรียบร้อยแล้วครับ

**My Response:**
> ขอบคุณมากครับ บอลลี่

**Review Result (@Alongkron1234):** Approved

---

### [PR #49](https://github.com/atiwit/toktickit/pull/49) — feat(admin): implement Administrator User Management screen and test suite · **Approved by @copter549365** (after 3 rounds of Changes Requested)

**Review Comment from my partner (@copter549365) - Round 1 [CHANGES REQUESTED]:**
> 1. Session ไม่ถูก invalidate เมื่อ user ถูก deactivate
>
> Test ADMIN-13 พิสูจน์เองว่า cookie ของ admin ที่ถูก deactivate แล้วยังผ่าน auth middleware ไปถึง business logic ได้ Spec ไม่ได้บังคับตรงๆ (มีแค่ "logout invalidation" ใน 6.1) แต่ขัดกับเจตนาฟีเจอร์ deactivate และขัดกับหลักการ "protect every API...according to role" คำถามที่ต้องถาม: ตั้งใจออกแบบแบบนี้ หรือเป็นช่องโหว่ที่ยังไม่ได้แก้?
>
> 2. Zen Green - hardcode hex แทน reuse token/component
>
> ทั้งไฟล์ใช้ style={{ backgroundColor: '#DCFCE7', ... }} แทน Badge/CSS variable ที่มีอยู่แล้ว แก้: เปลี่ยนไป reuse component/token เดิมจาก Lab 2 หรือดึงสีออกมาเป็น CSS class/variable ให้ตรง spec
>
> 3. Password rule ไม่ตรงกันระหว่างหน้า Login/Change-Password กับ Admin Create-User
>
> Hint text ใน Admin modal มีแค่ 3 เงื่อนไข ขาด "special character" แก้: เช็คว่า backend validation จริงบังคับ special character ไหม แล้วทำให้ UI text ตรงกับ backend ทั้งสองจุด

**My Response:**
> จริงด้วยครับคุณค็อปตวย ตอนนี้ผมได้แก้ทั้ง 3 ข้อแล้วนะครับลองตรวจสอบให้ผมอีกรอบนะครับ

**Review Comment from my partner (@copter549365) - Round 2 [CHANGES REQUESTED]:**
> ขอให้แก้ก่อน merge: ยังไม่เห็นการแก้เรื่อง session invalidation ใน commit นี้
>
> Commit c732d06 ("fixing session invalid / Zen screen hardcode/ Password rule") แก้แค่ 2 ไฟล์: client/src/pages/UserManagement.tsx และ client/src/index.css
>
> ทั้งสองไฟล์เป็น frontend UI/CSS ล้วนๆ การแก้ปัญหา "session ของ user ที่ถูก deactivate ไปแล้วยังใช้งานต่อได้" ต้องแก้ที่ฝั่ง server
>
> (ส่วนอื่นของ commit นี้ — การย้าย Zen Green ไปใช้ token และการแก้ข้อความกฎรหัสผ่าน — ทำได้ถูกต้องแล้ว ตรงกับที่เคย comment ไว้)

**My Response:**
> ขออภัยจริงๆครับ ตอนนี้ผมได้แก้ไขแล้วนะครับรบกวนลองเช็คอีกทีนะครับ รอบนี้ผมได้เพิ่มเทสสำหรับ user-admin ไปด้วยครับ

**Review Comment from my partner (@copter549365) - Round 3 [CHANGES REQUESTED]:**
> 1. Auth logic ซ้ำกันใน 2 ไฟล์ — error shape ไม่ตรงกัน
>
> middleware/auth.ts กับ index.ts มี logic เดียวกันเป๊ะ แต่เขียนแยกกันคนละที่ และ response shape ไม่เหมือนกัน
> - auth.ts: res.status(401).json({ error: 'Account is inactive...' }) - error เป็น string
> - index.ts: res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: '...' } }) - error เป็น object มี .code
>
> ทุก test ในไฟล์นี้เช็ค res.body.error.code ซึ่งจะพังทันทีถ้า route นั้นดันไปใช้ auth.ts แทน index.ts
> ถ้าไฟล์ใดไฟล์หนึ่งเป็น dead code ควรลบทิ้งไปเลยเพื่อไม่ให้ maintainer งงว่าต้องแก้ที่ไหน

**My Response:**
> จริงด้วยครับ ตอนนี้ผมได้ทำการลบไฟล์ auth.ts ออกที่เป็น deadcode แล้วครับ ส่วนใน api.test ก็แก้ code เรียบร้อยแล้วครับ

**Review Result (@copter549365):** Approved - ครับคุณอิคอ้วนทำการแก้ไขมาได้ตามที่บอก

---

### [PR #50](https://github.com/atiwit/toktickit/pull/50) — add Playwright E2E test suites, visual evidence, and confirmation modal enhancements · **Approved by @krittaphato3, @Alongkron1234**

**Review Comment from my partner (@krittaphato3):**
> ถูกต้องครบถ้วนครับ E2E test กับ Visual Evidence ก็มีครบทุก feature และขั้นตอน เก่งมากครับ ผ่าน
> [Approved]

**My Response:**
> ขอบคุณครับคุณ Ozone

**Review Result (@krittaphato3):** Approved

**Review Comment from my partner (@Alongkron1234):**
> โดยรวมทั้งหมดถูกต้องดีมากครับ ผ่านนะครับ

**My Response:**
> ขอบคุณครับคุณอลงบอลลล์

**Review Result (@Alongkron1234):** Approved

---

## Evidence: I Reviewed and Approved My Partner's PRs

---

### Repo: [Alongkron1234/toktickit](https://github.com/Alongkron1234/toktickit)

---

### [PR #42](https://github.com/Alongkron1234/toktickit/pull/42) — Create docs/lab-03/ and .md file · **Approved**

**My Review Comment:**
> โดยรวมแล้วเอกสารครบและละเอียดมากครับ ลุยโล้ดดด

**Review Result (me):** Approved

---

### [PR #45](https://github.com/Alongkron1234/toktickit/pull/45) — Implement IT Staff Ticket queue search filter view detail · **Commented → Approved**

**My Review Comment:**
> ภาพรวมโค้ดดูโอเคเลยครับ Test ครบถ้วนดีมาก มีจุดนึงอยากสอบถามเพื่อความแน่ใจ หากกรณีที่ฝั่ง Frontend ได้รับ status 403 เราได้จัดการให้มี UI แจ้งเตือนผู้ใช้ หรือ redirect กลับไปหน้า Login ไว้ด้วยไหมครับ?

**Partner's Response (@Alongkron1234):**
> ตอนนี้ไม่ว่าจะเป็น status อะไร ก็ใช้ error state เดียวกันทุก status code ที่ fail เลยครับ เดี๋ยวผมจะเพิ่มตรงส่วนนี้ให้นะครับ
> - **401** (session หมดอายุ/invalid) → logout + redirect กลับหน้า Login
> - **403** (login อยู่ แต่ไม่มีสิทธิ์ เช่น role ถูกเปลี่ยนระหว่าง session) → แสดงข้อความ "Access Denied" แทนที่จะ auto-redirect เพราะ session ยัง valid อยู่จริง แค่สิทธิ์เปลี่ยน ขอเวลาแก้สักครู่นะครับ @atiwit @krittaphato3

**My Response (หลัง fix):**
> โอเคครับ ผ่านได้

**Review Result (me):** Approved

---

### [PR #49](https://github.com/Alongkron1234/toktickit/pull/49) — Implement IT staff ticket ownership · **Approved**

**My Review Comment:**
> test สมบูรณ์ครบถ้วน และถูกต้องครับลุยต่อได้เลย

**Review Result (me):** Approved

---

### [PR #50](https://github.com/Alongkron1234/toktickit/pull/50) — Implement admin api and ui · **Approved**

**My Review Comment:**
> โค้ดส่วน API และ UI สำหรับ Admin จัดการได้เรียบร้อยดีครับ พร้อม merge ครับ

**Review Result (me):** Approved

---

### [PR #51](https://github.com/Alongkron1234/toktickit/pull/51) — Implement E2E tests; fix AuthContext re-render loop · **Approved**

**My Review Comment:**
> โดยรวมทั้งหมดแล้ว โอเคครับพร้อม merge ได้ครับ ไม่มีปัญหาแล้ว!!

**Review Result (me):** Approved

---

### [PR #54](https://github.com/Alongkron1234/toktickit/pull/54) — Release: Lab 3. TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens · **Approved**

**My Review Comment:**
> ทุกอย่างเรียบร้อยมากครับ ลุยต่อได้!

**Review Result (me):** Approved

---

### Repo: [krittaphato3/TokTickIT](https://github.com/krittaphato3/TokTickIT)

---

### [PR #47](https://github.com/krittaphato3/TokTickIT/pull/47) — Lab3 Auth: authentication foundation + dev requester migration · **Approved**

**My Review Comment:**
> โดยรวมแล้วในส่วนของ coding เขียนได้เคลียร์และเข้าใจง่ายมากๆครับ หลังจากตรวจสอบก็น่าจะครบตาม scope แล้วครับ

**Review Result (me):** Approved

---

### [PR #48](https://github.com/krittaphato3/TokTickIT/pull/48) — feat(lab3): add public comments and fix requester regression · **Approved**

**My Review Comment:**
> การไม่อนุญาตให้ใช้ PATCH/DELETE สำหรับ Public Comments และการบังคับใช้ authorId / createdAt จากฝั่ง Server ทำให้ระบบทำตาม BR-14 ได้เป๊ะมาก ป้องกันการปลอมแปลงได้ดีเยี่ยม ลุยต่อได้เลย

**Review Result (me):** Approved

---

### [PR #50](https://github.com/krittaphato3/TokTickIT/pull/50) — feat(lab3): IT Staff Ticket Detail · **Approved**

**My Review Comment:**
> โดยรวมแล้วโค้ดมีความครบถ้วนเรียบร้อยดีครับ ลุยต่อไปได้เลย

**Review Result (me):** Approved

---

### [PR #51](https://github.com/krittaphato3/TokTickIT/pull/51) — feat(lab3): Administrator User Management — API + /admin/users screen + sortable header · **Approved**

**My Review Comment:**
> ในส่วนของ compareUsers (Client-side sorting) มีการกำหนด ROLE_RANK ไว้แล้ว ซึ่งทำงานได้ถูกต้องดี แต่อาจจะคอมเมนต์เพิ่มเติมไว้เผื่ออนาคตมีการเพิ่ม Role ใหม่ๆ จะได้รู้ว่าต้องมาอัปเดตตรงนี้ครับ รวมๆแล้วผ่านครับ

**Review Result (me):** Approved

---

### [PR #53](https://github.com/krittaphato3/TokTickIT/pull/53) — docs(lab3): LAB3-07 release docs finalization · **Approved**

**My Review Comment:**
> โดยรวมแล้วเอกสาร ต่างๆครบถ้วนพร้อมขึ้น main ได้เลยครับสุดยอดมาก

**Review Result (me):** Approved

**Partner's Response (@krittaphato3):**
> ขอบคุณ ครับ @atiwit @Alongkron1234 @napatsun

---

## Kanban Board — All Issues in Done

> **Screenshot of Kanban board with all issues in Done:**

| Issue | Title | Status |
| :--- | :--- | :--- |
| #1 | Sprint Specification & Documentation | Done |
| #2 | Database Migration & Seed Data (User model) | Done |
| #3 | Authentication (Login, Logout, Change Password) | Done |
| #4 | Role-Based Authorization & Lab 2 Migration | Done |
| #5 | IT Staff Ticket Queue & Detail Operations | Done |
| #6 | Administrator User Management | Done |
| #7 | E2E Tests & Responsive Screenshots | Done |
| #8 | Release Integration | Done |

