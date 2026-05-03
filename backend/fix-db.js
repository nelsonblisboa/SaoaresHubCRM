const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
  console.log('Conectado via Prisma. Atualizando tabelas...');
  
  try {
    // Add columns directly since prisma raw query handles escaping safely
    await prisma.$executeRawUnsafe('ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS persona TEXT;');
    await prisma.$executeRawUnsafe('ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS logo TEXT;');
    await prisma.$executeRawUnsafe('ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT;');
    console.log('Tabela Organization atualizada!');
    
    // Create UserDevice table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserDevice" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
      );
    `);
    
    const orgs = await prisma.$queryRawUnsafe('SELECT id FROM "Organization" LIMIT 1;');
    if (orgs.length > 0) {
      const users = await prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1;`);
      if (users.length > 0) {
        const userId = users[0].id;
        await prisma.$executeRawUnsafe(`INSERT INTO "UserDevice" (id, "userId", token) VALUES ('test-device-id', '${userId}', 'evohorizonbr_hash') ON CONFLICT DO NOTHING;`);
        console.log('Dispositivo vinculado ao webhook com sucesso!');
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
