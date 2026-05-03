/**
 * SOARES HUB CRM - Instance Service
 * Gerencia mapeamento entre instâncias Evolution API e Organizações
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Busca organizationId baseado na instância do WhatsApp
 * @param {string} instanceName - Nome da instância Evolution API
 * @returns {Promise<string|null>} organizationId
 */
async function getOrganizationByInstance(instanceName) {
  /**
   * Estratégia de descoberta de organização:
   * 1. Busca em tabela de mapeamento (se existir)
   * 2. Decodifica o nome da instância (formato: org_[orgId]_[name])
   * 3. Fallback: busca na tabela userDevice (legado)
   */
  
  try {
    // Estratégia 1: Nome da instância codificado (recomendado)
    // Formato esperado: "org_123e4567-e89b-12d3-a456-426614174000_main"
    if (instanceName?.startsWith('org_')) {
      const parts = instanceName.split('_');
      if (parts.length >= 2) {
        const possibleOrgId = parts[1];
        // Validar se é um UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(possibleOrgId)) {
          const org = await prisma.organization.findUnique({
            where: { id: possibleOrgId }
          });
          if (org) return org.id;
        }
      }
    }

    // Estratégia 2: Busca na tabela userDevice (legado)
    const device = await prisma.userDevice.findFirst({
      where: { token: instanceName },
      include: { user: true }
    });
    
    if (device?.user?.organizationId) {
      return device.user.organizationId;
    }

    // Estratégia 3: Fallback - primeira org (apenas para desenvolvimento!)
    if (process.env.NODE_ENV === 'development') {
      const firstOrg = await prisma.organization.findFirst();
      if (firstOrg) {
        console.warn(`[InstanceService] Usando fallback para organização ${firstOrg.id}. Configure o mapeamento de instâncias!`);
        return firstOrg.id;
      }
    }

    return null;
  } catch (error) {
    console.error('[InstanceService] Erro ao buscar organização:', error);
    return null;
  }
}

/**
 * Registra uma nova instância para uma organização
 * @param {string} instanceName - Nome da instância
 * @param {string} organizationId - ID da organização
 * @param {string} userId - ID do usuário que criou
 */
async function registerInstance(instanceName, organizationId, userId) {
  try {
    // Cria ou atualiza o device
    const device = await prisma.userDevice.upsert({
      where: {
        // Assumindo que token é único
        token: instanceName,
      },
      update: {
        userId,
      },
      create: {
        token: instanceName,
        userId,
      },
    });

    // Atualiza o usuário com a organização (se necessário)
    await prisma.user.update({
      where: { id: userId },
      data: { organizationId },
    });

    return device;
  } catch (error) {
    console.error('[InstanceService] Erro ao registrar instância:', error);
    throw error;
  }
}

module.exports = {
  getOrganizationByInstance,
  registerInstance,
};
