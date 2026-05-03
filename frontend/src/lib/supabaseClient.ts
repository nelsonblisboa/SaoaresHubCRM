import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente são injetadas pelo Vite a partir do .env
// Certifique-se de que o arquivo .env na raiz do projeto contenha:
// VITE_SUPABASE_URL=https://joxsdkjbbvdjzelxjnxk.supabase.co
// VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Tipos para o nosso banco de dados
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          contact_id: string;
          stage: 'NOVO' | 'QUALIFICADO' | 'PROPOSTA' | 'NEGOCIACAO' | 'GANHO' | 'PERDIDO';
          score: number;
          temperature: 'QUENTE' | 'MORNO' | 'FRIO';
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          stage?: 'NOVO' | 'QUALIFICADO' | 'PROPOSTA' | 'NEGOCIACAO' | 'GANHO' | 'PERDIDO';
          score?: number;
          temperature?: 'QUENTE' | 'MORNO' | 'FRIO';
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          stage?: 'NOVO' | 'QUALIFICADO' | 'PROPOSTA' | 'NEGOCIACAO' | 'GANHO' | 'PERDIDO';
          score?: number;
          temperature?: 'QUENTE' | 'MORNO' | 'FRIO';
          organization_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          contact_id: string;
          channel: 'WHATSAPP' | 'EMAIL' | 'INSTAGRAM';
          status: 'ATIVA' | 'FECHADA' | 'AGUARDANDO_HUMANO';
          is_ai_active: boolean;
          last_message: string | null;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          channel?: 'WHATSAPP' | 'EMAIL' | 'INSTAGRAM';
          status?: 'ATIVA' | 'FECHADA' | 'AGUARDANDO_HUMANO';
          is_ai_active?: boolean;
          last_message?: string | null;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          channel?: 'WHATSAPP' | 'EMAIL' | 'INSTAGRAM';
          status?: 'ATIVA' | 'FECHADA' | 'AGUARDANDO_HUMANO';
          is_ai_active?: boolean;
          last_message?: string | null;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}