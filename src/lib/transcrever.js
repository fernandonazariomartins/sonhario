// Transcrição depois de gravar, no servidor (função "transcrever" do Supabase).
// Serve para quando o navegador não transcreve ao vivo (ex.: Safari no iPhone).
import { supabase } from './supabase.js';

export const transcricaoNoServidor = !!supabase && import.meta.env.VITE_TRANSCRICAO === '1';

export async function transcreverAudio(blob) {
  const ext = (blob.type.includes('mp4') && 'm4a') || (blob.type.includes('ogg') && 'ogg') || 'webm';
  const fd = new FormData();
  fd.append('audio', blob, 'sonho.' + ext);
  const { data, error } = await supabase.functions.invoke('transcrever', { body: fd });
  if (error) throw error;
  return (data?.texto || '').trim();
}
