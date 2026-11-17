// Cores das etiquetas de tema, no estilo do Notion: fundo claro, texto escuro.
// 1) Temas comuns em sonhos ganham uma cor que combina com o símbolo (água azul, fogo vermelho…).
// 2) Os outros (nomes, lugares) pegam a próxima cor da paleta, na ordem em que apareceram.
export const PALETA = {
  cinza: { fundo: '#E3E2E0', texto: '#32302C' },
  marrom: { fundo: '#EEE0DA', texto: '#442A1E' },
  laranja: { fundo: '#FADEC9', texto: '#49290E' },
  amarelo: { fundo: '#FDECC8', texto: '#402C1B' },
  verde: { fundo: '#DBEDDB', texto: '#1C3829' },
  azul: { fundo: '#D3E5EF', texto: '#183347' },
  roxo: { fundo: '#E8DEEE', texto: '#412454' },
  rosa: { fundo: '#F5E0E9', texto: '#4C2337' },
  vermelho: { fundo: '#FFE2DD', texto: '#5D1715' },
};
const ORDEM = ['laranja', 'azul', 'verde', 'roxo', 'amarelo', 'rosa', 'vermelho', 'marrom', 'cinza'];

// Associações de cor (escritas sem acento e no singular).
const SIMBOLOS = {
  azul: 'agua mar rio chuva lago piscina onda oceano ceu nuvem nadar nado peixe gelo neve banho banheira afogamento afogar barco navio ilha cachoeira enchente inundacao tempestade azul voar voo aviao baleia golfinho tubarao frio calma',
  vermelho: 'fogo sangue incendio raiva briga perigo ferida machucado violencia guerra perseguicao perseguido arma tiro faca morder sexo paixao coracao explosao vermelho acidente vulcao grito',
  rosa: 'mae avo bebe filha irma amor namorada namorado beijo flor gravidez gravida mulher feminino casamento noiva abraco carinho rosa crianca nascimento',
  marrom: 'casa lar terra madeira pai avo cachorro cao cavalo vaca boi fazenda lama montanha caverna porao toca pao comida caminho estrada trilha raiz tronco familia parente marrom urso',
  verde: 'arvore floresta mata natureza planta jardim cobra serpente sapo mato campo grama folha selva horta cura saude medico remedio verde esperanca lagarto',
  amarelo: 'sol luz ouro dinheiro festa alegria areia deserto verao riso risada amarelo brilho tesouro presente aniversario dourado abelha',
  laranja: 'gato gata viagem viajar mala cozinha laranja outono fruta energia danca musica show tigre leao raposa',
  roxo: 'noite lua estrela magia misterio espirito fantasma alma igreja deus anjo demonio religiao reza ritual sombra escuro escuridao inconsciente lucido bruxa roxo sonho visao',
  cinza: 'morte morto cemiterio enterro funeral luto escola prova trabalho emprego chefe cidade predio rua carro onibus trem metro elevador escada maquina celular computador hospital doenca medo cinza velho velhice dente cair queda perdido',
};
const DICIONARIO = new Map();
for (const [cor, palavras] of Object.entries(SIMBOLOS)) for (const p of palavras.split(' ')) if (!DICIONARIO.has(p)) DICIONARIO.set(p, cor);

const normalizar = (t) => String(t).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const singular = (p) => p.replace(/oes$/, 'ao').replace(/aes$/, 'ao').replace(/ns$/, 'm').replace(/(r|z|l)es$/, '$1').replace(/s$/, '');

// Cor que combina com o símbolo, se o tema (ou uma das palavras dele) estiver no dicionário.
export function corDoSimbolo(nome) {
  const t = normalizar(nome);
  if (DICIONARIO.has(t)) return DICIONARIO.get(t);
  if (DICIONARIO.has(singular(t))) return DICIONARIO.get(singular(t));
  for (const p of t.split(/[^a-z0-9]+/).filter((x) => x.length > 2)) {
    const c = DICIONARIO.get(p) || DICIONARIO.get(singular(p));
    if (c) return c;
  }
  return null;
}

function hash(k) {
  let h = 2166136261;
  for (const c of k) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15;
  return h >>> 0;
}

export function mapaDeCores(sonhos) {
  const primeiro = new Map();
  for (const s of sonhos) for (const t of s.temas || []) {
    const k = normalizar(t);
    const d = s.sonhado_em || '';
    if (!primeiro.has(k) || d < primeiro.get(k)) primeiro.set(k, d);
  }
  const mapa = new Map();
  let i = 0;
  const ordem = [...primeiro].sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[0].localeCompare(b[0])));
  for (const [k] of ordem) {
    const simbolo = corDoSimbolo(k);
    mapa.set(k, PALETA[simbolo || ORDEM[i++ % ORDEM.length]]);
  }
  return mapa;
}

export function corDoTema(nome, mapa) {
  const k = normalizar(nome);
  return mapa?.get(k) || PALETA[corDoSimbolo(k) || ORDEM[hash(k) % ORDEM.length]];
}

// Palavras do dicionário de símbolos (sem acento, no singular), usadas também nos temas automáticos.
export const ehSimbolo = (palavraNormalizada) => DICIONARIO.has(palavraNormalizada);
export { normalizar, singular };
