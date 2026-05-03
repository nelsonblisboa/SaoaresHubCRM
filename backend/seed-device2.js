const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const org = await prisma.organization.create({
      data: { name: 'Evo Horizon BR' }
    });
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@evohorizon.com.br',
        name: 'Admin',
        role: 'ADMIN',
        organizationId: org.id
      }
    });
    
    const device = await prisma.userDevice.upsert({
      where: { id: 'test-device-id-2' },
      update: { token: 'evohorizonbr_hash', userId: user.id },
      create: {
        id: 'test-device-id-2',
        userId: user.id,
        token: 'evohorizonbr_hash'
      }
    });
    console.log('Seed completo:', { org: org.id, user: user.id, device: device.token });
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
