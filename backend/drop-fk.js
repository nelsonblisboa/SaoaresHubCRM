const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.$executeRawUnsafe('ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_organization_id_fkey CASCADE;').catch(e => console.log(e.message));
  await prisma.$executeRawUnsafe('ALTER TABLE contacts DROP CONSTRAINT IF EXISTS "contacts_organizationId_fkey" CASCADE;').catch(e => console.log(e.message));
  
  console.log('Constraints dropped.');
  await prisma.$disconnect();
}
run();
