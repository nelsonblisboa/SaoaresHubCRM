const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Conectado. Atualizando tabelas...');
  
  try {
    await client.query('ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS persona TEXT;');
    await client.query('ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS logo TEXT;');
    await client.query('ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT;');
    
    console.log('Tabela Organization atualizada!');
    
    // Create UserDevice table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "UserDevice" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
      );
    `);
    
    const orgRes = await client.query('SELECT id FROM "Organization" LIMIT 1;');
    if (orgRes.rows.length > 0) {
      const orgId = orgRes.rows[0].id;
      const userRes = await client.query(`SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1;`);
      if (userRes.rows.length > 0) {
        const userId = userRes.rows[0].id;
        
        await client.query(`INSERT INTO "UserDevice" (id, "userId", token) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`, 
            ['test-device-id', userId, 'evohorizonbr_hash']);
        console.log('Dispositivo vinculado ao webhook com sucesso!');
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
