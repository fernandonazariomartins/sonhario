// Compartilhar sonhos com o terapeuta ou com amigos.
// Quem compartilha convida pelo e-mail; quem foi convidado entra com Google e lê (sem editar).
import { supabase, AUDIO_BUCKET } from './supabase.js';

export const PAPEIS = {
  terapeuta: { rotulo: 'terapeuta', grupo: 'Pacientes' },
  amigo: { rotulo: 'amigo ou amiga', grupo: 'Amigos' },
};

export const ESCOPOS = {
  todos: 'Todos os sonhos',
  escolhidos: 'Só os que eu escolher',
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
    meus: data.filter((c) => c.dono_id === usuario.id),
    comigo: data.filter((c) => c.convidado_email === eu && c.dono_id !== usuario.id),
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

export async function convidar(usuario, { email, nome = '', papel, escopo, ver_amplificacoes }) {
  const e = email.trim().toLowerCase();
  if (!emailValido(e)) throw new Error('Confira o e-mail.');
  if (e === (usuario.email || '').toLowerCase()) throw new Error('Esse é o seu próprio e-mail.');
  const { data, error } = await supabase.from('compartilhamentos').insert({
    dono_id: usuario.id, dono_nome: nomeDe(usuario), dono_email: usuario.email || '',
    convidado_email: e, convidado_nome: nome.trim(), papel, escopo, ver_amplificacoes,
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

export async function urlAudioCompartilhado(ref) {
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(ref, 60 * 60);
  return error ? null : data.signedUrl;
}

// Texto do convite, para mandar por WhatsApp ou e-mail.
export function textoConvite(c) {
  const app = location.origin + '/app/compartilhados';
  const quem = c.papel === 'terapeuta' ? 'Compartilhei com você o meu caderno de sonhos no Sonhário, para acompanharmos nas sessões.' : 'Compartilhei com você alguns dos meus sonhos no Sonhário.';
  return `${quem}\n\nPara ver, entre com a sua conta Google (${c.convidado_email}) em:\n${app}`;
}

// Quem pode ver um sonho meu.
export function quemVe(meus, sonho) {
  return meus.filter((c) => c.escopo === 'todos' || (sonho.compartilhado_com || []).includes(c.convidado_email));
}

// Rótulo da aba: "Pacientes", "Amigos" ou "Compartilhados" quando há dos dois.
export function rotuloAba(comigo) {
  const papeis = new Set(comigo.map((c) => c.papel));
  return papeis.size === 1 ? PAPEIS[[...papeis][0]].grupo : 'Compartilhados';
}
