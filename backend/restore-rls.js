const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Restoring schema privileges...');
    await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;`);
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;`);
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;`);
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;`);
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;`);
    
    console.log('Executing supabase_schema.sql...');
    const sql = fs.readFileSync('../supabase_schema.sql', 'utf8');
    
    // Split by statement (crude but usually works for basic files, though functions with $$ can be tricky)
    // Actually, prisma.$executeRawUnsafe can execute multiple statements? No, only one at a time.
    // Let's just restore missing profiles from auth.users:
    console.log('Ensuring organization exists...');
    const orgId = process.env.ORGANIZATION_ID || '00000000-0000-0000-0000-000000000000';
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.organizations (id, name)
      VALUES ('${orgId}', 'Soares Hub')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('Restoring profiles...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.profiles (id, email, name, role, organization_id)
      SELECT id, email, COALESCE(raw_user_meta_data->>'name', 'User'), 'VENDEDOR'::"Role", '${orgId}'
      FROM auth.users
      ON CONFLICT (id) DO NOTHING;
    `);

    // Let's execute the RLS policies manually to ensure they are created
    console.log('Restoring RLS and Triggers...');
    const commands = [
      `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE organizations ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE contacts ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE leads ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE conversations ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE messages ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE handovers ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE sequences ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY`,

      // Profiles
      `CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid()::text = id)`,
      `CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id)`,
      `CREATE POLICY "Org members can view profiles" ON profiles FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::text) AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role IN ('ADMIN', 'GERENTE')))`,

      // Contacts
      `CREATE POLICY "Org members can view contacts" ON contacts FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::text))`,
      `CREATE POLICY "Org members can insert contacts" ON contacts FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::text))`,
      `CREATE POLICY "Org members can update contacts" ON contacts FOR UPDATE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::text))`,

      // Leads
      `CREATE POLICY "Org members can view leads" ON leads FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::text) AND (is_deleted = FALSE OR is_deleted IS NULL))`,
      `CREATE POLICY "Org members can insert leads" ON leads FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::text))`,
      `CREATE POLICY "Org members can update leads" ON leads FOR UPDATE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::text))`,

      // Conversations
      `CREATE POLICY "Org members can view conversations" ON conversations FOR SELECT USING (contact_id IN (SELECT id FROM contacts WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::text)))`,
      `CREATE POLICY "Org members can insert conversations" ON conversations FOR INSERT WITH CHECK (contact_id IN (SELECT id FROM contacts WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::text)))`,

      // Messages
      `CREATE POLICY "Org members can view messages" ON messages FOR SELECT USING (conversation_id IN (SELECT c.id FROM conversations c JOIN contacts ct ON c.contact_id = ct.id WHERE ct.organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()::text)))`
    ];

    for (const cmd of commands) {
      try {
        await prisma.$executeRawUnsafe(cmd);
      } catch (e) {
        if (!e.message.includes('already exists')) {
            console.error('Failed: ' + cmd, e.message);
        }
      }
    }
    
    // Now functions & triggers
    console.log('Functions & Triggers');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    const triggers = [
      `CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
      `CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
      `CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
    ];
    
    for (const t of triggers) {
      try { await prisma.$executeRawUnsafe(t); } catch(e) { }
    }

    console.log("Done");
  } catch (e) {
    console.error(e);
  }
}

run().finally(() => prisma.$disconnect());
