// Migration: adiciona colunas de credenciais Instagram na tabela organizations
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') })

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrate() {
  console.log('🔧 Executando migration: colunas Instagram em organizations...')

  // Adiciona as 3 colunas via SQL direto (ALTER TABLE IF NOT EXISTS é idempotente)
  const { data, error } = await sb.rpc('exec_sql', {
    sql: `
      ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS instagram_username TEXT,
        ADD COLUMN IF NOT EXISTS instagram_password TEXT,
        ADD COLUMN IF NOT EXISTS instagram_service_url TEXT DEFAULT 'http://localhost:8000';
    `
  })

  if (error) {
    // Fallback: tenta via query direta caso exec_sql não exista
    console.log('ℹ️  RPC exec_sql não disponível — use o SQL Editor do Supabase com o script abaixo:')
    console.log(`
-- Cole no SQL Editor do Supabase (https://supabase.com/dashboard):
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS instagram_username TEXT,
  ADD COLUMN IF NOT EXISTS instagram_password TEXT,
  ADD COLUMN IF NOT EXISTS instagram_service_url TEXT DEFAULT 'http://localhost:8000';
    `)
    return
  }

  console.log('✅ Colunas adicionadas com sucesso:', data)
}

migrate()
