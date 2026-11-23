// Importação de sonhos que a pessoa já tem: Notion (CSV), Google Keep (Takeout, JSON) e texto/Markdown.
// Áudios e imagens que vêm junto (no .zip ou soltos) entram no sonho: ficam em "_midia" até a hora de guardar.
import { unzipSync, strFromU8 } from 'fflate';
import { novoSonho, novoId, STATUS, CORES } from './sonhos.js';
import { tipoPorNome, ehAudio, ehImagem } from './midia.js';

const CORES_KEEP = { DEFAULT: 'branco', YELLOW: 'amarelo', GREEN: 'verde', TEAL: 'azul', BLUE: 'azul', CERULEAN: 'azul', ORANGE: 'coral', RED: 'coral', PINK: 'coral', PURPLE: 'lilas', BROWN: 'areia', GRAY: 'areia' };

function parseCSV(texto) {
  const linhas = [];
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas.filter((l) => l.some((x) => x.trim()));
}

// Datas do Notion: "16/11/2026", "November 16, 2026", "2026-11-16".
function lerData(txt) {
  if (!txt) return null;
  const t = txt.replace(/[*_`]|📅|🗓️?/gu, '').replace(/^(data|date|criad[oa](\s+em)?|created|editad[oa](\s+em)?)\s*:\s*/i, '').trim();
  if (!/\d/.test(t)) return null;
  // Hora junto da data ("12/03/2024 07:41", "2024-05-02 às 6h10"); sem ela, 7 da manhã.
  const h = t.match(/\d[ ,àsT]+(\d{1,2})[:h](\d{2})(?::\d{2})?\s*([ap]m)?/i);
  let hora = [7, 0];
  if (h) {
    let hr = +h[1];
    if (/^p/i.test(h[3] || '') && hr < 12) hr += 12;
    if (/^a/i.test(h[3] || '') && hr === 12) hr = 0;
    hora = [hr, +h[2]];
  }
  let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], ...hora).toISOString();
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})(?!T)/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], ...hora).toISOString();
  // Como o Notion em português escreve: "28 de outubro de 2024 21:04"
  m = t.toLowerCase().match(/^(\d{1,2}) de ([a-zç]+)\.? de (\d{4})/);
  if (m) {
    const mes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'].indexOf(m[2].slice(0, 3));
    if (mes >= 0) return new Date(+m[3], mes, +m[1], ...hora).toISOString();
  }
  const d = new Date(t);
  return isNaN(d) ? null : d.toISOString();
}

const STATUS_NOTION = { 'não aberto': 'nao_aberto', 'nao aberto': 'nao_aberto', aberto: 'aberto', 'dar atenção': 'dar_atencao', 'dar atencao': 'dar_atencao' };

export function deNotionCSV(texto) {
  const [cab, ...linhas] = parseCSV(texto.replace(/^\uFEFF/, ''));
  const idx = (...nomes) => cab.findIndex((c) => nomes.includes(c.trim().toLowerCase()));
  const iNome = idx('name', 'nome', 'título', 'titulo');
  const iData = idx('data', 'date');
  const iTemas = idx('temas', 'tags', 'tema');
  const iStatus = idx('status');
  const iObs = idx('observações', 'observacoes', 'notas');
  const iCriado = idx('adicionado em', 'created time', 'criado em');
  return linhas.map((l) => {
    const sonhado = lerData(l[iData]) || lerData(l[iCriado]) || new Date().toISOString();
    const obs = iObs >= 0 ? (l[iObs] || '').trim() : '';
    return novoSonho({
      titulo: (l[iNome] || '').trim(),
      sonhado_em: sonhado,
      criado_em: sonhado,
      temas: iTemas >= 0 ? (l[iTemas] || '').split(',').map((t) => t.trim()).filter(Boolean) : [],
      status: STATUS_NOTION[(l[iStatus] || '').trim().toLowerCase()] || 'nao_aberto',
      conclusoes: obs ? [{ id: 'imp-' + Math.random().toString(16).slice(2), em: sonhado, origem: 'sozinho', texto: obs }] : [],
    });
  }).filter((s) => s.titulo || s.conclusoes.length);
}

// Página do Notion exportada em Markdown: "# Título", depois as propriedades
// ("Data : 30/09/2026", "Temas: A, B") e, por fim, o relato do sonho.
const PROPS = { data: 'data', date: 'data', status: 'status', temas: 'temas', tags: 'temas', tema: 'temas', 'observações': 'obs', observacoes: 'obs', notas: 'obs', 'adicionado em': 'criado', 'created time': 'criado', 'criado em': 'criado' };
const SEM_TITULO = ['untitled', 'sem título', 'sem titulo', 'new page', 'nova página'];

// Links internos do Notion ("[texto](Pagina%20abc.md)") viram só o texto.
const semLinks = (t) => t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

// Separa as linhas da página. Se o cabeçalho chegou numa linha só
// ("# Sem título Data : 02/02/2023 Adicionado em: …"), quebra antes de cada propriedade.
const CHAVES_RE = new RegExp('\\s+(' + Object.keys(PROPS).join('|') + ')\\s*:', 'gi');
function linhasDaPagina(texto) {
  const linhas = texto.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const i = linhas.findIndex((l) => l.trim());
  if (i >= 0 && /^#\s+/.test(linhas[i])) linhas.splice(i, 1, ...linhas[i].replace(CHAVES_RE, '\n$1:').split('\n'));
  return linhas;
}

// Devolve o sonho; null se não for uma página da tabela de sonhos;
// false se for uma página da tabela, mas sem título nem relato (não há o que trazer).
export function deNotionPagina(texto, nome = '', midias = null) {
  const anexos = midias ? extrairMidia(texto, nome, midias) : null;
  if (anexos) texto = anexos.texto;
  const linhas = linhasDaPagina(texto);
  let i = 0;
  while (i < linhas.length && !linhas[i].trim()) i++;
  let titulo = '';
  if (/^#\s+/.test(linhas[i] || '')) { titulo = linhas[i].replace(/^#\s+/, '').trim(); i++; }
  const props = {};
  let fimProps = i;
  for (; i < linhas.length; i++) {
    if (!linhas[i].trim()) continue; // o Notion às vezes deixa linha em branco entre as propriedades
    const m = linhas[i].match(/^([^:]{1,40}?)\s*:\s?(.*)$/);
    const chave = m && PROPS[m[1].trim().toLowerCase()];
    if (!chave) break;
    props[chave] = m[2].trim();
    fimProps = i + 1;
  }
  if (!Object.keys(props).length) return null; // não é uma página da tabela de sonhos
  const corpo = semLinks(linhas.slice(fimProps).join('\n')).trim();
  if (SEM_TITULO.includes(titulo.toLowerCase())) titulo = '';
  const sonhado = lerData(props.data) || lerData(props.criado) || new Date().toISOString();
  const obs = props.obs || '';
  const s = novoSonho({
    titulo: semLinks(titulo),
    texto: corpo,
    sonhado_em: sonhado,
    criado_em: sonhado,
    temas: semLinks(props.temas || '').split(',').map((t) => t.trim()).filter(Boolean),
    status: STATUS_NOTION[(props.status || '').toLowerCase()] || 'nao_aberto',
    conclusoes: obs ? [{ id: 'imp-' + Math.random().toString(16).slice(2), em: sonhado, origem: 'sozinho', texto: semLinks(obs) }] : [],
  });
  if (anexos?.midia) s._midia = anexos.midia;
  return s.titulo || s.texto || s.conclusoes.length || s._midia ? s : false;
}

// Sonhos que entraram com o cabeçalho do Notion grudado no relato
// ("# Sem título", "Data : …", "Adicionado em: …"). Devolve a versão arrumada
// de cada um, com o mesmo id, ou nada se não houver o que arrumar.
export function arrumarDoNotion(acervo) {
  const arrumados = [];
  for (const s of acervo) {
    if (!/^\s*#\s/.test(s.texto || '')) continue;
    const p = deNotionPagina(s.texto);
    if (p === null) continue;
    arrumados.push({
      ...s,
      titulo: s.titulo?.trim() && !SEM_TITULO.includes(s.titulo.trim().toLowerCase()) ? s.titulo : p ? p.titulo : '',
      texto: p ? p.texto : '',
      sonhado_em: p ? p.sonhado_em : lerData(s.texto.match(/Data\s*:\s*([^\n]+)/i)?.[1]) || s.sonhado_em,
      criado_em: p ? p.criado_em : s.criado_em,
      temas: [...new Set([...(s.temas || []), ...(p ? p.temas : [])])],
      conclusoes: (s.conclusoes || []).length ? s.conclusoes : p ? p.conclusoes : [],
    });
  }
  return arrumados;
}

/* ---------- anexos (áudio e imagem) ---------- */

const pasta = (caminho) => (caminho.includes('/') ? caminho.slice(0, caminho.lastIndexOf('/') + 1) : '');
const base = (caminho) => caminho.slice(caminho.lastIndexOf('/') + 1);
const semExt = (nome) => nome.replace(/\.[^.]+$/, '');
const decodificar = (t) => { try { return decodeURIComponent(t); } catch { return t; } };

// Guarda os anexos por caminho completo e também pelo nome do arquivo, para achar
// tanto "anexos/foto.jpg" (link relativo) quanto "foto.jpg" (como o Keep cita).
export function novoAcervoDeMidia() {
  const porCaminho = new Map(), porNome = new Map(), porNomeSemExt = new Map();
  return {
    tamanho: () => porCaminho.size,
    guardar(caminho, nome, blob) {
      const c = caminho.replace(/\\/g, '/').toLowerCase();
      const item = { nome, blob };
      porCaminho.set(c, item);
      const n = base(c);
      if (!porNome.has(n)) porNome.set(n, item);
      if (!porNomeSemExt.has(semExt(n))) porNomeSemExt.set(semExt(n), item);
    },
    achar(caminho, de = '') {
      const limpo = decodificar(caminho.trim().replace(/^<|>$/g, '').split(/[?#]/)[0]).replace(/\\/g, '/');
      const partes = [];
      for (const p of (pasta(de.replace(/\\/g, '/')) + limpo.replace(/^\.\//, '')).split('/')) {
        if (p === '..') partes.pop(); else if (p && p !== '.') partes.push(p);
      }
      const c = partes.join('/').toLowerCase();
      const n = base(limpo.toLowerCase());
      return porCaminho.get(c) || porCaminho.get(limpo.toLowerCase()) || porNome.get(n) || porNomeSemExt.get(semExt(n)) || null;
    },
  };
}

const ehMidia = (href) => { const n = decodificar(href.trim().replace(/^<|>$/g, '').split(/[?#]/)[0]); return ehAudio(n) || ehImagem(n); };
// ![](anexos/foto.jpg) · [Gravação](anexos/audio.3gp) · ![[anexos/foto.jpg]] · <img src="…"> · <audio src="…">
const LINK_MD = /!?\[([^\]]*)\]\(\s*(<[^>]+>|[^)\s]+(?:\s[^)"']+)*?)\s*(?:"[^"]*")?\s*\)/g;
const LINK_WIKI = /!?\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
const LINK_HTML = /<(?:img|audio|source|video|a)\b[^>]*?(?:src|href)\s*=\s*["']([^"']+)["'][^>]*>(?:\s*<\/(?:audio|video|a)>)?/gi;

// Tira do texto os links para áudios e imagens e devolve os arquivos que eles apontam.
// { texto, midia: { audios, imagens, faltando } | null }
export function extrairMidia(texto, de, midias) {
  const audios = [], imagens = [], vistos = new Set();
  let faltando = 0;
  const pegar = (inteiro, href) => {
    if (/^(https?:|data:|mailto:)/i.test(href) || !ehMidia(href)) return inteiro;
    const item = midias.achar(href, de);
    if (!item) { faltando++; return ''; }
    if (!vistos.has(item)) { vistos.add(item); (ehAudio(item.nome) ? audios : imagens).push(item); }
    return '';
  };
  const linhas = texto.split('\n').map((l) => {
    const nova = l.replace(LINK_HTML, (m, h) => pegar(m, h)).replace(LINK_WIKI, (m, h) => pegar(m, h)).replace(LINK_MD, (m, _t, h) => pegar(m, h));
    // Linha que só tinha o anexo (e talvez um rótulo como "Áudio:" ou "🎙️") some inteira.
    if (nova !== l && /^(?:[\s\-*•>:|]|🎙️?|🎤|🔊|📷|🖼️?)*(áudio|audio|imagem|imagens|foto|fotos|gravação|anexos?)?\s*:?\s*$/iu.test(nova)) return null;
    return nova;
  }).filter((l) => l !== null);
  const midia = audios.length || imagens.length || faltando ? { audios, imagens, faltando } : null;
  return { texto: linhas.join('\n').replace(/\n{3,}/g, '\n\n'), midia };
}

// Abre um .zip (o do Notion às vezes vem com outro .zip dentro). Textos vão para a lista; áudios e imagens, para "midias".
function abrirZip(bytes, midias, saida = []) {
  const arquivos = unzipSync(bytes);
  for (const [nome, dados] of Object.entries(arquivos)) {
    const n = nome.toLowerCase();
    if (n.endsWith('/') || /(^|\/)(__macosx|\.ds_store)/.test(n)) continue;
    if (n.endsWith('.zip')) abrirZip(dados, midias, saida);
    else if (n.endsWith('.md') || n.endsWith('.csv') || n.endsWith('.json') || n.endsWith('.txt') || n.endsWith('.html')) saida.push({ name: nome, doZip: true, text: async () => strFromU8(dados) });
    else if (ehAudio(n) || ehImagem(n)) midias.guardar(nome, base(nome), async () => new Blob([dados], { type: tipoPorNome(n) }));
  }
  return saida;
}

export function deKeepJSON(obj, marcadoresAceitos, midias = null) {
  if (obj.isTrashed) return null;
  const temas = (obj.labels || []).map((l) => l.name);
  if (marcadoresAceitos?.length && !temas.some((t) => marcadoresAceitos.includes(t))) return null;
  const em = obj.userEditedTimestampUsec ? new Date(obj.userEditedTimestampUsec / 1000).toISOString() : new Date().toISOString();
  const criado = obj.createdTimestampUsec ? new Date(obj.createdTimestampUsec / 1000).toISOString() : em;
  const texto = obj.textContent || (obj.listContent || []).map((i) => '• ' + i.text).join('\n');
  const anexos = (obj.attachments || []).filter((a) => a.filePath);
  if (!texto && !obj.title && !anexos.length) return null;
  const s = novoSonho({ titulo: obj.title || '', texto, temas, sonhado_em: criado, criado_em: criado, atualizado_em: em, cor: CORES_KEEP[obj.color] || 'branco' });
  if (anexos.length) {
    const audios = [], imagens = [];
    let faltando = 0;
    for (const a of anexos) {
      const item = midias?.achar(a.filePath);
      const tipo = a.mimetype || tipoPorNome(a.filePath);
      if (!item) faltando++;
      else (tipo.startsWith('audio/') || ehAudio(item.nome) ? audios : imagens).push(item);
    }
    s._midia = { audios, imagens, faltando };
  }
  return s;
}

// Texto ou Markdown: cada parágrafo que começa com uma data vira um sonho novo.
export function deTexto(texto, nome = '', midias = null) {
  const partes = texto.split(/\n(?=\s*(?:#+\s*)?\d{1,2}\/\d{1,2}\/\d{2,4}|\s*(?:#+\s*)?\d{4}-\d{2}-\d{2})/);
  return partes.map((p) => {
    const anexos = midias ? extrairMidia(p, nome, midias) : { texto: p, midia: null };
    const m = anexos.texto.trim().match(/^(?:#+\s*)?(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\s*[-–—:]?\s*(.*)$/s);
    let s;
    if (!m) s = anexos.texto.trim() || anexos.midia ? novoSonho({ texto: anexos.texto.trim() }) : null;
    else {
      let data = m[1];
      if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(data)) data = data.replace(/(\d{2})$/, '20$1');
      const iso = lerData(data) || new Date().toISOString();
      s = novoSonho({ texto: m[2].trim(), sonhado_em: iso, criado_em: iso });
    }
    if (s && anexos.midia) s._midia = anexos.midia;
    return s;
  }).filter(Boolean);
}

// Markdown com vários sonhos, um por título (## Título), como o Sonhos.md montado a partir do Keep.
// Em cada bloco: o título; a data de criação ("Criada em: …"), ou então a data escrita (no título,
// numa linha "Data: …" ou numa linha só com a data);
// temas ("Marcadores:", "Temas:", "Tags:" ou uma linha só de #hashtags); o resto é o relato.
const PROP_BLOCO = /^\s*(?:[-*]\s*)?(?:\*\*|__)?\s*(data|date|criad[oa](?: em)?|created|editad[oa](?: em)?|modificad[oa](?: em)?|edited|marcadores|etiquetas|labels|temas|tema|tags|cor|color)\s*(?:\*\*|__)?\s*:\s*(?:\*\*|__)?\s*(.*)$/i;
const SO_DATA = /^\s*[*_]*\s*(?:📅|🗓️)?\s*(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}[^\s*_]*|\d{1,2} de [a-zç]+\.? de \d{4}|[a-z]{3,9}\.? \d{1,2}, \d{4})(?:[ ,àsT]+\d{1,2}[:h]\d{2}(?::\d{2})?(?:\s?[ap]m)?)?\s*[*_]*\s*$/i;
const DATA_NO_TITULO = /^(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2} de [a-zç]+\.? de \d{4})(?:[ ,às]+\d{1,2}[:h]\d{2})?\s*(?:[-–—:·|]\s*)?(.*)$/i;

function nivelDosSonhos(linhas) {
  for (let n = 1; n <= 3; n++) {
    const re = new RegExp('^#{' + n + '}\\s+\\S');
    if (linhas.filter((l) => re.test(l)).length >= 2) return n;
  }
  return 0;
}

export function deMarkdown(texto, nome = '', midias = null) {
  const linhas = texto.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const nivel = nivelDosSonhos(linhas);
  if (!nivel) return deTexto(texto, nome, midias);
  const re = new RegExp('^#{' + nivel + '}\\s+(.*)$');
  const blocos = [];
  for (const l of linhas) {
    const m = l.match(re);
    if (m) blocos.push({ titulo: m[1].trim(), linhas: [] });
    else if (blocos.length) blocos[blocos.length - 1].linhas.push(l);
  }
  const sonhos = [];
  for (const b of blocos) {
    let titulo = b.titulo.replace(/[*_`]/g, '').trim(), data = null, criado = null;
    const temas = [];
    const md = titulo.match(DATA_NO_TITULO);
    if (md) { data = lerData(md[1]); titulo = md[2].trim(); }
    const anexos = midias ? extrairMidia(b.linhas.join('\n'), nome, midias) : { texto: b.linhas.join('\n'), midia: null };
    const corpo = [];
    let noTopo = true;
    for (const l of anexos.texto.split('\n')) {
      if (noTopo) {
        if (!l.trim() || /^\s*(-{3,}|\*{3,})\s*$/.test(l)) continue;
        const p = l.match(PROP_BLOCO);
        if (p) {
          const k = p[1].toLowerCase(), v = p[2].replace(/[*_`]/g, '').trim();
          if (/^(data|date)$/.test(k)) data = data || lerData(v);
          else if (/^(criad|created)/.test(k)) criado = criado || lerData(v);
          else if (/^(marcadores|etiquetas|labels|temas|tema|tags)$/.test(k)) temas.push(...v.split(/[,;]|\s#/).map((t) => t.replace(/^#/, '').trim()).filter(Boolean));
          continue;
        }
        if (!data && SO_DATA.test(l)) { data = lerData(l); continue; }
        if (/^\s*(#[\p{L}\p{N}_-]+\s*)+$/u.test(l)) { temas.push(...l.trim().split(/\s+/).map((t) => t.slice(1))); continue; }
        noTopo = false;
      }
      corpo.push(l);
    }
    // Separadores entre um sonho e outro ("---") e linhas em branco nas pontas ficam de fora.
    while (corpo.length && (!corpo[corpo.length - 1].trim() || /^\s*(-{3,}|\*{3,})\s*$/.test(corpo[corpo.length - 1]))) corpo.pop();
    // Vale a data em que a nota foi criada; sem ela, a data escrita no bloco.
    const quando = criado || data || new Date().toISOString();
    const s = novoSonho({
      titulo: SEM_TITULO.includes(titulo.toLowerCase()) ? '' : titulo,
      texto: corpo.join('\n').trim(),
      temas: [...new Set(temas)],
      sonhado_em: quando,
      criado_em: criado || quando,
    });
    if (anexos.midia) s._midia = anexos.midia;
    if (s.titulo || s.texto || s._midia) sonhos.push(s);
  }
  return sonhos;
}

export async function lerArquivos(entrada) {
  const midias = novoAcervoDeMidia();
  const arquivos = [];
  for (const f of entrada) {
    const n = f.name.toLowerCase();
    if (n.endsWith('.zip')) arquivos.push(...abrirZip(new Uint8Array(await f.arrayBuffer()), midias));
    else if (ehAudio(n) || ehImagem(n)) midias.guardar(f.webkitRelativePath || f.name, f.name, async () => f);
    else arquivos.push(f);
  }
  const sonhos = [];
  const doCSV = [];
  const paginas = [];
  const outrosMd = []; // .md de um .zip que não são páginas da tabela do Notion
  const marcadores = new Set();
  const keep = [];
  const copia = []; // sonhario.json de uma cópia do acervo
  let copiaEm = null;
  for (const f of arquivos) {
    const txt = await f.text();
    const n = f.name.toLowerCase();
    const pagina = n.endsWith('.md') ? deNotionPagina(txt, f.name, midias) : null;
    if (n.endsWith('.csv')) doCSV.push(...deNotionCSV(txt));
    else if (pagina) paginas.push(pagina);
    else if (pagina === false) continue; // página do Notion sem título nem relato
    else if (n.endsWith('.json')) {
      try {
        const o = JSON.parse(txt);
        if (ehCopiaSonhario(o)) { copia.push(...deCopiaSonhario(o, midias)); copiaEm = o.em || copiaEm; continue; }
        (o.labels || []).forEach((l) => marcadores.add(l.name));
        keep.push(o);
      } catch { /* não é uma nota do Keep */ }
    } else if (n.endsWith('.html')) continue; // o Takeout traz um .html de cada nota junto do .json
    else if (f.doZip) outrosMd.push({ txt, nome: f.name });
    else sonhos.push(...(n.endsWith('.md') ? deMarkdown(txt, f.name, midias) : deTexto(txt, f.name, midias)));
  }
  // Cópia do Sonhário: o .json já tem tudo; o Sonhos.md que vem junto é só para ler.
  if (copia.length) return { sonhos: copia, keep: [], midias, marcadores: [], soCSV: false, copia: { em: copiaEm } };
  // Num export do Notion, as outras páginas (a da tabela, subpáginas soltas) ficam de fora.
  // Num .zip que não é do Notion (ex.: Sonhos.md + pasta de anexos), cada .md vira sonhos.
  if (!paginas.length && !doCSV.length) for (const o of outrosMd) sonhos.push(...deMarkdown(o.txt, o.nome, midias));
  // As páginas trazem o relato; o CSV só tem título e propriedades.
  // Se vieram páginas, o CSV do mesmo export é dispensado.
  const vistos = new Set();
  const unicos = doCSV.filter((x) => { const k = x.titulo + '|' + x.sonhado_em + '|' + x.temas.join(); return !vistos.has(k) && vistos.add(k); });
  sonhos.push(...(paginas.length ? paginas : unicos));
  return { sonhos, keep, midias, marcadores: [...marcadores].sort(), soCSV: !paginas.length && doCSV.length > 0 };
}

// Cópia do acervo baixada no próprio Sonhário (⋯ › Baixar cópia do acervo, ou a .json de antes de trancar).
const ehCopiaSonhario = (o) => o && o.app === 'Sonhário' && Array.isArray(o.sonhos);

export function deCopiaSonhario(o, midias = null) {
  const saida = [];
  for (const x of o.sonhos) {
    if (!x || typeof x !== 'object') continue;
    // Id novo: a cópia pode ser restaurada em outra conta, onde o id antigo já pode existir.
    const s = novoSonho({
      id: novoId(),
      titulo: String(x.titulo || ''),
      texto: String(x.texto || ''),
      temas: Array.isArray(x.temas) ? x.temas.map(String).filter(Boolean) : [],
      sonhado_em: x.sonhado_em || new Date().toISOString(),
      criado_em: x.criado_em || x.sonhado_em || new Date().toISOString(),
      atualizado_em: x.atualizado_em || x.criado_em || x.sonhado_em || new Date().toISOString(),
      status: STATUS[x.status] ? x.status : 'nao_aberto',
      cor: CORES[x.cor] ? x.cor : 'branco',
      favorito: !!x.favorito,
      levar_sessao: !!x.levar_sessao,
      conclusoes: Array.isArray(x.conclusoes) ? x.conclusoes.filter((c) => c && c.texto) : [],
    });
    // Anexos: só a cópia em .zip traz os arquivos ("arquivo" aponta para anexos/…).
    const audios = [], imagens = [];
    let faltando = 0;
    const pegar = (arq, lista) => { const item = midias?.achar(arq); if (item) lista.push(item); else faltando++; };
    if (x.audio?.arquivo) pegar(x.audio.arquivo, audios);
    for (const im of Array.isArray(x.imagens) ? x.imagens : []) if (im?.arquivo) pegar(im.arquivo, imagens);
    if (audios.length || imagens.length || faltando) s._midia = { audios, imagens, faltando };
    if (s.titulo || s.texto || s._midia || s.conclusoes.length) saida.push(s);
  }
  return saida;
}

// Compara o que vai entrar com o acervo, sem duplicar.
// - Mesmo dia, mesmo título e mesmo começo de relato: já está lá, pula.
// - Mesmo dia e título, e o do acervo está sem relato (ex.: veio só da tabela): completa esse.
// Cada sonho do acervo só é usado uma vez, então vários "Sem título" no mesmo dia não se misturam.
const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const SEM = new Set(['', 'sem titulo', 'untitled']);
const tituloNorm = (s) => (SEM.has(norm(s.titulo)) ? '' : norm(s.titulo));
const dia = (s) => (s.sonhado_em || '').slice(0, 10);
const comeco = (s) => norm(s.texto).slice(0, 80);
const temAnexo = (s) => !!(s._midia && (s._midia.audios.length || s._midia.imagens.length));

export function combinarComAcervo(entrando, acervo, pularRepetidos = true) {
  const porChave = new Map();
  for (const e of acervo) {
    const k = dia(e) + '|' + tituloNorm(e);
    if (!porChave.has(k)) porChave.set(k, []);
    porChave.get(k).push(e);
  }
  const usados = new Set();
  const novos = [];
  const completar = [];
  let pulados = 0;
  for (const s of entrando) {
    const candidatos = porChave.get(dia(s) + '|' + tituloNorm(s)) || [];
    const igual = comeco(s) && candidatos.find((e) => comeco(e) === comeco(s));
    if (igual) {
      usados.add(igual.id);
      // Já está lá, mas entrou antes sem os anexos: completa com o áudio e as imagens.
      if (pularRepetidos && temAnexo(s) && !igual.audio && !(igual.imagens || []).length) completar.push({ ...igual, _midia: s._midia, _motivo: 'anexos' });
      else if (pularRepetidos) pulados++; else novos.push(s);
      continue;
    }
    if (comeco(s)) {
      const vazio = candidatos.find((e) => !usados.has(e.id) && !comeco(e));
      if (vazio) {
        usados.add(vazio.id);
        completar.push({ ...vazio, texto: s.texto, temas: [...new Set([...(vazio.temas || []), ...(s.temas || [])])], _midia: s._midia, _motivo: 'relato' });
        continue;
      }
    } else if (candidatos.length && pularRepetidos) {
      // Nota só com anexos que já entrou antes sem eles.
      const semAnexo = temAnexo(s) && candidatos.find((e) => !usados.has(e.id) && !e.audio && !(e.imagens || []).length && !comeco(e));
      if (semAnexo) { usados.add(semAnexo.id); completar.push({ ...semAnexo, _midia: s._midia, _motivo: 'anexos' }); } else pulados++;
      continue;
    }
    novos.push(s);
  }
  return { novos, completar, pulados };
}

// Sonho sem nada dentro: sem título, relato, áudio, imagens, temas nem amplificações.
export const ehVazio = (s) => !s.titulo?.trim() && !s.texto?.trim() && !s.audio && !(s.imagens || []).length && !(s.temas || []).length && !(s.conclusoes || []).length;
