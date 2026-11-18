// Compartilhar sonhos com o terapeuta ou com amigos.
// Quem compartilha convida pelo e-mail; quem foi convidado entra com Google e lê (sem editar).
import { supabase, AUDIO_BUCKET, IMAGEM_BUCKET } from './supabase.js';
import { abrirSonho, abrirArquivo } from './armazem.js';
import { cifrar, decifrar } from './cripto.js';
import * as cofre from './cofre.js';

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
  // Sonho trancado abre com a minha chave (a que o dono embrulhou para mim).
  return Promise.all(data.map((row) => abrirSonho(row, row.chave)));
}

export async function urlImagemCompartilhada(ref) {
  const { data, error } = await supabase.storage.from(IMAGEM_BUCKET).createSignedUrl(ref, 60 * 60);
  return error ? null : abrirArquivo(data.signedUrl).catch(() => null);
}

export async function urlAudioCompartilhado(ref) {
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(ref, 60 * 60);
  return error ? null : abrirArquivo(data.signedUrl).catch(() => null);
}

// Texto do convite pelo e-mail, para mandar por WhatsApp ou e-mail.
export function textoConvite(c, sonho) {
  const app = location.origin + '/app/compartilhados';
  return `Compartilhei com você um sonho que anotei no Sonhário${sonho?.titulo?.trim() ? ': “' + sonho.titulo.trim() + '”' : ''}.\n\nPara ver, entre com a sua conta Google (${c.convidado_email}) em:\n${app}\n\nO sonho vai trancado: na primeira vez, o Sonhário pede para você criar uma frase-senha, e só com ela ele abre.`;
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
// Sonho trancado: o link leva a chave depois do "#" (o navegador não manda essa parte ao
// servidor), e o convite guarda o começo do sonho trancado com ela, para a prévia.
export async function criarLink(usuario, { sonho, papel, ver_amplificacoes, aprovar = true }) {
  const token = novoToken();
  const k = sonho._cifrado ? cofre.chaveEmCache(sonho.id) : null;
  const previa = k ? await cifrar({ titulo: (sonho.titulo || '').trim(), trecho: (sonho.texto || '').slice(0, 400) }, k) : null;
  const { error } = await supabase.from('convites').insert({
    token, dono_id: usuario.id, dono_nome: nomeDe(usuario), dono_email: usuario.email || '', sonho_id: sonho.id, papel, ver_amplificacoes, aprovar,
    ...(previa ? { previa } : {}),
  });
  if (error) throw error;
  return location.origin + '/convite/' + token + (k ? '#k=' + await cofre.linkDaChave(k) : '');
}

// A chave que veio no "#" do link, guardada até a pessoa entrar (o login do Google apaga o "#").
const CHAVE_LINK = 'sonhario:chave-do-link:';
export const chaveDoLinkAberto = {
  guardar: (token, k) => { try { localStorage.setItem(CHAVE_LINK + token, k); } catch { /* sem armazenamento */ } },
  pegar: (token) => { try { return localStorage.getItem(CHAVE_LINK + token); } catch { return null; } },
  tirar: (token) => { try { localStorage.removeItem(CHAVE_LINK + token); } catch { /* idem */ } },
};

export async function verConvite(token, chaveTexto) {
  const [{ data, error }, trecho, previa] = await Promise.all([
    supabase.rpc('ver_convite', { chave: token }),
    supabase.rpc('ver_trecho_convite', { chave: token }),
    chaveTexto ? supabase.rpc('ver_previa_convite', { chave: token }) : Promise.resolve({ data: null }),
  ]);
  if (error) throw error;
  const convite = data?.[0] || null;
  if (!convite) return null;
  // O começo do sonho é extra: se não vier, a tela fica como antes.
  let comeco = trecho.data?.[0] || {};
  if (previa.data && chaveTexto) {
    try {
      const p = await decifrar(previa.data, await cofre.chaveDeLink(chaveTexto));
      comeco = { sonho_titulo: p.titulo, sonho_trecho: p.trecho };
    } catch { /* chave errada ou link cortado: só não mostra o começo */ }
  }
  return { ...convite, ...comeco };
}

export async function aceitarConvite(token) {
  const { data, error } = await supabase.rpc('aceitar_convite', { chave: token });
  if (error) throw new Error(error.message);
  return data?.[0];
}

export async function mandarLink(url, avisar) {
  const texto = 'Quero te mostrar um sonho que anotei no Sonhário. Abra o link e entre com a sua conta Google. O sonho vai trancado e só abre para você:\n' + url;
  try { if (navigator.share) { await navigator.share({ text: texto }); return true; } } catch (e) { if (e.name === 'AbortError') return false; }
  try { await navigator.clipboard.writeText(texto); avisar('Link copiado. Cole no WhatsApp ou no e-mail.'); return true; }
  catch { prompt('Copie o link:', url); return false; }
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

/* ---------- terapeuta ---------- */
// A marcação só existe depois que a coluna eh_terapeuta for criada no banco (schema.sql, parte 12).
export const temMarcaTerapeuta = (meus) => meus.some((c) => 'eh_terapeuta' in c);
export const terapeutaDe = (meus) => meus.find((c) => c.eh_terapeuta) || null;

// Só uma pessoa por vez: desmarca quem era antes e marca a nova.
export async function marcarTerapeuta(meus, c, ligar) {
  const antes = terapeutaDe(meus);
  if (antes && antes.id !== c.id) await mudarCompartilhamento(antes.id, { eh_terapeuta: false });
  await mudarCompartilhamento(c.id, { eh_terapeuta: ligar });
}
