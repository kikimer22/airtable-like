import 'dotenv/config';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';

const ROWS_TO_CREATE = 1111;
const NULL_RATIO = 0.1;

const getNullableValue = <T>(value: T): T | null => {
  return Math.random() < NULL_RATIO ? null : value;
};

async function main() {

  // Initialize Prisma Client
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  // start seeding
  const dataToInsert: Record<string, unknown>[] = [];

  for (let i = 0; i < ROWS_TO_CREATE; i++) {
    const mockRow: Record<string, unknown> = {};

    for (let s = 1; s <= 100; s++) {
      const key = `col_s_${String(s).padStart(3, '0')}`;
      if (s % 2 === 0) {
        mockRow[key] = getNullableValue(faker.person.fullName());
      } else if (s % 3 === 0) {
        mockRow[key] = getNullableValue(faker.internet.email());
      } else {
        mockRow[key] = getNullableValue(faker.lorem.sentence(3));
      }
    }

    for (let n = 101; n <= 172; n++) {
      const key = `col_n_${n}`;
      mockRow[key] = getNullableValue(faker.number.int({ min: 1, max: 10000 }));
    }

    for (let b = 173; b <= 222; b++) {
      const key = `col_b_${b}`;
      mockRow[key] = getNullableValue(faker.datatype.boolean());
    }

    dataToInsert.push(mockRow);
  }

  await prisma.mockDataTable.createMany({
    data: dataToInsert,
    skipDuplicates: true,
  });

  await prisma.$disconnect();
  console.log(`DONE ✅`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
