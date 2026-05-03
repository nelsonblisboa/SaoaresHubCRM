/**
 * Adicionar lead de teste 5759
 * Execute: node scripts/add-test-lead.js
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', 'backend', '.env') })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ORG_ID = '00000000-0000-0000-0000-000000000001'

async function main() {
  console.log('🔍 Verificando selead 5759 já existe...')
  
  // Verificar se contato existe
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('phone_number', '5511975759599')
    .single()

  let contactId

  if (existingContact) {
    console.log('✅ Contato já existe:', existingContact.id)
    contactId = existingContact.id
  } else {
    // Criar contato
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        name: 'Cliente Teste 5759',
        phone_number: '5511975759599',
        instagram_username: '@cliente5759',
        source: 'manual',
        tags: ['teste', 'manual'],
        organization_id: ORG_ID
      })
      .select()
      .single()

    if (contactError) {
      console.error('❌ Erro ao criar contato:', contactError)
      process.exit(1)
    }

    console.log('✅ Contato criado:', newContact.id)
    contactId = newContact.id
  }

  // Verificar se lead existe
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id')
    .eq('contact_id', contactId)
    .single()

  if (existingLead) {
    console.log('✅ Lead já existe:', existingLead.id)
  } else {
    // Criar lead
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        stage: 'NOVO',
        score: 7,
        temperature: 'MORNO',
        deal_value: 250000,
        notes: 'Lead de teste - Cliente 5759',
        funnel_stage: 'QUALIFICACAO',
        contact_id: contactId,
        organization_id: ORG_ID
      })
      .select()
      .single()

    if (leadError) {
      console.error('❌ Erro ao criar lead:', leadError)
      process.exit(1)
    }

    console.log('✅ Lead criado com sucesso!')
    console.log('   ID:', newLead.id)
    console.log('   Nome: Cliente Teste 5759')
    console.log('   Estágio: NOVO')
    console.log('   Temperatura: MORNO')
    console.log('   Score: 7')
  }

  console.log('\n✨ Lead 5759 está pronto para aparecer no Kanban!')
}

main().catch(console.error)