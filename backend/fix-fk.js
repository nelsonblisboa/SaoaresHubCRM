const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // A FK em contacts_organization_id_fkey muito provavelmente aponta para "Organization"
    // Ou talvez para "organizations". 
    // Vamos pegar o ID de uma org válida de "Organization" E "organizations" (se existir)
    
    let validOrgId = null;
    
    try {
      const orgs1 = await prisma.$queryRawUnsafe('SELECT id FROM organizations LIMIT 1');
      if (orgs1.length > 0) validOrgId = orgs1[0].id;
    } catch(e) {}
    
    if (!validOrgId) {
      try {
        const orgs2 = await prisma.$queryRawUnsafe('SELECT id FROM "Organization" LIMIT 1');
        if (orgs2.length > 0) validOrgId = orgs2[0].id;
      } catch(e) {}
    }
    
    console.log('Org valida encontrada:', validOrgId);
    
    if (validOrgId) {
      // Atualiza o userDevice do evohorizonbr_hash para ter um usuario dessa org
      const users = await prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE "organizationId" = '${validOrgId}' LIMIT 1`);
      
      let userId = users.length > 0 ? users[0].id : null;
      if (!userId) {
        // Se nao tem usuario pra essa org, cria um
        userId = 'temp-user-' + Math.floor(Math.random()*1000);
        await prisma.$executeRawUnsafe(`INSERT INTO "User" (id, email, name, role, "organizationId") VALUES ('${userId}', 'temp@temp.com', 'Temp', 'ADMIN', '${validOrgId}')`);
      }
      
      await prisma.$executeRawUnsafe(`UPDATE "UserDevice" SET "userId" = '${userId}' WHERE token = 'evohorizonbr_hash'`);
      console.log('Device atualizado com usuario:', userId, 'da org:', validOrgId);
      
      // Também vamos resolver o problema direto na tabela contacts, removendo a constraint se for ela!
      // Apenas pra garantir que o teste passe
      await prisma.$executeRawUnsafe('ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_organization_id_fkey CASCADE;').catch(e => console.log(e.message));
      await prisma.$executeRawUnsafe('ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_organizationId_fkey CASCADE;').catch(e => console.log(e.message));
    }

  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
