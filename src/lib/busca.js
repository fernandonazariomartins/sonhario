// Busca de palavras no acervo.
// - ignora maiúsculas e acentos ("cancao" acha "canção");
// - cada palavra casa com o começo de uma palavra do sonho ("mar" acha "mar" e "marés", não "amar");
// - várias palavras: o sonho precisa ter todas;
// - "entre aspas": procura a expressão exata;
// - -palavra: exclui sonhos que a tenham.

const MARCAS = /\p{M}/gu;
const LETRA = /[\p{L}\p{N}]/u;

function normChar(c) {
  if (/\s/.test(c)) return ' ';
  return c.normalize('NFD').replace(MARCAS, '').toLowerCase();
}

export function normalizar(s) {
  return Array.from(String(s || ''), normChar).join('');
}

// Texto normalizado + mapa de cada posição normalizada para a posição original.
function indexar(original) {
  const chars = Array.from(String(original || ''));
  let norm = '';
  const mapa = [];
  let pos = 0;
  chars.forEach((c) => {
    const n = normChar(c);
    for (let i = 0; i < n.length; i++) { norm += n[i]; mapa.push(pos); }
    pos += c.length;
  });
  mapa.push(pos);
  return { norm, mapa };
}

export function interpretar(q) {
  const termos = [];
  const excluir = [];
  const re = /(-?)"([^"]+)"?|(-?)(\S+)/g;
  let m;
  while ((m = re.exec(String(q || '')))) {
    const neg = m[1] || m[3];
    const bruto = normalizar((m[2] ?? m[4]).trim()).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (!bruto) continue;
    (neg ? excluir : termos).push(bruto);
  }
  return { termos, excluir, vazia: !termos.length && !excluir.length };
}

// Posições [ini, fim] (no texto original) onde algum termo começa uma palavra.
export function acharTrechos(original, termos) {
  if (!original || !termos?.length) return [];
  const { norm, mapa } = indexar(original);
  const achados = [];
  termos.forEach((t) => {
    let i = norm.indexOf(t);
    while (i !== -1) {
      if (i === 0 || !LETRA.test(norm[i - 1])) achados.push([mapa[i], mapa[i + t.length]]);
      i = norm.indexOf(t, i + 1);
    }
  });
  achados.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const juntos = [];
  achados.forEach(([a, b]) => {
    const ult = juntos[juntos.length - 1];
    if (ult && a <= ult[1]) ult[1] = Math.max(ult[1], b);
    else juntos.push([a, b]);
  });
  return juntos;
}

function campos(s) {
  return {
    titulo: s.titulo || '',
    texto: s.texto || '',
    temas: (s.temas || []).join(' · '),
    amplificacoes: (s.conclusoes || []).map((c) => c.texto).filter(Boolean).join(' … '),
  };
}

function temPalavra(norm, t) {
  let i = norm.indexOf(t);
  while (i !== -1) {
    if (i === 0 || !LETRA.test(norm[i - 1])) return true;
    i = norm.indexOf(t, i + 1);
  }
  return false;
}

// Devolve null se o sonho não casa; senão { ocorrencias, onde, trecho }.
export function casar(s, consulta) {
  if (!consulta || consulta.vazia) return { ocorrencias: 0 };
  const c = campos(s);
  const tudo = normalizar([c.titulo, c.texto, c.temas, c.amplificacoes].join(' \n '));
  if (consulta.excluir.some((t) => temPalavra(tudo, t))) return null;
  if (!consulta.termos.every((t) => temPalavra(tudo, t))) return null;
  if (!consulta.termos.length) return { ocorrencias: 0 };

  let ocorrencias = 0;
  let onde = null;
  for (const k of ['texto', 'amplificacoes', 'titulo', 'temas']) {
    const n = acharTrechos(c[k], consulta.termos).length;
    ocorrencias += n;
    if (n && !onde && k !== 'titulo' && k !== 'temas') onde = k;
  }
  const trecho = onde ? recortar(c[onde], consulta.termos) : null;
  return { ocorrencias, onde, trecho };
}

// Recorta um pedaço do texto em volta da primeira ocorrência.
export function recortar(texto, termos, antes = 70, total = 260) {
  const [primeiro] = acharTrechos(texto, termos);
  if (!primeiro) return texto.slice(0, total);
  let ini = Math.max(0, primeiro[0] - antes);
  if (ini > 0) { const esp = texto.lastIndexOf(' ', ini + 12); if (esp > ini - 20 && esp < primeiro[0]) ini = esp + 1; }
  let fim = Math.min(texto.length, ini + total);
  if (fim < texto.length) { const esp = texto.lastIndexOf(' ', fim); if (esp > primeiro[1]) fim = esp; }
  return (ini > 0 ? '…' : '') + texto.slice(ini, fim).trim() + (fim < texto.length ? '…' : '');
}
