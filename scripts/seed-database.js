/**
 * SOARES HUB CRM - Script de População do Banco de Dados
 * Execute: node scripts/seed-database.js
 * 
 * Este script cria:
 * - 1 Organização
 * - 3 Usuários (ADMIN, GERENTE, VENDEDOR)
 * - 20 Contatos
 * - 15 Leads em diferentes estágios
 * - 10 Conversas com mensagens
 * - 3 Campanhas
 * - 2 Sequências com passos
 * - Handovers e mensagens agendadas
 */

const path = require('path')
// Carrega variáveis de ambos os .env (backend tem a service_role_key)
require('dotenv').config({ path: path.resolve(__dirname, '..', 'backend', '.env') })
require('dotenv').config({ path: path.resolve(__dirname, '..', 'frontend', '.env') })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

console.log('🔑 Usando chave:', supabaseServiceKey?.substring(0, 20) + '...')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Dados fictícios para teste
const ORG_ID = '00000000-0000-0000-0000-000000000001'

const USERS = [
  {
    email: 'admin@soareshub.com',
    password: 'Admin123!',
    name: 'Nelson Soares',
    role: 'ADMIN'
  },
  {
    email: 'gerente@soareshub.com',
    password: 'Gerente123!',
    name: 'Maria Gerente',
    role: 'GERENTE'
  },
  {
    email: 'vendedor@soareshub.com',
    password: 'Vendedor123!',
    name: 'João Vendedor',
    role: 'VENDEDOR'
  }
]

const CONTACTS = [
  { name: 'Ana Clara Silva', phone: '5511999999901', instagram: 'anaclara_s', source: 'whatsapp' },
  { name: 'Roberto Carlos', phone: '5511999999902', instagram: 'roberto_c', source: 'instagram' },
  { name: 'Marcos Paulo', phone: '5511999999903', instagram: 'marcos_p', source: 'whatsapp' },
  { name: 'Juliana Oliveira', phone: '5511999999904', instagram: 'juliana_o', source: 'instagram' },
  { name: 'Carlos Eduardo', phone: '5511999999905', instagram: 'carlosedu', source: 'whatsapp' },
  { name: 'Fernanda Lima', phone: '5511999999906', instagram: 'fernanda_l', source: 'instagram' },
  { name: 'Ricardo Alves', phone: '5511999999907', instagram: 'ricardo_a', source: 'whatsapp' },
  { name: 'Patrícia Souza', phone: '5511999999908', instagram: 'patricia_s', source: 'instagram' },
  { name: 'Lucas Mendes', phone: '5511999999909', instagram: 'lucas_m', source: 'whatsapp' },
  { name: 'Camila Santos', phone: '5511999999910', instagram: 'camila_s', source: 'instagram' },
  { name: 'Bruno Costa', phone: '5511999999911', instagram: 'bruno_c', source: 'whatsapp' },
  { name: 'Larissa Dias', phone: '5511999999912', instagram: 'larissa_d', source: 'instagram' },
  { name: 'Eduardo Lima', phone: '5511999999913', instagram: 'eduardo_l', source: 'whatsapp' },
  { name: 'Amanda Torres', phone: '5511999999914', instagram: 'amanda_t', source: 'instagram' },
  { name: 'Felipe Rocha', phone: '5511999999915', instagram: 'felipe_r', source: 'whatsapp' },
  { name: 'Bianca Martins', phone: '5511999999916', instagram: 'bianca_m', source: 'instagram' },
  { name: 'Gustavo Henrique', phone: '5511999999917', instagram: 'gustavo_h', source: 'whatsapp' },
  { name: 'Letícia Almeida', phone: '5511999999918', instagram: 'leticia_a', source: 'instagram' },
  { name: 'André Luiz', phone: '5511999999919', instagram: 'andre_l', source: 'whatsapp' },
  { name: 'Priscila Vieira', phone: '5511999999920', instagram: 'priscila_v', source: 'instagram' }
]

const LEADS_DATA = [
  { stage: 'NOVO', score: 3, temp: 'FRIO', dealValue: 150000 },
  { stage: 'NOVO', score: 4, temp: 'FRIO', dealValue: 200000 },
  { stage: 'QUALIFICADO', score: 6, temp: 'MORNO', dealValue: 300000 },
  { stage: 'QUALIFICADO', score: 7, temp: 'MORNO', dealValue: 250000 },
  { stage: 'QUALIFICADO', score: 8, temp: 'QUENTE', dealValue: 180000 },
  { stage: 'PROPOSTA', score: 8, temp: 'QUENTE', dealValue: 450000 },
  { stage: 'PROPOSTA', score: 9, temp: 'QUENTE', dealValue: 350000 },
  { stage: 'PROPOSTA', score: 7, temp: 'MORNO', dealValue: 280000 },
  { stage: 'NEGOCIACAO', score: 9, temp: 'QUENTE', dealValue: 500000 },
  { stage: 'NEGOCIACAO', score: 8, temp: 'QUENTE', dealValue: 320000 },
  { stage: 'NEGOCIACAO', score: 9, temp: 'QUENTE', dealValue: 600000 },
  { stage: 'GANHO', score: 10, temp: 'QUENTE', dealValue: 400000 },
  { stage: 'GANHO', score: 10, temp: 'QUENTE', dealValue: 550000 },
  { stage: 'PERDIDO', score: 2, temp: 'FRIO', dealValue: 150000 },
  { stage: 'PERDIDO', score: 3, temp: 'FRIO', dealValue: 200000 }
]

