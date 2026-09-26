# AI Use Log — Lab 03

Prompt : Prepare all required engineering documents for Lab 3 before any implementation begins. (Issue 1) (Claude Sonnet 4.5)
Reflection : เหมือนกับ Lab 2 ครับ ผมใช้ AI ช่วยสร้างโครงสร้างเอกสารทั้งหมดก่อน แต่ Lab 3 มีความซับซ้อนกว่ามากเรื่อง Authorization Matrix และ Status Transition Matrix ที่ AI ร่างออกมาได้ดีในภาพรวม แต่ยังต้องปรับ FR และ BR หลายข้อให้ครอบคลุม edge case เช่น last-admin protection และ mustChangePassword flow

Prompt : Design and implement the Prisma migration from RequesterUser to User model with roles (REQUESTER, IT_STAFF, ADMINISTRATOR), bcrypt password hashing, and idempotent seed data. (Issue 2) (Claude Sonnet 4.5)
Reflection : AI ออกแบบ schema ได้ตรงตาม spec และสร้าง migration script ที่ migrate RequesterUser → User ได้ถูกต้อง แต่ต้องแก้ seed data เรื่อง cost factor ของ bcrypt ที่ AI ใช้ค่า default แทนที่จะใช้ 10 ตาม BR-08 และต้องตรวจสอบ idempotency ของ seed อีกรอบด้วยตัวเองเพราะ AI ทำ upsert ได้ไม่ครบทุก model

Prompt : Implement JWT httpOnly cookie authentication with login, logout, current-user, and mandatory first-login password change endpoints, including bcrypt verification and role-based middleware. (Issue 3) (Claude Sonnet 4.5)
Reflection : AI เขียน authentication flow ได้ครบถ้วนและถูกต้องตาม spec เกือบทั้งหมด แต่มีปัญหาเรื่อง SameSite cookie attribute ที่ต้องปรับจาก Lax เป็น Strict ตาม BR-CSRF และ error message ที่ต้องเป็น generic "Invalid email or password" เพื่อไม่ให้ leak ว่า email มีอยู่จริงหรือไม่ ตาม BR-06

Prompt : Implement role-based authorization middleware and protected route guards for Requester, IT Staff, and Administrator with proper 401/403 responses, and migrate all Lab 2 endpoints to use authenticated identity instead of Development Requester selector. (Issue 4) (Claude Sonnet 4.5)
Reflection : AI สร้าง middleware ได้ดีและลบ Development Requester selector ออกได้ถูกต้อง แต่ต้องตรวจสอบและแก้ไขหลายจุดที่ยังดึง requesterId จาก body/query แทนที่จะใช้ req.user จาก session ตาม BR-03 รวมถึงการ test regression ของ Lab 2 ทุก endpoint ที่ต้องรันผ่านทั้งหมดหลัง migration

Prompt : Implement IT Staff Ticket Queue API and UI with search, filters (status, IT Priority, owner), sorting, pagination, and IT Staff Ticket Detail with ownership claim/reassign, IT Priority update, status transitions, Public Comments, and Internal Notes. (Issue 5) (Claude Sonnet 4.5)
Reflection : AI เขียน Queue API ได้ครบฟีเจอร์ search/filter/sort/pagination แต่ต้องแก้ permittedStatuses ที่ควร compute จาก Status Transition Matrix แล้วส่งกลับมาพร้อม ticket detail เพื่อให้ UI รู้ว่า dropdown status ไหนกดได้บ้าง นอกจากนี้ต้องปรับ UI ของ Internal Notes ให้ไม่แสดงผลให้ Requester เห็นตาม BR-04

Prompt : Implement Administrator User Management screen with user list, search, role filter, create user modal, edit user, activate/deactivate, reset password, and all safety rules (last-admin protection, self-deactivation block, duplicate email check). (Issue 6) (Claude Sonnet 4.5)
Reflection : AI สร้าง UI และ API ได้ครบถ้วนดี แต่ต้องแก้ last-admin protection logic ที่ AI เช็คแค่ isActive แต่ลืมเช็คกรณีที่ admin เปลี่ยน role ของตัวเองออกจาก ADMINISTRATOR ตาม BR-22 และ AC-13 รวมถึง self-deactivation check ตาม BR-21 ที่ต้องเช็คจาก session user id ไม่ใช่จาก request body

Prompt : Write Playwright E2E test suites for authentication flow, IT Staff ticket workflow, and Administrator user management, including responsive viewport screenshots for desktop, tablet, and mobile. (Issue 7) (Claude Sonnet 4.5)
Reflection : AI เขียน E2E tests ได้ครอบคลุม happy path ดี แต่มี edge case หลายอย่างที่ต้องเพิ่มเองเช่น การ test ว่า mustChangePassword user ถูก redirect กลับมา Change Password page ถ้าพยายามเข้า route อื่น และการ capture screenshot ที่ครบ 3 viewport ต้องเพิ่ม setViewportSize() ด้วยตนเองเพราะ AI ลืมใส่เหมือน Lab 2

Overall Reflection : การใช้ AI ใน Lab 3 ช่วยให้ทำงานได้เร็วขึ้นมากในส่วนของ authentication/authorization boilerplate และ documentation แต่ Lab 3 ซับซ้อนกว่า Lab 2 มากในแง่ security logic และ business rules ที่ต้องตรวจสอบอย่างละเอียด โดยเฉพาะ last-admin protection, mustChangePassword middleware chain, และ Status Transition Matrix ที่ AI มักจะทำได้ถูกต้องแค่บางส่วน สิ่งที่เรียนรู้คือควร prompt พร้อมกับ Business Rules เฉพาะข้อและ Acceptance Criteria ที่เกี่ยวข้องเสมอ และควรแยก prompt ทีละ feature แทนที่จะ prompt รวมหลาย feature พร้อมกัน เพื่อให้ AI โฟกัสและลดโอกาสการเข้าใจผิดพลาด
