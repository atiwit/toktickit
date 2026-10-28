# AI Use Log — Lab 04

## LLM Specification
- **Model Used:** Gemini 3.8 Flash (High) / Antigravity Agentic Pair Programmer
- **Primary Roles:** Specification Agent (Planning, System Architecture, Spec DD, Test DD) & Coding Agent (TDD Implementation, Refactoring, E2E Automation)

---

## Key Prompts & Reflections

### Prompt 1 : Sprint 4 Planning & Engineering Contract Preparation (Issue #55)
> **Prompt:** "ช่วยอ่านไฟล์ แล็ป 4 นี้แล้ว เริ่มคิด Sprintจากวางนั้นโครงสร้างของไฟล์เอกสารที่จำเป็นก่อน พร้อมออกแบบ พร้อมคิดว่าควรมีกี่ Issue"
> 
> **Reflection:** การใช้ AI ช่วยเริ่มต้น Sprint 4 ทำให้สามารถลดเวลาในการวางแผน และ Business Rules เรื่อง Resolution Gate ได้อย่างรวดเร็ว AI ช่วยย่อย Requirements ออกมาเป็น 8 GitHub Issues ที่สอดคล้องกับเกณฑ์การให้คะแนน 9 ส่วนอย่างชัดเจน และช่วยร่างโครงสร้างเอกสาร Engineering Contract ทั้ง 6 ไฟล์ให้มีเนื้อหาที่รัดกุมและเชื่อมโยงกันอย่างเป็นระบบ

---

### Prompt 2 : Actions Taken Foundation (Database, Model, Seed & APIs) (Issue #56)
> **Prompt:** "ทำ issue 2 โดยที่ เรียงจาก Task ตามลำดับที่ได้ทำการวางแผนไว้"
> 
> **Reflection:** ในส่วนของ Issue 2 ได้ออกแบบโมเดล `ActionTaken` เชื่อมโยงกับ Ticket และ User และรัน Prisma migration โดยไม่กระทบข้อมูลเดิม พร้อมเพิ่ม seed data ให้ครอบคลุมตั๋วที่มี 0, 1, และหลาย actions โดยมีกรณีที่เจ้าหน้าที่คนอื่นที่ไม่ใช่ Ticket Owner จากนั้นสร้าง REST APIs สำหรับ CRUD Actions Taken และเขียน Automated Test 18 ข้อ ผ่านทั้งหมด

---

### Prompt 3 : Ticket Workflow, Resolution Gate & Concurrency Handling (Issue #57)
> **Prompt:** "ทำ Issue3 โดยทำตาม tasks ที่ได้วางแผนไว้และอัพเดทไฟล์เอกสาร reviwer ให้ด้วย"
> 
> **Reflection:** ในส่วนของ Issue 3 ได้บังคับใช้กฎ Resolution Gate (BR-08 / FR-09) ที่ฝั่ง backend โดยปฏิเสธการเปลี่ยนสถานะตั๋วเป็น `RESOLVED` ด้วย HTTP 422 Unprocessable Entity หากยังไม่มีรายการ Actions Taken ภายใต้ตั๋ว, อัปเดต Status Transition Matrix (BR-10, BR-11, FR-08) ให้ครอบคลุมทุกสถานะ รวมถึงการเปลี่ยนจาก `WAITING_FOR_REQUESTER` และสถานะสิ้นสุด `CANCELLED` (Terminal State), ตรวจสอบให้แน่ใจว่าการกด "Problem Appears Resolved" ของ Requester เป็นเพียง Advisory Flag ที่บันทึก `requesterIndicatedResolved = true` โดยไม่เปลี่ยนสถานะตั๋วอัตโนมัติ, พร้อมทั้งเพิ่ม Optimistic Concurrency Control (OCC) ตรวจจับความขัดแย้งในการอัปเดตข้อมูลด้วย `lastUpdatedAt` / `updatedAt` และส่ง HTTP 409 Conflict และเขียน Automated API Tests ครอบคลุม 49 เคสทดสอบใน `server/tests/lab-04/ticket-workflow.api.test.ts` ผ่าน 100%


