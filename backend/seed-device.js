const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');
    
    // Create the device
    const device = await prisma.userDevice.upsert({
      where: { id: 'test-device-id-2' },
      update: { token: 'evohorizonbr_hash', userId: user.id },
      create: {
        id: 'test-device-id-2',
        userId: user.id,
        token: 'evohorizonbr_hash'
      }
    });
    console.log('Created device:', device);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
