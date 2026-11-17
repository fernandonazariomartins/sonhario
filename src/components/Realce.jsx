import { acharTrechos } from '../lib/busca.js';
import { semViuvas } from '../lib/tipografia.js';

// Texto com as palavras buscadas marcadas.
export default function Realce({ texto, termos, viuvas = true }) {
  const t = viuvas ? semViuvas(texto) : texto;
  if (!t || !termos?.length) return t || null;
  const trechos = acharTrechos(t, termos);
  if (!trechos.length) return t;
  const partes = [];
  let pos = 0;
  trechos.forEach(([a, b], i) => {
    if (a > pos) partes.push(t.slice(pos, a));
    partes.push(<mark key={i} className="achado">{t.slice(a, b)}</mark>);
    pos = b;
  });
  if (pos < t.length) partes.push(t.slice(pos));
  return partes;
}
