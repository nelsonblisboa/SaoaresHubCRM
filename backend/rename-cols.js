const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // Renomear colunas para camelCase para o Prisma não quebrar
    await prisma.$executeRawUnsafe('ALTER TABLE contacts RENAME COLUMN phone_number TO "phoneNumber";').catch(()=>console.log('phoneNumber ja ok'));
    await prisma.$executeRawUnsafe('ALTER TABLE contacts RENAME COLUMN created_at TO "createdAt";').catch(()=>console.log('createdAt ja ok'));
    await prisma.$executeRawUnsafe('ALTER TABLE contacts RENAME COLUMN organization_id TO "organizationId";').catch(()=>console.log('organizationId ja ok'));

    await prisma.$executeRawUnsafe('ALTER TABLE "Conversation" RENAME COLUMN created_at TO "createdAt";').catch(()=>console.log('Conv createdAt ja ok'));
    await prisma.$executeRawUnsafe('ALTER TABLE "Conversation" RENAME COLUMN last_message_at TO "lastMessageAt";').catch(()=>console.log('lastMessageAt ja ok'));
    await prisma.$executeRawUnsafe('ALTER TABLE "Conversation" RENAME COLUMN is_ai_active TO "isAiActive";').catch(()=>console.log('isAiActive ja ok'));
    
    await prisma.$executeRawUnsafe('ALTER TABLE "Lead" RENAME COLUMN created_at TO "createdAt";').catch(()=>console.log('Lead createdAt ja ok'));
    await prisma.$executeRawUnsafe('ALTER TABLE "Lead" RENAME COLUMN updated_at TO "updatedAt";').catch(()=>console.log('Lead updatedAt ja ok'));
    await prisma.$executeRawUnsafe('ALTER TABLE "Lead" RENAME COLUMN organization_id TO "organizationId";').catch(()=>console.log('Lead orgId ja ok'));

    await prisma.$executeRawUnsafe('ALTER TABLE "Message" RENAME COLUMN created_at TO "timestamp";').catch(()=>console.log('Msg timestamp ja ok'));
    await prisma.$executeRawUnsafe('ALTER TABLE "Message" RENAME COLUMN is_ai_generated TO "isAiGenerated";').catch(()=>console.log('Msg isAiGen ja ok'));

    console.log('Colunas renomeadas para camelCase com sucesso!');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
