const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const res = await prisma.$queryRawUnsafe(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='contacts'`);
    console.log('Columns in contacts:', res);
    
    // Add missing columns if they don't exist
    await prisma.$executeRawUnsafe('ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT UNIQUE;');
    await prisma.$executeRawUnsafe('ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "instagram_username" TEXT UNIQUE;');
    await prisma.$executeRawUnsafe('ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "source" TEXT;');
    await prisma.$executeRawUnsafe('ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;');
    
    // Also add to conversations just in case
    await prisma.$executeRawUnsafe('ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "channel" TEXT DEFAULT \'WHATSAPP\';');
    await prisma.$executeRawUnsafe('ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "isAiActive" BOOLEAN DEFAULT true;');
    
    console.log('Tabelas atualizadas com segurança!');
  } catch(e) { console.error(e); } finally { await prisma.$disconnect(); }
}
run();
