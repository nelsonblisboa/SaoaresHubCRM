const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.$executeRawUnsafe('ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_contactId_fkey" CASCADE;').catch(e => console.log(e.message));
  await prisma.$executeRawUnsafe('ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_leadId_fkey" CASCADE;').catch(e => console.log(e.message));
  await prisma.$executeRawUnsafe('ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_conversationId_fkey" CASCADE;').catch(e => console.log(e.message));
  await prisma.$executeRawUnsafe('ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_contactId_fkey" CASCADE;').catch(e => console.log(e.message));
  await prisma.$executeRawUnsafe('ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_assignedToId_fkey" CASCADE;').catch(e => console.log(e.message));
  await prisma.$executeRawUnsafe('ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_organizationId_fkey" CASCADE;').catch(e => console.log(e.message));
  
  console.log('Constraints dropped.');
  await prisma.$disconnect();
}
run();
