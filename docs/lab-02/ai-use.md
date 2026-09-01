# AI Use Log — Lab 02

Prompt : Prepare all required engineering documents before any implementation begins. (Issue 1)
Reflection : เนื่องจากมีตัวเอกสารที่ต้องทำค่อนข้างเยอะ ผมเลยใช้ตัว AI ในการจัดการให้ แต่มันก็ยังทำได้ไม่ดีเนื่องจากบางไฟล์ทำละเอียดจนล่วงหน้าไปเยอะ สุดท้ายผมก็ต้องกลับมาแก้ใหม่และบางไฟล์ก็ยังขาดรายละเอียดสำคัญๆอยู่

Prompt : Design the Prisma database schema for Lab 2 including RequesterUser, Category, RelatedSystem, Ticket,Attachment for BR-18 Lab 3 migration compatibility. (Issue 2)
Reflection : AI ออกแบบ schema ได้ตรงตาม Business Rules เกือบทั้งหมดแต่ก็ต้องตรวจสอบและปรับ field types ด้วยตัวเอง อีกครั้งเช่น VarChar length ของ summary และ description ให้ตรงกับ spec

Prompt : Implement the full backend API for Create Ticket with ticket number generation in TKT-YYYYMMDD-NNNN format, validation for all required fields, and ownership verification. (Issue 4)
Reflection : AI เขียน logic การ generate ticket number และ validation ได้ดี แต่มี edge case เรื่อง sequence เมื่อมี ticket หลายใบในวันเดียวที่ต้องตรวจสอบเพิ่มเติม แต่นอกจากนี้ก็ยังต้องปรับ error response format ให้ตรงกับที่ frontend ตามภาพตัวอย่าง

Prompt : Guide me on attachment upload, download, and soft-remove endpoints with multer (Issue 5)
Reflection : AI ช่วยแนะนำการใช้ multer และ file cleanup ได้ดี แต่ก็ยังต้องการการตรวจสอบและแก้หลายๆส่วนด้วยตัวเองอีกเพราะมันยังไม่ตรงกับ design spec และ error response ที่ต้องการ

Prompt : Build the My Tickets screen following this image and requirement (Issue 6)
Reflection : AI เขียน component ได้ครบฟีเจอร์และ responsive แต่ style แต่ก็ยังไม่ตรง mockup ที่ได้รับมา ต้องปรับ CSS หลายจุดเองเพื่อให้ badge, header, และ filter bar ตรงกับ design ที่กำหนด รวมถึงการจัด layout บน mobile ที่ AI ทำออกมาได้ทับซ้อนกัน (มี table และ block พร้อมกันใน mobile)

Overall Reflection : การใช้ AI ใน Lab 2 ช่วยให้ทำงานได้เร็วขึ้นมากในส่วนของ การ coding และ documentation แต่ยังต้องการการตรวจสอบและปรับแก้หลายๆจุดด้วยตนเอง โดยเฉพาะส่วน UI ที่ต้องตรงกับ design spec, การ handle edge case ใน business logic, และ test environment setup ที่ AI ควรจะจัดการได้ดีกว่านี้ สิ่งที่เรียนรู้คือควร prompt ให้ละเอียดและอ้างอิง Business Rules หรือ Acceptance Criteria เฉพาะข้อที่เกี่ยวข้องเสมอ แทนที่จะ prompt กว้างๆ เพื่อลดข้อผิดพลาดและป้องกันไม่ต้องมาแก้อีกหลายๆรอบในภายหลัง
