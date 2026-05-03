const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const res = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'contacts'`;
  console.log(res);
}
run().finally(() => prisma.$disconnect());
