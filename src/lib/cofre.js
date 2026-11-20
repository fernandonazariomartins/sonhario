// O cofre da pessoa: o par de chaves e as chaves dos sonhos já abertos neste aparelho.
// Estados: 'indisponivel' (sem conta, ou o banco ainda sem o bloco 14: tudo como antes),
// 'sem-chaves' (precisa criar a frase-senha), 'trancado' (tem chaves, mas este aparelho
// ainda não recebeu a frase-senha) e 'aberto'.
import { supabase } from './supabase.js';
import {
  criarPar, exportarPublica, importarPublica, trancarPrivada, abrirPrivada, normalizarSenha,
  novoCodigoRecuperacao, normalizarCodigo, novaChaveSonho, embrulhar, desembrulhar, chaveParaLink, chaveDoLink,
} from './cripto.js';
import { tr } from './i18n.js';

let dono = null; // user id
let modo = 'basico'; // 'basico': o servidor guarda o código de recuperação; 'avancado': só a pessoa guarda
let meuEmail = '';
let publica = null;
let privada = null;
const chavesSonhos = new Map(); // sonho_id -> CryptoKey (AES)

let estadoAtual = 'carregando';
let lendo = Promise.resolve();
export const estadoDoCofre = () => estadoAtual;
// Quem vai salvar espera o cofre ser lido: nada sai aberto por pressa.
export const esperarCofre = () => lendo;

export const temPublica = () => !!publica;
export const modoAtual = () => modo;
export const estaAberto = () => !!privada;
export const chaveEmCache = (id) => chavesSonhos.get(id) || null;
export const guardarEmCache = (id, k) => { chavesSonhos.set(id, k); };

