const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const res = await prisma.$queryRaw`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`;
  const fs = require('fs');
  fs.writeFileSync('db-schema.json', JSON.stringify(res, null, 2));
}
run().finally(() => prisma.$disconnect());
