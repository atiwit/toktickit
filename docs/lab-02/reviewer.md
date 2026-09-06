# PR Review Evidence — Lab 02

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
  - [Issue #1 – Sprint Specification & Documentation](#)
  - [Issue #2 – Database Schema & Seed Data](#)
  - [Issue #3 – Development Requester Context](#)
  - [Issue #4 – Create Ticket](#)
  - [Issue #5 – Attachment Upload](#)
  - [Issue #6 – My Tickets Screen](#)
  - [Issue #7 – Ticket Detail Screen](#)
  - [Issue #8 – Automated Tests](#)
  - [Issue #9 – Zen Green UI Polish](#)
  - [Issue #10 – Release Integration](#)

---

## Pull Requests Submitted

| PR | Title | Branch | Link |
| :--- | :--- | :--- | :--- |
| #24 | add engineering documents skeleton for Issue #1 | `feature/lab2-specification` | [#24](https://github.com/atiwit/toktickit/pull/24) |
| #25 | feat(db): add full Lab 2 schema and idempotent seed | `feature/lab2-database` | [#25](https://github.com/atiwit/toktickit/pull/25) |
| #26 | feat: implement Requester Context & UI (Issue #3) | `feature/lab2-requester-context` | [#26](https://github.com/atiwit/toktickit/pull/26) |
| #27 | create ticket API and UI | `feature/lab2-create-ticket` | [#27](https://github.com/atiwit/toktickit/pull/27) |
| #28 | feat: attachment upload API, UI, and tests | `feature/lab2-attachments` | [#28](https://github.com/atiwit/toktickit/pull/28) |
| #29 | feat: implement My Tickets screen with API, UI, and tests | `feature/lab2-my-tickets` | [#29](https://github.com/atiwit/toktickit/pull/29) |
| #30 | feat: implement Ticket Detail screen and E2E testing | `feature/lab2-ticket-detail` | [#30](https://github.com/atiwit/toktickit/pull/30) |
| #31 | feat: implement Zen Green theme and responsive polish | `feature/lab2-ui-implement` | [#31](https://github.com/atiwit/toktickit/pull/31) |
| #32 | adding completed docs and preparing to merge into main | `feature/lab2-final` | [#32](https://github.com/atiwit/toktickit/pull/32) |
| #33 | release: lab2 staging → main | `lab2-staging` | [#33](https://github.com/atiwit/toktickit/pull/33) |

---

## Evidence: My Partner Reviewed and Approved My PRs

### Partner who reviewed my PRs: @Alongkron1234, @copter549365, @JeffMerry, @krittaphato3

---

### [PR #24](https://github.com/atiwit/toktickit/pull/24) — add engineering documents skeleton · **Approved by @Alongkron1234**

**Review Comment from my partner (@Alongkron1234):**
> จากที่ดูไฟล์ใน Issue1 เรียบร้อยครบถ้วนดีครับแต่ผมสงสัยว่าตัวไฟล์ lab02_extracted.txt คืออะไรหรอครับ @atiwit

**My Response:**
> มันเป็นไฟล์ที่แปลงออกมาจาก PDF ของ lab2 ครับเพื่อที่ผมจะให้ตัว AI ของผมอ่านไฟล์ได้ละเอียดและแม่นยำกว่าการอ่านผ่านไฟล์ docs แบบ PDF

**Follow-up Comment (@Alongkron1234):**
> ไอเดียดีมากครับ เดี๋ยวผมจะลองเอาไปประยุกต์ใช้ในงานผมบ้างนะๆ

**Review Result (@Alongkron1234):**
> ไฟล์ ใน docs .md ครบถ้วนดีทุกอย่าง ผ่านไป Issue ต่อไปได้คับบ

---

### [PR #25](https://github.com/atiwit/toktickit/pull/25) — feat(db): add full Lab 2 schema and idempotent seed · **Approved by @Alongkron1234, @copter549365**

**Review Comment from my partner (@Alongkron1234):**
> ตรง Enum TicketStatus ผมเห็นมีแค่สถานะเดียว คือ New ผมไม่แน่ใจว่าใน BR ของคุณอติวิชญ์ ในอนาคตต้องมีการใช้ status อื่นๆด้วยมั้ย เช่น OPEN, In process ผมฝากคุณอติวิชญ์ตรวจสอบเพิ่มเติมตรงส่วนนี้หน่อยครับบ

**Review Comment from my partner (@copter549365):**
> เห็นด้วยกับคุณ @Alongkron1234 ครับ

**My Response:**
> โอเคครับหลังจากลองกลับไปเช็ค ผมว่าผมเพิ่มตั้งแต่ตอนนี้น่าจะเป็นผลดีมากกว่า เพราะเวลาขึ่น production จะได้ migrate ได้ง่ายกว่า
> ขอบคุณครับตอนนี้ได้เพิ่มตามคำแนะนำแล้วครับ

**Review Result (@Alongkron1234):**
> ผมเช็คแล้วเรียบร้อยดีครับ ทุกอย่างโอเค

---

### [PR #26](https://github.com/atiwit/toktickit/pull/26) — feat: implement Requester Context & UI · **Approved by @Alongkron1234, @copter549365**

**Review Comment from my partner (@Alongkron1234):**
> ดูจากไฟล์โค้ดต่างๆแล้วครบถ้วนตาม list ที่ให้มาดีมากครับ

**Review Comment from my partner (@copter549365):**
> โดยรวมแล้วครบถ้วนตามlistครับ

---

### [PR #27](https://github.com/atiwit/toktickit/pull/27) — create ticket API and UI · **Approved by @Alongkron1234, @krittaphato3**

**Review Comment from my partner (@krittaphato3):**
> ในส่วนของ PR ของ Issue นี้จากที่ดูจะครอบคลุมเรื่อง Create Ticket API และ UI ของ หน้า Create Ticket ซึ่งผมสังเกตุเห็นว่า ยังขาด create ticket test ทั้งในส่วน client และ API test ของ server รบกวนตรวจสอบในส่วนของ test requirement ใหม่ และหากไม่ครบ ทำการแก้ไขให้เรียบร้อยนะครับ

**Review Comment from my partner (@Alongkron1234):**
> เห็นด้วยกันคุณโอโซนครับ @krittaphato3 ยังขาด test ฝั่ง client กับ test ฝั่ง server ไปนะครับ

**My Response:**
> ขอบคุณมากครับตอนนี้ผมได้ทำการเพิ่มไฟล์ test ให้แล้วนะครับ ฝากคุณโอโซนตรวจสอบความถูกต้องให้อีกครั้งนะครับ
> ตอนนี้ผมได้เพิ่มไฟล์ test ทั้ง UI และ API แล้วฝากคุณบอลตรวจสอบให้อีกครั้งครับ

**Review Result (@krittaphato3):**
> จากที่สังเกตุดู ตอนนี้ PR ครบตรงตาม Issue และ Acceptance Criteria แล้ว

**Review Result (@Alongkron1234):**
> จากที่ดูทั้งหมดโอเคเรียบร้อยดีมากครับ

---

### [PR #28](https://github.com/atiwit/toktickit/pull/28) — feat: attachment upload API, UI, and tests · **Approved by @JeffMerry, @krittaphato3**

**Review Comment from my partner (@JeffMerry):**
> Everything is good Mr.Atiwit.Ready to merge

**My Response:**
> Tysm kub Mr.Jeffy

**Inline Review Comment from my partner (@krittaphato3) on `server/src/index.ts`:**
> ผมลองสังเกตุดูคร่าวๆ เห็นแต่เช็คว่า Ticket มีอยู่จริงไหมแต่ไม่มี เช็คว่าใครเป็นเจ้าของ Ticket รึเปล่าครับ

**Inline Review Comment from my partner (@krittaphato3) on `server/src/index.ts` (follow-up):**
> เท่าที่ผมเข้าใจ ทุก endpoint ของ Attachment เชื่อค่า id จาก URL อย่างเดียวโดยไม่เช็ค ownership เลยครับ frontend ก็ไม่ได้ส่ง requester context มาด้วย จึงอาจทำให้ใครที่รู้ ticketId ก็ยิง POST อัปโหลดไฟล์เข้าไปใน ticket ของคนอื่นได้ เพราะ route นี้เช็คแค่ ticket exists ไม่ได้เช็คว่าใครเป็นเจ้าของ ยังไงรบกวนตรวจสอบตรงนี้ด้วยนะครับ

**My Response:**
> ขอบคุณ คุณ @krittaphato3 ที่ช่วยเช็คครับ เป็นจุดที่ตกหล่นไปจริงๆ ตอนนี้แก้ไขเรียบร้อยแล้วครับ
> - ในส่วนของ backend อัปเดตให้ทุก endpoint ของ Attachment เช็ค ownership แล้วครับ ถ้า requesterId ไม่ตรงกับเจ้าของ Ticket จะโดนโดนปัดตกไป
> - ในส่วนของ frontend ปรับให้ส่ง requester context ผ่าน Header และ Query string แล้วครับ
> - อัปเดตเทสเคสทั้งหมดให้ครอบคลุมและรันผ่านหมดแล้วครับ
> รบกวนลองรีวิวอีกรอบนะครับ ขอบคุณครับ

**Review Result (@krittaphato3):**
> ทุกส่วนมีครบและเรียบร้อยดีตาม Issue ครับ @atiwit Ready to merge

---

### [PR #29](https://github.com/atiwit/toktickit/pull/29) — feat: implement My Tickets screen with API, UI, and tests · **Approved by @krittaphato3, @Alongkron1234, @copter549365**

**Inline Review Comment from my partner (@krittaphato3) on `server/src/index.ts`:**
> ผมสงสัยนิดนึงนะครับ พอ Frontend ส่ง requestedPriority มาให้ แต่ Backend ดันไม่ได้ดึงค่านี้มา มันจะทำให้ พอกดกรอง Priority ที่หน้าเว็บ ข้อมูลจะไม่ถูกกรองไหมครับ ลองเช็ดดูหน่อย

**My Response:**
> แก้แล้วนะครับ ปัญหาอยู่ที่ Backend ตรง GET /api/tickets ตอน destructure req.query ลืมใส่ requestedPriority ไว้ด้วย เลยรับค่าที่ส่งมาไม่ได้ แก้โดยเพิ่ม requestedPriority เข้าไปใน destructure แล้วก็เพิ่ม where.requestedPriority = String(requestedPriority) ให้ Prisma filter ได้ครับ นอกจากนี้ยังแก้ Sort ด้วยตอนนี้กดที่ column header "Created Date" หรือ "Last Updated" ได้แล้วครับ

**Review Comment from my partner (@Alongkron1234):**
> จากไฟล์ client/src/tests/lab-02/MyTickets.test.tsx ที่เป็น mockTicket อะครับ ผมสงสัยครับว่าคุณอิคกี้ใช้ Ticket Number Format แบบไหนครับ

**My Response:**
> Ticket Number Format ที่ใช้ใน mockTickets คือ TKT-YYYYMMDD-NNNN ครับ เช่น TKT-20260825-0001

**Review Result (@krittaphato3):**
> จากที่สำรวจดู ทั้ง Frontend และ backend ไม่มีข้อพิดพลาดใดๆแล้ว รอ @Alongkron1234 กับ @copter549365 มารีวิวได้เลยคับ

**My Response:**
> ขอบคุณมากครับคุณ @Alongkron1234
> ขอบคุณมากครับคุณ @krittaphato3
> ขอบคุณมากครับคุณ @copter549365

**Review Result (@copter549365):**
> ไฟล์ที่เหลือโอเคแล้วครับสามารถ Merge ได้เลยครับ

---

### [PR #30](https://github.com/atiwit/toktickit/pull/30) — feat: implement Ticket Detail screen and E2E testing · **Approved by @krittaphato3, @Alongkron1234**

**Review Comment from my partner (@krittaphato3):**
> โค้ดกับเทสโดยรวมโอเคนะ แต่มีอยู่จุดนึงที่ยังขาดในฝั่ง artifacts คือ responsive screenshots ตาม labsheet ข้อ 8.8 ที่ต้องมี Playwright screenshots ครบ 3 ขนาด desktop / tablet / mobile น่ะ เราลองไล่ดูใน e2e/lab-02/requester-ticket-flow.spec.ts แล้วยังไม่เห็นมี setViewportSize หรือจุด capture screenshot เลย แล้วก็ยังไม่มีหลักฐานภาพตกอยู่ที่ artifacts/lab-02/screenshots/ticket-detail/ ด้วย รบกวนเพิ่ม shot ครบ 3 viewport แล้ว push มานะครับ จะเช็คให้ @atiwit

**Review Comment from my partner (@Alongkron1234):**
> โดยภาพรวมโอเคดีครับ แต่ถ้าตาม plan ของคุณอิคกี้มี playwright screenshots 3ขนาดตามนี้คุณโซนได้กล่าวไว้ข้างต้น รบกวนขอภาพเพิ่มเติมด้วยครับ หรือว่าจะไว้ทำตอนจบทีเดียวแบบผมบอกด้วยนะครับ

**My Response (ครั้งที่ 1):**
> ขอบคุณมากครับคุณ @Alongkron1234 ตอนนี้ผมได้เพิ่ม Screenshots ตามที่คุณ @krittaphato3 แล้วนะครับ
> ขอบคุณมากครับ

**My Response (ตอบ @krittaphato3):**
> หลังจากที่ผมดูแล้ว การ setViewportsize อยู่ใน requester-ticket-flow.spec.ts มีอยู่แล้วนะครับ แต่เหมือนจะมีเออเร่อนิดหน่อยตอนนี้ผมได้แก้ และเพิ่มรูป Screenshots ครบทั้ง 3 อย่างแล้วนะครับ @krittaphato3 รบกวนคุณโอโซนเช็คให้ผมอีกรอบนะครับ

**Review Comment from my partner (@krittaphato3) follow-up:**
> ตาม Requirement จะ ต้องมี ภาพของ My Tickets, Create Tickets and Ticket Detail นะครับ ไม่ไช่แค่ Ticket Detail

**My Response:**
> อ๋อจริงๆด้วยครับคุณ @krittaphato3 ตอนนี้ผมได้เพิ่มเข้าไปแล้วนะครับ

**Review Comment from my partner (@krittaphato3) final:**
> โอเคครับ ทำงานได้ว่องไวมากครับ ยังไม่ทันได้กระพริบตาก็มี commit ใหม่เพิ่มขึ้นมาแล้ว

**My Response:**
> ชิวๆครับ ผมทำงานไวอยู่แล้วครับ งานด่วนครับอิอิ

**Review Result (@krittaphato3):**
> ทุกอย่างเรียบร้อยและครบถ้วนดีครับ

---

### [PR #31](https://github.com/atiwit/toktickit/pull/31) — feat: implement Zen Green theme and responsive polish · **Approved by @Alongkron1234, @krittaphato3, @JeffMerry, @copter549365**

**Review Comment from my partner (@Alongkron1234):**
> ในไฟล์รูปนี้อะครับ artifacts/lab-02/screenshots/my-tickets/desktop.png ผมไม่แน่ใจว่ามันเป็นการแสดงผลซ้ำซ้อนมั้ยครับผมดูข้อมูลเหมือนกันแต่ว่าอันบนเป็นการแสดงแบบ table แต่อันล่างเป็นการแสดงแบบเป็นบล็อคๆ ฝากเช็คตรนี้อีกทีนะครับ @atiwit

**My Response:**
> จริงด้วยครับคุณ @Alongkron1234 UI มีการทับซ้อนกันจริงๆ ตอนนี้ผมได้ทำการแก้ไขเรียบร้อยแล้วนะครับ รบกวนช่วยเช็คให้ผมอีกทีนะครับทุกคน @copter549365 @Alongkron1234 @JeffMerry @krittaphato3

**Review Result (@krittaphato3):**
> จากที่สังเกตุดูหลังจากแก้ไขในส่วนของที่ @Alongkron1234 ได้แจ้งไว้ ก็ถือว่า pr นี้สมบูรณ๋แล้ว

**My Response:**
> ขอบคุณครับมิสซิส @krittaphato3

**Review Result (@JeffMerry):**
> จากที่ตรวจสอบ ทุกอย่างเรียบร้อยดีครบถ้วนสมบูรณ์

**My Response:**
> ขอบคุณมากครับคุณ Jeffza007xxx @JeffMerry

**Review Result (@copter549365):**
> ทุกกอย่างครบถ้วนสมบูรณ์ดีครับ

**My Response:**
> ขอบคุณครับคุณค็อบตวย @copter549365

**Review Result (@Alongkron1234):**
> โอเค ผ่านทำดีมากๆครับ อิคกี้

---

### [PR #32](https://github.com/atiwit/toktickit/pull/32) — adding completed docs and preparing to merge into main · **Approved by @copter549365, @JeffMerry**

**Review Result (@JeffMerry):**
> Good job,MR Q

**My Response:**
> Tysm naja

**Review Result (@copter549365):**
> good job big Q

**My Response:**
> Okaykaaaaa

---

## Evidence: I Reviewed and Approved My Partner's PRs

---

### Repo: [Alongkron1234/toktickit](https://github.com/Alongkron1234/toktickit)

---

### [PR #22](https://github.com/Alongkron1234/toktickit/pull/22) — feat: implement develop requester, UI, active requster API · **Commented**

**My Review Comment:**
> โดยรวมแล้ว test ดีมากๆครับ แต่ในไฟล์ create-ticket.api.test.ts Test case 3 ไม่มีการ assert error.message ทั้งที่ test case 2 มี ควรทำให้มีเหมือนกันนะครับ😘

**Partner's Response (@Alongkron1234):**
> จิงด้วยตาไวมาก ตอนนี้ผมแก้ไฟล์ create-ticket.api.test.ts ให้มีการเช็ค error.message เหมือน test case2 เรียบร้อยแล้วครับ ฝากเช็คอีกทีคับปม

---

### [PR #25](https://github.com/Alongkron1234/toktickit/pull/25) — feat: implement GET API with ownership data, search, filter · **Approved**

**My Inline Comment:**
> search (search=battery) ตรวจแค่ว่า status 200 แต่ไม่ได้เช็คว่า ticket ที่ return มามีคำว่า "battery" จริงๆ เราควรเพิ่มขั้นตอนในการเช็คผลลัพธ์ที่กลับมาจาก return อีกครั้งไหมครับ @Alongkron1234

**Partner's Response (@Alongkron1234):**
> @atiwit อ๋ออันนี้อยู่ใน Commit ล่าสุด (8b2e03a) ได้มีการอัปเดตเพิ่มการตรวจสอบ Assertion ฝั่งผลลัพธ์ที่ส่งกลับมาจาก API เรียบร้อยแล้วครับ โดยระบบจะเช็คเลยว่าตั๋วทุกใบที่ return กลับมาจะต้องมีคำค้นหา battery ปรากฏอยู่ใน summary หรือ ticketNumber จริงๆ ครับผม ในไฟล์ my-tickets.api.test.ts นะครับ

**My Response:**
> โอเคครับ สุดยอดมาก

---

### Repo: [krittaphato3/TokTickIT](https://github.com/krittaphato3/TokTickIT)

---

### [PR #28](https://github.com/krittaphato3/TokTickIT/pull/28) — feat: My Tickets UI — Issue #16 · **Approved**

**My Review Comment:**
> โดยรวมแล้วโอเคมากๆครับ ทุกอย่างดูดี ครบถ้วนสมบูรณ์

---

### [PR #34](https://github.com/krittaphato3/TokTickIT/pull/34) — feat: E2E flows, responsive screenshots, visual checklist · **Commented → Approved**

**My Review Comment:**
> โดยรวมโอเคแล้วครับ แต่มีคำแนะนำนิดนึง ถ้าเปลี่ยนจากการดัก (if...throw Error) มาใช้ test() และ await expect(...) ของ Playwright แทน ผมว่ามันอาจจะดีกว่า เพระว่ามันมีระบบรอโหลดให้อัตโนมัติ เราจะได้เอา waitForTimeout(400) ออกได้เลย เทสต์จะได้ไม่รวนด้วย

**Partner's Response (@krittaphato3):**
> ขอบคุณครับที่รีวิว — เห็นด้วยครับ เดี๋ยวผมเปลี่ยน guard แบบ if...throw เป็น await expect(...) และเอา waitForTimeout(400) ออก ให้ Playwright auto-wait แทน แล้ว push fix ตามมาครับ

**Partner's follow-up (@krittaphato3) หลัง push fix:**
> ขอบคุณครับ แก้ตามคำแนะนำแล้ว — เปลี่ยน if...throw + waitForTimeout เป็น await expect(...) / expect.poll auto-wait เรียบร้อยครับ @atiwit

**My Response (หลัง fix):**
> @krittaphato3 สุดยอดเลยครับ ไม่มีข้อสงสัยแล้วครับ Approve😘

---

### [PR #35](https://github.com/krittaphato3/TokTickIT/pull/35) — release(lab2): Lab 2 Requester Ticketing MVP staging to main · **Approved**

**My Review Comment:**
> Approved bro! Everything is jingle bell!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

---

## Kanban Board — All Issues in Done

> **Screenshot of Kanban board with all issues in Done:**

![](image.png)

| Issue | Title | Status |
| :--- | :--- | :--- |
| #1 | Sprint Specification & Documentation | ✅ Done |
| #2 | Database Schema & Seed Data | ✅ Done |
| #3 | Development Requester Context | ✅ Done |
| #4 | Create Ticket | ✅ Done |
| #5 | Attachment Upload | ✅ Done |
| #6 | My Tickets Screen | ✅ Done |
| #7 | Ticket Detail Screen | ✅ Done |
| #8 | Automated Tests | ✅ Done |
| #9 | Zen Green UI Polish | ✅ Done |
| #10 | Release Integration | ✅ Done |
