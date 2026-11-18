// Criptografia de ponta a ponta, só com o Web Crypto do navegador (nada de biblioteca de fora).
//
// - Cada pessoa tem um par de chaves RSA-OAEP. A chave privada só sai do aparelho trancada
//   com AES-GCM por uma chave tirada da frase-senha (PBKDF2), ou da chave de recuperação.
// - Cada sonho tem a própria chave AES-GCM. Ela vai para o banco "embrulhada" com a chave
//   pública do dono e de cada pessoa com quem o sonho foi compartilhado.
// - O texto do sonho vira "c1.<iv>.<cifra>"; áudios e imagens viram um arquivo que começa
//   com "SNH1" + id do sonho + iv, para saber de qual sonho é a chave na hora de abrir.
//
// Funciona igual no navegador e no Node 20 (os testes rodam lá).

const sutil = () => globalThis.crypto.subtle;
const aleatorio = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
const cod = new TextEncoder();
const decod = new TextDecoder();

/* ---------- base64 ---------- */
export function b64(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
}
export function deB64(s) {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
export const b64url = (bytes) => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const deB64url = (s) => deB64(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));

/* ---------- par de chaves da pessoa ---------- */
const RSA = { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
const USOS_PRIVADA = ['decrypt', 'unwrapKey'];
const USOS_PUBLICA = ['encrypt', 'wrapKey'];
export const ITERACOES = 600000;

export async function criarPar() {
  const par = await sutil().generateKey(RSA, true, [...USOS_PUBLICA, ...USOS_PRIVADA]);
  return { publica: par.publicKey, privada: par.privateKey };
}
export async function exportarPublica(chave) {
  return b64(await sutil().exportKey('spki', chave));
}
export async function importarPublica(texto) {
  return sutil().importKey('spki', deB64(texto), RSA, true, USOS_PUBLICA);
}

// A frase-senha vale como foi digitada, sem espaços nas pontas e com acentos normalizados.
export const normalizarSenha = (s) => String(s || '').normalize('NFC').trim();

async function chaveDaSenha(senha, sal, iteracoes) {
  const base = await sutil().importKey('raw', cod.encode(senha), 'PBKDF2', false, ['deriveKey']);
  return sutil().deriveKey({ name: 'PBKDF2', salt: sal, iterations: iteracoes, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// Tranca a chave privada com uma frase-senha (ou o código de recuperação).
export async function trancarPrivada(privada, senha, iteracoes = ITERACOES) {
  const sal = aleatorio(16);
  const iv = aleatorio(12);
  const k = await chaveDaSenha(senha, sal, iteracoes);
  const crua = await sutil().exportKey('pkcs8', privada);
  const ct = await sutil().encrypt({ name: 'AES-GCM', iv }, k, crua);
  return { v: 1, sal: b64(sal), iv: b64(iv), ct: b64(ct), iter: iteracoes };
}

// Abre a chave privada. Senha errada: erro "senha".
// extraivel: só para trocar a frase-senha; a que fica guardada no aparelho nunca sai dele.
export async function abrirPrivada(pacote, senha, extraivel = false) {
  const k = await chaveDaSenha(senha, deB64(pacote.sal), pacote.iter || ITERACOES);
  let crua;
  try { crua = await sutil().decrypt({ name: 'AES-GCM', iv: deB64(pacote.iv) }, k, deB64(pacote.ct)); }
  catch { throw new Error('senha'); }
  return sutil().importKey('pkcs8', crua, RSA, extraivel, USOS_PRIVADA);
}

// Código de recuperação: 24 letras e números (120 bits), em grupos de 4.
// Sem 0, O, 1, I e L, para não confundir quem copia à mão.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function novoCodigoRecuperacao() {
  const bytes = aleatorio(24);
  const letras = [...bytes].map((b) => ALFABETO[b % 31]); // 256 % 31 = 8: viés desprezível
  return letras.join('').match(/.{4}/g).join('-');
}
// Para trancar e abrir, vale só o que é letra ou número: hífens e espaços não contam.
export const normalizarCodigo = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/* ---------- chave de cada sonho ---------- */
export async function novaChaveSonho() {
  return sutil().generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
export async function embrulhar(chaveSonho, publica) {
  return b64(await sutil().wrapKey('raw', chaveSonho, publica, { name: 'RSA-OAEP' }));
}
export async function desembrulhar(texto, privada) {
  return sutil().unwrapKey('raw', deB64(texto), privada, { name: 'RSA-OAEP' }, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}
// Para o link de convite: a chave vai depois do "#", que o navegador nunca manda ao servidor.
export async function chaveParaLink(chaveSonho) {
  return b64url(await sutil().exportKey('raw', chaveSonho));
}
export async function chaveDoLink(texto) {
  return sutil().importKey('raw', deB64url(texto), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

/* ---------- textos ---------- */
const PREFIXO = 'c1.';
export const ehCifrado = (s) => typeof s === 'string' && s.startsWith(PREFIXO);

export async function cifrar(valor, chave) {
  const iv = aleatorio(12);
  const ct = await sutil().encrypt({ name: 'AES-GCM', iv }, chave, cod.encode(JSON.stringify(valor)));
  return PREFIXO + b64(iv) + '.' + b64(ct);
}
export async function decifrar(texto, chave) {
  const [, iv, ct] = texto.split('.');
  const claro = await sutil().decrypt({ name: 'AES-GCM', iv: deB64(iv) }, chave, deB64(ct));
  return JSON.parse(decod.decode(claro));
}

/* ---------- áudios e imagens ---------- */
const MAGIA = cod.encode('SNH1');
const TAM_ID = 36; // uuid
const CABECALHO = MAGIA.length + TAM_ID + 12;

export async function cifrarArquivo(blob, chave, sonhoId) {
  const id = cod.encode(String(sonhoId).slice(0, TAM_ID).padEnd(TAM_ID, ' '));
  const iv = aleatorio(12);
  const ct = await sutil().encrypt({ name: 'AES-GCM', iv }, chave, await blob.arrayBuffer());
  return new Blob([MAGIA, id, iv, ct], { type: blob.type });
}

// Devolve o id do sonho se o arquivo estiver trancado; null se for um arquivo comum (de antes).
export function sonhoDoArquivo(bytes) {
  const u = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, CABECALHO));
  if (u.length < CABECALHO) return null;
  for (let i = 0; i < MAGIA.length; i++) if (u[i] !== MAGIA[i]) return null;
  return decod.decode(u.subarray(MAGIA.length, MAGIA.length + TAM_ID)).trim();
}

export async function decifrarArquivo(bytes, chave, tipo = '') {
  const u = new Uint8Array(bytes);
  const iv = u.subarray(MAGIA.length + TAM_ID, CABECALHO);
  const claro = await sutil().decrypt({ name: 'AES-GCM', iv }, chave, u.subarray(CABECALHO));
  return new Blob([claro], { type: tipo });
}
