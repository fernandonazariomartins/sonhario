// Evita viúvas e palavras curtas soltas no fim da linha.
const NB = '\u00a0';
const curtas = /(^|[\s\u00a0("“'])([\p{L}]{1,3}) (?=\S)/gu;

export function semViuvas(texto) {
  if (!texto) return texto;
  let t = String(texto);
  let antes;
  do { antes = t; t = t.replace(curtas, (_, a, b) => a + b + NB); } while (t !== antes);
  if (t.trim().split(/\s+/).length >= 3) t = t.replace(/ (\S+)\s*$/u, NB + '$1');
  return t;
}
