// Comentários sobre um tema: o que a pessoa pensa sobre "casa", "mãe", "água"…
// Escritos na página do tema (/app/acervo?tema=X); só quem escreveu vê.
// Sem conta: no aparelho (localStorage). Com conta: tabela "notas_tema" (bloco 18 do schema.sql).
// Com o cofre, o tema e o texto saem do aparelho trancados, cada nota com a própria chave.
import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from './supabase.js';
import { cifrar, decifrar } from './cripto.js';
import * as cofre from './cofre.js';
import { useEstado } from './estado.jsx';

const CHAVE = 'sonhario:notas-tema';
const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : 'n-' + Date.now() + Math.random().toString(16).slice(2));
const semTabela = (e) => /notas_tema/.test(e?.message || '') && /exist|schema cache|find|relation/i.test(e?.message || '') || e?.code === '42P01' || e?.code === 'PGRST205';

/* ---------- onde moram ---------- */
const local = {
  listar() { try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { return []; } },
  gravar(lista) { localStorage.setItem(CHAVE, JSON.stringify(lista)); },
};

async function fechar(n, userId) {
  const o = { id: n.id, user_id: userId, criado_em: n.criado_em, editado_em: n.editado_em || null, tema: n.tema, texto: n.texto, cifrado: null, chave_dono: null };
  await cofre.esperarCofre();
  if (cofre.estadoDoCofre() === 'indisponivel') return o; // banco sem o bloco 14: como antes
  if (!cofre.temPublica()) throw new Error('o cofre não abriu, e o comentário não sai aberto do aparelho. Tente de novo.');
  const k = await cofre.chaveParaSalvar(n.id);
  o.cifrado = await cifrar({ tema: n.tema, texto: n.texto }, k);
  o.chave_dono = await cofre.embrulharParaMim(k);
  o.tema = ''; o.texto = '';
  return o;
}

async function abrir(row) {
  const { cifrado, chave_dono, user_id, ...resto } = row; // eslint-disable-line no-unused-vars
  if (!cifrado) return resto;
  try {
    const k = await cofre.abrirChave(row.id, chave_dono);
    if (!k) return { ...resto, _trancado: true };
    const p = await decifrar(cifrado, k);
    return { ...resto, tema: p.tema || '', texto: p.texto || '' };
  } catch { return { ...resto, _trancado: true }; }
}

/* ---------- o que fica na memória, para todas as telas ---------- */
let estado = { de: null, notas: [], carregado: false, semTabela: false };
const ouvintes = new Set();
const mudar = (x) => { estado = { ...estado, ...x }; ouvintes.forEach((f) => f()); };
const assinar = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };
let usuarioAtual = null;

async function carregar(usuario, chave) {
  usuarioAtual = usuario;
  mudar({ de: chave, notas: [], carregado: false, semTabela: false });
  if (!usuario || !supabase) { mudar({ notas: local.listar(), carregado: true }); return; }
  const { data, error } = await supabase.from('notas_tema').select('*').order('criado_em');
  if (estado.de !== chave) return;
  if (error) { mudar({ carregado: true, semTabela: semTabela(error) }); return; }
  const notas = await Promise.all(data.map(abrir));
  if (estado.de === chave) mudar({ notas, carregado: true });
}

// Lê as notas da conta (ou do aparelho) uma vez, e de novo quando a conta ou o cofre mudam.
export function useNotasTema() {
  const { usuario, podeLer, cofre: estadoCofre } = useEstado();
  const chave = (usuario?.id || 'aparelho') + '|' + (podeLer ? estadoCofre : 'fechado');
  useEffect(() => {
    if (!podeLer) { usuarioAtual = usuario; mudar({ de: chave, notas: [], carregado: true }); return; }
    if (estado.de !== chave) carregar(usuario, chave).catch(() => mudar({ carregado: true }));
  }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps
  return useSyncExternalStore(assinar, () => estado, () => estado);
}

async function gravar(lista) {
  const u = usuarioAtual;
  if (!u || !supabase) { local.gravar([...local.listar().filter((x) => !lista.some((n) => n.id === x.id)), ...lista]); return; }
  const linhas = await Promise.all(lista.map((n) => fechar(n, u.id)));
  const { error } = await supabase.from('notas_tema').upsert(linhas);
  if (error) throw new Error(semTabela(error) ? 'os comentários de tema ainda não estão ativos no banco: rode o bloco 18 do supabase/schema.sql.' : error.message);
}

const juntar = (lista) => {
  const ids = new Set(lista.map((n) => n.id));
  mudar({ notas: [...estado.notas.filter((n) => !ids.has(n.id)), ...lista].sort((a, b) => a.criado_em.localeCompare(b.criado_em)) });
};

export async function comentarTema(tema, texto) {
  const n = { id: novoId(), tema, texto: texto.trim(), criado_em: new Date().toISOString(), editado_em: null };
  await gravar([n]);
  juntar([n]);
  return n;
}

export async function editarNotaTema(nota, texto) {
  const n = { ...nota, texto: texto.trim(), editado_em: new Date().toISOString() };
  await gravar([n]);
  juntar([n]);
  return n;
}

export async function apagarNotaTema(id) {
  const u = usuarioAtual;
  if (!u || !supabase) local.gravar(local.listar().filter((x) => x.id !== id));
  else {
    const { error } = await supabase.from('notas_tema').delete().eq('id', id);
    if (error) throw error;
  }
  mudar({ notas: estado.notas.filter((n) => n.id !== id) });
}

// Juntar ou renomear temas: os comentários vão junto para o tema que fica.
export async function renomearNasNotas(de, para) {
  const lista = estado.notas.filter((n) => !n._trancado && de.includes(n.tema) && n.tema !== para).map((n) => ({ ...n, tema: para }));
  if (!lista.length) return 0;
  await gravar(lista);
  juntar(lista);
  return lista.length;
}

// Restaurar uma cópia do acervo: traz os comentários que ainda não estão aqui (mesmo tema e texto).
export async function restaurarNotas(entrando) {
  const ja = new Set(estado.notas.map((n) => n.tema + '|' + n.texto));
  const novas = entrando
    .filter((x) => x && x.tema && x.texto && !ja.has(x.tema + '|' + x.texto))
    .map((x) => ({ id: novoId(), tema: String(x.tema), texto: String(x.texto).slice(0, 5000), criado_em: x.criado_em || new Date().toISOString(), editado_em: x.editado_em || null }));
  if (!novas.length) return 0;
  await gravar(novas);
  juntar(novas);
  return novas.length;
}

export const notasDoTema = (notas, tema) => notas.filter((n) => n.tema === tema);

// Amplificações gerais, sobre o processo como um todo (vista Amplificações do acervo).
// Moram na mesma tabela, com este "tema" reservado; com o cofre, ele também sai trancado.
export const PROCESSO = '@processo';
export const ehProcesso = (n) => n.tema === PROCESSO;
export const amplificarProcesso = (texto) => comentarTema(PROCESSO, texto);
