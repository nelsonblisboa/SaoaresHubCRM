const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function run() {
  try {
    const res = await prisma.$queryRaw`SELECT * FROM app_settings`;
    fs.writeFileSync('app_settings_backup.json', JSON.stringify(res, null, 2));
    console.log("Backup successful");
  } catch (e) {
    console.error(e);
  }
}
run().finally(() => prisma.$disconnect());
