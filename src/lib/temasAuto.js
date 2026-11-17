// Temas automáticos: lê o relato e sugere temas, sem enviar nada para fora do aparelho.
// 1) Temas que você já usa no acervo e aparecem no texto (o sinal mais forte).
// 2) Símbolos comuns em sonhos (água, mãe, cobra, escola…) que aparecem no texto.
import { normalizar, singular, ehSimbolo } from './coresTema.js';

// Palavras que aparecem demais nos relatos para virar tema sozinhas.
const COMUNS = new Set(['sonho', 'visao', 'medo', 'cair', 'velho', 'presente', 'caminho', 'luz', 'energia', 'alma', 'calma', 'brilho', 'frio']);
const MAX = 5;

export function sugerirTemas(texto, jaTem = [], temasDoAcervo = []) {
  const palavras = String(texto || '').toLowerCase().match(/[\p{L}\d]+/gu) || [];
  const chaves = new Set(palavras.flatMap((p) => { const n = normalizar(p); return [n, singular(n)]; }));
  const fora = new Set(jaTem.map(normalizar));
  const out = [];
  const add = (nome) => { const k = normalizar(nome); if (!fora.has(k) && out.length < MAX) { fora.add(k); out.push(nome); } };

  // 1. Temas do seu acervo (os mais usados primeiro), quando todas as palavras do tema estão no relato.
  for (const t of temasDoAcervo) {
    const ps = normalizar(t).split(/[^a-z0-9]+/).filter((x) => x.length > 2);
    if (ps.length && ps.every((p) => chaves.has(p) || chaves.has(singular(p)))) add(t);
  }
  // 2. Símbolos do dicionário, na forma em que aparecem no texto (com acento, no singular).
  for (const p of palavras) {
    const n = singular(normalizar(p));
    if (p.length < 3 || COMUNS.has(n) || !ehSimbolo(n)) continue;
    const forma = normalizar(p) === n ? p : p.replace(/ões$/, 'ão').replace(/ães$/, 'ão').replace(/ns$/, 'm').replace(/(r|z|l)es$/, '$1').replace(/s$/, '');
    add(forma);
  }
  return out;
}
