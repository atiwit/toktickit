# AI Use Log — Lab 04

## LLM Specification
- **Model Used:** Gemini 3.8 Flash (High) / Antigravity Agentic Pair Programmer
- **Primary Roles:** Specification Agent (Planning, System Architecture, Spec DD, Test DD) & Coding Agent (TDD Implementation, Refactoring, E2E Automation)

---

## Key Prompts & Reflections

### Prompt 1 : Sprint 4 Planning & Engineering Contract Preparation (Issue #55)
> **Prompt:** "ช่วยอ่านไฟล์ แล็ป 4 นี้แล้ว เริ่มคิด Sprintจากวางนั้นโครงสร้างของไฟล์เอกสารที่จำเป็นก่อน พร้อมออกแบบ พร้อมคิดว่าควรมีกี่ Issue"
> 
> **Reflection:** การใช้ AI ช่วยเริ่มต้น Sprint 4 ทำให้สามารถวิเคราะห์ Handout ที่มีความซับซ้อนของ Parent-Child relationship (Ticket -> Actions Taken) และ Business Rules เรื่อง Resolution Gate ได้อย่างรวดเร็ว AI ช่วยย่อย Requirements ออกมาเป็น 8 GitHub Issues ที่สอดคล้องกับเกณฑ์การให้คะแนน 9 ส่วนอย่างชัดเจน และช่วยร่างโครงสร้างเอกสาร Engineering Contract ทั้ง 6 ไฟล์ให้มีเนื้อหาที่รัดกุมและเชื่อมโยงกันอย่างเป็นระบบ โดยเฉพาะการกำหนด State Transition Matrix และการคิดล่วงหน้าเรื่อง Optimistic Concurrency Control เพื่อไม่ให้เกิด Stale Updates

---

### Prompt 2 : Actions Taken Model Design & Prisma Migration (Issue #56)
> **Prompt:** "Design and implement the Prisma schema increment for ActionTaken model with foreign keys to Ticket and User (performedBy), non-destructive migration preserving existing tickets, and idempotent seed data covering 0, 1, and multiple actions."
> 
> **Reflection:** *(To be recorded upon implementation of Issue #56)*

---

### Prompt 3 : Ticket Workflow Enforcement, Resolution Gate & Stale Updates (Issue #57)
> **Prompt:** "Implement backend status transition validation, the Resolution Gate blocking transition to RESOLVED without Actions Taken (422 Unprocessable Entity), and optimistic concurrency conflict detection (409 Conflict) with comprehensive API test suite."
> 
> **Reflection:** *(To be recorded upon implementation of Issue #57)*

---

### Prompt 4 : Actions Taken Section on Ticket Detail UI (Issue #58)
> **Prompt:** "Build the Actions Taken list, Create/Edit modal with conditional follow-up note validation, auto-recorded performed-by badge, and read-only view for Requesters under Zen Green theme with component tests."
> 
> **Reflection:** *(To be recorded upon implementation of Issue #58)*

---

### Prompt 5 : Role-Based Dashboard Metrics APIs (Issue #59)
> **Prompt:** "Implement GET /api/dashboards/requester and GET /api/dashboards/staff endpoints with authoritative database aggregate queries, timezone consistency, empty state handling, and automated API tests."
> 
> **Reflection:** *(To be recorded upon implementation of Issue #59)*

---

### Prompt 6 : Role-Based Dashboard UIs & Drill-Down Navigation (Issue #60)
> **Prompt:** "Create responsive Requester and IT Staff Dashboard screens with metric cards, recent tickets table, quick action buttons, and accessible drill-down navigation linking cards to pre-filtered queues."
> 
> **Reflection:** *(To be recorded upon implementation of Issue #60)*

---

### Prompt 7 : Playwright E2E Workflows & Viewport Screenshots (Issue #61)
> **Prompt:** "Write Playwright E2E test suites for Actions Taken lifecycle, Resolution Gate blocking, and Dashboard drill-down, and capture responsive screenshots for desktop, tablet, and mobile viewports."
> 
> **Reflection:** *(To be recorded upon implementation of Issue #61)*

---

### Prompt 8 : Full System Regression & Release Integration (Issue #62)
> **Prompt:** "Run full regression test suites across Labs 1-4, conduct WCAG accessibility checklist audit, verify reviewer approvals, and execute release merge from lab4-staging to main."
> 
> **Reflection:** *(To be recorded upon implementation of Issue #62)*

---

## My Reflection on Specification-Agent & Coding-Agent Use

การทำงานใน Sprint 4 ร่วมกับ AI Agent ในฐานะ **Specification Agent** แสดงให้เห็นถึงพลังของการวางแผนและออกแบบสถาปัตยกรรมก่อนการลงมือเขียนโค้ดจริง (Spec DD) โดย AI สามารถช่วยเชื่อมโยงความต้องการของผู้มีส่วนได้ส่วนเสีย (Stakeholder Request) เข้ากับข้อกำหนดทางเทคนิค เช่น การแยก `performedById` ออกจาก `ownerId` เพื่อสะท้อนความเป็นจริงของกระบวนการ IT Support และการกำหนดเงื่อนไข **Resolution Gate** อย่างชัดเจนในระดับฐานข้อมูลและ API 

สิ่งที่ได้เรียนรู้จากการทำงานขั้นนี้คือ AI จะให้ผลลัพธ์ที่ดีที่สุดเมื่อเรากำหนดกรอบและข้อบังคับทางวิศวกรรมที่ชัดเจน (เช่น ห้าม client กำหนด performedBy เอง, ต้องตรวจ stale updates, และต้องคง regression ของแล็บ 1–3) การแบ่งงานออกเป็น 8 Issues อย่างเป็นรูปธรรมช่วยให้ Coding Agent สามารถทำงานในรอบถัดไปได้อย่างมีทิศทาง ไม่หลุดขอบเขต และตรวจสอบย้อนกลับได้ในทุกขั้นตอน
