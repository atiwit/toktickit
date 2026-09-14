import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:Egq123za@localhost:5432/toktickIT?schema=public';
}
