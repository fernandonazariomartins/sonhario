import { createClient } from '@supabase/supabase-js';
import { DEMO, clienteDemo } from './demo.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sem as variáveis, o app roda só no modo sem conta (como o Torvilo).
// Na demonstração (/demo), um banco de mentira na memória toma o lugar do Supabase.
export const supabase = DEMO ? clienteDemo : url && key ? createClient(url, key) : null;

export const AUDIO_BUCKET = 'audios';
export const IMAGEM_BUCKET = 'imagens';

export function entrarComGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.origin + '/app' },
  });
}

export function sair() {
  return supabase.auth.signOut();
}
