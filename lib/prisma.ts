import { PrismaClient } from '@/lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}
const adapter = new PrismaPg({ connectionString });

const prisma = global.prisma || new PrismaClient({
  adapter,
  log: ['query'],
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
