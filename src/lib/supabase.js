import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sem as variáveis, o app roda só no modo sem conta (como o Torvilo).
export const supabase = url && key ? createClient(url, key) : null;

export const AUDIO_BUCKET = 'audios';

export function entrarComGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.origin + '/app' },
  });
}

export function sair() {
  return supabase.auth.signOut();
}
