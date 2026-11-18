// Áudios e imagens que chegam de fora (importação ou "adicionar imagem"):
// descobre o tipo pelo nome, deixa o áudio num formato que todo navegador toca
// e reduz fotos grandes antes de guardar.

const TIPOS = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
  '3gp': 'audio/3gpp', '3gpp': 'audio/3gpp', amr: 'audio/amr', m4a: 'audio/mp4', mp4: 'audio/mp4', aac: 'audio/aac', mp3: 'audio/mpeg',
  ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', wav: 'audio/wav', webm: 'audio/webm', flac: 'audio/flac',
};

export const extensao = (nome) => (String(nome).toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
export const tipoPorNome = (nome) => TIPOS[extensao(nome)] || '';
export const ehImagem = (nome) => tipoPorNome(nome).startsWith('image/');
export const ehAudio = (nome) => tipoPorNome(nome).startsWith('audio/');

// Formatos que tocam no Chrome, no Safari e no Firefox sem conversão.
const TOCAM_EM_TODOS = ['audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav', 'audio/webm', 'audio/ogg'];

function duracaoPeloPlayer(blob) {
  return new Promise((ok) => {
    const url = URL.createObjectURL(blob);
    const a = new Audio();
    const fim = (d) => { URL.revokeObjectURL(url); ok(Number.isFinite(d) ? d : null); };
    const t = setTimeout(() => fim(null), 4000);
    a.preload = 'metadata';
    a.onloadedmetadata = () => { clearTimeout(t); fim(a.duration); };
    a.onerror = () => { clearTimeout(t); fim(null); };
    a.src = url;
  });
}

// WAV mono 16 bits: pesado, mas toca em qualquer navegador. Voz não precisa de mais que 16 kHz.
function paraWav(buffer, taxa) {
  const n = Math.floor(buffer.duration * taxa);
  const canais = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) canais.push(buffer.getChannelData(c));
  const dados = new DataView(new ArrayBuffer(44 + n * 2));
  const escrever = (pos, txt) => { for (let i = 0; i < txt.length; i++) dados.setUint8(pos + i, txt.charCodeAt(i)); };
  escrever(0, 'RIFF'); dados.setUint32(4, 36 + n * 2, true); escrever(8, 'WAVE');
  escrever(12, 'fmt '); dados.setUint32(16, 16, true); dados.setUint16(20, 1, true); dados.setUint16(22, 1, true);
  dados.setUint32(24, taxa, true); dados.setUint32(28, taxa * 2, true); dados.setUint16(32, 2, true); dados.setUint16(34, 16, true);
  escrever(36, 'data'); dados.setUint32(40, n * 2, true);
  const passo = buffer.sampleRate / taxa;
  for (let i = 0; i < n; i++) {
    const j = Math.min(buffer.length - 1, Math.floor(i * passo));
    let v = 0;
    for (const c of canais) v += c[j];
    v = Math.max(-1, Math.min(1, v / canais.length));
    dados.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  return new Blob([dados], { type: 'audio/wav' });
}

// Devolve { blob, duracao }. Formatos que nem todo navegador toca (o .3gp do Keep, .amr, .flac)
// viram WAV quando este navegador consegue abrir; se não conseguir, o original vai assim mesmo.
export async function prepararAudio(blob, nome = '') {
  const tipo = blob.type || tipoPorNome(nome) || 'audio/mpeg';
  const original = blob.type === tipo ? blob : new Blob([blob], { type: tipo });
  if (TOCAM_EM_TODOS.includes(tipo)) return { blob: original, duracao: await duracaoPeloPlayer(original) };
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const buffer = await ctx.decodeAudioData(await original.arrayBuffer());
    ctx.close?.();
    const taxa = buffer.duration > 700 ? 8000 : 16000; // cabe no limite de 25 MB do bucket
    return { blob: paraWav(buffer, taxa), duracao: buffer.duration };
  } catch {
    return { blob: original, duracao: await duracaoPeloPlayer(original) };
  }
}

// Devolve { blob, largura, altura }. Fotos maiores que 1600 px viram JPEG nesse tamanho.
// O que o navegador não abre (HEIC no Chrome, por exemplo) vai como veio.
export async function prepararImagem(blob, nome = '') {
  const tipo = blob.type || tipoPorNome(nome) || 'image/jpeg';
  const original = blob.type === tipo ? blob : new Blob([blob], { type: tipo });
  try {
    const bmp = await createImageBitmap(original);
    const { width: w, height: h } = bmp;
    const MAX = 1600;
    if ((w <= MAX && h <= MAX && original.size < 1.5e6) || tipo === 'image/gif') { bmp.close?.(); return { blob: original, largura: w, altura: h }; }
    const k = Math.min(1, MAX / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * k); canvas.height = Math.round(h * k);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const menor = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.85));
    return menor ? { blob: menor, largura: canvas.width, altura: canvas.height } : { blob: original, largura: w, altura: h };
  } catch {
    return { blob: original, largura: null, altura: null };
  }
}

// Leva os anexos de um sonho importado para o armazenamento e devolve o sonho pronto para salvar.
// "_midia" nunca vai para o banco.
export async function guardarMidia(sonho, { salvarAudio, salvarImagem }) {
  const { _midia, ...s } = sonho;
  if (!_midia) return s;
  if (!s.audio && _midia.audios.length) {
    const a = _midia.audios[0];
    try {
      const { blob, duracao } = await prepararAudio(await a.blob(), a.nome);
      s.audio = { ref: await salvarAudio(s.id, blob), duracao, nome: a.nome };
    } catch { /* fica sem o áudio, o resto entra */ }
  }
  const imagens = [...(s.imagens || [])];
  for (const im of _midia.imagens) {
    try {
      const { blob, largura, altura } = await prepararImagem(await im.blob(), im.nome);
      const id = s.id + '-' + imagens.length;
      imagens.push({ ref: await salvarImagem(id, blob), largura, altura, nome: im.nome });
    } catch { /* idem */ }
  }
  if (imagens.length) s.imagens = imagens;
  return s;
}
