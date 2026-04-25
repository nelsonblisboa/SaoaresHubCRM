import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente são injetadas pelo Vite a partir do .env
// Certifique‑se de que o arquivo .env na raiz do projeto contenha:
// VITE_SUPABASE_URL=&#60;url do supabase&#62;
// VITE_SUPABASE_ANON_KEY=&#60;chave anônima&#62;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);