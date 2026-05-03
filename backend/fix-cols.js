const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // Drop the new camelCase columns we created by mistake
    await prisma.$executeRawUnsafe('ALTER TABLE contacts DROP COLUMN IF EXISTS "phoneNumber";');
    await prisma.$executeRawUnsafe('ALTER TABLE contacts DROP COLUMN IF EXISTS "organizationId";');
    // I think createdAt was renamed successfully because it wasn't added by mistake? 
    // Wait, let's drop it if it's there and empty, no wait, what if it was renamed?
    // In check-cols output: we have 'createdAt' but NO 'created_at'! It was successfully renamed!
    // So ONLY phoneNumber and organizationId are duplicated!
    
    // Drop the duplicates
    console.log('Dropped duplicate columns');
    
    // Now rename the snake_case ones to camelCase
    await prisma.$executeRawUnsafe('ALTER TABLE contacts RENAME COLUMN phone_number TO "phoneNumber";').catch(e => console.log('Rename phone error:', e.message));
    await prisma.$executeRawUnsafe('ALTER TABLE contacts RENAME COLUMN organization_id TO "organizationId";').catch(e => console.log('Rename org error:', e.message));
    
    // Let's also check Lead table just in case
    const leadCols = await prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name='Lead'");
    console.log('Lead columns:', leadCols);
    
    // Let's also check Conversation table
    const convCols = await prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name='Conversation'");
    console.log('Conversation columns:', convCols);

  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
