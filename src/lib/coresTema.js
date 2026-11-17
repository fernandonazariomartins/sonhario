// Cores das etiquetas de tema, no estilo do Notion: fundo claro, texto escuro.
// Cada tema ganha sempre a mesma cor, calculada a partir do nome.
export const PALETA = [
  { fundo: '#E3E2E0', texto: '#32302C' }, // cinza
  { fundo: '#EEE0DA', texto: '#442A1E' }, // marrom
  { fundo: '#FADEC9', texto: '#49290E' }, // laranja
  { fundo: '#FDECC8', texto: '#402C1B' }, // amarelo
  { fundo: '#DBEDDB', texto: '#1C3829' }, // verde
  { fundo: '#D3E5EF', texto: '#183347' }, // azul
  { fundo: '#E8DEEE', texto: '#412454' }, // roxo
  { fundo: '#F5E0E9', texto: '#4C2337' }, // rosa
  { fundo: '#FFE2DD', texto: '#5D1715' }, // vermelho
];

function hash(k) {
  let h = 2166136261;
  for (const c of k) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15;
  return h >>> 0;
}

// Como no Notion: cada tema novo pega a próxima cor da paleta, na ordem em que apareceu
// no acervo. Temas vizinhos não repetem cor e criar um tema novo não muda os antigos.
export function mapaDeCores(sonhos) {
  const primeiro = new Map();
  for (const s of sonhos) for (const t of s.temas || []) {
    const k = t.trim().toLowerCase();
    const d = s.sonhado_em || '';
    if (!primeiro.has(k) || d < primeiro.get(k)) primeiro.set(k, d);
  }
  const ordem = [...primeiro].sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[0].localeCompare(b[0])));
  // Começa pelo laranja: o cinza fica para o fim do ciclo, como o "padrão" do Notion.
  return new Map(ordem.map(([k], i) => [k, PALETA[(i + 2) % PALETA.length]]));
}

export function corDoTema(nome, mapa) {
  const k = String(nome).trim().toLowerCase();
  return mapa?.get(k) || PALETA[hash(k) % PALETA.length];
}
