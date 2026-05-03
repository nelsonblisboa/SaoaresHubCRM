const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    console.log("Dropping duplicate camelCase tables...");
    const tablesToDrop = [
      'Campanha', 'Contact', 'Conversation', 'Handover', 'Lead', 'Message', 
      'Organization', 'ScheduledMessage', 'Sequence', 'SequenceEnrollment', 
      'SequenceStep', 'UserDevice'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`Dropped ${table}`);
      } catch (e) {
        console.log(`Could not drop ${table}: ${e.message}`);
      }
    }

    console.log("Emptying actual snake_case tables to allow Prisma to alter them...");
    const actualTables = [
      'sequence_enrollments', 'sequence_steps', 'sequences',
      'scheduled_messages', 'handovers', 'messages', 'conversations',
      'leads', 'contacts', 'campanhas'
    ];

    for (const table of actualTables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`Truncated ${table}`);
      } catch (e) {
        console.log(`Could not truncate ${table}: ${e.message}`);
      }
    }
    console.log("Done");
  } catch (e) {
    console.error(e);
  }
}
run().finally(() => prisma.$disconnect());