const MESSAGE_TEMPLATES = {
  whatsapp: [
    'Olá! Vi seu interesse em nossos imóveis. Como posso ajudar?',
    'Tenho ótimas opções no seu orçamento. Podemos agendar uma visita?',
    'Esta propriedade tem exatamente o que você procura!',
    'O que você achou do imóvel que enviamos?',
    'Podemos negociar as condições de pagamento.',
    'Documentação toda pronta, podemos fechar negócio!'
  ],
  instagram: [
    'Oi! Vi que você tem interesse em imóveis. Vamos conversar?',
    'Tenho promoções exclusivas para seguidores do Instagram!',
    'DM aberta para negociações especiais 🏠',
    'Que tal conhecer esse imóvel incrível?',
    'Promoção relâmpago só hoje! Confira'
  ]
}

async function seed() {
  console.log('🌱 Iniciando população do banco de dados...\n')

  try {
    // 1. Criar Organização
    console.log('1️⃣ Criando organização...')
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: ORG_ID,
        name: 'SOARES HUB Imóveis',
        persona: 'Sou um corretor virtual especializado em imóveis de alto padrão. Sou prestativo, profissional e foco em fechar vendas.',
        primary_color: '#10b981'
      })
      .select()
      .single()

    if (orgError) throw orgError
    console.log(`✅ Organização criada: ${org.name}\n`)

    // 2. Criar Usuários (via Auth)
    console.log('2️⃣ Criando usuários...')
    const userIds = {}

    for (const userData of USERS) {
      // Tentar criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { name: userData.name, role: userData.role }
      }).catch(async () => {
        // Se não tem permissão admin, tenta signUp normal
        return await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: { data: { name: userData.name, role: userData.role } }
        })
      })

      if (authData?.user) {
        userIds[userData.role] = authData.user.id
        console.log(`   ✓ ${userData.name} (${userData.role})`)
      } else {
        // Buscar usuário existente
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', userData.email)
          .single()
        
        if (existingUser) {
          userIds[userData.role] = existingUser.id
          console.log(`   ✓ ${userData.name} (${userData.role}) - já existente`)
        }
      }
    }

    // Atualizar profiles com organization_id
    for (const [role, userId] of Object.entries(userIds)) {
      await supabase
        .from('profiles')
        .update({ 
          organization_id: ORG_ID,
          role: role 
        })
        .eq('id', userId)
    }

    console.log('✅ Usuários criados\n')

    // 3. Criar Contatos
    console.log('3️⃣ Criando contatos...')
    const contactIds = []

    for (const contact of CONTACTS) {
      const { data, error } = await supabase
        .from('contacts')
        .upsert({
          name: contact.name,
          phone_number: contact.phone,
          instagram_username: contact.instagram,
          source: contact.source,
          tags: [contact.source, 'teste'],
          organization_id: ORG_ID
        })
        .select()
        .single()

      if (error) {
        // Tentar buscar se já existe
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('phone_number', contact.phone)
          .single()
        
        if (existing) contactIds.push(existing.id)
      } else if (data) {
        contactIds.push(data.id)
      }
    }

    console.log(`✅ ${contactIds.length} contatos criados\n`)

    // 4. Criar Leads
    console.log('4️⃣ Criando leads...')
    const leadIds = []
    const adminId = userIds['ADMIN']
    const vendedorId = userIds['VENDEDOR']

    for (let i = 0; i < LEADS_DATA.length && i < contactIds.length; i++) {
      const leadData = LEADS_DATA[i]
      const { data, error } = await supabase
        .from('leads')
        .upsert({
          stage: leadData.stage,
          score: leadData.score,
          temperature: leadData.temp,
          deal_value: leadData.dealValue,
          notes: `Lead de teste - ${leadData.stage}`,
          funnel_stage: leadData.stage === 'GANHO' ? 'FECHAMENTO' : 
                        leadData.stage === 'NEGOCIACAO' ? 'NEGOCIACAO' :
                        leadData.stage === 'PROPOSTA' ? 'PROPOSTA' : 'QUALIFICACAO',
          contact_id: contactIds[i],
          assigned_to_id: i < 5 ? adminId : (i < 10 ? vendedorId : null),
          organization_id: ORG_ID,
          is_deleted: false
        })
        .select()
        .single()

      if (!error && data) {
        leadIds.push(data.id)
      }
    }

    console.log(`✅ ${leadIds.length} leads criados\n`)

    // 5. Criar Conversas e Mensagens
    console.log('5️⃣ Criando conversas e mensagens...')
    const conversationIds = []

    for (let i = 0; i < Math.min(10, contactIds.length); i++) {
      const channel = i % 2 === 0 ? 'WHATSAPP' : 'INSTAGRAM'
      const status = i < 7 ? 'ATIVA' : (i < 9 ? 'AGUARDANDO_HUMANO' : 'FECHADA')
      const isAiActive = i < 7

      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          status: status,
          channel: channel,
          is_ai_active: isAiActive,
          last_message: MESSAGE_TEMPLATES[channel.toLowerCase()][0],
          last_message_at: new Date(Date.now() - i * 3600000).toISOString(),
          active_agent: isAiActive ? 'Vendas' : null,
          contact_id: contactIds[i],
          lead_id: i < leadIds.length ? leadIds[i] : null
        })
        .select()
        .single()

      if (convError) {
        // Buscar conversa existente
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .eq('contact_id', contactIds[i])
          .single()
        
        if (existing) {
          conversationIds.push(existing.id)
        }
      } else if (conv) {
        conversationIds.push(conv.id)

        // Criar mensagens para esta conversa
        const msgCount = 5 + Math.floor(Math.random() * 10)
        const messages = []

        for (let j = 0; j < msgCount; j++) {
          const fromMe = j % 2 === 0
          const templates = MESSAGE_TEMPLATES[channel.toLowerCase()]
          messages.push({
            content: templates[j % templates.length],
            from_me: fromMe,
            message_type: 'text',
            is_ai_generated: fromMe && isAiActive,
            agent_key: (fromMe && isAiActive) ? 'Vendas' : null,
            timestamp: new Date(Date.now() - (msgCount - j) * 600000).toISOString(),
            conversation_id: conv.id
          })
        }

        await supabase.from('messages').insert(messages)
      }
    }

    console.log(`✅ ${conversationIds.length} conversas criadas com mensagens\n`)

    // 6. Criar Handovers
    console.log('6️⃣ Criando handovers...')
    for (let i = 0; i < Math.min(3, conversationIds.length); i++) {
      await supabase
        .from('handovers')
        .insert({
          reason: i === 0 ? 'Cliente solicitou falar com humano' : 
                   i === 1 ? 'IA não conseguiu qualificar' : 'Preço muito alto, escalar',
          status: i === 0 ? 'PENDENTE' : 'ACEITO',
          conversation_id: conversationIds[i],
          requested_by: 'IA',
          resolved_at: i > 0 ? new Date().toISOString() : null
        })
    }
    console.log('✅ Handovers criados\n')

    // 7. Criar Campanhas
    console.log('7️⃣ Criando campanhas...')
    const campaigns = [
      {
        name: 'Welcome WhatsApp - Outubro',
        channel: 'WHATSAPP',
        status: 'CONCLUIDA',
        segment: { temperature: ['QUENTE', 'MORNO'] },
        ai_prompt: 'Crie uma mensagem de boas-vindas personalizada oferecendo nossos melhores imóveis',
        total_sent: 150,
        total_delivered: 145,
        total_replied: 45,
        total_converted: 8,
        scheduled_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        organization_id: ORG_ID
      },
      {
        name: 'Follow-up Instagram - Leads Frios',
        channel: 'INSTAGRAM',
        status: 'RASCUNHO',
        segment: { temperature: ['FRIO'] },
        ai_prompt: 'Mensagem casual para reaquecer lead frio do Instagram',
        total_sent: 0,
        total_delivered: 0,
        total_replied: 0,
        total_converted: 0,
        organization_id: ORG_ID
      },
      {
        name: 'Black Friday Imóveis 2026',
        channel: 'WHATSAPP',
        status: 'AGENDADA',
        segment: { stage: ['QUALIFICADO', 'PROPOSTA'] },
        ai_prompt: 'Oferta especial de Black Friday com descontos exclusivos',
        total_sent: 0,
        total_delivered: 0,
        total_replied: 0,
        total_converted: 0,
        scheduled_at: new Date(Date.now() + 3 * 86400000).toISOString(),
        organization_id: ORG_ID
      }
    ]

    const { data: campData, error: campError } = await supabase
      .from('campanhas')
      .insert(campaigns)
      .select()

    if (!campError && campData) {
      console.log(`✅ ${campData.length} campanhas criadas\n`)

      // 8. Criar Sequências
      console.log('8️⃣ Criando sequências de follow-up...')
      
      const sequences = [
        {
          name: 'Reengajamento Lead Frio',
          trigger: 'lead_cold_7days',
          is_active: true,
          organization_id: ORG_ID
        },
        {
          name: 'Pós-venda Ganho',
          trigger: 'lead_won_1day',
          is_active: true,
          organization_id: ORG_ID
        }
      ]

      for (const seq of sequences) {
        const { data: seqData, error: seqError } = await supabase
          .from('sequences')
          .insert(seq)
          .select()
          .single()

        if (!seqError && seqData) {
          // Criar passos da sequência
          const steps = seq.trigger.includes('cold') 
            ? [
                { order: 1, delay_minutes: 1440, message_template: 'Olá! Vi que você ainda não decidiu. Tenho novas opções para você!', use_ai: false, channel: 'WHATSAPP' },
                { order: 2, delay_minutes: 2880, message_template: null, use_ai: true, ai_prompt: 'Crie uma mensagem personalizada tentando reaquecer este lead', channel: 'WHATSAPP' },
                { order: 3, delay_minutes: 4320, message_template: 'Última chance! Promoção especial válida até amanhã.', use_ai: false, channel: 'WHATSAPP' }
              ]
            : [
                { order: 1, delay_minutes: 1440, message_template: 'Parabéns pela compra! Como posso ajudar com seu novo imóvel?', use_ai: false, channel: 'WHATSAPP' },
                { order: 2, delay_minutes: 10080, message_template: null, use_ai: true, ai_prompt: 'Peça uma indicação para o cliente satisfeito', channel: 'WHATSAPP' }
              ]

          for (const step of steps) {
            await supabase
              .from('sequence_steps')
              .insert({
                ...step,
                sequence_id: seqData.id
              })
          }

          // Criar enrollments para alguns leads
          const leadsToEnroll = leadIds.filter((_, idx) => 
            seq.trigger.includes('cold') ? LEADS_DATA[idx]?.temp === 'FRIO' : LEADS_DATA[idx]?.stage === 'GANHO'
          ).slice(0, 3)

          for (const leadId of leadsToEnroll) {
            const lead = await supabase.from('leads').select('contact_id').eq('id', leadId).single()
            if (lead.data) {
              await supabase
                .from('sequence_enrollments')
                .insert({
                  sequence_id: seqData.id,
                  contact_id: lead.data.contact_id,
                  current_step: 1,
                  status: 'ACTIVE',
                  next_run_at: new Date(Date.now() + 86400000).toISOString()
                })
            }
          }
        }
      }
      console.log('✅ Sequências e passos criados\n')
    }

    // 9. Criar Mensagens Agendadas
    console.log('9️⃣ Criando mensagens agendadas...')
    for (let i = 0; i < 5; i++) {
      await supabase
        .from('scheduled_messages')
        .insert({
          content: `Lembrete ${i + 1}: Não esqueça de retornar ao cliente!`,
          channel: i % 2 === 0 ? 'WHATSAPP' : 'INSTAGRAM',
          status: 'PENDING',
          scheduled_at: new Date(Date.now() + (i + 1) * 3600000).toISOString(),
          contact_id: contactIds[i % contactIds.length]
        })
    }
    console.log('✅ Mensagens agendadas criadas\n')

    // 10. Criar User Devices (para push notifications)
    console.log('🔟 Criando dispositivos de usuários...')
    for (const [role, userId] of Object.entries(userIds)) {
      await supabase
        .from('user_devices')
        .insert({
          user_id: userId,
          token: `fake-push-token-${role.toLowerCase()}-${Date.now()}`
        })
    }
    console.log('✅ Dispositivos criados\n')

    console.log('🎉 Banco de dados populado com sucesso!')
    console.log('\n📊 Resumo:')
    console.log(`   - 1 Organização`)
    console.log(`   - ${Object.keys(userIds).length} Usuários`)
    console.log(`   - ${contactIds.length} Contatos`)
    console.log(`   - ${leadIds.length} Leads`)
    console.log(`   - ${conversationIds.length} Conversas com mensagens`)
    console.log(`   - 3 Campanhas`)
    console.log(`   - 2 Sequências com passos`)
    console.log(`   - 5 Mensagens agendadas`)
    console.log('\n🔑 Credenciais de acesso:')
    console.log('   Admin: admin@soareshub.com / Admin123!')
    console.log('   Gerente: gerente@soareshub.com / Gerente123!')
    console.log('   Vendedor: vendedor@soareshub.com / Vendedor123!')

  } catch (error) {
    console.error('❌ Erro durante a população:', error.message)
    console.error(error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seed()
}

module.exports = { seed }
