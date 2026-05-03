import { supabase } from '../lib/supabaseClient';

export interface Lead {
  id: string;
  contact_id?: string;
  contact_name?: string;
  stage: 'NOVO' | 'QUALIFICADO' | 'PROPOSTA' | 'NEGOCIACAO' | 'GANHO' | 'PERDIDO';
  score: number;
  temperature: 'QUENTE' | 'MORNO' | 'FRIO';
  deal_value?: number | null;
  notes?: string | null;
  funnel_stage?: string;
  organization_id: string;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string;
  contact?: {
    id: string;
    name: string;
    phone_number?: string;
    instagram_username?: string;
  }
}

export interface Conversation {
  id: string;
  contact_id: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'INSTAGRAM';
  status: 'ATIVA' | 'FECHADA' | 'AGUARDANDO_HUMANO';
  is_ai_active: boolean;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

class SupabaseService {
  // Autenticação
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Leads
  async fetchLeads(organizationId: string) {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        contact:contacts(id, name, phone_number, instagram_username)
      `)
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data as Lead[];
  }

  async createLead(leadData: any) {
    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lead;
  }

  async updateLead(id: string, updates: any) {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lead;
  }

  // Conversas
  async fetchConversations(organizationId: string) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)

    if (!contacts || contacts.length === 0) return []

    const contactIds = contacts.map(c => c.id)

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        contact:contacts(
          id,
          name,
          phone_number,
          instagram_username,
          organization_id
        ),
        lead:leads(
          id,
          stage,
          temperature,
          score
        )
      `)
      .in('contact_id', contactIds)
      .order('last_message_at', { ascending: false });
    
    if (error) throw error;
    return data as any as Conversation[];
  }

  async createConversation(conversationData: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Conversation;
  }

  // Perfil
  async fetchProfile() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    return data as Profile;
  }

  async updateProfile(profileData: Partial<Profile>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    if (!user) throw new Error('User not found');
    
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Profile;
  }

  // Upload de arquivos (ex: avatares)
  async uploadAvatar(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // Takeover: assumir conversa (humano assume)
  async takeoverLead(leadId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error('No authentication token');

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/leads/${leadId}/takeover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to takeover' }));
      throw new Error(error.error || 'Failed to takeover lead');
    }

    return response.json();
  }
}

export const supabaseService = new SupabaseService();