const { createClient } = require('@supabase/supabase-js');

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente público (para frontend)
const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente com service role (para operações administrativas no backend)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Funções utilitárias
const supabaseService = {
  // Cliente público
  get client() {
    return supabase;
  },

  // Cliente administrativo
  get admin() {
    return supabaseAdmin;
  },

  // Buscar dados com tratamento de erros
  async fetch(table, params = {}) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('is_deleted', false);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching from ${table}:`, error);
      throw error;
    }
  },

  // Inserir dados
  async insert(table, data) {
    try {
      const { data: insertedData, error } = await supabase
        .from(table)
        .insert(data)
        .select();
      
      if (error) throw error;
      return insertedData;
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  },

  // Atualizar dados
  async update(table, id, data) {
    try {
      const { data: updatedData, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return updatedData;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  },

  // Deletar dados (soft delete)
  async softDelete(table, id) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update({ is_deleted: true, deleted_at: new Date() })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error soft deleting from ${table}:`, error);
      throw error;
    }
  },

  // Autenticação
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Obter usuário atual
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }
};

module.exports = supabaseService;