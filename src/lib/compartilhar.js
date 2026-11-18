// Compartilhar sonhos com o terapeuta ou com amigos.
// Quem compartilha convida pelo e-mail; quem foi convidado entra com Google e lê (sem editar).
import { supabase, AUDIO_BUCKET, IMAGEM_BUCKET } from './supabase.js';

export const PAPEIS = {
  // Terapeuta e amigo funcionam igual: o papel fica guardado só por compatibilidade.
  terapeuta: { rotulo: 'terapeuta ou amigo', grupo: 'Compartilhados' },
  amigo: { rotulo: 'terapeuta ou amigo', grupo: 'Compartilhados' },
};

export const nomeDe = (u) => u?.user_metadata?.full_name || u?.user_metadata?.name || (u?.email || '').split('@')[0];
const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export const fotoDe = (u) => u?.user_metadata?.avatar_url || u?.user_metadata?.picture || '';

// Guarda o meu nome e a minha foto do Google, para quem compartilha comigo me reconhecer.
export async function salvarMeuPerfil(usuario) {
  if (!usuario?.email) return;
  await supabase.from('perfis').upsert({
    id: usuario.id, email: usuario.email.toLowerCase(), nome: nomeDe(usuario), foto: fotoDe(usuario), atualizado_em: new Date().toISOString(),
  });
}

// Os dois lados de uma vez: os convites que eu fiz, os que recebi e o rosto de cada pessoa.
export async function listarCompartilhamentos(usuario) {
  const { data, error } = await supabase.from('compartilhamentos').select('*').order('criado_em');
  if (error) throw error;
  const eu = (usuario.email || '').toLowerCase();
  const { data: ps } = await supabase.rpc('perfis_conectados');
  return {
    meus: data.filter((c) => c.dono_id === usuario.id && !c.pendente),
    // Pedido: pessoa ainda não aprovada, ou já aprovada que pediu um sonho por um link com aprovação.
    pedidos: data.filter((c) => c.dono_id === usuario.id && (c.pendente || c.sonhos_pedidos?.length)),
    comigo: data.filter((c) => c.convidado_email === eu && c.dono_id !== usuario.id && !c.pendente),
    aguardando: data.filter((c) => c.convidado_email === eu && c.dono_id !== usuario.id && c.pendente),
    perfis: Object.fromEntries((ps || []).map((p) => [p.email, p])),
  };
}

// Quem já usa o Sonhário com esse e-mail (só e-mail exato).
export async function perfilPorEmail(email) {
  const e = email.trim().toLowerCase();
  if (!emailValido(e)) return null;
  const { data } = await supabase.rpc('perfil_por_email', { procurado: e });
  return data?.[0] || null;
}

// Nome e foto de uma pessoa: o do Google, se ela já entrou; senão o apelido dado no convite.
export function pessoa(perfis, email, apelido = '') {
  const p = perfis?.[email];
  return { email, nome: p?.nome || apelido || email, foto: p?.foto || '', temConta: !!p };
}

export async function convidar(usuario, { email, nome = '', papel, ver_amplificacoes }) {
  const e = email.trim().toLowerCase();
  if (!emailValido(e)) throw new Error('Confira o e-mail.');
  if (e === (usuario.email || '').toLowerCase()) throw new Error('Esse é o seu próprio e-mail.');
  const { data, error } = await supabase.from('compartilhamentos').insert({
    dono_id: usuario.id, dono_nome: nomeDe(usuario), dono_email: usuario.email || '',
    convidado_email: e, convidado_nome: nome.trim(), papel, escopo: 'escolhidos', ver_amplificacoes,
  }).select().single();
  if (error) throw new Error(error.code === '23505' ? 'Esse e-mail já tem acesso.' : error.message);
  return data;
}

export async function mudarCompartilhamento(id, parcial) {
  const { error } = await supabase.from('compartilhamentos').update(parcial).eq('id', id);
  if (error) throw error;
}