/* ---------- chave privada guardada no aparelho (IndexedDB, sem poder ser exportada) ---------- */
function abrirDB() {
  return new Promise((ok, erro) => {
    const req = indexedDB.open('sonhario-cofre', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('chaves');
    req.onsuccess = () => ok(req.result);
    req.onerror = () => erro(req.error);
  });
}
async function idb(modo, fn) {
  const db = await abrirDB();
  return new Promise((ok, erro) => {
    const tx = db.transaction('chaves', modo);
    const req = fn(tx.objectStore('chaves'));
    tx.oncomplete = () => ok(req && req.result);
    tx.onerror = () => erro(tx.error);
  });
}
const lerDoAparelho = (uid) => idb('readonly', (s) => s.get(uid)).catch(() => null);
const guardarNoAparelho = (uid, k) => idb('readwrite', (s) => s.put(k, uid)).catch(() => {});
const apagarDoAparelho = (uid) => idb('readwrite', (s) => s.delete(uid)).catch(() => {});

const semTabela = (e) => /chaves/.test(e?.message || '') && /exist|schema cache|find|relation/i.test(e?.message || '');

export function carregarCofre(usuario) {
  estadoAtual = 'carregando';
  const p = lerCofre(usuario).then(
    (e) => { estadoAtual = e; return e; },
    (er) => { estadoAtual = 'erro'; throw er; },
  );
  lendo = p.catch(() => {});
  return p;
}

async function lerCofre(usuario) {
  limparMemoria();
  if (!supabase || !usuario) return 'indisponivel';
  dono = usuario.id;
  meuEmail = (usuario.email || '').toLowerCase();
  let { data, error } = await supabase.from('chaves').select('publica, modo').eq('user_id', usuario.id).maybeSingle();
  // Banco ainda sem a coluna "modo" (bloco 15): lê como avançada, que é como funcionava.
  if (error && /modo/.test(error.message || '')) ({ data, error } = await supabase.from('chaves').select('publica').eq('user_id', usuario.id).maybeSingle());
  if (error) { if (semTabela(error) || error.code === '42P01' || error.code === 'PGRST205') return 'indisponivel'; throw error; }
  if (!data) return 'sem-chaves';
  modo = data.modo || 'avancado';
  publica = await importarPublica(data.publica);
  const guardada = await lerDoAparelho(usuario.id);
  if (guardada) { privada = guardada; return 'aberto'; }
  return 'trancado';
}

function limparMemoria() {
  modo = 'basico';
  dono = null; meuEmail = ''; publica = null; privada = null; chavesSonhos.clear();
}

// Sair: este aparelho esquece a chave. Para voltar, precisa da frase-senha de novo.
export async function esquecerAparelho(uid) {
  if (uid) await apagarDoAparelho(uid);
  limparMemoria();
}

/* ---------- código de recuperação guardado pelo servidor (criptografia básica) ---------- */
async function servidorRecuperacao(acao, codigo) {
  const { data, error } = await supabase.functions.invoke('recuperacao', { body: { acao, codigo } });
  if (error) {
    let msg = error.message;
    try { msg = (await error.context.json()).erro || msg; } catch { /* sem corpo */ }
    throw new Error(msg);
  }
  return data;
}

// Primeira vez: cria o par, tranca a privada com a frase-senha e com um código de recuperação.
// Básica: o código fica guardado pelo servidor e a função devolve ''.
// Avançada: devolve o código, que a pessoa precisa guardar.
export async function criarCofre(usuario, senha, nivel = 'basico') {
  const s = normalizarSenha(senha);
  const par = await criarPar();
  const codigo = novoCodigoRecuperacao();
  if (nivel === 'basico') await servidorRecuperacao('guardar', codigo);
  const linha = {
    modo: nivel,
    user_id: usuario.id,
    email: (usuario.email || '').toLowerCase(),
    publica: await exportarPublica(par.publica),
    privada_senha: await trancarPrivada(par.privada, s),
    privada_recuperacao: await trancarPrivada(par.privada, normalizarCodigo(codigo)),
  };
  const { error } = await supabase.from('chaves').insert(linha);
  if (error) throw new Error(error.code === '23505' ? tr("Esta conta já tem uma frase-senha. Recarregue a página.") : error.message);
  // A que fica no aparelho não pode ser exportada: nem um script na página consegue copiá-la.
  const fixa = await abrirPrivada(linha.privada_senha, s, false);
  dono = usuario.id; meuEmail = linha.email;
  publica = par.publica; privada = fixa; modo = nivel;
  estadoAtual = 'aberto';
  await guardarNoAparelho(usuario.id, fixa);
  return nivel === 'avancado' ? codigo : '';
}

async function pacote(campo) {
  const { data, error } = await supabase.from('chaves').select(campo).eq('user_id', dono).single();
  if (error) throw error;
  return data[campo];
}

export async function destrancar(senha) {
  let k;
  try { k = await abrirPrivada(await pacote('privada_senha'), normalizarSenha(senha), false); }
  catch (e) { throw new Error(e.message === 'senha' ? tr("Frase-senha errada.") : e.message); }
  privada = k;
  estadoAtual = 'aberto';
  await guardarNoAparelho(dono, k);
}

// Esqueceu a frase-senha: abre com o código de recuperação e define uma nova.
export async function recuperar(codigo, novaSenha) {
  let k;
  try { k = await abrirPrivada(await pacote('privada_recuperacao'), normalizarCodigo(codigo), true); }
  catch (e) { throw new Error(e.message === 'senha' ? tr("Esse código de recuperação não confere.") : e.message); }
  await gravarNovaSenha(k, normalizarSenha(novaSenha));
}

// Básica: esqueceu a frase-senha, o servidor devolve o código e a pessoa só cria uma nova.
export async function recuperarBasico(novaSenha) {
  const { codigo } = await servidorRecuperacao('pegar');
  await recuperar(codigo, novaSenha);
}

// Configurações: passar para a avançada. Devolve o código para a pessoa guardar; o servidor apaga a cópia.
export async function irParaAvancado() {
  const { codigo } = await servidorRecuperacao('pegar');
  const { error } = await supabase.from('chaves').update({ modo: 'avancado', atualizado_em: new Date().toISOString() }).eq('user_id', dono);
  if (error) throw error;
  modo = 'avancado';
  await servidorRecuperacao('apagar');
  return codigo;
}

// Configurações: voltar para a básica. Pede a frase-senha para criar um código novo, que o servidor guarda.
export async function irParaBasico(senha) {
  let k;
  try { k = await abrirPrivada(await pacote('privada_senha'), normalizarSenha(senha), true); }
  catch (e) { throw new Error(e.message === 'senha' ? tr("Frase-senha errada.") : e.message); }
  const codigo = novoCodigoRecuperacao();
  await servidorRecuperacao('guardar', codigo);
  const { error } = await supabase.from('chaves').update({
    modo: 'basico', privada_recuperacao: await trancarPrivada(k, normalizarCodigo(codigo)), atualizado_em: new Date().toISOString(),
  }).eq('user_id', dono);
  if (error) throw error;
  modo = 'basico';
}

export async function trocarSenha(atual, nova) {
  let k;
  try { k = await abrirPrivada(await pacote('privada_senha'), normalizarSenha(atual), true); }
  catch (e) { throw new Error(e.message === 'senha' ? tr("A frase-senha atual está errada.") : e.message); }
  await gravarNovaSenha(k, normalizarSenha(nova));
}

async function gravarNovaSenha(extraivel, senha) {
  const novo = await trancarPrivada(extraivel, senha);
  const { error } = await supabase.from('chaves').update({ privada_senha: novo, atualizado_em: new Date().toISOString() }).eq('user_id', dono);
  if (error) throw error;
  const fixa = await abrirPrivada(novo, senha, false);
  privada = fixa;
  estadoAtual = 'aberto';
  await guardarNoAparelho(dono, fixa);
}

/* ---------- chaves dos sonhos ---------- */
// Sonho novo ganha chave nova; sonho já aberto usa a mesma (os arquivos e quem recebeu dependem dela).
export async function chaveParaSalvar(id) {
  let k = chavesSonhos.get(id);
  if (!k) { k = await novaChaveSonho(); chavesSonhos.set(id, k); }
  return k;
}
export const embrulharParaMim = (k) => embrulhar(k, publica);

export async function abrirChave(id, embrulhada) {
  const ja = chavesSonhos.get(id);
  if (ja) return ja;
  if (!privada || !embrulhada) return null;
  const k = await desembrulhar(embrulhada, privada);
  chavesSonhos.set(id, k);
  return k;
}

export const linkDaChave = chaveParaLink;
export const chaveDeLink = chaveDoLink;

/* ---------- entregar a chave a quem recebeu o sonho ---------- */
// O banco diz quais pessoas já têm frase-senha e ainda não receberam a chave de um sonho meu.
let entregando = null;
export function entregarChaves() {
  if (!privada || !supabase) return Promise.resolve(0);
  entregando ||= (async () => {
    try {
      const { data, error } = await supabase.rpc('chaves_faltando');
      if (error || !data?.length) return 0;
      const publicas = new Map();
      const linhas = [];
      for (const f of data) {
        try {
          const k = await abrirChave(f.sonho_id, f.chave_dono);
          if (!k) continue;
          if (!publicas.has(f.email)) publicas.set(f.email, await importarPublica(f.publica));
          linhas.push({ sonho_id: f.sonho_id, email: f.email, chave: await embrulhar(k, publicas.get(f.email)) });
        } catch { /* um sonho com problema não impede os outros */ }
      }
      if (linhas.length) await supabase.from('chaves_sonhos').upsert(linhas);
      return linhas.length;
    } finally { entregando = null; }
  })();
  return entregando;
}

// Quem abriu um link com a chave no "#": guarda a chave para si, embrulhada com a própria pública.
const PENDENTES = 'sonhario:chaves-de-links';
const lerPendentes = () => { try { return JSON.parse(localStorage.getItem(PENDENTES)) || {}; } catch { return {}; } };
export function guardarChaveDeLink(sonhoId, texto) {
  const p = lerPendentes();
  p[sonhoId] = texto;
  try { localStorage.setItem(PENDENTES, JSON.stringify(p)); } catch { /* sem armazenamento */ }
}
export async function subirChavesDeLinks() {
  if (!publica || !supabase || !meuEmail) return;
  const p = lerPendentes();
  const ids = Object.keys(p);
  if (!ids.length) return;
  const linhas = [];
  for (const id of ids) {
    try {
      const k = await chaveDoLink(p[id]);
      chavesSonhos.set(id, k);
      linhas.push({ sonho_id: id, email: meuEmail, chave: await embrulhar(k, publica) });
    } catch { /* chave estragada: descarta */ }
  }
  if (linhas.length) {
    const { error } = await supabase.from('chaves_sonhos').upsert(linhas);
    if (error) return;
  }
  try { localStorage.removeItem(PENDENTES); } catch { /* idem */ }
}
