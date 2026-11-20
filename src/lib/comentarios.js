// Comentários nos sonhos compartilhados (bloco 13 do supabase/schema.sql).
// Cada pessoa que recebeu o sonho tem a sua conversa com o dono (leitor_email).
// "privado": nota que só quem escreveu vê.
// Com a chave do sonho à mão (dono ou quem recebeu), o texto vai trancado.
import { supabase } from './supabase.js';
import { cifrar, decifrar, ehCifrado } from './cripto.js';
import { chaveEmCache } from './cofre.js';
import { tr, locale } from './i18n.js';

async function abrirTexto(c) {
  if (!ehCifrado(c.texto)) return c;
  const k = chaveEmCache(c.sonho_id);
  if (!k) return { ...c, texto: tr("(comentário trancado)"), _trancado: true };
  try { return { ...c, texto: await decifrar(c.texto, k) }; } catch { return { ...c, texto: tr("(comentário trancado)"), _trancado: true }; }
}
async function fecharTexto(sonhoId, texto) {
  const k = chaveEmCache(sonhoId);
  return k ? cifrar(texto, k) : texto;
}

const semTabela = (e) => /comentarios|vejo_sonho|ver_comentarios/.test(e?.message || '') && /exist|schema cache|find/i.test(e?.message || '');

export async function comentariosDoSonho(sonhoId) {
  const { data, error } = await supabase.from('comentarios').select('*').eq('sonho_id', sonhoId).order('criado_em');
  if (error) { if (semTabela(error)) return null; throw error; }
  return Promise.all(data.map(abrirTexto));
}

// Resumo por sonho para os indicadores do mural e da lista: { [sonho_id]: { total, novos } }.
// Dono: as conversas dos meus sonhos. Quem recebeu: as minhas conversas nos sonhos desse dono.
export async function resumoComentarios({ donoId, leitorEmail, meuId }) {
  if (!supabase) return {};
  let q = supabase.from('comentarios').select('sonho_id, autor_id, visto, privado').eq('dono_id', donoId);
  if (leitorEmail) q = q.eq('leitor_email', leitorEmail);
  const { data, error } = await q;
  if (error) return {};
  const r = {};
  for (const c of data) {
    if (c.privado && c.autor_id !== meuId) continue;
    const x = (r[c.sonho_id] ||= { total: 0, novos: 0 });
    x.total += 1;
    if (!c.visto && !c.privado && c.autor_id !== meuId) x.novos += 1;
  }
  return r;
}

export async function comentar({ sonhoId, texto, privado = false, leitorEmail = '' }) {
  const { data, error } = await supabase.from('comentarios')
    .insert({ sonho_id: sonhoId, texto: await fecharTexto(sonhoId, texto.trim()), privado, leitor_email: leitorEmail || '' })
    .select().single();
  if (error) throw new Error(semTabela(error) ? tr("Os comentários ainda não estão ativos no banco (bloco 13 do schema.sql).") : error.message);
  return abrirTexto(data);
}

export async function editarComentario(id, parcial, sonhoId) {
  const p = { ...parcial };
  if (typeof p.texto === 'string' && sonhoId) p.texto = await fecharTexto(sonhoId, p.texto);
  const { data, error } = await supabase.from('comentarios').update(p).eq('id', id).select().single();
  if (error) throw error;
  return abrirTexto(data);
}

export async function apagarComentario(id) {
  const { error } = await supabase.from('comentarios').delete().eq('id', id);
  if (error) throw error;
}

export async function marcarVistos(sonhoId) {
  await supabase.rpc('ver_comentarios', { sonho: sonhoId });
}

// Agrupa por conversa (uma por pessoa que recebeu o sonho).
export function conversas(lista) {
  const m = new Map();
  for (const c of lista) {
    if (c.privado) continue;
    if (!m.has(c.leitor_email)) m.set(c.leitor_email, []);
    m.get(c.leitor_email).push(c);
  }
  return [...m.entries()].map(([email, itens]) => ({ email, itens }));
}

export function quando(iso) {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const hora = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (mesmoDia) return tr("hoje, ") + hora;
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return tr("ontem, ") + hora;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', ...(d.getFullYear() !== hoje.getFullYear() ? { year: 'numeric' } : {}) });
}
