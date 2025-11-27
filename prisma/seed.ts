import 'dotenv/config';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';

const ROWS_TO_CREATE = 555;
const NULL_RATIO = 0.05;

const getNullableValue = <T>(value: T): T | null => {
  return Math.random() < NULL_RATIO ? null : value;
};

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const dataToInsert: Record<string, unknown>[] = [];

  for (let i = 0; i < ROWS_TO_CREATE; i++) {
    const mockRow: Record<string, unknown> = {};

    for (let s = 1; s <= 11; s++) {
      const key = `col_s_${String(s).padStart(2, '0')}`;
      if (s % 2 === 0) {
        mockRow[key] = getNullableValue(faker.person.fullName());
      } else if (s % 3 === 0) {
        mockRow[key] = getNullableValue(faker.internet.email());
      } else {
        mockRow[key] = getNullableValue(faker.lorem.sentence(3));
      }
    }

    for (let n = 1; n <= 11; n++) {
      const key = `col_n_${String(n).padStart(2, '0')}`;
      mockRow[key] = getNullableValue(faker.number.int({ min: 1, max: 10000 }));
    }

    for (let b = 1; b <= 11; b++) {
      const key = `col_b_${String(b).padStart(2, '0')}`;
      mockRow[key] = getNullableValue(faker.datatype.boolean());
    }

    dataToInsert.push(mockRow);
  }

  await prisma.dataTable.createMany({
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
