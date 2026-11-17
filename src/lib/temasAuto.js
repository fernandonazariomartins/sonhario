// Temas automáticos, em dois grupos:
// 1) Dos seus temas: temas que você já usa no acervo e aparecem no relato (sem sair do aparelho).
// 2) Sugestões novas: símbolos comuns em sonhos (dicionário do app) e, se você estiver logado,
//    temas propostos por uma IA a partir do relato (função "sugerir-temas" do Supabase).
import { normalizar, singular, ehSimbolo } from './coresTema.js';
import { supabase } from './supabase.js';

// Palavras que aparecem demais nos relatos para virar tema sozinhas.
const COMUNS = new Set(['sonho', 'visao', 'medo', 'cair', 'velho', 'presente', 'caminho', 'luz', 'energia', 'alma', 'calma', 'brilho', 'frio']);
const MAX = 6;

export function sugerirTemas(texto, jaTem = [], temasDoAcervo = []) {
  const palavras = String(texto || '').toLowerCase().match(/[\p{L}\d]+/gu) || [];
  const chaves = new Set(palavras.flatMap((p) => { const n = normalizar(p); return [n, singular(n)]; }));
  const fora = new Set(jaTem.map(normalizar));
  const doAcervo = [];
  const novos = [];
  const add = (lista, nome) => { const k = normalizar(nome); if (!fora.has(k) && lista.length < MAX) { fora.add(k); lista.push(nome); } };

  // 1. Temas do seu acervo (os mais usados primeiro), quando todas as palavras do tema estão no relato.
  for (const t of temasDoAcervo) {
    const ps = normalizar(t).split(/[^a-z0-9]+/).filter((x) => x.length > 2);
    if (ps.length && ps.every((p) => chaves.has(p) || chaves.has(singular(p)))) add(doAcervo, t);
  }
  // 2. Símbolos do dicionário, na forma em que aparecem no texto (com acento, no singular).
  for (const p of palavras) {
    const n = singular(normalizar(p));
    if (p.length < 3 || COMUNS.has(n) || !ehSimbolo(n)) continue;
    const forma = normalizar(p) === n ? p : p.replace(/ões$/, 'ão').replace(/ães$/, 'ão').replace(/ns$/, 'm').replace(/(r|z|l)es$/, '$1').replace(/s$/, '');
    add(novos, forma);
  }
  return { doAcervo, novos };
}

// Pede à IA temas para o relato. Devolve [] se não der (sem login, função não instalada, erro).
export async function sugerirTemasIA(texto, evitar = []) {
  if (!supabase || !String(texto || '').trim()) return [];
  try {
    const { data, error } = await supabase.functions.invoke('sugerir-temas', { body: { texto, evitar } });
    if (error) return [];
    return (Array.isArray(data?.temas) ? data.temas : []).map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  } catch { return []; }
}

// Junta o que a IA trouxe aos dois grupos: o que bate com um tema do acervo vai para o grupo 1,
// com o nome que você já usa; o resto entra nas sugestões novas, sem repetir.
export function juntarIA(grupos, daIA, jaTem = [], temasDoAcervo = []) {
  const fora = new Set([...jaTem, ...grupos.doAcervo, ...grupos.novos].map((t) => singular(normalizar(t))));
  const acervo = new Map(temasDoAcervo.map((t) => [singular(normalizar(t)), t]));
  const doAcervo = [...grupos.doAcervo];
  const ia = [];
  for (const t of daIA) {
    const k = singular(normalizar(t));
    if (fora.has(k)) continue;
    fora.add(k);
    if (acervo.has(k)) doAcervo.push(acervo.get(k));
    else if (ia.length < MAX) ia.push(t);
  }
  return { doAcervo, ia };
}
