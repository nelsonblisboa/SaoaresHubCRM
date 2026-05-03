const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.$executeRawUnsafe('ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "activeAgent" TEXT;').catch(e => console.log(e.message));
  await prisma.$executeRawUnsafe('ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "agentKey" TEXT;').catch(e => console.log(e.message));
  await prisma.$executeRawUnsafe('ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "dealValue" DOUBLE PRECISION;').catch(e => console.log(e.message));
  await prisma.$executeRawUnsafe('ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "funnelStage" TEXT;').catch(e => console.log(e.message));
  
  console.log('Columns added.');
  await prisma.$disconnect();
}
run();
