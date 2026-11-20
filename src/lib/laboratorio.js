// Laboratório onírico: observações extras que só aparecem para quem digita a senha na busca.
// Cada pessoa vê as do próprio acervo. Abrir fica guardado na conta (perfis.laboratorio)
// e no aparelho; sem conta, só no aparelho.
import { supabase } from './supabase.js';
import { normalizar } from './coresTema.js';

const SENHA = 'laboratorioonirico';
const chave = (uid) => 'sonhario:laboratorio:' + (uid || 'aparelho');

// Aceita com ou sem acento, maiúsculas e espaços: "Laboratório Onírico" também vale.
export const ehSenha = (texto) => normalizar(String(texto || '')).replace(/[^a-z]/g, '') === SENHA;

export function lerNoAparelho(uid) {
  try { return localStorage.getItem(chave(uid)) === '1'; } catch { return false; }
}
function guardarNoAparelho(uid, aberto) {
  try { if (aberto) localStorage.setItem(chave(uid), '1'); else localStorage.removeItem(chave(uid)); } catch { /* sem armazenamento */ }
}

export async function lerLaboratorio(usuario) {
  const aqui = lerNoAparelho(usuario?.id);
  if (!usuario || !supabase) return aqui;
  const { data, error } = await supabase.from('perfis').select('laboratorio').eq('id', usuario.id).maybeSingle();
  if (error) return aqui;
  const naConta = !!data?.laboratorio;
  guardarNoAparelho(usuario.id, naConta);
  return naConta;
}

export async function definirLaboratorio(usuario, aberto) {
  guardarNoAparelho(usuario?.id, aberto);
  if (!usuario || !supabase) return;
  await supabase.from('perfis').update({ laboratorio: aberto }).eq('id', usuario.id);
}
