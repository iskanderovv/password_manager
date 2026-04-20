import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Foundation seed scaffold only. Real demo data seeding can be added in the next step.
  await prisma.$queryRaw`SELECT 1`;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    await prisma.$disconnect();
    throw error;
  });
