/// <reference types="node" />
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network"
  ];

  console.log('Start seeding categories...');

  for (const catName of categories) {
    // ใช้ upsert เพื่อให้สคริปต์เป็น Idempotent (ปลอดภัยเมื่อรันซ้ำ)
    await prisma.category.upsert({
      where: { name: catName },
      update: {}, // ถ้ามีอยู่แล้ว ไม่ต้องเปลี่ยนแปลงอะไร
      create: {
        name: catName, // ถ้ายังไม่มี ให้สร้างใหม่ด้วยชื่อนี้
      },
    });
    console.log(`Upserted category: ${catName}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });