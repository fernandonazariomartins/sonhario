// Cópia do acervo: um .zip com tudo o que é da pessoa, aberto, para guardar onde ela quiser.
// - sonhario.json: os sonhos completos (temas, status, cor, favoritos, amplificações), para restaurar
//   pelo "Importar sonhos" do próprio Sonhário, nesta conta ou em outra.
// - Sonhos.md: o mesmo acervo para ler em qualquer lugar (um sonho por título).
// - anexos/: os áudios e as imagens, já destrancados.
// Tudo é montado no aparelho: nada passa por servidor nenhum.
import { zipSync, strToU8 } from 'fflate';
import { STATUS, tituloDe } from './sonhos.js';

const EXT = {
  'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
  'audio/aac': 'aac', 'audio/3gpp': '3gp', 'audio/amr': 'amr', 'audio/flac': 'flac',
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif',
};
const extDe = (blob, nome, padrao) => EXT[(blob?.type || '').split(';')[0]] || (String(nome || '').match(/\.([a-z0-9]{2,4})$/i) || [])[1]?.toLowerCase() || padrao;

const doisDig = (n) => String(n).padStart(2, '0');
const dataHora = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${doisDig(d.getMonth() + 1)}-${doisDig(d.getDate())} ${doisDig(d.getHours())}:${doisDig(d.getMinutes())}`; };
const lesma = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'sonho';

// Baixa o arquivo guardado (já destrancado pelo armazém) como Blob.
async function blobDe(urlDe, ref) {
  const url = await urlDe(ref).catch(() => null);
  if (!url) return null;
  try { return await (await fetch(url)).blob(); } catch { return null; } finally { if (url.startsWith('blob:')) URL.revokeObjectURL(url); }
}

export function contarArquivos(sonhos) {
  return sonhos.reduce((t, s) => ({ audios: t.audios + (s.audio?.ref ? 1 : 0), imagens: t.imagens + (s.imagens || []).length }), { audios: 0, imagens: 0 });
}

function markdown(sonhos, quando) {
  const linhas = [
    '# Sonhário · cópia do acervo', '',
    `Baixada em ${dataHora(quando)} · ${sonhos.length === 1 ? '1 sonho' : sonhos.length + ' sonhos'}, do mais recente ao mais antigo.`, '',
  ];
  for (const s of sonhos) {
    linhas.push('---', '', '## ' + (s.titulo?.trim() || 'Sem título'), '');
    linhas.push('Data: ' + dataHora(s.sonhado_em));
    if (s.temas?.length) linhas.push('Temas: ' + s.temas.join(', '));
    linhas.push('Status: ' + (STATUS[s.status]?.rotulo || 'não aberto') + (s.favorito ? ' · favorito' : '') + (s.levar_sessao ? ' · levar para a sessão' : ''));
    linhas.push('');
    if (s.texto?.trim()) linhas.push(s.texto.trim(), '');
    if (s._audio) linhas.push(`[Áudio do sonho](${s._audio})`, '');
    for (const im of s._imagens || []) linhas.push(`![](${im})`, '');
    const amps = (s.conclusoes || []).filter((c) => c.texto?.trim());
    if (amps.length) {
      linhas.push('### Amplificações', '');
      for (const c of amps) linhas.push(`- ${c.em ? dataHora(c.em).slice(0, 10) + ' · ' : ''}${c.texto.trim().replace(/\n+/g, ' ')}`);
      linhas.push('');
    }
  }
  return linhas.join('\n');
}

function mdNotas(notas) {
  if (!notas.length) return '';
  const porTema = new Map();
  for (const n of notas) { if (!porTema.has(n.tema)) porTema.set(n.tema, []); porTema.get(n.tema).push(n); }
  const linhas = ['', '---', '', '# Comentários sobre os temas', ''];
  for (const [tema, lista] of [...porTema].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))) {
    linhas.push('## ' + tema, '');
    for (const n of lista) linhas.push(`- ${dataHora(n.criado_em).slice(0, 10)} · ${n.texto.trim().replace(/\n+/g, ' ')}`);
    linhas.push('');
  }
  return linhas.join('\n');
}

const LEIA_ME = (quando, n) => `Sonhário · cópia do acervo
Baixada em ${dataHora(quando)}, com ${n === 1 ? '1 sonho' : n + ' sonhos'}.

O que tem aqui
- Sonhos.md: todos os sonhos para ler em qualquer editor de texto.
- sonhario.json: os mesmos sonhos, completos, no formato do Sonhário.
- anexos/: os áudios e as imagens dos sonhos.

Para restaurar
No Sonhário, abra ⋯ › Importar sonhos e envie este .zip inteiro, sem descompactar.
Os sonhos voltam com temas, status, favoritos, amplificações, áudios e imagens,
além dos comentários sobre os temas.
Os que já estiverem no acervo são pulados.

Atenção: esta cópia está aberta, sem a criptografia do app.
Guarde num lugar só seu.
`;

// aoAvancar(feitos, total): conta os arquivos baixados.
// notasTema: os comentários sobre os temas, que vão no .json e no fim do Sonhos.md.
export async function montarCopia(sonhos, { urlAudio, urlImagem }, { comArquivos = true, aoAvancar = () => {}, notasTema = [] } = {}) {
  const quando = new Date().toISOString();
  const usados = new Set();
  const nomeUnico = (base) => { let n = base, k = 2; while (usados.has(n)) n = base + '-' + k++; usados.add(n); return n; };
  const tarefas = [];
  const itens = sonhos.map((s) => {
    const base = nomeUnico(dataHora(s.sonhado_em).slice(0, 10) + '-' + lesma(tituloDe(s)));
    const item = { s, base, audio: null, imagens: [] };
    if (comArquivos && s.audio?.ref) tarefas.push(async () => {
      const b = await blobDe(urlAudio, s.audio.ref);
      if (b) item.audio = { caminho: `anexos/${base}-audio.${extDe(b, s.audio.nome, 'webm')}`, blob: b };
    });
    if (comArquivos) (s.imagens || []).forEach((im, k) => tarefas.push(async () => {
      const b = await blobDe(urlImagem, im.ref);
      if (b) item.imagens[k] = { caminho: `anexos/${base}-imagem-${k + 1}.${extDe(b, im.nome, 'jpg')}`, blob: b, im };
    }));
    return item;
  });

  // De 4 em 4, para não abrir centenas de downloads de uma vez.
  let feitos = 0, falhas = 0;
  aoAvancar(0, tarefas.length);
  for (let i = 0; i < tarefas.length; i += 4) {
    await Promise.all(tarefas.slice(i, i + 4).map((t) => t().catch(() => { falhas++; })));
    feitos = Math.min(tarefas.length, i + 4);
    aoAvancar(feitos, tarefas.length);
  }

  const arquivos = {};
  const json = [];
  const paraMd = [];
  for (const { s, audio, imagens } of itens) {
    const ims = imagens.filter(Boolean);
    if (audio) arquivos[audio.caminho] = [new Uint8Array(await audio.blob.arrayBuffer()), { level: 0 }];
    for (const x of ims) arquivos[x.caminho] = [new Uint8Array(await x.blob.arrayBuffer()), { level: 0 }];
    json.push({
      id: s.id, sonhado_em: s.sonhado_em, criado_em: s.criado_em, atualizado_em: s.atualizado_em,
      titulo: s.titulo || '', texto: s.texto || '', temas: s.temas || [],
      status: s.status, cor: s.cor, favorito: !!s.favorito, levar_sessao: !!s.levar_sessao,
      conclusoes: s.conclusoes || [],
      audio: audio ? { arquivo: audio.caminho, duracao: s.audio.duracao ?? null, nome: s.audio.nome || null } : null,
      imagens: ims.map((x) => ({ arquivo: x.caminho, largura: x.im.largura ?? null, altura: x.im.altura ?? null, nome: x.im.nome || null })),
    });
    paraMd.push({ ...s, _audio: audio?.caminho, _imagens: ims.map((x) => x.caminho) });
  }
  const notas = notasTema.filter((n) => !n._trancado && n.texto?.trim()).map((n) => ({ tema: n.tema, texto: n.texto, criado_em: n.criado_em, editado_em: n.editado_em || null }));
  arquivos['sonhario.json'] = strToU8(JSON.stringify({ app: 'Sonhário', tipo: 'copia-do-acervo', versao: 1, em: quando, total: json.length, sonhos: json, comentarios_temas: notas }, null, 2));
  arquivos['Sonhos.md'] = strToU8(markdown(paraMd, quando) + mdNotas(notas));
  arquivos['LEIA-ME.txt'] = strToU8(LEIA_ME(quando, json.length));
  const zip = zipSync(arquivos, { level: 6 });
  return { blob: new Blob([zip], { type: 'application/zip' }), nome: `sonhario-copia-${quando.slice(0, 10)}.zip`, falhas };
}

export function baixar(blob, nome) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
}
