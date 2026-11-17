// Imagens dos sonhos: um desenho feito ao acordar, uma foto, um print.
// Antes de guardar, toda imagem é reduzida (lado maior de até 1600 px, WebP ou JPEG),
// o que deixa cada uma com cerca de 150 a 400 KB, em vez dos 3 a 8 MB de uma foto do celular.

export const LADO_MAXIMO = 1600;
export const MAX_POR_SONHO = 12;
const QUALIDADE = 0.8;

const TIPOS = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp', heic: 'image/heic', heif: 'image/heif' };
export const EXT_IMAGEM = /\.(png|jpe?g|gif|webp|avif|bmp|heic|heif)$/i;
export const tipoPorNome = (nome) => TIPOS[(nome.split('.').pop() || '').toLowerCase()] || 'application/octet-stream';

function suportaWebP() {
  try { return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp'); } catch { return false; }
}

async function decodificar(blob) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch { /* tenta pelo <img> */ }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally { URL.revokeObjectURL(url); }
}

// Devolve { blob, largura, altura }. GIF animado fica como está (até 5 MB), para não perder o movimento.
export async function reduzirImagem(arquivo) {
  if (arquivo.type === 'image/gif' && arquivo.size <= 5 * 1024 * 1024) {
    const img = await decodificar(arquivo).catch(() => null);
    return { blob: arquivo, largura: img?.width || 0, altura: img?.height || 0 };
  }
  let img;
  try { img = await decodificar(arquivo); } catch { throw new Error('Não consegui abrir essa imagem. Tente salvar como JPG ou PNG.'); }
  const escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
  const largura = Math.max(1, Math.round(img.width * escala));
  const altura = Math.max(1, Math.round(img.height * escala));
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // PNG transparente vira fundo branco no JPEG
  ctx.fillRect(0, 0, largura, altura);
  ctx.drawImage(img, 0, 0, largura, altura);
  img.close?.();
  const tipo = suportaWebP() ? 'image/webp' : 'image/jpeg';
  const blob = await new Promise((ok) => canvas.toBlob(ok, tipo, QUALIDADE));
  if (!blob) throw new Error('Não consegui preparar essa imagem.');
  // Se a original já era pequena e leve, fica a original.
  if (escala === 1 && arquivo.size && arquivo.size < blob.size && /image\/(jpeg|webp|png)/.test(arquivo.type)) return { blob: arquivo, largura, altura };
  return { blob, largura, altura };
}

export const extensaoDe = (blob) => (blob.type.includes('webp') && 'webp') || (blob.type.includes('png') && 'png') || (blob.type.includes('gif') && 'gif') || 'jpg';

// Endereços temporários das imagens, para não pedir de novo a cada tela.
const cache = new Map(); // ref -> { url, ate }
export async function urlEmCache(ref, buscar) {
  const c = cache.get(ref);
  if (c && c.ate > Date.now()) return c.url;
  const url = await buscar(ref);
  if (url) cache.set(ref, { url, ate: Date.now() + 50 * 60 * 1000 });
  return url;
}
export const esquecerUrl = (ref) => cache.delete(ref);

// Tira do texto as marcas de imagem do Markdown ("![foto.png](pasta/foto.png)")
// e o que sobrava delas nas importações antigas ("!foto.png").
export const MARCA_IMAGEM = /!\[[^\]]*\]\([^)]*\)/g;
const SOBRA_IMAGEM = /!(?=[^\n!]{1,160}?\.(?:png|jpe?g|gif|webp|avif|heic|bmp)\b)[^\n!]{1,160}?\.(?:png|jpe?g|gif|webp|avif|heic|bmp)\b/gi;
export const semMarcasDeImagem = (t) => String(t || '').replace(MARCA_IMAGEM, '').replace(SOBRA_IMAGEM, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
export const temMarcaDeImagem = (t) => { const s = String(t || ''); MARCA_IMAGEM.lastIndex = 0; SOBRA_IMAGEM.lastIndex = 0; return MARCA_IMAGEM.test(s) || SOBRA_IMAGEM.test(s); };