export async function desfazer(id) {
  const { error } = await supabase.from('compartilhamentos').delete().eq('id', id);
  if (error) throw error;
}

export async function sonhosDe(donoId) {
  const { data, error } = await supabase.rpc('sonhos_compartilhados', { dono: donoId });
  if (error) throw error;
  return data;
}

export async function urlImagemCompartilhada(ref) {
  const { data, error } = await supabase.storage.from(IMAGEM_BUCKET).createSignedUrl(ref, 60 * 60);
  return error ? null : data.signedUrl;
}

export async function urlAudioCompartilhado(ref) {
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(ref, 60 * 60);
  return error ? null : data.signedUrl;
}

// Texto do convite pelo e-mail, para mandar por WhatsApp ou e-mail.
export function textoConvite(c, sonho) {
  const app = location.origin + '/app/compartilhados';
  return `Compartilhei com você um sonho que anotei no Sonhário${sonho?.titulo?.trim() ? ': “' + sonho.titulo.trim() + '”' : ''}.\n\nPara ver, entre com a sua conta Google (${c.convidado_email}) em:\n${app}`;
}

// Quem pode ver um sonho meu.
export function quemVe(meus, sonho) {
  return meus.filter((c) => (sonho.compartilhado_com || []).includes(c.convidado_email));
}

// Rótulo da aba: sempre "Compartilhados" (terapeuta e amigo não se diferenciam).
export function rotuloAba() {
  return 'Compartilhados';
}

/* ---------- link de convite ---------- */
const PENDENTE = 'sonhario:convite';
export const convitePendente = {
  guardar: (t) => { try { localStorage.setItem(PENDENTE, t); } catch { /* sem armazenamento */ } },
  pegar: () => { try { const t = localStorage.getItem(PENDENTE); localStorage.removeItem(PENDENTE); return t; } catch { return null; } },
};

function novoToken() {
  const b = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Cria um link. Pode ir para várias pessoas: cada uma vira um pedido para aprovar.
// aprovar: true, cada pessoa vira um pedido; false, entra direto (mas sempre com login).
export async function criarLink(usuario, { sonhoId, papel, ver_amplificacoes, aprovar = true }) {
  const token = novoToken();
  const { error } = await supabase.from('convites').insert({
    token, dono_id: usuario.id, dono_nome: nomeDe(usuario), dono_email: usuario.email || '', sonho_id: sonhoId, papel, ver_amplificacoes, aprovar,
  });
  if (error) throw error;
  return location.origin + '/convite/' + token;
}

export async function verConvite(token) {
  const [{ data, error }, trecho] = await Promise.all([
    supabase.rpc('ver_convite', { chave: token }),
    supabase.rpc('ver_trecho_convite', { chave: token }),
  ]);
  if (error) throw error;
  const convite = data?.[0] || null;
  // O começo do sonho é extra: se não vier, a tela fica como antes.
  return convite && { ...convite, ...(trecho.data?.[0] || {}) };
}

export async function aceitarConvite(token) {
  const { data, error } = await supabase.rpc('aceitar_convite', { chave: token });
  if (error) throw new Error(error.message);
  return data?.[0];
}

export async function mandarLink(url, avisar) {
  const texto = 'Quero te mostrar um sonho que anotei no Sonhário. Abra o link e entre com a sua conta Google:\n' + url;
  try { if (navigator.share) { await navigator.share({ text: texto }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(texto); avisar('Link copiado. Cole no WhatsApp ou no e-mail.'); }
  catch { prompt('Copie o link:', url); }
}

// Recusar: quem não foi aprovada sai; quem já via outros sonhos só perde os pedidos.
export async function recusarPedido(c) {
  if (c.pendente) return desfazer(c.id);
  const { error } = await supabase.from('compartilhamentos').update({ sonhos_pedidos: [] }).eq('id', c.id);
  if (error) throw error;
}

export async function aprovarPedido(id) {
  const { error } = await supabase.rpc('aprovar_pedido', { pedido: id });
  if (error) throw error;
}
